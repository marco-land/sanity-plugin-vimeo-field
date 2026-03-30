import {defineField, defineType} from 'sanity'

import {VimeoReferenceInput} from '../components/VimeoReferenceInput'

export const vimeoSchemaType = defineType({
  name: 'vimeo',
  title: 'Vimeo Video',
  type: 'object',
  fields: [
    defineField({
      components: {
        input: VimeoReferenceInput,
        field: (props) => props.children,
      },
      name: 'asset',
      title: 'Asset',
      type: 'reference',
      to: [{type: 'vimeoVideo'}],
    }),
  ],
})
