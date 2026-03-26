import {defineField, definePlugin} from 'sanity'

import {vimeoVideoType} from './schema/vimeoVideo'

export {vimeoVideoType} from './schema/vimeoVideo'
export {syncVimeoVideos} from './lib/syncVimeoVideos'

export const vimeoField = (options?: {name?: string; title?: string}) =>
  defineField({
    name: options?.name ?? 'vimeo',
    title: options?.title ?? 'Vimeo Video',
    type: 'reference',
    to: [{type: 'vimeoVideo'}],
  })

export const vimeoPlugin = definePlugin(() => {
  return {
    name: 'sanity-plugin-vimeo-field',
    schema: {
      types: [vimeoVideoType],
    },
  }
})
