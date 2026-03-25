// @ts-nocheck -- loose types inherited from pre-v5
import {SyncIcon} from '@sanity/icons'
import {SettingsView, useSecrets} from '@sanity/studio-secrets'
import {Button, Inline, Spinner, Stack, Text, TextInput} from '@sanity/ui'
import {useState} from 'react'

const NAMESPACE = 'vimeo'
const SECRET_KEYS = [{key: 'accessToken', title: 'Vimeo Access Token'}]

const DataFetcher = (props) => {
  const {onSuccess, fields} = props
  const {secrets} = useSecrets(NAMESPACE)
  const accessToken = secrets?.accessToken

  const [vimeoId, setVimeoId] = useState('')
  const [isFetching, setIsFetching] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [showSettings, setShowSettings] = useState(false)

  let url = `https://api.vimeo.com/videos/${vimeoId}?fields=name,play,pictures,files`
  if (fields?.length) {
    url += `,${fields.join(',')}`
  }

  const handleChange = (event) => {
    setVimeoId(event.target.value)
  }

  const handleSubmit = async () => {
    setIsFetching(true)
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {Authorization: `Bearer ${accessToken}`},
      })
      const data = await response.json()
      if (data?.name) {
        setErrorMsg('')
        data.id = vimeoId
        onSuccess(data)
      } else if (data?.error) {
        setErrorMsg(data.error)
      }
      setIsFetching(false)
    } catch (error) {
      console.error('Error fetching data:', error)
      setErrorMsg('There was an error fetching data.')
      setIsFetching(false)
    }
  }

  if (showSettings || !accessToken) {
    return (
      <SettingsView
        title="Vimeo Credentials"
        namespace={NAMESPACE}
        keys={SECRET_KEYS}
        onClose={() => setShowSettings(false)}
      />
    )
  }

  return (
    <Stack space={3}>
      <Inline space={[2]}>
        <TextInput
          onChange={handleChange}
          value={vimeoId}
          placeholder="Vimeo ID"
          disabled={isFetching}
        />
        <Button
          text="Fetch"
          onClick={handleSubmit}
          disabled={vimeoId.trim() === '' || isFetching}
          icon={SyncIcon}
          tone="primary"
        />
        {isFetching && <Spinner muted />}
      </Inline>
      <Inline>
        <Button
          text="Configure Vimeo Token"
          mode="ghost"
          tone="default"
          fontSize={1}
          onClick={() => setShowSettings(true)}
        />
      </Inline>
      {errorMsg && (
        <Text size={1} style={{color: 'red'}}>
          Error: {errorMsg}
        </Text>
      )}
    </Stack>
  )
}

export default DataFetcher
