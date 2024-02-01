import {definePlugin, defineType} from 'sanity'

import {vimeo} from './schema'
import {VideoInput} from './components/VideoInput'
interface Config {
  accessToken?: string
}

const defaultConfig: Config = {
  accessToken: '',
}

export const vimeoField = definePlugin<Config | void>((userConfig) => {
  const config: Config = {...defaultConfig, ...userConfig}
  return {
    name: 'sanity-plugin-vimeo-field',
    schema: {
      types: [
        defineType({
          title: 'Vimeo Video',
          name: 'vimeo',
          type: 'object',
          components: {
            input: (props) => VideoInput(config, props),
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
