import {SearchIcon, SyncIcon, TrashIcon} from '@sanity/icons'
import {SettingsView, useSecrets} from '@sanity/studio-secrets'
import {
  Badge,
  Box,
  Button,
  Card,
  Dialog,
  Flex,
  Inline,
  Spinner,
  Stack,
  Text,
} from '@sanity/ui'
import type {ReactElement} from 'react'
import {useCallback, useEffect, useState} from 'react'
import type {ObjectInputProps, Reference, ReferenceSchemaType} from 'sanity'
import {set, unset, useClient} from 'sanity'

import {refreshSingleVideo} from '../lib/syncVimeoVideos'
import type {VimeoVideo} from '../utils/types'
import {
  formatDate,
  formatDuration,
  pickThumbnail,
  privacyLabel,
  privacyTone,
  VimeoVideoGrid,
} from './VimeoVideoGrid'

const NAMESPACE = 'vimeo'
const SECRET_KEYS = [{key: 'accessToken', title: 'Vimeo Access Token'}]

interface VimeoSecrets {
  accessToken?: string
}

export function VimeoReferenceInput(
  props: ObjectInputProps<Reference, ReferenceSchemaType>,
): ReactElement {
  const {onChange, value} = props
  const client = useClient({apiVersion: '2024-01-01'})
  const {secrets, loading: secretsLoading} = useSecrets<VimeoSecrets>(NAMESPACE)
  const accessToken = secrets?.accessToken

  const [dialogOpen, setDialogOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
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

  const handleRefresh = useCallback(async () => {
    if (!accessToken || !resolved?.vimeoId || !refId) {
      return
    }
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

        {dialogOpen && (
          <Dialog
            id="vimeo-picker"
            header="Select a Vimeo Video"
            onClose={() => setDialogOpen(false)}
            width={3}
          >
            <Box padding={4}>
              <VimeoVideoGrid onSelect={handleSelect} selectedId={refId} />
            </Box>
          </Dialog>
        )}
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

      {dialogOpen && (
        <Dialog
          id="vimeo-picker"
          header="Select a Vimeo Video"
          onClose={() => setDialogOpen(false)}
          width={3}
        >
          <Box padding={4}>
            <VimeoVideoGrid onSelect={handleSelect} selectedId={refId} />
          </Box>
        </Dialog>
      )}
    </Stack>
  )
}
