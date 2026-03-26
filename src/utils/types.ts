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

export interface VimeoVideoFile {
  quality: string
  type: string
  width: number
  height: number
  link: string
  size: number
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
  width?: number
  height?: number
  privacy?: string
  lastSynced?: string
  pictures?: {
    sizes?: VimeoVideoSize[]
  }
  files?: VimeoVideoFile[]
  play?: VimeoVideoPlay
}
