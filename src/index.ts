import type {FieldDefinitionBase, ReferenceDefinition} from 'sanity'
import {defineField, definePlugin} from 'sanity'

import {VimeoReferenceInput} from './components/VimeoReferenceInput'
import {vimeoVideoType} from './schema/vimeoVideo'

export {refreshSingleVideo, syncVimeoVideos} from './lib/syncVimeoVideos'
export {vimeoVideoType} from './schema/vimeoVideo'
export type {VimeoVideo} from './utils/types'

/**
 * Registers the hidden `vimeoVideo` document type with Sanity.
 * Add this to your `sanity.config.ts` plugins array.
 */
export const vimeoFieldPlugin = definePlugin(() => {
  return {
    name: 'sanity-plugin-vimeo-field',
    schema: {
      types: [vimeoVideoType],
    },
  }
})

/**
 * Returns a reference field definition pointing to `vimeoVideo`
 * with the custom Vimeo picker input component.
 * Use this inside a document's fields array.
 */
export const vimeoField = (
  fieldOptions?: Partial<Omit<FieldDefinitionBase, 'type'>> &
    Partial<Pick<ReferenceDefinition, 'options'>>,
) =>
  defineField({
    name: 'vimeo',
    title: 'Vimeo Video',
    ...fieldOptions,
    type: 'reference',
    to: [{type: 'vimeoVideo'}],
    components: {
      input: VimeoReferenceInput,
    },
  })
