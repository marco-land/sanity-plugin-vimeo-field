import {defineType} from 'sanity'

export const vimeo = defineType({
  title: 'Vimeo Video',
  name: 'vimeo',
  type: 'object',
  // components: {
  //   input: (props) => {
  //     console.log(config)
  //   },
  // },
  fields: [
    {
      type: 'object',
      name: 'vimeoData',
      title: 'Vimeo Data',
      readOnly: true,
      fields: [
        {
          title: 'Vimeo ID',
          name: 'id',
          type: 'string',
        },
      ],
    },
  ],
})
