# Sanity Plugin Vimeo Field

[![npm version](https://img.shields.io/npm/v/sanity-plugin-vimeo-field)](https://www.npmjs.com/package/sanity-plugin-vimeo-field)
[![npm downloads](https://img.shields.io/npm/dm/sanity-plugin-vimeo-field)](https://www.npmjs.com/package/sanity-plugin-vimeo-field)
[![license](https://img.shields.io/npm/l/sanity-plugin-vimeo-field)](https://github.com/marco-land/sanity-plugin-vimeo-field/blob/main/LICENSE)
[![CI](https://github.com/marco-land/sanity-plugin-vimeo-field/actions/workflows/release.yml/badge.svg)](https://github.com/marco-land/sanity-plugin-vimeo-field/actions/workflows/release.yml)

Syncs your Vimeo video library into Sanity as first-class documents and provides a reference field with a visual picker.

<img style="width: 100%; height: auto;" width="2494" height="1928" alt="Sanity Vimeo Field Plugin" src="https://github.com/user-attachments/assets/d6ee6045-7326-4445-8205-97d4cdac4e52" />

## Installation

```sh
npm install sanity-plugin-vimeo-field
# or
pnpm add sanity-plugin-vimeo-field
```

> **Requires Sanity Studio v5** and React 18+.

## Setup

### 1. Register the plugin

```ts
// sanity.config.ts
import {defineConfig} from 'sanity'
import {vimeoFieldPlugin} from 'sanity-plugin-vimeo-field'

export default defineConfig({
  // ...
  plugins: [vimeoFieldPlugin()],
})
```

### 2. Add a Vimeo field to a document

Use the `vimeoField` type in any document's fields array. All standard field options (`hidden`, `readOnly`, `group`, `validation`, etc.) work as expected.

```ts
// schemas/movie.ts
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'movie',
  title: 'Movie',
  type: 'document',
  fields: [
    defineField({
      type: 'vimeoField',
      name: 'trailer',
      title: 'Trailer',
    }),

    // With standard field options
    defineField({
      type: 'vimeoField',
      name: 'behindTheScenes',
      title: 'Behind the Scenes',
      hidden: ({document}) => !document?.title,
      readOnly: true,
      group: 'media',
    }),
  ],
})
```

### 3. Vimeo access token

The first time you use the field, you will be prompted to enter your Vimeo API access token. The token is stored securely in the Sanity dataset using [@sanity/studio-secrets](https://github.com/sanity-io/plugins/tree/main/plugins/%40sanity/studio-secrets).

To create a token, go to [developer.vimeo.com/apps](https://developer.vimeo.com/apps), select your app (or create one), and generate a personal access token with the following scopes:

- **Public** — access public videos
- **Private** — access private and unlisted videos
- **Video Files** — access direct video file links (progressive/HLS/DASH)

> The **Video Files** scope requires a Vimeo **Pro** plan or above. Without it the `play` field will be empty.

## How it works

Videos are stored as hidden `vimeoVideo` documents in your dataset. The `vimeoField` type is an object that contains a reference to these documents.

### Vimeo Library tool

<img style="width: 100%; height: auto;" width="3176" height="1956" alt="Sanity Vimeo Field Plugin" src="https://github.com/user-attachments/assets/3ae6ab7e-e53a-45f0-aee1-350433adbca3" />

The plugin adds a **Vimeo Library** tool to the Studio sidebar. It provides a searchable, browsable grid of all synced videos with inline video playback. From here you can:

- **Search** videos by name or Vimeo ID.
- **Sync from Vimeo** to fetch your full Vimeo library and upsert documents.
- **Configure Access Token** to update your Vimeo API credentials.

### Vimeo field

<img style="width: 100%; height: auto;" width="3176" height="1956" alt="Sanity Vimeo Field Plugin" src="https://github.com/user-attachments/assets/9dc4e1ad-5884-4a57-a9d3-efd924211413" />

When using the `vimeoField` type in a document:

- **Select Video** opens a picker dialog showing all synced videos.
- **Sync from Vimeo** (in the picker) fetches your full Vimeo library and upserts documents.
- **Refresh** (on the populated field) re-syncs just the selected video from the Vimeo API.

## The `vimeoVideo` document

Each synced video is stored as a document with this shape:

| Field        | Type       | Description                                    |
| ------------ | ---------- | ---------------------------------------------- |
| `vimeoId`    | `string`   | Numeric Vimeo video ID                         |
| `name`       | `string`   | Video title                                    |
| `duration`   | `number`   | Duration in seconds                            |
| `width`      | `number`   | Video width in pixels                          |
| `height`     | `number`   | Video height in pixels                         |
| `privacy`    | `string`   | Privacy setting — `anybody`, `nobody`, `unlisted`, etc. |
| `lastSynced` | `datetime` | When this document was last synced              |
| `pictures`   | `object`   | Thumbnail sizes (array of `{width, height, link}`) |
| `files`      | `array`    | Video file downloads — `{quality, type, width, height, link, size}` |
| `play`       | `object`   | Playback links — `progressive[]`, `dash`, `hls` |

Documents use the ID format `vimeoVideo-{vimeoId}` and have `liveEdit: true` (no draft/publish workflow).

> **Note:** The `files` and `play` fields require a Vimeo account with API access to direct video file links (Pro plan or above). On free/basic accounts these fields will be empty.

> **Important:** The `play` links (progressive/HLS/DASH) are short-lived and will expire after a few hours. They are not suitable for use in production frontends. Use the `files` field instead — it contains persistent direct MP4 download URLs that do not expire.

## Querying in the frontend

The field stores a reference inside an object, so you need to dereference the nested `asset` field in your GROQ query:

```groq
*[_type == "movie"][0] {
  title,
  trailer {
    asset-> {
      vimeoId,
      name,
      duration,
      width,
      height,
      privacy,
      "thumbnail": pictures.sizes[0].link,
      "mp4": files[quality == "hd"][0].link,
      files
    }
  }
}
```

### TypeScript type

Import the `VimeoVideo` type for use in your frontend code:

```ts
import type {VimeoVideo} from 'sanity-plugin-vimeo-field'
```

## License

[MIT](LICENSE) © Marco Land

## Develop & test

This plugin uses [@sanity/plugin-kit](https://github.com/sanity-io/plugin-kit) with default configuration for build & watch scripts.

```sh
# Install dependencies
pnpm install

# Build the plugin
pnpm build

# Watch for changes during development
pnpm watch

# Link into a Sanity Studio for live development
pnpm link-watch

# Lint
pnpm lint
```

See [Testing a plugin in Sanity Studio](https://github.com/sanity-io/plugin-kit#testing-a-plugin-in-sanity-studio) on how to run this plugin with hotreload in the studio.
