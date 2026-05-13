# Chorus

![cover](/cover.png)

[![GitHub tag (Latest by date)](https://img.shields.io/github/v/tag/zeruhur/chorus)](https://github.com/zeruhur/chorus/releases) ![GitHub all releases](https://img.shields.io/github/downloads/zeruhur/chorus/total)

Chorus is an Obsidian plugin for solo and group tabletop role-playing, backed by multiple AI providers, with Lonelog and Partylog notation support.

Chorus is a fork of [zeruhur/sybyl](https://github.com/zeruhur/sybyl). It preserves all solo/Lonelog functionality and adds optional **Partylog** support for group play with multiple players and a GM (or GM-less mode). The name comes from the Greek chorus: a neutral observer that narrates consequences and tracks threads without intervening in the characters' decisions.

The plugin enforces a strict neutral, third-person, non-directive AI persona: it never narrates the player character, never uses second person, never invents lore. It is a referee tool, not a storyteller.

**New to Chorus?** Start with the **[Tutorial](TUTORIAL.md)** — a step-by-step walkthrough from installation to your first scene.

For a complete reference of every command, frontmatter field, and provider option see **[USER_GUIDE.md](USER_GUIDE.md)**.

## Commands

### Solo and shared commands

- **Insert Note Frontmatter** — scaffolds a complete frontmatter block interactively
- **Digest Source into Game Context** — distils source documents into a compact `game_context` stored in frontmatter
- **Ask the Rules** — queries the active ruleset for rules clarifications
- **Adventure Seed** — generates a pre-session adventure premise
- **Generate Character** — generates a character concept following source rules
- **Start Scene** — generates a scene opening
- **Declare Action** — interprets a declared action and dice outcome
- **Ask Oracle** — interprets oracle answers (yes/no, fate, or custom mode)
- **Interpret Oracle Roll** — narrates the meaning of a dice result
- **What Now** — suggests complications or consequences
- **What Can I Do** — lists available moves/actions given the current scene
- **Expand Scene** — expands the current scene into prose
- **Add Source File** — attaches a vault or local file to the current note
- **Manage Sources** — manages source files attached to a note

### Lonelog commands *(solo, Lonelog mode only)*

- **Update Scene Context** — parses the Lonelog session log into `scene_context`
- **New Session Header** — inserts a Lonelog session break

### Partylog commands *(group play, Partylog mode only)*

- **Chorus: New Scene** — opens a new scene with an optional thread ID for split-party play
- **Chorus: Declare Action** — logs a character action with optional collaborator (`@(A > B)`)
- **Chorus: Log GM Event** — logs a GM-introduced event and optionally generates a consequence
- **Chorus: Log This** — converts raw session notes into Partylog notation (works on selection or modal input)
- **Chorus: Update Scene Context from Log** — parses the party log into `scene_context`
- **Chorus: New Session Header** — inserts a Partylog session break with date, duration, and scribe

## Supported Providers

- Gemini
- OpenAI
- Anthropic (Claude)
- OpenRouter (free tier available)
- Ollama (local)

## How It Works

Chorus works inside the active note. Each request is stateless and built from:

- note frontmatter (`ruleset`, `pcs` or `party`, `game_context`, `scene_context`, etc.)
- the current scene context
- the command-specific prompt

Source files are distilled once into a compact `game_context` block via the **Digest Source into Game Context** command. That result is reused on every subsequent request without per-request file overhead.

## Development

```bash
npm ci
npm run check
npm run build
```

## BRAT Release Flow

BRAT installs plugin builds from GitHub releases. The release job uploads:

- `main.js`
- `manifest.json`
- `versions.json`

To publish a BRAT-installable build:

1. Update `manifest.json` and `package.json` to the release version.
2. Update `versions.json` with the plugin version and minimum Obsidian version.
3. Commit and push to GitHub.
4. Create and push a matching tag, for example `0.2.0`.

The release workflow verifies that the tag version matches `manifest.json`, builds the plugin, and attaches the release assets automatically.
