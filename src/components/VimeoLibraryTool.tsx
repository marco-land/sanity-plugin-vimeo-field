import {SettingsView, useSecrets} from '@sanity/studio-secrets'
import {Box, Button, Card, Flex, Spinner, Text} from '@sanity/ui'
import type {ReactElement} from 'react'
import {useState} from 'react'

import {VimeoVideoGrid} from './VimeoVideoGrid'

const NAMESPACE = 'vimeo'
const SECRET_KEYS = [{key: 'accessToken', title: 'Vimeo Access Token'}]

interface VimeoSecrets {
  accessToken?: string
}

export function VimeoLibraryTool(): ReactElement {
  const {secrets, loading} = useSecrets<VimeoSecrets>(NAMESPACE)
  const accessToken = secrets?.accessToken
  const [showSettings, setShowSettings] = useState(false)

  if (showSettings) {
    return (
      <Box padding={4}>
        <SettingsView
          title="Vimeo Credentials"
          namespace={NAMESPACE}
          keys={SECRET_KEYS}
          onClose={() => setShowSettings(false)}
        />
      </Box>
    )
  }

  if (loading) {
    return (
      <Flex justify="center" padding={5}>
        <Spinner muted />
      </Flex>
    )
  }

  if (!accessToken) {
    return (
      <Box padding={4}>
        <Card padding={4} tone="caution" radius={2} border>
          <Flex direction="column" gap={3}>
            <Text size={1}>
              No Vimeo access token configured. Add your token to start syncing videos.
            </Text>
            <Button
              text="Configure Access Token"
              tone="primary"
              onClick={() => setShowSettings(true)}
            />
          </Flex>
        </Card>
      </Box>
    )
  }

  return (
    <Box padding={4}>
      <VimeoVideoGrid
        minCardWidth={260}
        gap={4}
        showVideo
        onConfigureToken={() => setShowSettings(true)}
      />
    </Box>
  )
}
