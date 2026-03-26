# Sanity Plugin Vimeo Field

Retrieve Vimeo video data via the API with an access token and store it in Sanity.

## Installation

```sh
npm install sanity-plugin-vimeo-field
# or
pnpm add sanity-plugin-vimeo-field
```

> **Requires Sanity Studio v5** and React 18+.

## Setup

The plugin exposes two exports:

| Export | Purpose |
| --- | --- |
| `vimeoFieldPlugin` | Registers the hidden `vimeoVideo` document type. Add to `plugins`. |
| `vimeoField` | Returns a `reference` field pointing to `vimeoVideo`. Add to a document's `fields`. |

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
