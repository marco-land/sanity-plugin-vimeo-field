import type {Template} from 'sanity'
import {definePlugin} from 'sanity'

import {VimeoLibraryTool} from './components/VimeoLibraryTool'
import {vimeoSchemaType} from './schema/vimeoField'
import {vimeoVideoType} from './schema/vimeoVideo'

export {refreshSingleVideo, syncVimeoVideos} from './lib/syncVimeoVideos'
export {vimeoSchemaType} from './schema/vimeoField'
export {vimeoVideoType} from './schema/vimeoVideo'
export type {VimeoVideo} from './utils/types'

/**
 * Registers the `vimeoVideo` document type, `vimeo` object type,
 * and a Vimeo Library tool with Sanity.
 * Add this to your `sanity.config.ts` plugins array.
 *
 * Usage in a document schema:
 * ```ts
 * defineField({ type: 'vimeo', name: 'myVideo' })
 * ```
 */
export const vimeoField = definePlugin(() => {
  return {
    name: 'sanity-plugin-vimeo-field',
    schema: {
      types: [vimeoVideoType, vimeoSchemaType],
      templates: (prev: Template[]) => prev.filter((t) => t.schemaType !== 'vimeoVideo'),
    },
    tools: [
      {
        name: 'vimeo-library',
        title: 'Vimeo Library',
        component: VimeoLibraryTool,
      },
    ],
  }
})
