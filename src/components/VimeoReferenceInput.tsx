// @ts-nocheck -- loose types; tsc verification disabled for this plugin
import {PlayIcon, SearchIcon, SyncIcon, TrashIcon} from '@sanity/icons'
import {SettingsView, useSecrets} from '@sanity/studio-secrets'
import {
  Badge,
  Box,
  Button,
  Card,
  Dialog,
  Flex,
  Grid,
  Inline,
  Spinner,
  Stack,
  Text,
} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'
import {set, unset, useClient} from 'sanity'

import {refreshSingleVideo, syncVimeoVideos} from '../lib/syncVimeoVideos'
import type {VimeoVideo} from '../utils/types'

const NAMESPACE = 'vimeo'
const SECRET_KEYS = [{key: 'accessToken', title: 'Vimeo Access Token'}]

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function pickThumbnail(sizes?: {width: number; height: number; link: string}[]) {
  if (!sizes?.length) return null
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

function privacyTone(privacy?: string) {
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

function privacyLabel(privacy?: string): string {
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

export function VimeoReferenceInput(props) {
  const {onChange, value} = props
  const client = useClient({apiVersion: '2024-01-01'})
  const {secrets, loading: secretsLoading} = useSecrets(NAMESPACE)
  const accessToken = secrets?.accessToken

  const [dialogOpen, setDialogOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [loadingVideos, setLoadingVideos] = useState(false)
  const [videos, setVideos] = useState<VimeoVideo[]>([])
  const [error, setError] = useState('')
  const [syncMessage, setSyncMessage] = useState('')
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Resolved referenced document
  const [resolved, setResolved] = useState<VimeoVideo | null>(null)
  const [resolving, setResolving] = useState(false)

  const refId = value?._ref

  const resolveRef = useCallback(
    (id: string) => {
      setResolving(true)
      client
        .fetch<VimeoVideo>('*[_id == $id][0]', {id})
        .then((doc) => setResolved(doc || null))
        .catch(() => setResolved(null))
        .finally(() => setResolving(false))
    },
    [client],
  )

  // Resolve the referenced document when we have a ref
  useEffect(() => {
    if (!refId) {
      setResolved(null)
      return
    }
    resolveRef(refId)
  }, [refId, resolveRef])

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
    if (!accessToken) return
    setError('')
    setSyncMessage('')
    setSyncing(true)
    try {
      const result = await syncVimeoVideos(accessToken, client)
      if (result.errors.length > 0) {
        setError(
          `Synced ${result.synced} videos with ${result.errors.length} error(s): ${result.errors[0]}`,
        )
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

  const handleRefresh = useCallback(async () => {
    if (!accessToken || !resolved?.vimeoId || !refId) return
    setRefreshing(true)
    try {
      await refreshSingleVideo(resolved.vimeoId, accessToken, client)
      resolveRef(refId)
    } catch {
      // Silently fail — the user can see lastSynced didn't change
    }
    setRefreshing(false)
  }, [accessToken, client, resolved?.vimeoId, refId, resolveRef])

  const handleOpen = useCallback(() => {
    if (!accessToken) {
      setShowSettings(true)
      return
    }
    setDialogOpen(true)
  }, [accessToken])

  // Load existing documents when dialog opens (no sync)
  useEffect(() => {
    if (dialogOpen) {
      loadVideos()
    }
  }, [dialogOpen, loadVideos])

  const handleSelect = useCallback(
    (doc: VimeoVideo) => {
      onChange(set({_type: 'reference', _ref: doc._id}))
      setDialogOpen(false)
    },
    [onChange],
  )

  const handleRemove = useCallback(() => {
    onChange(unset())
    setConfirmRemove(false)
  }, [onChange])

  if (showSettings || (!secretsLoading && !accessToken)) {
    return (
      <SettingsView
        title="Vimeo Credentials"
        namespace={NAMESPACE}
        keys={SECRET_KEYS}
        onClose={() => setShowSettings(false)}
      />
    )
  }

  if (secretsLoading) {
    return (
      <Flex justify="center" padding={4}>
        <Spinner muted />
      </Flex>
    )
  }

  // Populated state
  if (refId) {
    if (resolving) {
      return (
        <Card padding={4} border radius={2}>
          <Flex justify="center">
            <Spinner muted />
          </Flex>
        </Card>
      )
    }

    if (!resolved) {
      return (
        <Card padding={4} border radius={2} tone="caution">
          <Stack space={3}>
            <Text size={1}>Referenced video not found ({refId})</Text>
            <Inline space={2}>
              <Button text="Change" icon={SearchIcon} mode="ghost" onClick={handleOpen} />
              <Button
                text="Remove"
                icon={TrashIcon}
                mode="ghost"
                tone="critical"
                onClick={() => onChange(unset())}
              />
            </Inline>
          </Stack>
        </Card>
      )
    }

    const thumb = pickThumbnail(resolved.pictures?.sizes)

    return (
      <Card padding={3} border radius={2}>
        <Stack space={3}>
          <Flex gap={3} align="flex-start">
            {thumb && (
              <img
                src={thumb.link}
                alt={resolved.name}
                style={{
                  width: '120px',
                  height: 'auto',
                  borderRadius: '2px',
                  flexShrink: 0,
                }}
              />
            )}
            <Stack space={2} style={{flex: 1}}>
              <Inline space={2}>
                <Text size={1} weight="semibold">
                  {resolved.name}
                </Text>
                <Badge tone={privacyTone(resolved.privacy)} fontSize={0}>
                  {privacyLabel(resolved.privacy)}
                </Badge>
              </Inline>
              <Text size={0} muted>
                ID: {resolved.vimeoId}
              </Text>
              {resolved.duration !== null && resolved.duration !== undefined && (
                <Text size={0} muted>
                  Duration: {formatDuration(resolved.duration)}
                </Text>
              )}
              {resolved.lastSynced && (
                <Text size={0} muted>
                  Last synced: {formatDate(resolved.lastSynced)}
                </Text>
              )}
            </Stack>
          </Flex>
          <Inline space={2}>
            <Button text="Change" icon={SearchIcon} mode="ghost" onClick={handleOpen} />
            <Button
              text={refreshing ? 'Refreshing…' : 'Refresh'}
              icon={SyncIcon}
              mode="ghost"
              disabled={refreshing}
              onClick={handleRefresh}
            />
            {refreshing && <Spinner muted />}
            {confirmRemove ? (
              <Inline space={2}>
                <Button
                  text="Confirm Remove"
                  tone="critical"
                  mode="default"
                  onClick={handleRemove}
                />
                <Button text="Cancel" mode="ghost" onClick={() => setConfirmRemove(false)} />
              </Inline>
            ) : (
              <Button
                text="Remove"
                icon={TrashIcon}
                mode="ghost"
                tone="critical"
                onClick={() => setConfirmRemove(true)}
              />
            )}
            <Button
              text="Configure Vimeo Token"
              mode="ghost"
              tone="default"
              fontSize={1}
              onClick={() => setShowSettings(true)}
            />
          </Inline>
        </Stack>

        {dialogOpen && renderPickerDialog()}
      </Card>
    )
  }

  // Empty state
  return (
    <Stack space={3}>
      <Button text="Select Video" icon={SearchIcon} tone="primary" onClick={handleOpen} />
      <Inline>
        <Button
          text="Configure Vimeo Token"
          mode="ghost"
          tone="default"
          fontSize={1}
          onClick={() => setShowSettings(true)}
        />
      </Inline>

      {dialogOpen && renderPickerDialog()}
    </Stack>
  )

  function renderPickerDialog() {
    return (
      <Dialog
        id="vimeo-picker"
        header="Select a Vimeo Video"
        onClose={() => setDialogOpen(false)}
        width={3}
      >
        <Box padding={4}>
          <Stack space={4}>
            <Flex justify="flex-end" align="center" gap={3}>
              {syncMessage && (
                <Card padding={2} tone="positive" radius={2}>
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
              />
              {syncing && <Spinner muted />}
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
                  No videos synced yet. Click &lsquo;Sync from Vimeo&rsquo; to import your Vimeo
                  library.
                </Text>
              </Card>
            )}

            {videos.length > 0 && (
              <Grid columns={[1, 2, 3, 4]} gap={3}>
                {videos.map((doc) => {
                  const thumb = pickThumbnail(doc.pictures?.sizes)
                  const isSelected = refId === doc._id
                  return (
                    <Card
                      key={doc._id}
                      radius={2}
                      shadow={1}
                      tone={isSelected ? 'primary' : 'default'}
                      style={{cursor: 'pointer', overflow: 'hidden'}}
                      onClick={() => handleSelect(doc)}
                    >
                      {thumb && (
                        <img
                          src={thumb.link}
                          alt={doc.name}
                          style={{width: '100%', height: 'auto', display: 'block'}}
                        />
                      )}
                      <Box padding={2}>
                        <Stack space={2}>
                          <Text size={1} weight="semibold" textOverflow="ellipsis">
                            {doc.name}
                          </Text>
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
        </Box>
      </Dialog>
    )
  }
}
