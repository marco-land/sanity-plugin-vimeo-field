// @ts-nocheck -- loose types inherited from pre-v5
import {PlayIcon, SearchIcon} from '@sanity/icons'
import {SettingsView, useSecrets} from '@sanity/studio-secrets'
import {Box, Button, Card, Dialog, Flex, Grid, Inline, Spinner, Stack, Text} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'

const NAMESPACE = 'vimeo'
const SECRET_KEYS = [{key: 'accessToken', title: 'Vimeo Access Token'}]
const PER_PAGE = 24
const BROWSE_FIELDS = 'uri,name,duration,created_time,pictures'

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'})
}

function pickThumbnail(sizes) {
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

function extractId(uri) {
  const match = uri?.match(/\/videos\/(\d+)/)
  return match ? match[1] : null
}

const VideoPicker = ({onSelect, fields}) => {
  const {secrets} = useSecrets(NAMESPACE)
  const accessToken = secrets?.accessToken

  const [open, setOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [videos, setVideos] = useState([])
  const [page, setPage] = useState(1)
  const [paging, setPaging] = useState({next: null, previous: null})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selecting, setSelecting] = useState(null)

  const fetchVideos = useCallback(
    async (p) => {
      if (!accessToken) return
      setLoading(true)
      setError('')
      try {
        const res = await fetch(
          `https://api.vimeo.com/me/videos?per_page=${PER_PAGE}&page=${p}&fields=${BROWSE_FIELDS}`,
          {headers: {Authorization: `Bearer ${accessToken}`}},
        )
        const json = await res.json()
        if (json.data) {
          setVideos(json.data)
          setPaging(json.paging || {next: null, previous: null})
          setPage(p)
        } else if (json.error) {
          setError(json.error)
        }
      } catch {
        setError('Failed to load videos.')
      }
      setLoading(false)
    },
    [accessToken],
  )

  useEffect(() => {
    if (open && accessToken) {
      fetchVideos(1)
    }
  }, [open, accessToken, fetchVideos])

  const handleSelect = async (video) => {
    const id = extractId(video.uri)
    if (!id) return
    setSelecting(id)

    let url = `https://api.vimeo.com/videos/${id}?fields=name,play,pictures,files`
    if (fields?.length) {
      url += `,${fields.join(',')}`
    }

    try {
      const res = await fetch(url, {
        headers: {Authorization: `Bearer ${accessToken}`},
      })
      const data = await res.json()
      if (data?.name) {
        data.id = id
        setOpen(false)
        onSelect(data)
      } else if (data?.error) {
        setError(data.error)
      }
    } catch {
      setError('Failed to fetch video details.')
    }
    setSelecting(null)
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
    <>
      <Stack space={3}>
        <Button
          text="Select Video"
          icon={SearchIcon}
          tone="primary"
          onClick={() => setOpen(true)}
        />
        <Inline>
          <Button
            text="Configure Vimeo Token"
            mode="ghost"
            tone="default"
            fontSize={1}
            onClick={() => setShowSettings(true)}
          />
        </Inline>
      </Stack>

      {open && (
        <Dialog
          id="vimeo-picker"
          header="Select a Vimeo Video"
          onClose={() => setOpen(false)}
          width={3}
        >
          <Box padding={4}>
            {loading && !videos.length && (
              <Flex justify="center" padding={5}>
                <Spinner muted />
              </Flex>
            )}

            {error && (
              <Card padding={3} tone="critical" radius={2}>
                <Text size={1}>{error}</Text>
              </Card>
            )}

            {!loading && !error && !videos.length && (
              <Text size={1} muted>
                No videos found.
              </Text>
            )}

            {videos.length > 0 && (
              <Stack space={4}>
                <Grid columns={[1, 2, 3, 4]} gap={3}>
                  {videos.map((video) => {
                    const thumb = pickThumbnail(video.pictures?.sizes)
                    const id = extractId(video.uri)
                    const isSelecting = selecting === id
                    return (
                      <Card
                        key={video.uri}
                        radius={2}
                        shadow={1}
                        style={{cursor: isSelecting ? 'wait' : 'pointer', overflow: 'hidden'}}
                        onClick={() => !selecting && handleSelect(video)}
                      >
                        {thumb && (
                          <img
                            src={thumb.link}
                            alt={video.name}
                            style={{
                              width: '100%',
                              height: 'auto',
                              display: 'block',
                            }}
                          />
                        )}
                        <Box padding={2}>
                          <Stack space={2}>
                            <Text size={1} weight="semibold" textOverflow="ellipsis">
                              {video.name}
                            </Text>
                            <Inline space={2}>
                              {video.duration !== null && video.duration !== undefined && (
                                <Text size={0} muted>
                                  <PlayIcon style={{verticalAlign: 'middle', marginRight: 2}} />
                                  {formatDuration(video.duration)}
                                </Text>
                              )}
                              {video.created_time && (
                                <Text size={0} muted>
                                  {formatDate(video.created_time)}
                                </Text>
                              )}
                            </Inline>
                            {isSelecting && <Spinner muted />}
                          </Stack>
                        </Box>
                      </Card>
                    )
                  })}
                </Grid>

                <Flex justify="center" gap={3}>
                  <Button
                    text="Previous"
                    mode="ghost"
                    disabled={!paging.previous || loading}
                    onClick={() => fetchVideos(page - 1)}
                  />
                  <Button
                    text="Next"
                    mode="ghost"
                    disabled={!paging.next || loading}
                    onClick={() => fetchVideos(page + 1)}
                  />
                </Flex>

                {loading && videos.length > 0 && (
                  <Flex justify="center">
                    <Spinner muted />
                  </Flex>
                )}
              </Stack>
            )}
          </Box>
        </Dialog>
      )}
    </>
  )
}

export default VideoPicker
