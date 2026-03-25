// @ts-nocheck -- loose types inherited from pre-v5
import {TrashIcon} from '@sanity/icons'
import {Button, Card, Inline, Stack, Text, TextInput} from '@sanity/ui'
import {set, unset} from 'sanity'

import type {VimeoFieldInput} from '../utils/types'
import VideoPicker from './VideoPicker'

export const VideoInput = (props: VimeoFieldInput) => {
  const fields = props?.schemaType?.options?.fields

  const {onChange, value} = props
  const handleReset = () => {
    onChange(unset())
  }

  const handleSelect = (data) => {
    onChange(data ? set(data) : unset())
  }

  const imgStyle = {
    width: 'auto',
    height: '100px',
    borderRadius: '2px',
  }

  return (
    <Card>
      {!value && <VideoPicker onSelect={handleSelect} fields={fields} />}
      <div>{value?.error}</div>
      {value?.pictures?.sizes?.length && (
        <Stack space={4}>
          <Stack space={3}>
            <Text size={1} weight="semibold">
              ID
            </Text>
            <TextInput fontSize={2} padding={3} readOnly value={value?.id} />
          </Stack>
          <Stack space={3}>
            <Text size={1} weight="semibold">
              Thumbnail
            </Text>
            <img
              src={value.pictures.sizes[0]?.link}
              width={value.pictures.sizes[0].width}
              height={value.pictures.sizes[0].height}
              alt="Vimeo"
              style={imgStyle}
            />
          </Stack>
          <Stack space={3}>
            <Text size={1} weight="semibold">
              Title
            </Text>
            <TextInput fontSize={2} padding={3} readOnly value={value?.name} />
          </Stack>
          <Inline space={[2]}>
            <Button
              text="Reset"
              icon={TrashIcon}
              mode="ghost"
              onClick={handleReset}
              type="reset"
              tone="critical"
            />
          </Inline>
        </Stack>
      )}
    </Card>
  )
}
