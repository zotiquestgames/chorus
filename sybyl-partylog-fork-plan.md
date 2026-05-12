# Chorus — Implementation Plan

## Overview

This document is the implementation spec for **Chorus**, a fork of
[zeruhur/sybyl](https://github.com/zeruhur/sybyl) that adds optional group
play support via Partylog notation. Partylog is a fork of Lonelog designed for
TTRPG sessions with multiple players and a GM (or GM-less shared authority).

The name comes from the Greek chorus: a neutral observer that narrates
consequences, tracks active threads, and never intervenes in the characters'
decisions. One oracle (Sybyl) for one player; one chorus for the group.

The fork preserves 100% of existing solo/Lonelog functionality. Partylog
support is an opt-in mode, controlled by a global toggle and a per-note
frontmatter override, exactly mirroring how Lonelog mode works in the original.

---

## Repository Setup

1. Fork `zeruhur/sybyl` to `zeruhur/chorus` (or equivalent namespace).
2. Update `manifest.json`:
   - `id`: `chorus`
   - `name`: `Chorus`
   - `description`: `Solo and group tabletop role-playing inside Obsidian, with
     Lonelog and Partylog notation support.`
3. Update `README.md` to document the fork relationship, the name rationale,
   and Partylog additions.
4. Keep the existing `lonelog.md` reference file. Add `partylog.md` alongside
   it (the full Partylog v1.0.0 spec, for in-vault reference).

---

## Repository Structure — Additions

```
src/
├── lonelog/               # unchanged from upstream
│   ├── parser.ts
│   └── formatter.ts
├── partylog/              # NEW
│   ├── parser.ts
│   └── formatter.ts
├── main.ts                # minor additions
├── commands.ts            # extended
├── providers/             # unchanged
├── frontmatter.ts         # minor additions
├── promptBuilder.ts       # extended
├── settings.ts            # extended
└── types.ts               # extended
```

---

## Phase 1 — types.ts Extensions

### 1.1 Party roster

Add a `PartyMember` interface and extend `NoteFrontMatter`:

```typescript
export interface PartyMember {
  name:  string;
  notes: string;   // brief role/class/trait summary for AI context
}

export interface NoteFrontMatter {
  // ... all existing fields unchanged ...

  // Partylog additions
  partylog?:       boolean;        // per-note override of global partylogMode
  party?:          PartyMember[];  // replaces single pc_name/pc_notes in group mode
  gm_name?:        string;         // optional — for scribe attribution
  scene_counter?:  number;         // shared with Lonelog mode
  session_number?: number;         // shared with Lonelog mode
}
```

`pc_name` and `pc_notes` remain valid for solo mode. When `partylog: true`,
the `party` array is used instead and `pc_name`/`pc_notes` are ignored.

### 1.2 Settings

Extend `ChorusSettings` (renamed from `SybylSettings` in the fork):

```typescript
export interface ChorusSettings {
  // ... all existing fields unchanged ...

  // Partylog global settings
  partylogMode:             boolean;  // global opt-in flag
  partylogContextDepth:     number;   // lines to scan; default 60
  partylogWrapCodeBlock:    boolean;  // default true
  partylogAutoIncScene:     boolean;  // default true
  partylogInsertRaw:        boolean;  // always true — raw notes are never replaced
}
```

Add to `DEFAULT_SETTINGS`:

```typescript
partylogMode:          false,
partylogContextDepth:  60,
partylogWrapCodeBlock: true,
partylogAutoIncScene:  true,
partylogInsertRaw:     true,
```

---

## Phase 2 — partylog/parser.ts

The Partylog parser extends the Lonelog parser's approach: scan trailing lines,
extract structured context, serialize for the AI prompt. It handles all
Partylog-specific symbols and tags.

### 2.1 Symbols recognized

| Symbol | Pattern |
|---|---|
| `@(Name)` | Attributed player action |
| `@(A > B)` | Collaborative action (lead > assist) |
| `!` | GM / world event |
| `d(Name):` | Attributed dice roll |
| `d:` | Unattributed dice roll |
| `->` | Resolution result |
| `=>` | Consequence |
| `?(Name)` | Oracle question (GM-less, Appendix B) |

### 2.2 Tags recognized

| Tag | Pattern |
|---|---|
| `[N:Name|tags]` | NPC (first mention) |
| `[#N:Name]` | NPC reference |
| `[L:Name|tags]` | Location |
| `[E:Name X/Y]` | Event / clock |
| `[Thread:Name|state]` | Story thread |
| `[Goal:Name|state]` | Shared objective |
| `[Quest:Name|state]` | Major milestone |
| `[Loot:Name|tags]` | Unassigned party item |
| `[PC:Name|stats]` | Player character state |
| `[Party:resources]` | Party-level tracking |
| `[Faction:Name|tier:X|standing:Y]` | Faction |
| `[Advance:Name|Class Level|+gained]` | Advancement event |
| `[F:Enemy|stats]` | Foe in combat |
| `[Clock:Name X/Y]` | Clock |
| `[Track:Name X/Y]` | Progress track |
| `[Timer:Name X]` | Countdown |

### 2.3 PartlylogContext interface

```typescript
export interface PartylogContext {
  lastSceneId:     string;
  lastSceneDesc:   string;
  activeNPCs:      string[];
  activeLocations: string[];
  activeThreads:   string[];
  activeGoals:     string[];
  activeQuests:    string[];
  activeClocks:    string[];
  activeTracks:    string[];
  factions:        string[];
  partyState:      string[];   // [Party:] and [PC:] tags
  loot:            string[];   // [Loot:] tags
  recentBeats:     string[];   // last 10 action/event/consequence lines
  combatActive:    boolean;    // true if [COMBAT] seen without [/COMBAT]
}
```

### 2.4 Scene ID patterns

The parser must recognize both standard and thread-specific scene IDs:

- `S#` — standard scene
- `S#a` — flashback
- `T#-S#` — thread-specific (split party)
- `S#.#` — montage / time cut

### 2.5 serializeContext()

Serialize to a compact string for the AI prompt. Output format:

```
Current scene: T2-S7 *The burning mill*
Party: [PC:Kael|rogue|HP:8/12] [PC:Sable|mage|HP:10/10]
NPCs: [N:Aldric|innkeeper|friendly] [N:Hooded Figure|unknown|hostile]
Locations: [L:Thornwall|settlement]
Threads: [Thread:The stolen relic|active]
Goals: [Goal:Escape the valley|in progress]
Clocks: [Clock:Reinforcements 3/6]
Factions: [Faction:Iron Brotherhood|tier:2|standing:hostile]
Loot: [Loot:Sealed letter|unread]
Recent beats:
  @(Kael) Pick the lock on the side door
  d: Thievery d20+4=17 vs DC 14 -> Success
  => The door swings open silently.
  ! A patrol rounds the corner ahead.
  => [Clock:Reinforcements 4/6]
```

---

## Phase 3 — partylog/formatter.ts

Formats AI output as valid Partylog notation. Same structure as
`lonelog/formatter.ts`. All formatters accept a `PartylogFormatOptions` object:

```typescript
export interface PartylogFormatOptions {
  wrapInCodeBlock: boolean;
  sceneId?:        string;
  postMarker?:     boolean;  // prepend (post: ...) meta note
}
```

### 3.1 formatStartScene()

```
### S8 *The burning mill*

[prose from AI, plain third-person past tense]
```

No code fence. Scene header is a markdown heading. Identical to Lonelog
`formatStartScene`.

### 3.2 formatDeclareAction()

```
@(Kael) Pick the lock
d: Thievery d20+4=17 vs DC 14 -> Success
=> The door swings open silently.
```

Code-fenced if `wrapInCodeBlock: true`.

### 3.3 formatCollaborativeAction()

```
@(Mira > Kael) Assist with the rope climb
d: Athletics d20+2=13 -> Success (assist bonus applied)
=> Kael reaches the ledge cleanly.
```

### 3.4 formatGMEvent()

```
! A patrol rounds the corner ahead.
=> [Clock:Reinforcements 4/6]
```

### 3.5 formatAskOracle() — GM-less only

```
?(Sable) Is the ruin inhabited?
-> Yes, but... (d6=4)
=> The upper floors are occupied. The ground level is clear.
```

### 3.6 formatWhatNow()

Each suggestion is a separate `=>` line:

```
=> The patrol splits — one guard checks the alley.
=> A dog starts barking from the yard nearby.
```

### 3.7 formatExpandScene()

Uses Partylog block delimiters:

```
\---
[prose from AI]
---\
```

### 3.8 formatLogThis()

For the new `Log This` command. Prepend a `(post: formatted from raw notes)`
marker, then the formatted Partylog block:

```
(post: formatted from raw notes)
@(Kael) Sneak past the guard
d: Stealth d20+5=8 vs DC 14 -> Fail
=> Kicks a bottle. Guard turns!
! Guard draws his blade and advances
@(Sable) Cast Sleep before he can shout
d: Spell DC 13, guard WIS save d20=9 -> Fail
=> The guard crumples. Silence holds.
```

Code-fenced if `wrapInCodeBlock: true`.

---

## Phase 4 — promptBuilder.ts Extensions

### 4.1 Party system prompt block

When `partylog: true`, replace the solo PC block with a party block:

```typescript
function buildPartyBlock(fm: NoteFrontMatter): string {
  if (!fm.party?.length) return "";
  const members = fm.party
    .map((m) => `- ${m.name}: ${m.notes}`)
    .join("\n");
  return `The party consists of:\n${members}`;
}
```

### 4.2 Partylog system addendum

Append to the system prompt when Partylog mode is active:

```
PARTYLOG NOTATION MODE IS ACTIVE.

When generating consequences, oracle interpretations, or scene text:
- Player actions use @(Name) — always attribute to a named character
- GM events use ! — declarative, present tense, no attribution
- Consequences use => (one per line for multiple consequences)
- Oracle answers (GM-less mode only) use ->
- Do not use blockquote markers (">")
- Do not add labels like "[Result]" or "[Scene]"
- Do not invent or suggest Partylog tags ([N:], [L:], etc.) — the scribe manages those
- For scene descriptions: plain prose only, 2-3 lines, no symbol prefix
- Never narrate any PC's internal thoughts or decisions
- Never use second person
```

### 4.3 buildRequest() update

Extend the existing signature to accept Partylog context:

```typescript
export function buildRequest(
  fm: NoteFrontMatter,
  userMessage: string,
  settings: ChorusSettings,
  maxOutputTokens = 512,
  noteBody?: string
): GenerationRequest {
  const lonelogActive  = fm.lonelog  ?? settings.lonelogMode;
  const partylogActive = fm.partylog ?? settings.partylogMode;

  let contextBlock = "";
  if (fm.scene_context?.trim()) {
    contextBlock = `SCENE CONTEXT:\n${fm.scene_context.trim()}`;
  } else if (partylogActive && noteBody) {
    const ctx = parsePartylogContext(noteBody, settings.partylogContextDepth ?? 60);
    contextBlock = serializePartylogContext(ctx);
  } else if (lonelogActive && noteBody) {
    const ctx = parseLonelogContext(noteBody, settings.lonelogContextDepth ?? 60);
    contextBlock = serializeLonelogContext(ctx);
  }

  // ...rest unchanged
}
```

---

## Phase 5 — settings.ts Extensions

### 5.1 Settings tab — Section 3 additions

After the existing Lonelog toggle, add:

**Partylog Mode** — toggle. When enabled:
- All command outputs use Partylog notation
- Note body is parsed for party context before each generation
- Partylog-specific commands become available
- Sub-section appears with:
  - **Auto-increment scene counter** — toggle (default: on)
  - **Context extraction depth** — number input (default: 60)
  - **Wrap notation in code blocks** — toggle (default: on)

Note: Lonelog mode and Partylog mode are mutually exclusive per note. If both
global toggles are on, the per-note frontmatter (`lonelog: true` /
`partylog: true`) takes precedence. If neither frontmatter key is set,
Partylog takes precedence over Lonelog globally. Surface a warning in the
settings tab if both global toggles are enabled simultaneously.

---

## Phase 6 — Existing Commands: Partylog Adaptations

All five existing commands that transfer cleanly still need to route through
the Partylog formatter when active. The changes are minimal.

### 6.1 Helper (add to commands.ts)

```typescript
function isPartylogActive(settings: ChorusSettings, fm: NoteFrontMatter): boolean {
  return fm.partylog ?? settings.partylogMode;
}

function partylogOpts(settings: ChorusSettings): PartylogFormatOptions {
  return { wrapInCodeBlock: settings.partylogWrapCodeBlock ?? true };
}
```

### 6.2 What Now (`chorus:suggest-consequence`)

When Partylog active: use `formatWhatNow(response.text, opts)`. Output is
`=>` lines. User message unchanged.

### 6.3 What Can I Do (`chorus:what-can-i-do`)

Add an optional `Character` field to the `InputModal`. If provided, the user
message becomes:

```
Character: {name}
Current scene: {scene context}
List 2-4 available actions or moves for this character given the current scene.
Present as neutral options. Do not choose between them.
```

If omitted, fallback to existing behavior (party-level options).

Output: plain numbered list. No Partylog formatter needed — this is always
prose output.

### 6.4 Expand Scene (`chorus:expand-scene`)

When Partylog active: use `formatExpandScene(response.text, opts)`. Output
uses `\--- ... ---\` block delimiters instead of generic blockquotes.

### 6.5 Ask the Rules (`chorus:ask-rules`)

No changes. System-agnostic, formatter-agnostic.

### 6.6 Adventure Seed (`chorus:adventure-seed`)

No changes to command logic. When Partylog active, the system prompt includes
the party roster, so the seed output is naturally party-aware without any
formatter change.

---

## Phase 7 — New Commands

Register all new commands unconditionally. When Partylog mode is inactive for
the active note, show a notice and abort.

### 7.1 `chorus:partylog-new-scene`

**Name**: Chorus: New Scene

1. Read `scene_counter` from frontmatter (default: 1).
2. Open `InputModal`: `Scene description` (brief location/time).
3. Optional field: `Thread ID` (e.g. `T2` for split-party scenes; leave blank
   for standard).
4. Build scene ID: `T#-S#` if thread given, else `S#`.
5. Call `generate()` with:

```
START SCENE. Generate only: 2-3 lines of third-person past-tense prose
describing the atmosphere and setting of: "{sceneDesc}".
No dialogue. No PC actions. No additional commentary.
```

6. Format with `formatStartScene(aiText, sceneId, sceneDesc, opts)`.
7. Insert at cursor.
8. Increment `scene_counter` if `partylogAutoIncScene` is true.

### 7.2 `chorus:partylog-declare-action`

**Name**: Chorus: Declare Action

Opens `InputModal` with fields:
- `Character` (text — should match a name in `party` array)
- `Action` (text)
- `Roll result` (text)
- `Collaborator` (optional — for `@(A > B)` pattern)

User message:

```
Character: {name}
Action: {action}
Roll result: {roll}
Describe only the consequences and world reaction.
Do not describe the character's action or internal state.
```

When collaborator is provided, use `formatCollaborativeAction(...)`.
Otherwise use `formatDeclareAction(...)`.

### 7.3 `chorus:partylog-gm-event`

**Name**: Chorus: Log GM Event

Opens `InputModal` with fields:
- `Event` (text — what the GM introduced)
- `Generate consequence?` (checkbox — default: yes)

If consequence requested, call `generate()` with:

```
GM event: {event}
Describe 1-2 consequences or reactions from the world or NPCs.
Third person, neutral, present tense for world state.
Do not describe any PC's reaction or decision.
```

Format with `formatGMEvent(event, consequence, opts)`.

If consequence not requested, insert bare:

```
! {event}
```

No AI call.

### 7.4 `chorus:partylog-log-this`

**Name**: Chorus: Log This

This is the primary new command with no Lonelog equivalent.

**Flow**:

1. Check for editor selection. If text is selected, use it as the raw input.
   If not, open `InputModal` with a large `Raw notes` textarea.
2. Resolve the party roster from frontmatter (`party` array). Build a
   roster string to include in the system prompt.
3. Call `generate()` with `maxOutputTokens: 800` and user message:

```
Convert these raw session notes into valid Partylog notation.

PARTY ROSTER (use these exact names for @(Name) attribution):
{roster}

RAW NOTES:
{rawNotes}

Rules:
- Use @(Name) for each player action, attributed to the correct character
- Use ! for GM-introduced events
- Use d: for dice rolls with their results
- Use -> for resolution outcomes
- Use => for consequences (one per line)
- Preserve the sequence of events exactly
- Do not invent events not present in the raw notes
- Do not add [N:], [L:], or other tracking tags — the scribe will add those
- Output only the Partylog notation lines, nothing else
```

4. Insert **below** the raw input (never replace):
   - If raw was a selection: insert below the selection using
     `insertBelowSelection(editor, formatted)`.
   - If raw was from modal: insert at cursor.
5. Format with `formatLogThis(response.text, opts)`.

**Token note**: `maxOutputTokens: 800` because raw notes can produce long
notation blocks. Flag in settings description that this command uses more
tokens than others.

### 7.5 `chorus:partylog-parse-context`

**Name**: Chorus: Update Scene Context from Log

No AI call. Runs `parsePartylogContext()` on the note body, serializes with
`serializePartylogContext()`, writes to `scene_context` in frontmatter.
Shows notice: `"Scene context updated from party log."`.

Identical in purpose to `chorus:lonelog-parse-context` but uses the Partylog
parser.

### 7.6 `chorus:partylog-session-break`

**Name**: Chorus: New Session Header

1. Read `session_number` from frontmatter (default: 1).
2. Open `InputModal`:
   - `Date` (pre-filled: today's date, `YYYY-MM-DD`)
   - `Duration` (placeholder: `3h`)
   - `Scribe` (optional — person taking notes this session)
   - `Recap` (optional — one-line summary of last session)
3. Insert at cursor:

```markdown
## Session {session_number}
*Date: {date} | Duration: {duration} | Scribe: {scribe}*

**Recap:** {recap}

```

4. Increment `session_number` in frontmatter.

No AI call.

---

## Phase 8 — Note Frontmatter Schema (Full Reference)

```yaml
---
game: "Blades in the Dark"

# Party roster (Partylog mode — replaces pc_name/pc_notes)
party:
  - name: "Kael"
    notes: "Lurk. Shadow specialty. HP 8/12."
  - name: "Sable"
    notes: "Slide. Finesse weapons. HP 10/10."
  - name: "Mira"
    notes: "Cutter. Heavy armor. HP 9/9."

gm_name: "Jordan"   # optional

# Provider settings (unchanged from upstream)
provider: "anthropic"
model: "claude-3-5-sonnet-20241022"
temperature: 0.7

# Partylog mode (overrides global plugin setting)
partylog: true

# Auto-managed by plugin
scene_counter: 8
session_number: 2

# Optional — if present, takes precedence over live note parsing
scene_context: ""

# Sources (unchanged from upstream)
sources:
  - label: "BitD Rulebook"
    provider: "anthropic"
    mime_type: "application/pdf"
    vault_path: "rpg/blades-in-the-dark.pdf"
---
```

---

## Implementation Order

### Stage 1 — Foundation

1. Fork repo, update `manifest.json`, `README.md`, add `partylog.md`.
2. Extend `types.ts`: `PartyMember`, `PartylogContext`, settings fields,
   frontmatter fields.
3. Add `DEFAULT_SETTINGS` entries for all Partylog fields.

### Stage 2 — Core Modules

4. Implement `partylog/parser.ts`: `parsePartylogContext()` and
   `serializePartylogContext()`. Unit-test with a sample Partylog log string
   covering all tag types and scene ID patterns.
5. Implement `partylog/formatter.ts`: all formatters. Test each with mock AI
   text, with and without `wrapInCodeBlock`.

### Stage 3 — Prompt and Settings

6. Extend `promptBuilder.ts`: `buildPartyBlock()`, `PARTYLOG_SYSTEM_ADDENDUM`,
   updated `buildSystemPrompt()` and `buildRequest()`.
7. Extend `settings.ts`: Partylog toggle and sub-settings. Verify mutual
   exclusivity warning with Lonelog. Verify show/hide of sub-section.

### Stage 4 — Commands

8. Update existing commands: route through Partylog formatters when active.
   Add character attribution field to `What Can I Do`.
9. Implement `chorus:partylog-new-scene`.
10. Implement `chorus:partylog-declare-action` (including collaborative action
    path).
11. Implement `chorus:partylog-gm-event`.
12. Implement `chorus:partylog-log-this` — the most complex new command.
    Test with selection input and modal input paths separately.
13. Implement `chorus:partylog-parse-context`.
14. Implement `chorus:partylog-session-break`.

### Stage 5 — Polish

15. Command gating: all Partylog commands abort with notice when Partylog
    is inactive for the active note.
16. Error handling pass: add Partylog-specific cases to the error table
    (empty party roster, no character match for attribution, raw notes
    too long for context window).
17. Token optimization pass: verify `Log This` token budget, confirm
    `serializePartylogContext()` output stays under 500 chars for a
    typical session window.

---

## Error Handling Additions

| Condition | Notice text |
|---|---|
| Partylog command on non-Partylog note | `"Partylog mode is not enabled for this note."` |
| `party` array empty or missing | `"No party roster found. Add a party: field to this note's frontmatter."` |
| Character name not in party roster | `"Character '{name}' not found in party roster. Check frontmatter."` |
| Raw notes too long (Log This) | `"Raw notes too long for a single request. Split into smaller blocks."` |
| Log This returns empty | `"No Partylog notation could be extracted from the raw notes."` |

---

## Testing Checklist

- [ ] Fork loads without console errors alongside the upstream manifest
- [ ] Partylog toggle shows/hides sub-settings correctly
- [ ] Mutual exclusivity warning appears when both Lonelog and Partylog
      global toggles are on
- [ ] Per-note `partylog: true` overrides global toggle correctly
- [ ] `parsePartylogContext` correctly extracts scene ID, party state, NPCs,
      threads, clocks, factions from a sample log
- [ ] `serializePartylogContext` output is under 500 chars for a typical
      60-line window
- [ ] Thread-specific scene IDs (`T2-S7`) are recognized and preserved
- [ ] `new-scene` inserts correct `### S# *desc*` or `### T#-S# *desc*` header
- [ ] `new-scene` increments `scene_counter` only when `partylogAutoIncScene`
      is on
- [ ] `declare-action` inserts `@(Name)` + `d:` + `=>` lines
- [ ] Collaborative action path inserts `@(A > B)` correctly
- [ ] `gm-event` with consequence generates and inserts `!` + `=>` lines
- [ ] `gm-event` without consequence inserts bare `!` line, no AI call
- [ ] `log-this` with selection inserts formatted block below selection,
      raw text untouched above
- [ ] `log-this` with modal inserts at cursor
- [ ] `log-this` (post:) meta marker present in all output
- [ ] `log-this` correctly attributes actions to party roster names
- [ ] `what-can-i-do` with character field scopes output to named character
- [ ] `expand-scene` in Partylog mode uses `\--- ... ---\` delimiters
- [ ] `suggest-consequence` in Partylog mode outputs `=>` lines
- [ ] `ask-rules` and `adventure-seed` unchanged in behavior; party roster
      included in system prompt when Partylog active
- [ ] `parse-context` writes serialized context to `scene_context` frontmatter
- [ ] `session-break` inserts correct header, increments `session_number`
- [ ] All Partylog commands abort with correct notice when mode is inactive
- [ ] Existing solo and Lonelog commands unaffected by all Partylog additions
- [ ] `wrapInCodeBlock: false` produces bare symbol lines without fences
