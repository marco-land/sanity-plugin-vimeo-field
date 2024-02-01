import React from 'react'

import VideoInput from './components/VideoInput'
import type {Config, VimeoFieldInput} from './utils/types'

export function vimeoFieldRendering(config: Config) {
  return {
    components: {
      input: (props: VimeoFieldInput) => <VideoInput config={config} {...props} />,
    },
  }
}
