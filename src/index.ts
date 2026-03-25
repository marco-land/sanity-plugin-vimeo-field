import {definePlugin, defineType} from 'sanity'

import {VideoInput} from './components/VideoInput'

export const vimeoField = definePlugin(() => {
  return {
    name: 'sanity-plugin-vimeo-field',
    schema: {
      types: [
        defineType({
          title: 'Vimeo Video',
          name: 'vimeo',
          type: 'object',
          components: {
            input: (props) => VideoInput(props),
          },
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
        }),
      ],
    },
  }
})
