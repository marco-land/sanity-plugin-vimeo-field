// @ts-nocheck
import React, {useState} from 'react'
import {Inline, TextInput, Text, Code, Button, Stack, Spinner} from '@sanity/ui'
import {SyncIcon} from '@sanity/icons'

const DataFetcher = (props) => {
  // eslint-disable-next-line react/prop-types
  const {accessToken, onSuccess} = props
  const [vimeoId, setVimeoId] = useState('')
  const [isFetching, setIsFetching] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleChange = (event) => {
    setVimeoId(event.target.value)
  }
  const handleSubmit = async () => {
    setIsFetching(true)
    const options = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
    try {
      const response = await fetch(
        `https://api.vimeo.com/videos/${vimeoId}?fields=play,pictures,files,name`,
        options,
      )
      const data = await response.json()
      if (data?.name) {
        setErrorMsg('')
        data.id = vimeoId
        onSuccess(data)
      } else if (data?.error) {
        setErrorMsg(data?.error)
      }
      setIsFetching(false)
    } catch (error) {
      console.error('Error fetching data:', error)
      setErrorMsg('There was an error fetching data.')
      setIsFetching(false)
    }
  }

  return (
    <Stack>
      {!accessToken && (
        <Inline space={[2]}>
          <Text size={2}>No</Text>
          <Code size={2}>SANITY_STUDIO_VIMEO_ACCESS_TOKEN</Code>
          <Text size={2}>found!</Text>
        </Inline>
      )}
      {accessToken && (
        // Fetcher
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
      )}
      {errorMsg && <p style={{color: 'red'}}>Error: {errorMsg}</p>}
    </Stack>
  )
}

export default DataFetcher
