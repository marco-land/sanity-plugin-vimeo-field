# Sanity Plugin Vimeo Field

Syncs your Vimeo video library into Sanity as first-class documents and provides a reference field with a visual picker.

## Installation

```sh
npm install sanity-plugin-vimeo-field
# or
pnpm add sanity-plugin-vimeo-field
```

> **Requires Sanity Studio v5** and React 18+.

## Setup

The plugin exposes two main exports:

| Export             | Purpose                                                            |
| ------------------ | ------------------------------------------------------------------ |
| `vimeoFieldPlugin` | Registers the hidden `vimeoVideo` document type. Add to `plugins`. |
| `vimeoField`       | Returns a `reference` field pointing to `vimeoVideo`. Add to a document's `fields`. |

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

```ts
// schemas/movie.ts
import {defineType} from 'sanity'
import {vimeoField} from 'sanity-plugin-vimeo-field'

export default defineType({
  name: 'movie',
  title: 'Movie',
  type: 'document',
  fields: [
    // Uses defaults: name 'vimeo', title 'Vimeo Video'
    vimeoField(),

    // Or override name, title, validation, etc.
    vimeoField({name: 'trailer', title: 'Trailer'}),
  ],
})
```

### 3. Vimeo access token

The first time you use the field, you will be prompted to enter your Vimeo API access token. The token is stored securely in the Sanity dataset using [@sanity/studio-secrets](https://github.com/sanity-io/plugins/tree/main/plugins/%40sanity/studio-secrets).

## How it works

Videos are stored as hidden `vimeoVideo` documents in your dataset. The field is a standard Sanity `reference` to these documents.

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
| `privacy`    | `string`   | Privacy setting — `anybody`, `nobody`, `unlisted`, etc. |
| `lastSynced` | `datetime` | When this document was last synced              |
| `pictures`   | `object`   | Thumbnail sizes (array of `{width, height, link}`) |
| `play`       | `object`   | Playback links — `progressive[]`, `dash`, `hls` |

Documents use the ID format `vimeoVideo-{vimeoId}` and have `liveEdit: true` (no draft/publish workflow).

> **Note:** The `play` field (progressive/HLS/DASH direct links) requires a Vimeo account with API access to direct video file links (Pro plan or above). On free/basic accounts this field will be empty.

## Querying in the frontend

The field stores a reference, so you need to dereference it in your GROQ query:

```groq
*[_type == "movie"][0] {
  title,
  vimeo-> {
    vimeoId,
    name,
    duration,
    privacy,
    "thumbnail": pictures.sizes[0].link,
    play
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

# Format
pnpm format
```

See [Testing a plugin in Sanity Studio](https://github.com/sanity-io/plugin-kit#testing-a-plugin-in-sanity-studio) on how to run this plugin with hotreload in the studio.
