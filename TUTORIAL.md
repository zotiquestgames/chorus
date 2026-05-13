# Chorus Tutorial: Your First Session

This tutorial walks you through Chorus from a cold start to your first complete scene. It covers both solo play and group play with Partylog.

The solo sections use **Ironsworn** as the example ruleset. The group play section uses **Blades in the Dark**. Every step applies to any game.

You will learn:

- How to install and configure the plugin
- How to set up a note for play
- How to run a session using the ribbon and command palette
- How context works and why it matters
- What Lonelog mode is and when to enable it
- What Partylog mode is and how to use it for group play

---

## Part 1 — Installation

### Manual install

1. In your Chorus repo folder, build the plugin:

   ```bash
   npm ci
   npm run build
   ```

2. Copy these three files into your vault's plugin folder:

   ```
   main.js
   manifest.json
   versions.json
   ```

   Target path inside your vault:

   ```
   .obsidian/plugins/chorus/
   ```

3. In Obsidian: **Settings → Community Plugins → Installed plugins**, find Chorus, toggle it on.

### Via BRAT

If the GitHub repository has a published release:

1. Install the BRAT plugin from the community plugin browser.
2. In BRAT settings, choose **Add Beta Plugin** and paste the Chorus repository URL.
3. BRAT downloads and installs the latest release automatically.

---

## Part 2 — First-Time Configuration

Open **Settings → Chorus**.

### Choose a provider

Pick the AI service you want to use. Each one requires different credentials:

| Provider   | What you need |
|------------|---------------|
| Gemini     | Google AI Studio API key |
| OpenAI     | OpenAI API key |
| Anthropic  | Anthropic API key |
| OpenRouter | OpenRouter API key (free tier available) |
| Ollama     | Ollama running locally — no key needed |

Select your provider from the **Active Provider** dropdown, then paste your API key (or base URL for Ollama) in the field that appears.

> **Tip:** If you don't have an API key yet, OpenRouter has a free tier with several capable models. Create an account at openrouter.ai and use the API key it provides.

### Choose a default model

After entering an API key, tab out of the field. Chorus will validate the key and fetch the list of available models. Use the **Default Model** dropdown to pick one.

Recommended starting points:

- Gemini: `gemini-2.5-flash`
- OpenAI: `gpt-4o-mini`
- Anthropic: `claude-haiku-4-5-20251001`
- OpenRouter (free): `meta-llama/llama-3.3-70b-instruct:free`
- Ollama: `gemma3`

### Other settings

Leave everything else at its default for now. You can return here later to adjust insertion mode, temperature, Lonelog mode, and Partylog mode.

---

## Part 3 — Setting Up a Solo Play Note

Every Chorus solo session lives inside a single Obsidian note. The note is your play log, your character sheet, and your oracle roll history all in one.

### Create a new note

Create a blank markdown note. Name it something like `Ironsworn - Kira Voss campaign`.

### Run Insert Note Frontmatter

Open the command palette (`Ctrl+P` / `Cmd+P`) and run:

```
Chorus: Insert Note Frontmatter
```

A dialog asks for:

- **Game / ruleset** — type `Ironsworn`
- **Genre** — optional, e.g. `Dark fantasy / survival`
- **PC (solo mode)** — type something like `Kira Voss, dangerous rank, vow: find her missing brother`
- **Tone** — optional, e.g. `Gritty, hopeful`
- **Language** — optional, leave blank for auto-detect

Chorus writes a frontmatter block at the top of the note:

```yaml
---
ruleset: "Ironsworn"
genre: "Dark fantasy / survival"
pcs: "Kira Voss, dangerous rank, vow: find her missing brother"
tone: "Gritty, hopeful"
oracle_mode: "yes-no"
provider: "gemini"
model: "gemini-2.5-flash"
temperature: 0.7
lonelog: false
partylog: false
scene_counter: 1
session_number: 1
game_context: ""
scene_context: ""
---
```

You can edit any of these values by hand at any time. The most commonly hand-edited fields are `pcs` (update it as your character changes) and `scene_context` (a running summary of the current situation).

### Optional: digest a rulebook

If you have the Ironsworn PDF or a rules summary as a text file, you can feed it to Chorus once so it understands the game's mechanics, oracle tables, and vocabulary.

1. Run **Chorus: Add Source File** and attach your rulebook file.
2. Run **Chorus: Digest Source into Game Context**.

Chorus reads the file, condenses the relevant rules into a compact summary, and stores it in `game_context` in your frontmatter. From that point on, every request automatically includes that context.

> **Skip this for now if you don't have a source file.** Chorus works fine without it, especially if your `ruleset` and `pcs` fields are descriptive.

---

## Part 4 — Your First Solo Scene

You're ready to play. Open the note and use the ribbon icon (a dice symbol, left sidebar) to access the quick-command menu. Alternatively, every command is available in the command palette.

### Start the scene

Run `Chorus: Start Scene` from the palette.

Chorus generates a short scene opening based on your ruleset and PC details and inserts it at the cursor. Example output:

> [Scene] The road into Saltmarsh is quiet — too quiet. A cart overturned at the crossroads, its cargo of grain scattered and trampled. No bodies, no sounds, only the wind.

### Declare an action and roll

Your character tries to do something. You roll the dice (physically or using an app), then tell Chorus what happened.

Run **Chorus: Declare Action** from the palette. A dialog asks for:

- **Action** — `Track the cart's attackers into the forest`
- **Roll result** — `Weak Hit (7)`

Chorus returns the consequence — what the world does in response — without describing your character's action:

> [Action] A trail of broken branches and smeared mud leads into the pines. You find it — but you also find something else: a second set of tracks, human, following the same path. Someone is ahead of you.

### Ask an oracle

Run **Chorus: Ask Oracle** from the palette:

- **Question** — `Is someone waiting for me on the path?`
- **Oracle result** — `Yes, but...` (or leave blank to let Chorus generate one)

Chorus interprets the result in context:

> [Oracle] Yes — but they are not hostile. An old trapper, Bram, has been watching the forest for days. He's frightened and has information, but he won't speak freely until he trusts you.

### What to do when you're stuck

- **What Now** — suggests 1–2 neutral things the world might do next
- **What Can I Do** — suggests 3 concrete actions your PC could take

Neither command makes a choice for you. They give you raw material.

### Expand a scene into prose

Run **Chorus: Expand Scene**. Chorus writes a 100–150 word prose passage from the current context. Third person, past tense, no dialogue.

---

## Part 5 — Managing Context

Chorus builds every request from three layers:

| Layer | Where it comes from | Purpose |
|---|---|---|
| System prompt | `ruleset`, `pcs`, `tone`, `game_context` | Tells the AI what game you're playing |
| Scene context | `scene_context` frontmatter field | Tells the AI what's happening right now |
| Command | The specific command you ran | The actual request |

### Keeping scene context current

`scene_context` is the most important field during active play. Without it, every command starts cold.

Update it regularly. You can:

- Edit it by hand directly in the frontmatter (fastest)
- Run **Chorus: Update Scene Context** — this parses your note and writes a compact summary automatically (Lonelog mode only)

A good `scene_context` entry looks like:

```yaml
scene_context: "Kira is following tracks through Saltmarsh forest. She has encountered the trapper Bram, who is frightened and holding information about the cart attack."
```

One or two sentences is enough. Keep it current as scenes develop.

---

## Part 6 — Lonelog Mode (Optional, Solo)

Lonelog is a structured notation system for solo play logs. Instead of freeform prose, you record play using compact symbols:

```
@ Scout the crossroads
d: Scout d6 = 4 -> Weak Hit
=> Tracks found, but someone is following you too
? Is someone waiting on the path?
-> Yes, but...
=> Bram the trapper — frightened, has information
```

Enable it globally in **Settings → Chorus → Lonelog Mode**, or per-note by setting `lonelog: true` in frontmatter.

With Lonelog active:

- **Start Scene** asks for a scene description and inserts a formatted scene header
- **Declare Action** inserts notation (`@`, `d:`, `=>`) in a code block
- **Ask Oracle** inserts notation (`?`, `->`, `=>`) in a code block
- **Expand Scene** inserts a `\---` / `---\` narrative block
- **Adventure Seed** inserts a `gen: Adventure Seed` result block
- **Generate Character** outputs a `[PC:Name|stat|gear|trait]` Lonelog tag
- **Update Scene Context** parses the log and writes to `scene_context`
- **New Session Header** inserts a structured session break

If you are new to Lonelog, start without it. Switch it on once you want more structure in your logs.

---

## Part 7 — Group Play with Partylog

Partylog is a structured notation system for TTRPG sessions with multiple players. It extends Lonelog's approach with character attribution, collaborative actions, GM events, and party tracking.

### Set up a Partylog note

Create a new note and run **Chorus: Insert Note Frontmatter**. After it writes the block, edit it by hand to add your party roster and enable Partylog:

```yaml
---
ruleset: "Blades in the Dark"
partylog: true
party:
  - name: "Kael"
    notes: "Lurk. Shadow specialty. HP 8/12."
  - name: "Sable"
    notes: "Slide. Finesse weapons. HP 10/10."
  - name: "Mira"
    notes: "Cutter. Heavy armor. HP 9/9."
gm_name: "Jordan"
game_context: ""
scene_context: ""
scene_counter: 1
session_number: 1
---
```

Character names in `party:` must be used exactly as typed when running Partylog commands. They appear in `@(Name)` attribution in all output.

### Open a scene

Run **Chorus: New Scene** from the palette:

- **Scene description** — `The burning mill at the edge of town`
- **Thread ID** — leave blank for a standard scene, or enter `T2` for a split-party thread

Chorus generates atmosphere prose and inserts a scene header:

```markdown
### S1 *The burning mill at the edge of town*

Smoke billowed through the broken shutters as the mill's wheel groaned to a halt. The smell of scorched grain filled the air. Somewhere inside, glass shattered.
```

### Log a character action

Run **Chorus: Declare Action**:

- **Character** — `Kael`
- **Action** — `Slip through the side window before the fire spreads`
- **Roll result** — `Success (6)`
- **Collaborator** — leave blank (or enter `Mira` to produce `@(Kael > Mira)`)

Output (code-fenced):

```
@(Kael) Slip through the side window before the fire spreads
d: Prowl -> Success
=> Kael is inside. The room is smoke-filled but crossable. A body slumped near the millstone.
```

### Log a GM event

Run **Chorus: Log GM Event**:

- **Event** — `A patrol rounds the far corner of the mill`
- **Generate consequence?** — leave `yes` to generate a consequence, or clear to insert a bare `!` line

Output with consequence:

```
! A patrol rounds the far corner of the mill.
=> Two guards. They haven't spotted the party yet. The clock is ticking.
```

### Convert raw notes with Log This

If you took handwritten or freeform notes during a session, select them in the editor and run **Chorus: Log This**. Chorus reads the party roster from frontmatter and converts the raw text into attributed Partylog notation, inserted below the selection.

If you didn't pre-select, the command opens a textarea modal instead.

### Update scene context

Run **Chorus: Update Scene Context from Log** to parse the current Partylog log and write a compact summary into `scene_context`. No AI call — this is pure parsing.

### Start a new session

Run **Chorus: New Session Header**:

- **Date** — pre-filled with today's date
- **Duration** — `3h`
- **Scribe** — optional, e.g. `Jordan`
- **Recap** — optional, one-line summary of last session

Output:

```markdown
## Session 2
*Date: 2026-05-13 | Duration: 3h | Scribe: Jordan*

**Recap:** The party escaped the mill but lost the sealed letter.
```

---

## Part 8 — Pre-Session Setup Commands

These commands are used once at the start of a campaign or session, not during active play.

### Adventure Seed

No idea how to start? Run **Chorus: Adventure Seed**.

Optionally type a theme (e.g. `political intrigue`, `revenge journey`). Chorus generates a structured pitch — Premise, Conflict, Hook, Tone — using your ruleset and any `game_context` you have loaded. When a party roster is present, the seed is naturally party-aware.

### Generate Character

Run **Chorus: Generate Character** to create a character by strictly following the rules in your attached source file.

- Requires at least one source attached to the note
- Optionally accepts a concept: `wandering healer`, `disgraced noble`, etc.
- In Lonelog mode, outputs a `[PC:Name|stat|gear|trait]` tag

### Ask the Rules

Use **Chorus: Ask the Rules** when you need a precise rules answer. Type your question and Chorus reads the full source file to answer it.

---

## Quick Reference: What to Use When

| Situation | Command |
|---|---|
| Starting a new campaign with no idea | Adventure Seed |
| Creating a character following the rules | Generate Character |
| Opening a solo scene | Start Scene |
| Opening a group scene | Chorus: New Scene |
| You rolled dice and need consequences (solo) | Declare Action |
| A character acted and you need consequences (group) | Chorus: Declare Action |
| GM introduces a world event | Chorus: Log GM Event |
| Raw notes need converting to Partylog | Chorus: Log This |
| Uncertainty about the world | Ask Oracle |
| Oracle result on the page you want explained | Interpret Oracle Roll |
| Scene feels stuck, world needs to act | What Now |
| You have no idea what your PC should do | What Can I Do |
| You want a prose record of the scene | Expand Scene |
| Rules question during play | Ask the Rules |
| Snapshot current state into scene_context (solo) | Update Scene Context |
| Snapshot current state into scene_context (group) | Chorus: Update Scene Context from Log |
| Starting a new session | New Session Header / Chorus: New Session Header |

---

## Common Issues

**No response / provider error**

Check that your API key is saved in settings. Confirm the model name in your note's frontmatter (or the default in settings) is valid for the provider you selected.

**Output is short or cut off (Gemini)**

Gemini 2.5 Flash uses "thinking tokens" by default. Chorus disables this automatically. If you are using a different Gemini model and seeing truncated output, try switching to `gemini-2.5-flash`.

**Lonelog commands say Lonelog is not enabled**

Either enable it globally in settings, or add `lonelog: true` to the note frontmatter.

**Partylog commands say Partylog is not enabled**

Either enable it globally in settings, or add `partylog: true` to the note frontmatter.

**Log This says no party roster found**

Add a `party:` list to frontmatter with at least one `name:` entry before using this command.

**Character not found in party roster**

The name in the **Character** field must exactly match (case-sensitive) a `name:` entry in the `party:` list.

**The AI doesn't know what's happening in the scene**

Update `scene_context` in frontmatter, or run **Update Scene Context** / **Chorus: Update Scene Context from Log**. Without it, Chorus has no memory of earlier events.

**Digest command fails on a PDF**

PDF inline encoding is supported by Gemini and Anthropic only. For OpenAI, OpenRouter, and Ollama, export the relevant pages as a `.txt` file instead.

---

For a full reference of every frontmatter field, command, and provider option, see [USER_GUIDE.md](USER_GUIDE.md).
