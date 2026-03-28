import type {Template} from 'sanity'
import {definePlugin} from 'sanity'

import {vimeoFieldType} from './schema/vimeoField'
import {vimeoVideoType} from './schema/vimeoVideo'

export {refreshSingleVideo, syncVimeoVideos} from './lib/syncVimeoVideos'
export {vimeoFieldType} from './schema/vimeoField'
export {vimeoVideoType} from './schema/vimeoVideo'
export type {VimeoVideo} from './utils/types'

/**
 * Registers the `vimeoVideo` document type and `vimeoField` object type with Sanity.
 * Add this to your `sanity.config.ts` plugins array.
 *
 * Usage in a document schema:
 * ```ts
 * defineField({ type: 'vimeoField', name: 'myVideo' })
 * ```
 */
export const vimeoFieldPlugin = definePlugin(() => {
  return {
    name: 'sanity-plugin-vimeo-field',
    schema: {
      types: [vimeoVideoType, vimeoFieldType],
      templates: (prev: Template[]) => prev.filter((t) => t.schemaType !== 'vimeoVideo'),
    },
  }
})
