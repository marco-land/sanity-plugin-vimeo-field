import {SettingsView, useSecrets} from '@sanity/studio-secrets'
import {Box, Flex, Spinner} from '@sanity/ui'
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

  if (showSettings || (!loading && !accessToken)) {
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

  return (
    <Box padding={4}>
      <VimeoVideoGrid columns={[1, 2, 4, 6]} gap={4} showVideo onConfigureToken={() => setShowSettings(true)} />
    </Box>
  )
}
