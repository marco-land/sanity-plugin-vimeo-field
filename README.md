# Sanity Plugin Vimeo Field

Retrieve Vimeo video data via the API with an access token and store it in Sanity.

## Installation

```sh
npm install sanity-plugin-vimeo-field
# or
pnpm add sanity-plugin-vimeo-field
```

> **Requires Sanity Studio v5** and React 18+.

## Configuration

Add the plugin to your Sanity configuration:

```ts
// `sanity.config.ts` / `sanity.config.js`:
import {defineConfig} from 'sanity'
import {vimeoField} from 'sanity-plugin-vimeo-field'

export default defineConfig({
  // ...
  plugins: [
    // ...
    vimeoField(),
  ],
})
```

### Vimeo Access Token

The first time you use the Vimeo field in the Studio, you will be prompted to enter your Vimeo API access token. The token is stored securely in the Sanity dataset using [@sanity/studio-secrets](https://github.com/sanity-io/plugins/tree/main/plugins/%40sanity/studio-secrets) — it is **not** exposed in the client-side JS bundle.

You can update the token at any time by clicking "Configure Vimeo Token" below the Vimeo ID input field.

## Usage

```ts
// … your schema
defineField({
  title: 'Vimeo',
  name: 'vimeo',
  type: 'vimeo',
  // Optional: Extend the default fields, see below for more information
  options: {
    fields: ['metadata'],
  },
})
```

## Options

By default the plugin stores the fields `name`, `pictures`, `files` and `play`, but you can extend (not overwrite) the fields through the options. Please be sure to add fields as an array of strings. See the [vimeo response documentation](https://developer.vimeo.com/api/reference/response/video) for a list of available fields.

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
