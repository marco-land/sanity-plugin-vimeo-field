import {CogIcon} from '@sanity/icons/Cog'
import {PlayIcon} from '@sanity/icons/Play'
import {SearchIcon} from '@sanity/icons/Search'
import {SyncIcon} from '@sanity/icons/Sync'
import {TrashIcon} from '@sanity/icons/Trash'
import {useSecrets} from '@sanity/studio-secrets'
// Layout note: @sanity/ui v4 (Sanity Studio v6) dropped `space` on Stack/Inline
// and `columns` on Grid in favour of `gap` / `gridTemplateColumns`. To stay
// compatible with both v3 and v4 we only use props that exist in both:
// `Flex` + `gap` for stacks/rows and `Grid` + `gap` with an inline template.
import {Badge, Box, Button, Card, Flex, Grid, Spinner, Text, TextInput} from '@sanity/ui'
import type {ReactElement} from 'react'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {useClient} from 'sanity'

import {deleteStaleVideos, syncVimeoVideos} from '../lib/syncVimeoVideos'
import type {VimeoVideo} from '../utils/types'

const NAMESPACE = 'vimeo'

interface VimeoSecrets {
  accessToken?: string
}

interface VimeoVideoGridProps {
  onSelect?: (doc: VimeoVideo) => void
  selectedId?: string
  /** Minimum card width in px; the grid fits as many columns as the container allows. */
  minCardWidth?: number
  gap?: number
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
      return privacy ?? ''
  }
}

const fillStyle = {
  width: '100%',
  height: '100%',
  display: 'block',
  position: 'absolute',
  inset: 0,
  objectFit: 'cover',
} as const

export function VimeoVideoGrid({
  onSelect,
  selectedId,
  minCardWidth = 220,
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
  const [removingStale, setRemovingStale] = useState(false)
  const [confirmRemoveStale, setConfirmRemoveStale] = useState(false)
  const [skippedStale, setSkippedStale] = useState<{id: string; name: string}[]>([])

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
        const staleSuffix = result.stale > 0 ? `, ${result.stale} marked stale` : ''
        setSyncMessage(
          `Synced ${result.synced} video${result.synced === 1 ? '' : 's'}${staleSuffix}`,
        )
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

  const handleRemoveStale = useCallback(async () => {
    setConfirmRemoveStale(false)
    setError('')
    setSyncMessage('')
    setSkippedStale([])
    setRemovingStale(true)
    try {
      const result = await deleteStaleVideos(client)
      setSyncMessage(`Deleted ${result.deleted} stale video${result.deleted === 1 ? '' : 's'}`)
      setTimeout(() => setSyncMessage(''), 4000)
      setSkippedStale(result.skipped)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete stale videos')
    }
    setRemovingStale(false)
    await loadVideos()
  }, [client, loadVideos])

  useEffect(() => {
    loadVideos()
  }, [loadVideos])

  const staleCount = useMemo(() => videos.filter((v) => v.stale).length, [videos])

  const filteredVideos = useMemo(() => {
    if (!searchQuery.trim()) {
      return videos
    }
    const q = searchQuery.toLowerCase()
    return videos.filter((v) => v.name?.toLowerCase().includes(q) || v.vimeoId?.includes(q))
  }, [videos, searchQuery])

  return (
    <Flex direction="column" gap={4}>
      <Flex align="center" gap={3} wrap="wrap">
        <Box style={{flex: 1, minWidth: 200}}>
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
        {staleCount > 0 &&
          (confirmRemoveStale ? (
            <Flex gap={2} style={{flexShrink: 0}}>
              <Button
                text={`Confirm Remove (${staleCount})`}
                tone="critical"
                mode="default"
                disabled={removingStale}
                onClick={handleRemoveStale}
              />
              <Button text="Cancel" mode="ghost" onClick={() => setConfirmRemoveStale(false)} />
            </Flex>
          ) : (
            <Button
              text={removingStale ? 'Removing…' : `Remove Stale (${staleCount})`}
              icon={TrashIcon}
              mode="ghost"
              tone="critical"
              disabled={removingStale}
              onClick={() => setConfirmRemoveStale(true)}
              style={{flexShrink: 0}}
            />
          ))}
        {removingStale && <Spinner muted />}
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

      {skippedStale.length > 0 && (
        <Card padding={3} tone="caution" radius={2}>
          <Text size={1}>
            Skipped {skippedStale.length} stale video{skippedStale.length === 1 ? '' : 's'} still
            referenced by other documents — unlink them first:{' '}
            {skippedStale.map((s) => s.name).join(', ')}
          </Text>
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
        <Grid
          gap={gap}
          style={{
            gridTemplateColumns: `repeat(auto-fill, minmax(min(${minCardWidth}px, 100%), 1fr))`,
          }}
        >
          {filteredVideos.map((doc) => {
            const thumb = pickThumbnail(doc.pictures?.sizes)
            const videoSrc = showVideo ? pickLowResVideo(doc) : null
            const isSelected = selectedId === doc._id
            const privacy = privacyLabel(doc.privacy)
            return (
              <Card
                key={doc._id}
                radius={2}
                shadow={1}
                tone={isSelected ? 'primary' : 'default'}
                style={{cursor: onSelect ? 'pointer' : 'default', overflow: 'hidden', minWidth: 0}}
                onClick={onSelect ? () => onSelect(doc) : undefined}
              >
                <div style={{aspectRatio: '16/9', backgroundColor: '#000', position: 'relative'}}>
                  {videoSrc ? (
                    <video
                      src={videoSrc}
                      controls
                      preload="none"
                      poster={thumb?.link}
                      style={{...fillStyle, objectFit: 'contain'}}
                    />
                  ) : (
                    thumb && (
                      <img src={thumb.link} alt={doc.name} loading="lazy" style={fillStyle} />
                    )
                  )}
                </div>

                <Flex direction="column" gap={2} padding={3}>
                  <Text size={1} weight="semibold" textOverflow="ellipsis" title={doc.name}>
                    {doc.name}
                  </Text>
                  <Flex gap={2} align="center" wrap="wrap">
                    {privacy && (
                      <Badge tone={privacyTone(doc.privacy)} fontSize={0}>
                        {privacy}
                      </Badge>
                    )}
                    {doc.stale && (
                      <Badge tone="critical" fontSize={0}>
                        Stale
                      </Badge>
                    )}
                    {doc.duration !== null && doc.duration !== undefined && (
                      <Flex gap={1} align="center">
                        <Text size={0} muted>
                          <PlayIcon />
                        </Text>
                        <Text size={0} muted>
                          {formatDuration(doc.duration)}
                        </Text>
                      </Flex>
                    )}
                  </Flex>
                  {doc.lastSynced && (
                    <Text size={0} muted textOverflow="ellipsis">
                      Synced {formatDate(doc.lastSynced)}
                    </Text>
                  )}
                </Flex>
              </Card>
            )
          })}
        </Grid>
      )}
    </Flex>
  )
}
