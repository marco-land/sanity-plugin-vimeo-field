# Sanity Plugin Vimeo Field

Retrieve Vimeo video data via the API with an access token and store it in Sanity.

![Sanity Plugin Vimeo Field Preview](https://github.com/marco-land/sanity-plugin-vimeo-field/assets/24410335/b1bd4b87-4575-4669-9ea8-a704806a9532)

## Installation

```sh
yarn install sanity-plugin-vimeo-field
# or npm
npm install sanity-plugin-vimeo-field
```

ℹ This is a **Sanity Studio** v3 plugin

## Configuration

Add your Vimeo access token to your `.env`

```sh
SANITY_STUDIO_VIMEO_ACCESS_TOKEN="YOUR_ACCESS_TOKEN"
```

Add the plugin to your Sanity configuration

```ts
// `sanity.config.ts` / `sanity.config.js`:
import {defineConfig} from 'sanity'
import {vimeoField} from 'sanity-plugin-vimeo-field'

export default defineConfig({
  // ...
  plugins: [
    // ...
    vimeoField({
      accessToken: process.env.SANITY_STUDIO_VIMEO_ACCESS_TOKEN,
    }),
  ],
})
```

## Usage

```ts
// … your schema
defineField({
  title: 'Vimeo',
  name: 'vimeo',
  type: 'vimeo',
})
```

## License

[MIT](LICENSE) © Marco Land

## Develop & test

This plugin uses [@sanity/plugin-kit](https://github.com/sanity-io/plugin-kit)
with default configuration for build & watch scripts.

See [Testing a plugin in Sanity Studio](https://github.com/sanity-io/plugin-kit#testing-a-plugin-in-sanity-studio)
on how to run this plugin with hotreload in the studio.
