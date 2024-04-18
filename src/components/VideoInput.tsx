// @ts-nocheck
import React from 'react'
import {Card, Inline, Button, Text, TextInput, Stack} from '@sanity/ui'
import DataFetcher from './DataFetcher'
import {TrashIcon} from '@sanity/icons'
import type {Config, VimeoFieldInput} from '../utils/types'
import {unset, set} from 'sanity'

export interface InputProps extends VimeoFieldInput {
  config: Config
}

export const VideoInput = (config: Config, props: InputProps) => {
  const {fields} = props?.schemaType?.options
  const {accessToken} = config

  const {onChange, value} = props
  const handleReset = () => {
    onChange(unset())
  }

  const setVimeoData = (data) => {
    onChange(data ? set(data) : unset())
  }

  const imgStyle = {
    width: 'auto',
    height: '100px',
    borderRadius: '2px',
  }

  return (
    <Card>
      {!value && <DataFetcher accessToken={accessToken} onSuccess={setVimeoData} fields={fields} />}
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
