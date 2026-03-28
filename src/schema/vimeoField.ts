import {defineField, defineType} from 'sanity'

import {VimeoReferenceInput} from '../components/VimeoReferenceInput'

export const vimeoFieldType = defineType({
  name: 'vimeoField',
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
