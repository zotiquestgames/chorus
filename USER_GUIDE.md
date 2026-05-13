# Chorus User Guide

Chorus is an Obsidian plugin for solo and group tabletop role-playing. It helps start scenes, interpret oracle results, suggest consequences, log group play, and format output in either a generic inline style, Lonelog notation, or Partylog notation.

Chorus is a fork of [zeruhur/sybyl](https://github.com/zeruhur/sybyl) that adds Partylog support for group play with multiple players and a GM.

If you are new to Chorus, read the **[Tutorial](TUTORIAL.md)** first — it walks through installation, setup, and a complete first session with worked examples. This document is a reference for when you need to look something specific up.

---

## What Chorus Does

Chorus works inside the active markdown note. Each request is stateless. There is no persistent chat thread.

It can:

- generate scene openings
- interpret declared actions and dice outcomes
- interpret oracle answers
- suggest complications
- expand a scene into prose
- convert raw session notes into Partylog notation
- distil source documents into a compact `game_context` block stored in frontmatter
- parse Lonelog or Partylog notes into compact AI context

Each request is built from:

- the note frontmatter (`ruleset`, `pcs` or `party`, `game_context`, `scene_context`, etc.)
- the current scene context (from `scene_context` or live log parsing)
- the command-specific prompt

Source files are **not** injected into every request. They are used once via the **Digest Source into Game Context** command, which distils them into `game_context` and stores the result in frontmatter.

---

## Installation

### Manual

1. Build the plugin:

```bash
npm ci
npm run build
```

2. Copy these files into your vault plugin folder:

- `main.js`
- `manifest.json`
- `versions.json`

Target folder example:

```text
.obsidian/plugins/chorus/
```

3. Enable the plugin in Obsidian.

### BRAT

If the GitHub repo has a release with `main.js`, `manifest.json`, and `versions.json`, BRAT can install it directly from the repository URL.

---

## First-Time Setup

Open **Settings → Chorus**.

### 1. Pick an Active Provider

Choose one of:

- Gemini
- OpenAI
- Anthropic (Claude)
- OpenRouter
- Ollama

This is the default provider unless a note overrides it in frontmatter.

### 2. Configure the Provider

| Provider   | Required           |
|------------|--------------------|
| Gemini     | API key            |
| OpenAI     | API key            |
| Anthropic  | API key            |
| OpenRouter | API key            |
| Ollama     | Base URL           |

### 3. Set Global Behavior

- **Default temperature** — affects all generation unless overridden per note
- **Insertion mode** — at cursor or end of note
- **Show token count** — appends an HTML comment with token usage after each response
- **Lonelog mode** — global toggle for solo structured play; can also be set per note in frontmatter
- **Partylog mode** — global toggle for group play; can also be set per note in frontmatter

Lonelog and Partylog are mutually exclusive per note. If both global toggles are on, Partylog takes precedence unless the note frontmatter specifies otherwise. The settings tab displays a warning when both global toggles are on simultaneously.

---

## YAML Frontmatter

Frontmatter is not strictly required, but it is the primary control surface for note-specific behavior and should be treated as the normal way to use the plugin.

Without frontmatter, Chorus still works using the globally active provider, its default model, and a generic prompt.

### Quick Setup

Run **Chorus: Insert Note Frontmatter** on any note. It asks for a ruleset, optional genre, PC details, tone, and language, then writes a complete frontmatter block with sensible defaults.

### Recommended Minimal Frontmatter — Solo

```yaml
---
ruleset: "Ironsworn"
pcs: "Kira Voss"
oracle_mode: "yes-no"
---
```

### Recommended Minimal Frontmatter — Group Play

```yaml
---
ruleset: "Blades in the Dark"
partylog: true
party:
  - name: "Kael"
    notes: "Lurk. Shadow specialty. HP 8/12."
  - name: "Sable"
    notes: "Slide. Finesse weapons. HP 10/10."
---
```

### Full Frontmatter Reference

```yaml
---
# ── Game identity ────────────────────────────────────────────────
# Game system or ruleset. Used in the base system prompt.
ruleset: "Ironsworn"

# Optional genre tag. Supplementary to ruleset.
genre: "Dark fantasy / survival"

# ── Solo mode ────────────────────────────────────────────────────
# Player character(s). Name, rank, vows, traits — anything relevant.
# Used in solo and Lonelog mode. Ignored when partylog: true.
pcs: "Kira Voss, dangerous rank, vow: recover the relic"

# Creative tone. Injected into the system prompt.
tone: "Gritty, hopeful"

# ── Group play (Partylog mode) ────────────────────────────────────
# Party roster. Replaces pcs when partylog: true.
# Each entry becomes @(Name) attribution in Partylog output.
party:
  - name: "Kael"
    notes: "Lurk. Shadow specialty. HP 8/12."
  - name: "Sable"
    notes: "Slide. Finesse weapons. HP 10/10."
  - name: "Mira"
    notes: "Cutter. Heavy armor. HP 9/9."

# Optional GM name — for session header scribe attribution.
gm_name: "Jordan"

# ── Chorus-specific fields ────────────────────────────────────────
# Optional oracle mode hint used by Ask Oracle.
# Supported values: "yes-no", "fate", "custom"
oracle_mode: "yes-no"

# Optional language instruction.
# If omitted, Chorus responds in the same language as the input.
language: "en"

# Optional per-note provider override.
# Supported values: "gemini", "openai", "anthropic", "ollama", "openrouter"
provider: "gemini"

# Optional per-note model override.
model: "gemini-2.5-flash"

# Optional per-note temperature override.
temperature: 0.7

# Optional full replacement for the built-in system prompt.
# If set, this bypasses all default Chorus prompt logic.
system_prompt_override: ""

# Static game rules and world facts, distilled from source material.
# Populated by the "Digest Source into Game Context" command.
# Injected into the system prompt on every request.
game_context: ""

# Dynamic scene state — the current situation in play.
# If non-empty, takes precedence over live log parsing.
# Updated by "Update Scene Context" / "Update Scene Context from Log", or manually.
scene_context: ""

# Optional note-specific source list.
# Managed through plugin commands, not by hand.
sources:
  - label: "Oracle Tables"
    mime_type: "text/plain"
    vault_path: "rpg/ironsworn/oracles.txt"

# Notation mode overrides for this note.
lonelog: false
partylog: false

# Counters. Managed automatically by commands.
scene_counter: 1
session_number: 1
---
```

### Frontmatter Fields Explained

#### `ruleset`

The game system or ruleset being played. Injected into the base system prompt. If omitted, Chorus falls back to a generic phrase like `the game`.

#### `genre`

Optional supplementary genre description. Injected into the system prompt alongside `ruleset`.

#### `pcs`

Player character description for solo mode. Name, rank, vows, key traits, injuries — anything that should ground the AI's responses. Keep it concise; it is included in every request. Ignored when `partylog: true`.

#### `tone`

Creative and genre tone. Injected into the system prompt. Examples: `"Gritty, hopeful"`, `"Eerie but playful"`, `"Low fantasy, grounded"`.

#### `party`

Party roster for group play. Each entry has `name` and `notes`. Character names must match exactly what you type in Partylog commands, as they are used for `@(Name)` attribution. `pcs` is ignored when this is active.

#### `gm_name`

Optional GM name. Used in Partylog session headers for scribe attribution.

#### `oracle_mode`

Used by Ask Oracle when the oracle result field is left blank.

| Value   | Behaviour |
|---------|-----------|
| `yes-no` | Binary oracle. Produces a yes or no answer, optionally with a qualifier. Default when omitted. |
| `fate`   | Likelihood oracle. Produces a graduated result — strong yes, complication, twist, etc. Suitable for Mythic-style play. |
| `custom` | Open-ended hint. The model interprets the oracle loosely, guided by `ruleset` and `game_context`. |

#### `language`

Language instruction for model responses. If omitted, the model responds in the same language as the input.

#### `provider`

Overrides the plugin-wide active provider for this note. Supported values: `gemini`, `openai`, `anthropic`, `ollama`, `openrouter`.

#### `model`

Overrides the provider default model for this note.

#### `temperature`

Overrides the global temperature for this note. Typical range: 0.2 (tight) to 0.9 (loose).

#### `system_prompt_override`

Completely replaces the built-in Chorus system prompt. Use only when you want deliberate custom behavior for a specific note.

#### `game_context`

Static knowledge about the game world and rules. Populated once by **Digest Source into Game Context** and injected into the system prompt on every request.

#### `scene_context`

The current scene state. If non-empty, this takes precedence over live log parsing. Updated by **Update Scene Context** (Lonelog) or **Update Scene Context from Log** (Partylog), or edited manually.

#### `sources`

The list of source files attached to the current note. Managed by **Add Source File** and **Manage Sources**.

#### `lonelog` / `partylog`

Enables or disables the respective mode for this note, overriding the global setting. Mutually exclusive: if both are `true` in frontmatter, `partylog` wins.

#### `scene_counter` / `session_number`

Managed automatically by scene and session commands.

### Should You Edit Frontmatter By Hand?

| Field | Hand-edit? |
|---|---|
| `ruleset`, `genre`, `pcs`, `tone` | Yes |
| `party`, `gm_name` | Yes |
| `oracle_mode`, `language` | Yes |
| `provider`, `model`, `temperature` | Yes |
| `lonelog`, `partylog` | Yes |
| `scene_context` | Yes, or via command |
| `game_context` | Only to clear or correct it |
| `sources` | Prefer commands |
| `scene_counter`, `session_number` | Prefer commands |
| `system_prompt_override` | Only if you know what you're doing |

---

## Commands

All commands appear in the Obsidian command palette as **Chorus: \<name\>**.

### Insert Note Frontmatter

Asks for a ruleset, optional genre, PC details, tone, and language, then writes a complete frontmatter block to the active note. Existing values are not overwritten.

### Digest Source into Game Context

Picks a vault file, reads it, and sends it to the AI with a digest prompt tailored to the current game. The condensed result is stored in `game_context` in the note frontmatter.

Run this once at session setup. The `game_context` is then included in every subsequent request automatically, with no per-request file overhead.

Supported file types depend on the active provider:

- Text and Markdown: all providers
- PDF: Gemini and Anthropic only

### Ask the Rules

Sends a specific question to the AI along with the full content of a selected source file. Use when you need a precise rules answer that the digest may not cover.

If the note has one source attached, it is used automatically. If multiple sources are attached, a picker is shown first.

### Adventure Seed

Generates a structured campaign pitch with Premise, Conflict, Hook, and Tone — using the note's `ruleset` and `game_context`. Optionally accepts a theme or concept to steer the result. When the party roster is active, the seed is party-aware automatically.

- Normal mode: inserts a blockquote-style pitch block
- Lonelog mode: inserts a `gen: Adventure Seed` result block

### Generate Character

Creates a character by following the exact character creation procedure in a source file. Uses the full source text — not `game_context` — so that stat ranges, starting equipment, and mechanical steps are precise.

Requires at least one source attached to the note. Optionally accepts a character concept.

- Normal mode: inserts a blockquote-style character sheet
- Lonelog mode: outputs a `[PC:Name|stat|gear|trait]` tag block

### Start Scene

Generates a short scene opening.

- Normal mode: inserts a blockquote-style scene line
- Lonelog mode: asks for a scene description and inserts a scene header plus prose

For Partylog group play, use **Chorus: New Scene** instead.

### Declare Action

Prompts for an action and a roll result. Returns consequences and world reaction only. The PC's action is never described by the model.

For Partylog group play with character attribution and collaborator support, use **Chorus: Declare Action** instead.

### Ask Oracle

Prompts for a question and an optional oracle result.

- With a result: interprets it in context
- Without a result: generates an answer and interpretation based on `oracle_mode`

### Interpret Oracle Roll

Uses the current editor selection if available. If nothing is selected, asks for oracle text. Inserts the interpretation below the selection.

### What Now

Generates 1–2 neutral possibilities for what the world does next, based on the current context.

- Partylog mode: outputs `=>` consequence lines
- Lonelog mode: outputs Lonelog notation
- Normal mode: outputs a blockquote

### What Can I Do

Suggests concrete actions the PC (or party) could take next, presented as neutral numbered options. Does not resolve any outcome or recommend one over another.

In Partylog mode, an optional **Character name** field scopes the suggestions to a specific party member.

### Expand Scene

Generates a 100–150 word prose passage from the current context. Third person, past tense, no dialogue.

- Partylog mode: uses `\--- ... ---\` block delimiters
- Lonelog mode: uses Lonelog narrative block delimiters
- Normal mode: uses a blockquote

### Add Source File

Picks a vault file or a local file and attaches it to the current note's `sources` list. Local files are copied into a `sources/` folder alongside the note.

### Manage Sources

Lists sources attached to the current note. Allows removing a source.

### Update Scene Context *(Lonelog only)*

Parses the current note body using the Lonelog parser and writes a compact summary into `scene_context`. No AI call.

### New Session Header *(Lonelog only)*

Asks for a date and duration, then inserts a formatted session header block and increments `session_number`.

---

## Partylog Commands

All Partylog commands are gated: they abort with a notice if Partylog mode is not enabled for the active note.

### Chorus: New Scene

Opens a new scene for group play.

1. Asks for a **Scene description** and an optional **Thread ID** (e.g. `T2` for split-party).
2. Generates 2–3 lines of atmosphere prose.
3. Inserts a Partylog scene header: `### S8 *The burning mill*` or `### T2-S8 *...* ` for thread-specific scenes.
4. Increments `scene_counter` if auto-increment is on.

### Chorus: Declare Action

Logs a character action with AI-generated consequences.

Fields:
- **Character** — must match a name in the `party` roster
- **Action** — what the character attempted
- **Roll result** — dice outcome
- **Collaborator** (optional) — triggers `@(Character > Collaborator)` collaborative action pattern

Output format: `@(Name)` + `d:` + `=>` lines, fenced in a code block if the wrap setting is on.

### Chorus: Log GM Event

Logs a world event introduced by the GM.

- With consequence: calls the AI and inserts a `!` line plus `=>` consequence lines.
- Without consequence: inserts a bare `!` line immediately with no AI call.

### Chorus: Log This

The primary group play command. Converts raw session notes into valid Partylog notation.

- If text is selected in the editor, uses it as raw input.
- Otherwise opens a textarea modal for raw notes.

The AI attributes actions to party members using exact names from the `party` roster, applies Partylog symbols (`@`, `!`, `d:`, `->`, `=>`), and preserves event sequence. The formatted output is inserted below the selection (or at cursor if from modal) — the raw input is never replaced.

Requires a `party` roster in frontmatter. Uses up to 800 output tokens; split very long sessions into blocks.

### Chorus: Update Scene Context from Log

Runs the Partylog parser on the note body and writes the serialized context to `scene_context` in frontmatter. No AI call. Shows a notice on completion.

### Chorus: New Session Header

Inserts a session break for group play.

Fields: **Date** (pre-filled today), **Duration**, optional **Scribe**, optional **Recap**.

Output:

```markdown
## Session 3
*Date: 2026-05-13 | Duration: 3h | Scribe: Jordan*

**Recap:** The party escaped the mill but lost the sealed letter.
```

Increments `session_number` in frontmatter.

---

## How Context Works

Chorus assembles each request from three layers:

| Layer | Source | When active |
|---|---|---|
| System prompt | `ruleset`, `pcs` or `party`, `tone`, `game_context` | Always |
| Scene context | `scene_context` or live log parsing | If either is available |
| Command prompt | The specific command | Always |

**`game_context`** is injected into the system prompt. Set it once with the digest command and it applies to every request.

**`scene_context`** is prepended to the user message. If non-empty, it takes precedence over live log parsing. If empty and a notation mode is active, the current note body is parsed automatically.

If neither is available, Chorus generates from the command prompt alone.

---

## Provider Notes

### Gemini

- Uses `requestUrl` (Obsidian's network API) — works correctly inside the desktop app
- Supports inline PDF via `inlineData` when used with the digest command

### OpenAI

- Text files and Markdown only for sources
- Supports base URL override for Azure or proxy endpoints

### Anthropic

- Supports inline PDF at digest time (base64 encoded)
- Use short PDF excerpts to avoid high token costs

### OpenRouter

- Access to many free and paid models via a unified API
- Free models have `:free` in their model ID
- Text files and Markdown only for sources

### Ollama

- Local only, no API key required
- Text files and Markdown only

---

## Recommended Workflow

### Solo — Normal Note

1. Run **Insert Note Frontmatter** and fill in ruleset and PC details
2. If you have source material, run **Add Source File** then **Digest Source into Game Context**
3. Use **Start Scene**, **Declare Action**, **Ask Oracle**, **What Now**, **What Can I Do** during play
4. Update `scene_context` manually as scenes develop

### Solo — Lonelog Note

1. Run **Insert Note Frontmatter** and enable `lonelog: true`
2. Optionally digest source material into `game_context`
3. Use **Start Scene** to open each scene
4. Log play in Lonelog notation
5. Use **Update Scene Context** to snapshot the current state
6. Use **New Session Header** at the start of each session

### Group Play — Partylog Note

1. Run **Insert Note Frontmatter** and set `partylog: true`
2. Add a `party:` array to frontmatter with each player character's name and notes
3. Optionally add `gm_name:` for scribe attribution
4. Optionally digest source material into `game_context`
5. Use **Chorus: New Scene** to open each scene
6. Use **Chorus: Declare Action** and **Chorus: Log GM Event** during play
7. Use **Chorus: Log This** to convert handwritten or freeform notes into Partylog notation after the fact
8. Use **Chorus: Update Scene Context from Log** to snapshot the current state
9. Use **Chorus: New Session Header** at the start of each session

---

## Troubleshooting

### No response or provider error

- Check API key or base URL in settings
- Confirm the selected model exists for that provider
- Check that the per-note `provider` override is what you intended

### Digest command fails on a PDF

- Gemini and Anthropic support PDF inline; OpenAI, OpenRouter, and Ollama do not
- For those providers, convert the relevant sections to a `.txt` or `.md` file

### Lonelog commands say Lonelog is not enabled

Enable Lonelog globally in settings, or set `lonelog: true` in the note frontmatter.

### Partylog commands say Partylog is not enabled

Enable Partylog globally in settings, or set `partylog: true` in the note frontmatter.

### Log This says no party roster found

Add a `party:` list to the note frontmatter with at least one entry before using **Chorus: Log This**.

### Character not found in party roster

The name typed in the **Character** field of Declare Action must match a `name:` entry in the `party:` list exactly (case-sensitive).

### `game_context` is stale

Re-run **Digest Source into Game Context** on the same or an updated source file. The command overwrites the existing value.
