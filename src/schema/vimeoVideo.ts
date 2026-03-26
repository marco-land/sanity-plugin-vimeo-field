import {defineField, defineType} from 'sanity'

export const vimeoVideoType = defineType({
  name: 'vimeoVideo',
  title: 'Vimeo Video',
  type: 'document',
  liveEdit: true,
  readOnly: true,
  __experimental_omnisearch_visibility: true,
  fields: [
    defineField({
      name: 'vimeoId',
      title: 'Vimeo ID',
      type: 'string',
    }),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
    }),
    defineField({
      name: 'duration',
      title: 'Duration',
      type: 'number',
    }),
    defineField({
      name: 'privacy',
      title: 'Privacy',
      type: 'string',
    }),
    defineField({
      name: 'lastSynced',
      title: 'Last Synced',
      type: 'datetime',
    }),
    defineField({
      name: 'pictures',
      title: 'Pictures',
      type: 'object',
      fields: [
        defineField({
          name: 'sizes',
          title: 'Sizes',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                defineField({name: 'width', title: 'Width', type: 'number'}),
                defineField({name: 'height', title: 'Height', type: 'number'}),
                defineField({name: 'link', title: 'Link', type: 'url'}),
              ],
            },
          ],
        }),
      ],
    }),
    defineField({
      name: 'files',
      title: 'Files',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({name: 'quality', title: 'Quality', type: 'string'}),
            defineField({name: 'type', title: 'Type', type: 'string'}),
            defineField({name: 'width', title: 'Width', type: 'number'}),
            defineField({name: 'height', title: 'Height', type: 'number'}),
            defineField({name: 'link', title: 'Link', type: 'url'}),
            defineField({name: 'size', title: 'Size', type: 'number'}),
          ],
        },
      ],
    }),
    defineField({
      name: 'play',
      title: 'Play',
      type: 'object',
      fields: [
        defineField({
          name: 'progressive',
          title: 'Progressive',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                defineField({name: 'type', title: 'Type', type: 'string'}),
                defineField({name: 'rendition', title: 'Rendition', type: 'string'}),
                defineField({name: 'width', title: 'Width', type: 'number'}),
                defineField({name: 'height', title: 'Height', type: 'number'}),
                defineField({name: 'link', title: 'Link', type: 'url'}),
              ],
            },
          ],
        }),
        defineField({
          name: 'dash',
          title: 'Dash',
          type: 'object',
          fields: [defineField({name: 'link', title: 'Link', type: 'url'})],
        }),
        defineField({
          name: 'hls',
          title: 'HLS',
          type: 'object',
          fields: [defineField({name: 'link', title: 'Link', type: 'url'})],
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'vimeoId',
    },
  },
})
