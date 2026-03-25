# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Sanity Studio v3 plugin that provides a custom `vimeo` field type. Users enter a Vimeo video ID, the plugin fetches video data from the Vimeo API (name, pictures, files, play + optional extra fields), and stores it in Sanity.

## Commands

- **Build:** `pnpm build` (cleans dist, verifies package, builds with pkg-utils)
- **Watch:** `pnpm watch` (rebuild on changes)
- **Lint:** `pnpm lint` (ESLint with sanity/typescript/react presets + prettier)
- **Format:** `pnpm format` (prettier)
- **Dev in Studio:** `pnpm link-watch` (hot-reload via @sanity/plugin-kit)

Package manager is **pnpm**. No test suite exists.

## Architecture

Built with `@sanity/plugin-kit` and `@sanity/pkg-utils`. Entry point: `src/index.ts`.

- **`src/index.ts`** — `definePlugin` entry. Merges user config (accessToken), registers the `vimeo` schema type with a custom input component.
- **`src/schema.ts`** — Standalone `vimeo` type definition (currently unused; the actual schema is defined inline in `index.ts`).
- **`src/plugin.tsx`** — Alternate rendering wrapper (currently unused by the main plugin export).
- **`src/components/VideoInput.tsx`** — Custom input component. Shows `DataFetcher` when no value; displays thumbnail/title/ID and a reset button when populated.
- **`src/components/DataFetcher.tsx`** — Handles Vimeo ID input and API fetch. Calls `https://api.vimeo.com/videos/{id}` with Bearer token auth. Supports extending default fields via `options.fields` on the schema field.
- **`src/utils/types.ts`** — Shared TypeScript interfaces (`Config`, `VimeoFieldInput`).

The plugin config accepts `accessToken` (from env var `SANITY_STUDIO_VIMEO_ACCESS_TOKEN`). Schema field `options.fields` allows extending the default Vimeo API response fields.

## Notes

- Several source files use `@ts-nocheck`; TypeScript checking is also disabled in plugin-kit verification (`sanityPlugin.verifyPackage.tsc: false`).
- `src/schema.ts` and `src/plugin.tsx` appear to be leftover/unused — the active schema and component wiring is all in `src/index.ts`.
- Build output goes to `dist/` (CJS + ESM + types).
