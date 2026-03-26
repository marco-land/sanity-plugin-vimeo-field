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

interface VimeoApiVideo {
  uri: string
  name: string
  duration: number
  privacy?: {view?: string}
  pictures: {sizes: VimeoSize[]}
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
  errors: string[]
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

const API_FIELDS = 'uri,name,duration,created_time,pictures,play,privacy.view'
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

  const transaction = client.transaction()
  for (const video of videos) {
    try {
      const doc = mapVideoToDocument(video)
      transaction.createOrReplace(doc)
      synced++
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err))
    }
  }

  await transaction.commit()

  return {synced, errors}
}

export async function refreshSingleVideo(
  vimeoId: string,
  accessToken: string,
  client: SanityClient,
): Promise<void> {
  const response = await fetch(`${BASE_URL}/videos/${vimeoId}?fields=${API_FIELDS}`, {
    headers: {Authorization: `Bearer ${accessToken}`},
  })

  if (!response.ok) {
    throw new Error(`Vimeo API error: ${response.status} ${response.statusText}`)
  }

  const video: VimeoApiVideo = await response.json()
  const doc = mapVideoToDocument(video)
  await client.createOrReplace(doc)
}
