import {CogIcon, PlayIcon, SearchIcon, SyncIcon} from '@sanity/icons'
import {useSecrets} from '@sanity/studio-secrets'
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Grid,
  Inline,
  Spinner,
  Stack,
  Text,
  TextInput,
} from '@sanity/ui'
import type {ReactElement} from 'react'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {useClient} from 'sanity'

import {syncVimeoVideos} from '../lib/syncVimeoVideos'
import type {VimeoVideo} from '../utils/types'

const NAMESPACE = 'vimeo'

interface VimeoSecrets {
  accessToken?: string
}

interface VimeoVideoGridProps {
  onSelect?: (doc: VimeoVideo) => void
  selectedId?: string
  columns?: number[]
  gap?: number | number[]
  showVideo?: boolean
  onConfigureToken?: () => void
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function pickThumbnail(sizes?: {width: number; height: number; link: string}[]) {
  if (!sizes?.length) {
    return null
  }
  const target = 295
  let best = sizes[0]
  let bestDiff = Math.abs(best.width - target)
  for (const size of sizes) {
    const diff = Math.abs(size.width - target)
    if (diff < bestDiff) {
      best = size
      bestDiff = diff
    }
  }
  return best
}

function pickLowResVideo(doc: VimeoVideo): string | null {
  const files = doc.files
  if (!files?.length) {
    return null
  }
  const sorted = [...files].sort((a, b) => a.width - b.width)
  return sorted[0].link
}

export function privacyTone(privacy?: string) {
  switch (privacy) {
    case 'anybody':
      return 'positive'
    case 'nobody':
      return 'critical'
    case 'unlisted':
      return 'caution'
    default:
      return 'default'
  }
}

export function privacyLabel(privacy?: string): string {
  switch (privacy) {
    case 'anybody':
      return 'Public'
    case 'nobody':
      return 'Private'
    case 'unlisted':
      return 'Unlisted'
    default:
      return privacy ?? 'Unknown'
  }
}

export function VimeoVideoGrid({
  onSelect,
  selectedId,
  columns = [1, 2, 3, 4],
  gap = 3,
  showVideo = false,
  onConfigureToken,
}: VimeoVideoGridProps): ReactElement {
  const client = useClient({apiVersion: '2024-01-01'})
  const {secrets} = useSecrets<VimeoSecrets>(NAMESPACE)
  const accessToken = secrets?.accessToken

  const [syncing, setSyncing] = useState(false)
  const [loadingVideos, setLoadingVideos] = useState(false)
  const [videos, setVideos] = useState<VimeoVideo[]>([])
  const [error, setError] = useState('')
  const [syncMessage, setSyncMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const loadVideos = useCallback(async () => {
    setLoadingVideos(true)
    setError('')
    try {
      const docs = await client.fetch<VimeoVideo[]>('*[_type == "vimeoVideo"] | order(name asc)')
      setVideos(docs || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load videos')
    }
    setLoadingVideos(false)
  }, [client])

  const handleSync = useCallback(async () => {
    if (!accessToken) {
      return
    }
    setError('')
    setSyncMessage('')
    setSyncing(true)
    try {
      const result = await syncVimeoVideos(accessToken, client)
      if (result.errors.length > 0) {
        const msg =
          `Synced ${result.synced} videos with ` +
          `${result.errors.length} error(s): ${result.errors[0]}`
        setError(msg)
      } else {
        setSyncMessage(`Synced ${result.synced} video${result.synced === 1 ? '' : 's'}`)
        setTimeout(() => setSyncMessage(''), 4000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
      setSyncing(false)
      return
    }
    setSyncing(false)
    await loadVideos()
  }, [accessToken, client, loadVideos])

  useEffect(() => {
    loadVideos()
  }, [loadVideos])

  const filteredVideos = useMemo(() => {
    if (!searchQuery.trim()) {
      return videos
    }
    const q = searchQuery.toLowerCase()
    return videos.filter((v) => v.name?.toLowerCase().includes(q) || v.vimeoId?.includes(q))
  }, [videos, searchQuery])

  return (
    <Stack space={4}>
      <Flex align="center" gap={3}>
        <Box style={{flex: 1}}>
          <TextInput
            icon={SearchIcon}
            placeholder="Search by name or ID…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            fontSize={1}
          />
        </Box>
        {syncMessage && (
          <Card padding={2} tone="positive" radius={2} style={{flexShrink: 0}}>
            <Text size={1}>{syncMessage}</Text>
          </Card>
        )}
        <Button
          text={syncing ? 'Syncing…' : 'Sync from Vimeo'}
          icon={SyncIcon}
          mode="ghost"
          tone="primary"
          disabled={syncing}
          onClick={handleSync}
          style={{flexShrink: 0}}
        />
        {syncing && <Spinner muted />}
        {onConfigureToken && (
          <Button
            text="Configure Access Token"
            icon={CogIcon}
            mode="ghost"
            tone="default"
            fontSize={1}
            onClick={onConfigureToken}
            style={{flexShrink: 0}}
          />
        )}
      </Flex>

      {loadingVideos && !videos.length && (
        <Flex justify="center" padding={5}>
          <Spinner muted />
        </Flex>
      )}

      {error && (
        <Card padding={3} tone="critical" radius={2}>
          <Text size={1}>{error}</Text>
        </Card>
      )}

      {!loadingVideos && !error && !videos.length && (
        <Card padding={4} tone="transparent" radius={2} border>
          <Text size={1} muted align="center">
            No videos synced yet. Click &lsquo;Sync from Vimeo&rsquo; to import your Vimeo library.
          </Text>
        </Card>
      )}

      {videos.length > 0 && !filteredVideos.length && (
        <Text size={1} muted align="center">
          No videos matching &ldquo;{searchQuery}&rdquo;
        </Text>
      )}

      {filteredVideos.length > 0 && (
        <Grid columns={columns} gap={gap}>
          {filteredVideos.map((doc) => {
            const thumb = pickThumbnail(doc.pictures?.sizes)
            const videoSrc = showVideo
              ? pickLowResVideo(doc)
              : null
            const isSelected = selectedId === doc._id
            return (
              <Card
                key={doc._id}
                radius={2}
                shadow={1}
                tone={isSelected ? 'primary' : 'default'}
                style={{cursor: onSelect ? 'pointer' : 'default', overflow: 'hidden'}}
                onClick={onSelect ? () => onSelect(doc) : undefined}
              >
                <div style={{aspectRatio: '4/3', backgroundColor: '#000', position: 'relative'}}>
                  {videoSrc ? (
                    <video
                      src={videoSrc}
                      controls
                      preload="metadata"
                      poster={thumb?.link}
                      style={{width: '100%', height: '100%', display: 'block', position: 'absolute', inset: 0, objectFit: 'contain'}}
                    />
                  ) : thumb && (
                    <img
                      src={thumb.link}
                      alt={doc.name}
                      style={{width: '100%', height: '100%', display: 'block', position: 'absolute', inset: 0, objectFit: 'contain'}}
                    />
                  )}
                </div>

                <Box padding={2}>
                  <Stack space={2}>
                    <Inline space={2}>
                      <Text size={1} weight="semibold" textOverflow="ellipsis">
                        {doc.name}
                      </Text>
                      <Badge tone={privacyTone(doc.privacy)} fontSize={0}>
                        {privacyLabel(doc.privacy)}
                      </Badge>
                    </Inline>
                    <Inline space={2}>
                      {doc.duration !== null && doc.duration !== undefined && (
                        <Text size={0} muted>
                          <PlayIcon style={{verticalAlign: 'middle', marginRight: 2}} />
                          {formatDuration(doc.duration)}
                        </Text>
                      )}
                      {doc.lastSynced && (
                        <Text size={0} muted>
                          {formatDate(doc.lastSynced)}
                        </Text>
                      )}
                    </Inline>
                  </Stack>
                </Box>
              </Card>
            )
          })}
        </Grid>
      )}
    </Stack>
  )
}
