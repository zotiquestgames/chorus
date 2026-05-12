# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**Chorus** is a fork of [zeruhur/sybyl](https://github.com/zeruhur/sybyl) — an Obsidian plugin for solo tabletop role-playing backed by multiple AI providers. The fork adds **Partylog** support: group play with multiple players and a GM (or GM-less mode), using Partylog notation alongside the existing Lonelog solo notation.

The full implementation plan for Partylog additions lives in `sybyl-partylog-fork-plan.md`. The Lonelog spec is in `sybyl-plugin-spec-lonelog.md`. The Partylog notation reference is in `partylog.md`.

**Note:** The codebase still carries "Sybyl" identifiers in many places (class names, command IDs, manifest). These will be renamed to "Chorus" as part of the ongoing migration — don't add new "Sybyl" identifiers.

## Commands

```bash
npm ci           # install deps
npm run check    # TypeScript type-check (no emit) — the only lint/test step
npm run build    # bundle to main.js via esbuild (dev build, inline sourcemap)
node esbuild.config.mjs production   # production build (minified, no sourcemap)
```

There is no test runner. `npm run check` / `npm test` both run `tsc --noEmit`. Type-check passes before every build.

## Architecture

### Request lifecycle

Every AI interaction follows this path:

1. A command in `commands.ts` calls `plugin.requestGeneration(fm, noteBody, userMessage, maxTokens)`
2. `main.ts` calls `buildRequest()` from `promptBuilder.ts`, which assembles `GenerationRequest` (system prompt + context block + user message)
3. The request goes to the active provider via `getProvider(settings).generate(request)`
4. The raw AI text comes back and is passed to a **formatter** function (from `lonelog/formatter.ts` or, once implemented, `partylog/formatter.ts`)
5. The formatted string is inserted into the editor via `insertText()` or `insertBelowSelection()`

### Context assembly (`promptBuilder.ts`)

`buildRequest()` determines which context block to inject:
- If Lonelog active and `noteBody` is provided → runs `parseLonelogContext()` on the note body (live parsing, always fresh)
- Otherwise → uses `fm.scene_context` from frontmatter (manually maintained)
- The `fm.scene_context` field is also the output target of the "Update Scene Context" command

The system prompt base comes from `buildBasePrompt(fm)` (or `fm.system_prompt_override` if set). Lonelog mode appends `LONELOG_SYSTEM_ADDENDUM`. Partylog mode will append its own addendum instead.

### Mode selection pattern

Both Lonelog and Partylog use the same pattern:
- Global toggle in settings (`lonelogMode` / `partylogMode`)
- Per-note frontmatter override (`lonelog: true` / `partylog: true`) takes precedence
- Helper function `isLonelogActive(settings, fm)` → `fm.lonelog ?? settings.lonelogMode`
- Commands check the active mode and branch to the appropriate formatter

Lonelog and Partylog are **mutually exclusive per note**. When both global toggles are on, Partylog takes precedence; settings tab shows a warning.

### Formatter pattern (`lonelog/formatter.ts`)

Each formatter takes AI text + `LonelogFormatOptions` (or `PartylogFormatOptions`) and returns a string ready for insertion. `wrapInCodeBlock` controls whether notation is fenced. `cleanAiText()` strips blockquote markers from AI output before formatting.

The `isInsideCodeBlock(editor, targetLine)` check in `commands.ts` passes `noWrap: true` to formatters when the cursor is already inside a code fence.

### Provider system (`providers/`)

All providers implement `AIProvider` from `providers/base.ts`. `getProvider(settings, providerId?)` is the factory. Providers use raw `fetch` — no vendor SDKs. PDF sources are handled per-provider: Anthropic encodes inline base64, OpenAI uses `vault_path` text extraction, Gemini uses the File API.

### Frontmatter access

- Reading: `readFrontMatter(app, file)` wraps Obsidian's metadata cache — cheap, synchronous-ish
- Writing: `writeFrontMatterKey(app, file, key, value)` and `app.fileManager.processFrontMatter()` for batch updates
- `scene_counter` and `session_number` are auto-incremented by scene/session commands and written back via `writeFrontMatterKey`

### Modals

`openInputModal(app, title, fields)` is a promise-based wrapper around `InputModal`. It resolves `null` when the user cancels. All commands use this pattern — always null-check the result before proceeding.

### Release

BRAT-based release: update `manifest.json` and `package.json` versions, update `versions.json`, commit, push a matching tag. The GitHub Actions workflow builds and attaches `main.js`, `manifest.json`, and `versions.json` to the release automatically.
