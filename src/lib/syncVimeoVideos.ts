import type {SanityClient} from 'sanity'

interface VimeoSize {
  width: number
  height: number
  link: string
}

interface VimeoProgressive {
  type: string
  rendition: string
  width: number
  height: number
  link: string
}

interface VimeoFile {
  quality: string
  type: string
  width: number
  height: number
  link: string
  size: number
}

interface VimeoApiVideo {
  uri: string
  name: string
  duration: number
  width: number
  height: number
  privacy?: {view?: string}
  pictures: {sizes: VimeoSize[]}
  files?: VimeoFile[]
  play?: {
    progressive?: VimeoProgressive[]
    dash?: {link: string}
    hls?: {link: string}
  }
}

interface VimeoPageResponse {
  data: VimeoApiVideo[]
  paging: {next: string | null}
}

export interface SyncResult {
  synced: number
  stale: number
  errors: string[]
}

export interface DeleteStaleResult {
  deleted: number
  skipped: {id: string; name: string}[]
}

function extractVimeoId(uri: string): string {
  const match = uri.match(/\/videos\/(\d+)/)
  if (!match) {
    throw new Error(`Could not extract video ID from URI: ${uri}`)
  }
  return match[1]
}

function mapVideoToDocument(video: VimeoApiVideo) {
  const vimeoId = extractVimeoId(video.uri)

  return {
    _id: `vimeoVideo-${vimeoId}`,
    _type: 'vimeoVideo' as const,
    vimeoId,
    name: video.name,
    duration: video.duration,
    width: video.width,
    height: video.height,
    privacy: video.privacy?.view ?? undefined,
    lastSynced: new Date().toISOString(),
    pictures: video.pictures
      ? {
        _type: 'object' as const,
        sizes: video.pictures.sizes?.map((s) => ({
          _type: 'object' as const,
          _key: `${s.width}x${s.height}`,
          width: s.width,
          height: s.height,
          link: s.link,
        })),
      }
      : undefined,
    files: video.files?.length
      ? video.files.map((f) => ({
        _type: 'object' as const,
        _key: `${f.quality}-${f.width}x${f.height}`,
        quality: f.quality,
        type: f.type,
        width: f.width,
        height: f.height,
        link: f.link,
        size: f.size,
      }))
      : undefined,
    play: video.play
      ? {
        _type: 'object' as const,
        progressive: video.play.progressive?.map((p) => ({
          _type: 'object' as const,
          _key: `${p.rendition}-${p.width}x${p.height}`,
          type: p.type,
          rendition: p.rendition,
          width: p.width,
          height: p.height,
          link: p.link,
        })),
        dash: video.play.dash
          ? {_type: 'object' as const, link: video.play.dash.link}
          : undefined,
        hls: video.play.hls ? {_type: 'object' as const, link: video.play.hls.link} : undefined,
      }
      : undefined,
  }
}

const API_FIELDS = 'uri,name,duration,width,height,created_time,pictures,files,play,privacy.view'
const BATCH_SIZE = 25
const BASE_URL = 'https://api.vimeo.com'

async function fetchAllVideos(accessToken: string): Promise<VimeoApiVideo[]> {
  const allVideos: VimeoApiVideo[] = []
  let url: string | null = `${BASE_URL}/me/videos?per_page=100&fields=${API_FIELDS}`

  while (url) {
    const response = await fetch(url, {
      headers: {Authorization: `Bearer ${accessToken}`},
    })

    if (!response.ok) {
      throw new Error(`Vimeo API error: ${response.status} ${response.statusText}`)
    }

    const page: VimeoPageResponse = await response.json()
    allVideos.push(...page.data)

    url = page.paging.next ? `${BASE_URL}${page.paging.next}` : null
  }

  return allVideos
}

export async function syncVimeoVideos(
  accessToken: string,
  client: SanityClient,
): Promise<SyncResult> {
  const errors: string[] = []
  let synced = 0

  const videos = await fetchAllVideos(accessToken)
  const freshIds = new Set<string>()

  for (let i = 0; i < videos.length; i += BATCH_SIZE) {
    const batch = videos.slice(i, i + BATCH_SIZE)
    const transaction = client.transaction()
    for (const video of batch) {
      try {
        const doc = mapVideoToDocument(video)
        transaction.createOrReplace(doc)
        freshIds.add(doc._id)
        synced++
      } catch (err) {
        errors.push(err instanceof Error ? err.message : String(err))
      }
    }
    await transaction.commit()
  }

  const existingIds = await client.fetch<string[]>('*[_type == "vimeoVideo"]._id')
  const staleIds = existingIds.filter((id) => !freshIds.has(id))

  for (let i = 0; i < staleIds.length; i += BATCH_SIZE) {
    const batch = staleIds.slice(i, i + BATCH_SIZE)
    const transaction = client.transaction()
    for (const id of batch) {
      transaction.patch(id, {set: {stale: true}})
    }
    await transaction.commit()
  }

  return {synced, stale: staleIds.length, errors}
}

/**
 * Deletes all `vimeoVideo` documents marked as stale.
 * Documents that are still referenced by other documents are skipped
 * and reported so the user can unlink them first.
 */
export async function deleteStaleVideos(client: SanityClient): Promise<DeleteStaleResult> {
  const staleDocs = await client.fetch<{id: string; name: string; referenceCount: number}[]>(
    `*[_type == "vimeoVideo" && stale == true]{
      "id": _id, name, "referenceCount": count(*[references(^._id)])
    }`,
  )

  const deletable = staleDocs.filter((doc) => doc.referenceCount === 0)
  const skipped = staleDocs
    .filter((doc) => doc.referenceCount > 0)
    .map(({id, name}) => ({id, name}))

  for (let i = 0; i < deletable.length; i += BATCH_SIZE) {
    const batch = deletable.slice(i, i + BATCH_SIZE)
    const transaction = client.transaction()
    for (const doc of batch) {
      transaction.delete(doc.id)
    }
    await transaction.commit()
  }

  return {deleted: deletable.length, skipped}
}

export async function refreshSingleVideo(
  vimeoId: string,
  accessToken: string,
  client: SanityClient,
): Promise<void> {
  const response = await fetch(`${BASE_URL}/videos/${vimeoId}?fields=${API_FIELDS}`, {
    headers: {Authorization: `Bearer ${accessToken}`},
  })

  if (response.status === 404) {
    await client.patch(`vimeoVideo-${vimeoId}`).set({stale: true}).commit()
    throw new Error('Video no longer exists on Vimeo — marked as stale')
  }

  if (!response.ok) {
    throw new Error(`Vimeo API error: ${response.status} ${response.statusText}`)
  }

  const video: VimeoApiVideo = await response.json()
  const doc = mapVideoToDocument(video)
  await client.createOrReplace(doc)
}
