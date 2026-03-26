export interface VimeoVideoSize {
  width: number
  height: number
  link: string
}

export interface VimeoVideoProgressive {
  type: string
  rendition: string
  width: number
  height: number
  link: string
}

export interface VimeoVideoPlay {
  progressive?: VimeoVideoProgressive[]
  dash?: {link: string}
  hls?: {link: string}
}

export interface VimeoVideo {
  _id: string
  _type: 'vimeoVideo'
  vimeoId: string
  name: string
  duration?: number
  privacy?: string
  lastSynced?: string
  pictures?: {
    sizes?: VimeoVideoSize[]
  }
  play?: VimeoVideoPlay
}
