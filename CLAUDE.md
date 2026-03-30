# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Do not add Co-Authored-By lines to commit messages.

## Overview

Sanity Studio v5 plugin that syncs Vimeo videos into Sanity as first-class `vimeoVideo` documents and provides a custom reference field with a visual picker. Videos are fetched from the Vimeo API and stored/updated via `createOrReplace`.

## Commands

- **Build:** `pnpm build` (cleans dist, verifies package, builds with pkg-utils)
- **Watch:** `pnpm watch` (rebuild on changes)
- **Lint:** `pnpm lint` (ESLint with sanity/typescript/react presets + prettier)
- **Format:** `pnpm format` (prettier)
- **Dev in Studio:** `pnpm link-watch` (hot-reload via @sanity/plugin-kit)

Package manager is **pnpm**. No test suite exists.

## Architecture

Built with `@sanity/plugin-kit` and `@sanity/pkg-utils`. Entry point: `src/index.ts`.

### Exports (from `src/index.ts`)

- **`vimeoField`** — `definePlugin` that registers the hidden `vimeoVideo` document type. Goes in `sanity.config.ts` plugins array.
- **`vimeoSchemaType`** — The `vimeo` object type definition (registered by the plugin). Contains a reference to `vimeoVideo` with the custom `VimeoReferenceInput` component. Used as `type: 'vimeo'` in a document's fields array.
- **`syncVimeoVideos(accessToken, client)`** — Fetches all videos from `GET /me/videos` (paginated), upserts them as `vimeoVideo` documents. Returns `{ synced, errors }`.
- **`refreshSingleVideo(vimeoId, accessToken, client)`** — Fetches and upserts a single video by ID.
- **`vimeoVideoType`** — The raw Sanity document type definition, re-exported for advanced use.
- **`VimeoVideo`** — TypeScript type for the `vimeoVideo` document shape, for frontend use.

### Source files

- **`src/schema/vimeoVideo.ts`** — `vimeoVideo` document type definition (vimeoId, name, duration, privacy, lastSynced, pictures, play). Uses `liveEdit: true`.
- **`src/lib/syncVimeoVideos.ts`** — Sync engine. `syncVimeoVideos` paginates through `GET /me/videos`, maps responses to document shape, and batches upserts in a single transaction. `refreshSingleVideo` fetches and upserts one video.
- **`src/components/VimeoReferenceInput.tsx`** — Custom input component for the reference field. Empty state shows "Select Video" button; populated state shows thumbnail, title, privacy badge, duration, lastSynced, with Change/Refresh/Remove actions. The picker dialog queries existing `vimeoVideo` documents and has a manual "Sync from Vimeo" button.
- **`src/utils/types.ts`** — `VimeoVideo` TypeScript interface for the document shape.

### Key patterns

- Vimeo access token is stored via `@sanity/studio-secrets` (namespace `vimeo`), not environment variables.
- Document IDs are deterministic: `vimeoVideo-{numericVimeoId}`.
- The Vimeo API fields requested: `uri,name,duration,created_time,pictures,play,privacy.view`.
- Array items in Sanity documents use `_key` fields (e.g. `{width}x{height}` for picture sizes).

## Notes

- `VimeoReferenceInput.tsx` uses `@ts-nocheck`; TypeScript checking is disabled in plugin-kit verification (`sanityPlugin.verifyPackage.tsc: false`).
- Build output goes to `dist/` (CJS + ESM + types).
