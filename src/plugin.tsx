// @ts-nocheck -- loose types inherited from pre-v5
import {VideoInput} from './components/VideoInput'
import type {VimeoFieldInput} from './utils/types'

export function vimeoFieldRendering() {
  return {
    components: {
      input: (props: VimeoFieldInput) => <VideoInput {...props} />,
    },
  }
}
