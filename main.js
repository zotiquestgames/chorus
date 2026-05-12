/* Sybyl Plugin */
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => ChorusPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian10 = require("obsidian");

// src/editor.ts
function insertAtCursor(editor, text) {
  const cursor = editor.getCursor();
  editor.replaceRange(`
${text}
`, cursor);
  editor.setCursor({ line: cursor.line + text.split("\n").length + 1, ch: 0 });
}
function appendToNote(editor, text) {
  const lastLine = editor.lastLine();
  const lastCh = editor.getLine(lastLine).length;
  editor.replaceRange(`
${text}
`, { line: lastLine, ch: lastCh });
}
function getSelection(editor) {
  return editor.getSelection().trim();
}
function insertBelowSelection(editor, text) {
  const selection = editor.listSelections()[0];
  const targetLine = selection ? selection.head.line : editor.getCursor().line;
  editor.replaceRange(`
${text}`, { line: targetLine, ch: editor.getLine(targetLine).length });
}
function isInsideCodeBlock(editor, atLine) {
  const checkLine = atLine != null ? atLine : editor.getCursor().line;
  let inside = false;
  for (let i = 0; i < checkLine; i++) {
    if (/^```/.test(editor.getLine(i))) {
      inside = !inside;
    }
  }
  return inside;
}

// src/lonelog/parser.ts
function parseLonelogContext(noteBody, depthLines = 60) {
  var _a;
  const bodyWithoutFM = noteBody.replace(/^---[\s\S]*?---\r?\n/, "");
  const lines = bodyWithoutFM.split(/\r?\n/);
  const window = lines.slice(-depthLines);
  const ctx = {
    lastSceneId: "",
    lastSceneDesc: "",
    activeNPCs: [],
    activeLocations: [],
    activeThreads: [],
    activeClocks: [],
    activeTracks: [],
    pcState: [],
    recentBeats: []
  };
  const sceneRe = /^(?:#+\s+)?(T\d+-)?S(\d+[\w.]*)\s*\*([^*]*)\*/;
  const npcRe = /\[N:([^\]]+)\]/g;
  const locRe = /\[L:([^\]]+)\]/g;
  const threadRe = /\[Thread:([^\]]+)\]/g;
  const clockRe = /\[Clock:([^\]]+)\]/g;
  const trackRe = /\[Track:([^\]]+)\]/g;
  const pcRe = /\[PC:([^\]]+)\]/g;
  const beatRe = /^(@|\?|d:|->|=>)/;
  const skipRe = /^(#|---|>\s*\[|\[N:|\[L:|\[Thread:|\[Clock:|\[Track:|\[PC:)/;
  const npcMap = /* @__PURE__ */ new Map();
  const locMap = /* @__PURE__ */ new Map();
  const threadMap = /* @__PURE__ */ new Map();
  const clockMap = /* @__PURE__ */ new Map();
  const trackMap = /* @__PURE__ */ new Map();
  const pcMap = /* @__PURE__ */ new Map();
  for (const rawLine of window) {
    const line = rawLine.trim();
    const sceneMatch = line.match(sceneRe);
    if (sceneMatch) {
      ctx.lastSceneId = `${(_a = sceneMatch[1]) != null ? _a : ""}S${sceneMatch[2]}`;
      ctx.lastSceneDesc = sceneMatch[3].trim();
    }
    for (const match of line.matchAll(npcRe))
      npcMap.set(match[1].split("|")[0], match[1]);
    for (const match of line.matchAll(locRe))
      locMap.set(match[1].split("|")[0], match[1]);
    for (const match of line.matchAll(threadRe))
      threadMap.set(match[1].split("|")[0], match[1]);
    for (const match of line.matchAll(clockRe))
      clockMap.set(match[1].split(" ")[0], match[1]);
    for (const match of line.matchAll(trackRe))
      trackMap.set(match[1].split(" ")[0], match[1]);
    for (const match of line.matchAll(pcRe))
      pcMap.set(match[1].split("|")[0], match[1]);
    if (beatRe.test(line)) {
      ctx.recentBeats.push(line);
    } else if (line.length > 0 && !skipRe.test(line) && !sceneRe.test(line)) {
      ctx.recentBeats.push(line);
    }
  }
  ctx.activeNPCs = [...npcMap.values()];
  ctx.activeLocations = [...locMap.values()];
  ctx.activeThreads = [...threadMap.values()];
  ctx.activeClocks = [...clockMap.values()];
  ctx.activeTracks = [...trackMap.values()];
  ctx.pcState = [...pcMap.values()];
  ctx.recentBeats = ctx.recentBeats.slice(-10);
  return ctx;
}
function serializeContext(ctx) {
  const lines = [];
  if (ctx.lastSceneId)
    lines.push(`Current scene: ${ctx.lastSceneId} *${ctx.lastSceneDesc}*`);
  if (ctx.pcState.length)
    lines.push(`PC: ${ctx.pcState.map((state) => `[PC:${state}]`).join(" ")}`);
  if (ctx.activeNPCs.length)
    lines.push(`NPCs: ${ctx.activeNPCs.map((state) => `[N:${state}]`).join(" ")}`);
  if (ctx.activeLocations.length) {
    lines.push(`Locations: ${ctx.activeLocations.map((state) => `[L:${state}]`).join(" ")}`);
  }
  if (ctx.activeThreads.length) {
    lines.push(`Threads: ${ctx.activeThreads.map((state) => `[Thread:${state}]`).join(" ")}`);
  }
  if (ctx.activeClocks.length) {
    lines.push(`Clocks: ${ctx.activeClocks.map((state) => `[Clock:${state}]`).join(" ")}`);
  }
  if (ctx.activeTracks.length) {
    lines.push(`Tracks: ${ctx.activeTracks.map((state) => `[Track:${state}]`).join(" ")}`);
  }
  if (ctx.recentBeats.length) {
    lines.push("Recent beats:");
    ctx.recentBeats.forEach((beat) => lines.push(`  ${beat}`));
  }
  return lines.join("\n");
}

// src/partylog/parser.ts
function parsePartylogContext(noteBody, depthLines = 60) {
  var _a;
  const bodyWithoutFM = noteBody.replace(/^---[\s\S]*?---\r?\n/, "");
  const lines = bodyWithoutFM.split(/\r?\n/);
  const scanWindow = lines.slice(-depthLines);
  const ctx = {
    lastSceneId: "",
    lastSceneDesc: "",
    activeNPCs: [],
    activeLocations: [],
    activeThreads: [],
    activeGoals: [],
    activeQuests: [],
    activeClocks: [],
    activeTracks: [],
    factions: [],
    partyState: [],
    loot: [],
    recentBeats: [],
    combatActive: false
  };
  const sceneRe = /^(?:#+\s+)?(T\d+-)?S(\d+[\w.]*)\s*\*([^*]*)\*/;
  const npcRe = /\[N:([^\]]+)\]/g;
  const npcRefRe = /\[#N:([^\]]+)\]/g;
  const locRe = /\[L:([^\]]+)\]/g;
  const threadRe = /\[Thread:([^\]]+)\]/g;
  const goalRe = /\[Goal:([^\]]+)\]/g;
  const questRe = /\[Quest:([^\]]+)\]/g;
  const lootRe = /\[Loot:([^\]]+)\]/g;
  const pcRe = /\[PC:([^\]]+)\]/g;
  const partyRe = /\[Party:([^\]]+)\]/g;
  const factionRe = /\[Faction:([^\]]+)\]/g;
  const clockRe = /\[Clock:([^\]]+)\]/g;
  const trackRe = /\[Track:([^\]]+)\]/g;
  const beatRe = /^(@\(|!|d[:(]|->|=>|\?\()/;
  const skipRe = /^(#+|---|>\s*\[|\[N:|\[#N:|\[L:|\[Thread:|\[Goal:|\[Quest:|\[Loot:|\[PC:|\[Party:|\[Faction:|\[Clock:|\[Track:|\[F:|\[Advance:|\[Timer:|\[E:)/;
  const npcMap = /* @__PURE__ */ new Map();
  const locMap = /* @__PURE__ */ new Map();
  const threadMap = /* @__PURE__ */ new Map();
  const goalMap = /* @__PURE__ */ new Map();
  const questMap = /* @__PURE__ */ new Map();
  const lootMap = /* @__PURE__ */ new Map();
  const pcMap = /* @__PURE__ */ new Map();
  const partyMap = /* @__PURE__ */ new Map();
  const factionMap = /* @__PURE__ */ new Map();
  const clockMap = /* @__PURE__ */ new Map();
  const trackMap = /* @__PURE__ */ new Map();
  let combatOpen = false;
  for (const rawLine of scanWindow) {
    const line = rawLine.trim();
    if (!line)
      continue;
    if (line === "[COMBAT]") {
      combatOpen = true;
      continue;
    }
    if (line === "[/COMBAT]") {
      combatOpen = false;
      continue;
    }
    const sceneMatch = line.match(sceneRe);
    if (sceneMatch) {
      ctx.lastSceneId = `${(_a = sceneMatch[1]) != null ? _a : ""}S${sceneMatch[2]}`;
      ctx.lastSceneDesc = sceneMatch[3].trim();
    }
    for (const m of line.matchAll(npcRe))
      npcMap.set(m[1].split("|")[0].trim(), m[1]);
    for (const m of line.matchAll(npcRefRe)) {
      const name = m[1].trim();
      if (!npcMap.has(name))
        npcMap.set(name, name);
    }
    for (const m of line.matchAll(locRe))
      locMap.set(m[1].split("|")[0].trim(), m[1]);
    for (const m of line.matchAll(threadRe))
      threadMap.set(m[1].split("|")[0].trim(), m[1]);
    for (const m of line.matchAll(goalRe))
      goalMap.set(m[1].split("|")[0].trim(), m[1]);
    for (const m of line.matchAll(questRe))
      questMap.set(m[1].split("|")[0].trim(), m[1]);
    for (const m of line.matchAll(lootRe))
      lootMap.set(m[1].split("|")[0].trim(), m[1]);
    for (const m of line.matchAll(pcRe))
      pcMap.set(m[1].split("|")[0].trim(), m[1]);
    for (const m of line.matchAll(partyRe))
      partyMap.set(m[1].split("|")[0].trim(), m[1]);
    for (const m of line.matchAll(factionRe))
      factionMap.set(m[1].split("|")[0].trim(), m[1]);
    for (const m of line.matchAll(clockRe))
      clockMap.set(m[1].split(" ")[0].trim(), m[1]);
    for (const m of line.matchAll(trackRe))
      trackMap.set(m[1].split(" ")[0].trim(), m[1]);
    if (beatRe.test(line)) {
      ctx.recentBeats.push(line);
    } else if (!skipRe.test(line) && !sceneRe.test(line)) {
      ctx.recentBeats.push(line);
    }
  }
  ctx.activeNPCs = [...npcMap.values()];
  ctx.activeLocations = [...locMap.values()];
  ctx.activeThreads = [...threadMap.values()];
  ctx.activeGoals = [...goalMap.values()];
  ctx.activeQuests = [...questMap.values()];
  ctx.activeClocks = [...clockMap.values()];
  ctx.activeTracks = [...trackMap.values()];
  ctx.factions = [...factionMap.values()];
  ctx.partyState = [
    ...[...pcMap.values()].map((v) => `[PC:${v}]`),
    ...[...partyMap.values()].map((v) => `[Party:${v}]`)
  ];
  ctx.loot = [...lootMap.values()].map((v) => `[Loot:${v}]`);
  ctx.recentBeats = ctx.recentBeats.slice(-10);
  ctx.combatActive = combatOpen;
  return ctx;
}
function serializePartylogContext(ctx) {
  const lines = [];
  if (ctx.lastSceneId)
    lines.push(`Current scene: ${ctx.lastSceneId} *${ctx.lastSceneDesc}*`);
  if (ctx.partyState.length)
    lines.push(`Party: ${ctx.partyState.join(" ")}`);
  if (ctx.activeNPCs.length)
    lines.push(`NPCs: ${ctx.activeNPCs.map((s) => `[N:${s}]`).join(" ")}`);
  if (ctx.activeLocations.length)
    lines.push(`Locations: ${ctx.activeLocations.map((s) => `[L:${s}]`).join(" ")}`);
  if (ctx.activeThreads.length)
    lines.push(`Threads: ${ctx.activeThreads.map((s) => `[Thread:${s}]`).join(" ")}`);
  if (ctx.activeGoals.length)
    lines.push(`Goals: ${ctx.activeGoals.map((s) => `[Goal:${s}]`).join(" ")}`);
  if (ctx.activeQuests.length)
    lines.push(`Quests: ${ctx.activeQuests.map((s) => `[Quest:${s}]`).join(" ")}`);
  if (ctx.activeClocks.length)
    lines.push(`Clocks: ${ctx.activeClocks.map((s) => `[Clock:${s}]`).join(" ")}`);
  if (ctx.activeTracks.length)
    lines.push(`Tracks: ${ctx.activeTracks.map((s) => `[Track:${s}]`).join(" ")}`);
  if (ctx.factions.length)
    lines.push(`Factions: ${ctx.factions.map((s) => `[Faction:${s}]`).join(" ")}`);
  if (ctx.loot.length)
    lines.push(`Loot: ${ctx.loot.join(" ")}`);
  if (ctx.combatActive)
    lines.push("COMBAT ACTIVE");
  if (ctx.recentBeats.length) {
    lines.push("Recent beats:");
    ctx.recentBeats.forEach((beat) => lines.push(`  ${beat}`));
  }
  return lines.join("\n");
}

// src/promptBuilder.ts
var LONELOG_SYSTEM_ADDENDUM = `
LONELOG NOTATION MODE IS ACTIVE.

When generating consequences, oracle interpretations, or scene text:
- Consequences must start with "=>" (one per line for multiple consequences)
- Oracle answers must start with "->"
- Do not use blockquote markers (">")
- Do not add narrative headers or labels like "[Result]" or "[Scene]"
- For scene descriptions: plain prose only, 2-3 lines, no symbol prefix
- Do not invent or suggest Lonelog tags ([N:], [L:], etc.) - the player manages those

Generate only the symbol-prefixed content lines. The formatter handles wrapping.
`.trim();
var PARTYLOG_SYSTEM_ADDENDUM = `
PARTYLOG NOTATION MODE IS ACTIVE.

When generating consequences, oracle interpretations, or scene text:
- Player actions use @(Name) \u2014 always attribute to a named character
- GM events use ! \u2014 declarative, present tense, no attribution
- Consequences use => (one per line for multiple consequences)
- Oracle answers (GM-less mode only) use ->
- Do not use blockquote markers (">")
- Do not add labels like "[Result]" or "[Scene]"
- Do not invent or suggest Partylog tags ([N:], [L:], etc.) \u2014 the scribe manages those
- For scene descriptions: plain prose only, 2-3 lines, no symbol prefix
- Never narrate any PC's internal thoughts or decisions
- Never use second person

Generate only the symbol-prefixed content lines. The formatter handles wrapping.
`.trim();
function buildPartyBlock(fm) {
  var _a;
  if (!((_a = fm.party) == null ? void 0 : _a.length))
    return "";
  const members = fm.party.map((m) => `- ${m.name}: ${m.notes}`).join("\n");
  return `The party consists of:
${members}`;
}
function buildBasePrompt(fm, partylogMode = false) {
  var _a;
  const ruleset = (_a = fm.ruleset) != null ? _a : "the game";
  const pcBlock = partylogMode ? buildPartyBlock(fm) : fm.pcs ? `Player character: ${fm.pcs}` : "";
  const genre = fm.genre ? `Genre: ${fm.genre}` : "";
  const tone = fm.tone ? `Tone: ${fm.tone}` : "";
  const language = fm.language ? `Respond in ${fm.language}.` : "Respond in the same language as the user's input.";
  return `You are a tool for solo role-playing of ${ruleset}. You are NOT a game master.

Your role:
- Set the scene and offer alternatives (2-3 options maximum)
- When the user declares an action and their dice roll result, describe only consequences and world reactions
- When the user asks oracle questions, interpret them neutrally in context

STRICT PROHIBITIONS - never violate these:
- Never use second person ("you", "you stand", "you see")
- Never describe the PC's actions, thoughts, or internal states
- Never use dramatic or narrative tone
- Never invent lore, rules, or facts not present in the provided sources or scene context
- Never ask "What do you do?" or similar prompts
- Never use bold text for dramatic effect

RESPONSE FORMAT:
- Neutral, third-person, factual tone
- Past tense for scene descriptions, present tense for world state
- No rhetorical questions
- Be concise. Omit preamble, commentary, and closing remarks. Follow the length instruction in each request.

${pcBlock}
${genre}
${tone}
${language}`.trim();
}
function buildSystemPrompt(fm, lonelogMode, partylogMode) {
  var _a, _b;
  const base = ((_a = fm.system_prompt_override) == null ? void 0 : _a.trim()) || buildBasePrompt(fm, partylogMode);
  let prompt;
  if (partylogMode) {
    prompt = `${base}

${PARTYLOG_SYSTEM_ADDENDUM}`;
  } else if (lonelogMode) {
    prompt = `${base}

${LONELOG_SYSTEM_ADDENDUM}`;
  } else {
    prompt = base;
  }
  if ((_b = fm.game_context) == null ? void 0 : _b.trim()) {
    prompt = `${prompt}

GAME CONTEXT:
${fm.game_context.trim()}`;
  }
  return prompt;
}
function buildRequest(fm, userMessage, settings, maxOutputTokens = 512, noteBody) {
  var _a, _b, _c, _d, _e;
  const lonelogActive = (_a = fm.lonelog) != null ? _a : settings.lonelogMode;
  const partylogActive = (_b = fm.partylog) != null ? _b : settings.partylogMode;
  let contextBlock = "";
  if ((_c = fm.scene_context) == null ? void 0 : _c.trim()) {
    contextBlock = `SCENE CONTEXT:
${fm.scene_context.trim()}`;
  } else if (partylogActive && noteBody) {
    const ctx = parsePartylogContext(noteBody, (_d = settings.partylogContextDepth) != null ? _d : 60);
    contextBlock = serializePartylogContext(ctx);
  } else if (lonelogActive && noteBody) {
    const ctx = parseLonelogContext(noteBody, settings.lonelogContextDepth);
    contextBlock = serializeContext(ctx);
  }
  const contextMessage = contextBlock ? `${contextBlock}

${userMessage}` : userMessage;
  return {
    systemPrompt: buildSystemPrompt(fm, lonelogActive, partylogActive),
    userMessage: contextMessage,
    temperature: (_e = fm.temperature) != null ? _e : settings.defaultTemperature,
    maxOutputTokens,
    resolvedSources: []
  };
}

// src/frontmatter.ts
async function readFrontMatter(app, file) {
  var _a;
  const cache = app.metadataCache.getFileCache(file);
  return (_a = cache == null ? void 0 : cache.frontmatter) != null ? _a : {};
}
async function writeFrontMatterKey(app, file, key, value) {
  await app.fileManager.processFrontMatter(file, (fm) => {
    fm[key] = value;
  });
}
async function upsertSourceRef(app, file, ref) {
  await app.fileManager.processFrontMatter(file, (fm) => {
    const current = Array.isArray(fm["sources"]) ? [...fm["sources"]] : [];
    const next = current.filter((item) => item.vault_path !== ref.vault_path);
    next.push(ref);
    fm["sources"] = next;
  });
}
async function removeSourceRef(app, file, ref) {
  await app.fileManager.processFrontMatter(file, (fm) => {
    const current = Array.isArray(fm["sources"]) ? [...fm["sources"]] : [];
    fm["sources"] = current.filter((item) => item.vault_path !== ref.vault_path);
  });
}

// src/providers/anthropic.ts
var import_obsidian = require("obsidian");
var AnthropicProvider = class {
  constructor(config) {
    this.config = config;
    this.id = "anthropic";
    this.name = "Anthropic";
  }
  async generate(request) {
    var _a, _b, _c, _d;
    this.ensureConfigured();
    const model = request.model || this.config.defaultModel;
    const content = [];
    for (const source of (_a = request.resolvedSources) != null ? _a : []) {
      if (source.base64Data && source.ref.mime_type === "application/pdf") {
        content.push({
          type: "document",
          source: {
            type: "base64",
            media_type: source.ref.mime_type,
            data: source.base64Data
          }
        });
      } else if (source.textContent) {
        content.push({
          type: "text",
          text: `[SOURCE: ${source.ref.label}]
${source.textContent}
[END SOURCE]`
        });
      }
    }
    content.push({ type: "text", text: request.userMessage });
    const response = await (0, import_obsidian.requestUrl)({
      url: "https://api.anthropic.com/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.config.apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model,
        max_tokens: request.maxOutputTokens,
        temperature: request.temperature,
        system: request.systemPrompt,
        messages: [{ role: "user", content }]
      }),
      throw: false
    });
    if (response.status < 200 || response.status >= 300) {
      throw new Error(this.extractError(response));
    }
    const data = response.json;
    const text = ((_b = data.content) != null ? _b : []).map((item) => {
      var _a2;
      return (_a2 = item.text) != null ? _a2 : "";
    }).join("").trim();
    if (!text) {
      throw new Error("Provider returned an empty response.");
    }
    return {
      text,
      inputTokens: (_c = data.usage) == null ? void 0 : _c.input_tokens,
      outputTokens: (_d = data.usage) == null ? void 0 : _d.output_tokens
    };
  }
  async uploadSource() {
    throw new Error("Anthropic does not support persistent file upload. Use vault_path instead.");
  }
  async listSources() {
    return [];
  }
  async deleteSource() {
  }
  async listModels() {
    var _a;
    if (!this.config.apiKey.trim())
      return [];
    try {
      const response = await (0, import_obsidian.requestUrl)({
        url: "https://api.anthropic.com/v1/models",
        headers: {
          "x-api-key": this.config.apiKey,
          "anthropic-version": "2023-06-01"
        },
        throw: false
      });
      if (response.status < 200 || response.status >= 300)
        return [];
      const data = response.json;
      return ((_a = data.data) != null ? _a : []).map((m) => {
        var _a2;
        return (_a2 = m.id) != null ? _a2 : "";
      }).filter(Boolean);
    } catch (e) {
      return [];
    }
  }
  async validate() {
    if (!this.config.apiKey.trim()) {
      return false;
    }
    try {
      const response = await (0, import_obsidian.requestUrl)({
        url: "https://api.anthropic.com/v1/messages",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.config.apiKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: this.config.defaultModel,
          max_tokens: 1,
          messages: [{ role: "user", content: [{ type: "text", text: "ping" }] }]
        }),
        throw: false
      });
      return response.status >= 200 && response.status < 300;
    } catch (e) {
      return false;
    }
  }
  ensureConfigured() {
    if (!this.config.apiKey.trim()) {
      throw new Error("No Anthropic API key set. Check plugin settings.");
    }
  }
  extractError(response) {
    var _a, _b;
    if (response.status === 401 || response.status === 403) {
      return "Anthropic API key rejected. Check settings.";
    }
    try {
      const data = response.json;
      const msg = (_b = (_a = data == null ? void 0 : data.error) == null ? void 0 : _a.message) != null ? _b : `Anthropic request failed (${response.status}).`;
      return response.status === 429 ? `Anthropic quota/rate error: ${msg}` : msg;
    } catch (e) {
      return `Anthropic request failed (${response.status}).`;
    }
  }
};

// src/providers/gemini.ts
var import_obsidian2 = require("obsidian");
function asErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
var GeminiProvider = class {
  constructor(config) {
    this.config = config;
    this.id = "gemini";
    this.name = "Gemini";
  }
  async generate(request) {
    var _a, _b, _c, _d, _e, _f, _g;
    this.ensureConfigured();
    const model = request.model || this.config.defaultModel;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(this.config.apiKey)}`;
    const parts = [];
    for (const source of (_a = request.resolvedSources) != null ? _a : []) {
      if (source.base64Data) {
        parts.push({
          inlineData: {
            mimeType: source.ref.mime_type,
            data: source.base64Data
          }
        });
      } else if (source.textContent) {
        parts.push({ text: `[SOURCE: ${source.ref.label}]
${source.textContent}
[END SOURCE]` });
      }
    }
    parts.push({ text: request.userMessage });
    const response = await (0, import_obsidian2.requestUrl)({
      url: endpoint,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: request.systemPrompt }] },
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature: request.temperature,
          maxOutputTokens: request.maxOutputTokens,
          thinkingConfig: { thinkingBudget: 0 }
        }
      }),
      throw: false
    });
    if (response.status < 200 || response.status >= 300) {
      throw new Error(this.extractError(response, "Gemini"));
    }
    const data = response.json;
    const text = ((_e = (_d = (_c = (_b = data.candidates) == null ? void 0 : _b[0]) == null ? void 0 : _c.content) == null ? void 0 : _d.parts) != null ? _e : []).map((part) => {
      var _a2;
      return (_a2 = part.text) != null ? _a2 : "";
    }).join("").trim();
    if (!text) {
      throw new Error("Provider returned an empty response.");
    }
    return {
      text,
      inputTokens: (_f = data.usageMetadata) == null ? void 0 : _f.promptTokenCount,
      outputTokens: (_g = data.usageMetadata) == null ? void 0 : _g.candidatesTokenCount
    };
  }
  async uploadSource() {
    throw new Error("Use 'Add Source' from the note to attach a vault file inline.");
  }
  async listSources() {
    return [];
  }
  async deleteSource() {
  }
  async listModels() {
    var _a;
    if (!this.config.apiKey.trim())
      return [];
    try {
      const response = await (0, import_obsidian2.requestUrl)({
        url: `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(this.config.apiKey)}`,
        throw: false
      });
      if (response.status < 200 || response.status >= 300)
        return [];
      const data = response.json;
      return ((_a = data.models) != null ? _a : []).filter((m) => {
        var _a2;
        return (_a2 = m.supportedGenerationMethods) == null ? void 0 : _a2.includes("generateContent");
      }).map((m) => {
        var _a2;
        return ((_a2 = m.name) != null ? _a2 : "").replace(/^models\//, "");
      }).filter(Boolean);
    } catch (e) {
      return [];
    }
  }
  async validate() {
    if (!this.config.apiKey.trim()) {
      return false;
    }
    try {
      const response = await (0, import_obsidian2.requestUrl)({
        url: `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(this.config.apiKey)}`,
        throw: false
      });
      return response.status >= 200 && response.status < 300;
    } catch (e) {
      return false;
    }
  }
  ensureConfigured() {
    if (!this.config.apiKey.trim()) {
      throw new Error("No Gemini API key set. Check plugin settings.");
    }
  }
  extractError(response, providerName) {
    var _a, _b;
    if (response.status === 401 || response.status === 403) {
      return `${providerName} API key rejected. Check settings.`;
    }
    try {
      const data = response.json;
      const msg = (_b = (_a = data == null ? void 0 : data.error) == null ? void 0 : _a.message) != null ? _b : `${providerName} request failed (${response.status}).`;
      return response.status === 429 ? `${providerName} quota/rate error: ${msg}` : msg;
    } catch (error) {
      return asErrorMessage(error) || `${providerName} request failed (${response.status}).`;
    }
  }
};

// src/providers/ollama.ts
var import_obsidian4 = require("obsidian");

// src/sourceUtils.ts
var import_obsidian3 = require("obsidian");
var TEXT_EXTENSIONS = /* @__PURE__ */ new Set(["txt", "md", "markdown", "json", "yaml", "yml", "csv"]);
function getVaultFile(app, vaultPath) {
  const normalized = (0, import_obsidian3.normalizePath)(vaultPath);
  const file = app.vault.getAbstractFileByPath(normalized);
  if (!(file instanceof import_obsidian3.TFile)) {
    throw new Error(`Source file not found in vault: ${vaultPath}`);
  }
  return file;
}
async function readVaultTextSource(app, vaultPath) {
  const file = getVaultFile(app, vaultPath);
  const extension = file.extension.toLowerCase();
  if (!TEXT_EXTENSIONS.has(extension)) {
    throw new Error(`Text extraction is only supported for text files. Add a .txt companion for '${vaultPath}'.`);
  }
  return app.vault.cachedRead(file);
}
async function readVaultBinarySource(app, vaultPath) {
  const file = getVaultFile(app, vaultPath);
  return app.vault.readBinary(file);
}
function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 32768;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}
async function resolveSourcesForRequest(app, sources, providerId) {
  const resolved = [];
  for (const ref of sources) {
    if (providerId === "anthropic" || providerId === "gemini" && ref.mime_type === "application/pdf") {
      const buffer = await readVaultBinarySource(app, ref.vault_path);
      resolved.push({ ref, base64Data: arrayBufferToBase64(buffer) });
      continue;
    }
    const text = await readVaultTextSource(app, ref.vault_path);
    resolved.push({ ref, textContent: text });
  }
  return resolved;
}
function truncateSourceText(text, maxChars = 4e3) {
  return text.length <= maxChars ? text : text.slice(0, maxChars);
}
function describeSourceRef(ref) {
  return ref.vault_path;
}
function listVaultCandidateFiles(app) {
  return app.vault.getFiles().filter((file) => ["pdf", "txt", "md", "markdown"].includes(file.extension.toLowerCase())).sort((a, b) => a.path.localeCompare(b.path));
}

// src/providers/ollama.ts
var OllamaProvider = class {
  constructor(config) {
    this.config = config;
    this.id = "ollama";
    this.name = "Ollama";
  }
  async generate(request) {
    var _a, _b, _c, _d, _e;
    const baseUrl = this.config.baseUrl.replace(/\/$/, "");
    const model = request.model || this.config.defaultModel;
    const sourceBlocks = ((_a = request.resolvedSources) != null ? _a : []).filter((source) => source.textContent).map((source) => {
      var _a2;
      return `[SOURCE: ${source.ref.label}]
${truncateSourceText((_a2 = source.textContent) != null ? _a2 : "")}
[END SOURCE]`;
    });
    const response = await (0, import_obsidian4.requestUrl)({
      url: `${baseUrl}/api/chat`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        options: {
          temperature: request.temperature,
          num_predict: request.maxOutputTokens
        },
        messages: [
          { role: "system", content: request.systemPrompt },
          {
            role: "user",
            content: sourceBlocks.length ? `${sourceBlocks.join("\n\n")}

${request.userMessage}` : request.userMessage
          }
        ]
      }),
      throw: false
    });
    if (response.status < 200 || response.status >= 300) {
      if (response.status === 404) {
        throw new Error(`Model '${model}' not found in Ollama. Check available models in settings.`);
      }
      throw new Error(`Ollama not reachable at ${baseUrl}. Is it running?`);
    }
    const data = response.json;
    const text = (_e = (_d = (_c = (_b = data.message) == null ? void 0 : _b.content) == null ? void 0 : _c.trim) == null ? void 0 : _d.call(_c)) != null ? _e : "";
    if (!text) {
      throw new Error("Provider returned an empty response.");
    }
    return {
      text,
      inputTokens: data.prompt_eval_count,
      outputTokens: data.eval_count
    };
  }
  async uploadSource() {
    throw new Error("Ollama does not support file upload. Add a vault_path source instead.");
  }
  async listSources() {
    return [];
  }
  async deleteSource() {
  }
  async validate() {
    var _a;
    try {
      const tags = await this.fetchTags();
      return Boolean((_a = tags.models) == null ? void 0 : _a.length);
    } catch (e) {
      return false;
    }
  }
  async listModels() {
    var _a;
    const tags = await this.fetchTags();
    return ((_a = tags.models) != null ? _a : []).map((model) => {
      var _a2;
      return (_a2 = model.name) != null ? _a2 : "";
    }).filter(Boolean);
  }
  async fetchTags() {
    const response = await (0, import_obsidian4.requestUrl)({
      url: `${this.config.baseUrl.replace(/\/$/, "")}/api/tags`,
      throw: false
    });
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Ollama not reachable at ${this.config.baseUrl}. Is it running?`);
    }
    return response.json;
  }
};

// src/providers/openai.ts
var import_obsidian5 = require("obsidian");
var OpenAIProvider = class {
  constructor(config) {
    this.config = config;
    this.id = "openai";
    this.name = "OpenAI";
  }
  async generate(request) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    this.ensureConfigured();
    const baseUrl = this.config.baseUrl.replace(/\/$/, "");
    const model = request.model || this.config.defaultModel;
    const sourceBlocks = ((_a = request.resolvedSources) != null ? _a : []).filter((source) => source.textContent).map((source) => {
      var _a2;
      return `[SOURCE: ${source.ref.label}]
${truncateSourceText((_a2 = source.textContent) != null ? _a2 : "")}
[END SOURCE]`;
    });
    const body = {
      model,
      max_tokens: request.maxOutputTokens,
      messages: [
        { role: "system", content: request.systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: sourceBlocks.length ? `${sourceBlocks.join("\n\n")}

${request.userMessage}` : request.userMessage
            }
          ]
        }
      ]
    };
    if (!model.startsWith("gpt-5")) {
      body.temperature = request.temperature;
    }
    const response = await (0, import_obsidian5.requestUrl)({
      url: `${baseUrl}/chat/completions`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify(body),
      throw: false
    });
    if (response.status < 200 || response.status >= 300) {
      throw new Error(this.extractError(response));
    }
    const data = response.json;
    const text = (_g = (_f = (_e = (_d = (_c = (_b = data.choices) == null ? void 0 : _b[0]) == null ? void 0 : _c.message) == null ? void 0 : _d.content) == null ? void 0 : _e.trim) == null ? void 0 : _f.call(_e)) != null ? _g : "";
    if (!text) {
      throw new Error("Provider returned an empty response.");
    }
    return {
      text,
      inputTokens: (_h = data.usage) == null ? void 0 : _h.prompt_tokens,
      outputTokens: (_i = data.usage) == null ? void 0 : _i.completion_tokens
    };
  }
  async uploadSource() {
    throw new Error("This provider does not support file upload. Use vault_path instead.");
  }
  async listSources() {
    return [];
  }
  async deleteSource() {
  }
  async listModels() {
    var _a;
    if (!this.config.apiKey.trim())
      return [];
    try {
      const response = await (0, import_obsidian5.requestUrl)({
        url: `${this.config.baseUrl.replace(/\/$/, "")}/models`,
        headers: { Authorization: `Bearer ${this.config.apiKey}` },
        throw: false
      });
      if (response.status < 200 || response.status >= 300)
        return [];
      const data = response.json;
      const EXCLUDE = ["embedding", "whisper", "tts", "dall-e", "moderation", "text-search", "text-similarity"];
      return ((_a = data.data) != null ? _a : []).map((m) => {
        var _a2;
        return (_a2 = m.id) != null ? _a2 : "";
      }).filter((id) => id && !EXCLUDE.some((ex) => id.includes(ex))).sort();
    } catch (e) {
      return [];
    }
  }
  async validate() {
    if (!this.config.apiKey.trim()) {
      return false;
    }
    try {
      const response = await (0, import_obsidian5.requestUrl)({
        url: `${this.config.baseUrl.replace(/\/$/, "")}/models`,
        headers: { Authorization: `Bearer ${this.config.apiKey}` },
        throw: false
      });
      return response.status >= 200 && response.status < 300;
    } catch (e) {
      return false;
    }
  }
  ensureConfigured() {
    if (!this.config.apiKey.trim()) {
      throw new Error("No OpenAI API key set. Check plugin settings.");
    }
  }
  extractError(response) {
    var _a, _b;
    if (response.status === 401 || response.status === 403) {
      return "OpenAI API key rejected. Check settings.";
    }
    try {
      const data = response.json;
      const msg = (_b = (_a = data == null ? void 0 : data.error) == null ? void 0 : _a.message) != null ? _b : `OpenAI request failed (${response.status}).`;
      return response.status === 429 ? `OpenAI quota/rate error: ${msg}` : msg;
    } catch (e) {
      return `OpenAI request failed (${response.status}).`;
    }
  }
};

// src/providers/openrouter.ts
var import_obsidian6 = require("obsidian");
var BASE_URL = "https://openrouter.ai/api/v1";
function asErrorMessage2(error) {
  return error instanceof Error ? error.message : String(error);
}
var OpenRouterProvider = class {
  constructor(config) {
    this.config = config;
    this.id = "openrouter";
    this.name = "OpenRouter";
  }
  async generate(request) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    this.ensureConfigured();
    const model = request.model || this.config.defaultModel;
    const sourceBlocks = ((_a = request.resolvedSources) != null ? _a : []).filter((source) => source.textContent).map((source) => {
      var _a2;
      return `[SOURCE: ${source.ref.label}]
${truncateSourceText((_a2 = source.textContent) != null ? _a2 : "")}
[END SOURCE]`;
    });
    const response = await (0, import_obsidian6.requestUrl)({
      url: `${BASE_URL}/chat/completions`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.config.apiKey}`,
        "HTTP-Referer": "obsidian-sybyl",
        "X-Title": "Sybyl"
      },
      body: JSON.stringify({
        model,
        max_tokens: request.maxOutputTokens,
        temperature: request.temperature,
        messages: [
          { role: "system", content: request.systemPrompt },
          {
            role: "user",
            content: sourceBlocks.length ? `${sourceBlocks.join("\n\n")}

${request.userMessage}` : request.userMessage
          }
        ]
      }),
      throw: false
    });
    if (response.status < 200 || response.status >= 300) {
      throw new Error(this.extractError(response));
    }
    const data = response.json;
    const text = (_g = (_f = (_e = (_d = (_c = (_b = data.choices) == null ? void 0 : _b[0]) == null ? void 0 : _c.message) == null ? void 0 : _d.content) == null ? void 0 : _e.trim) == null ? void 0 : _f.call(_e)) != null ? _g : "";
    if (!text) {
      throw new Error("Provider returned an empty response.");
    }
    return {
      text,
      inputTokens: (_h = data.usage) == null ? void 0 : _h.prompt_tokens,
      outputTokens: (_i = data.usage) == null ? void 0 : _i.completion_tokens
    };
  }
  async uploadSource() {
    throw new Error("OpenRouter does not support file upload. Use vault_path instead.");
  }
  async listSources() {
    return [];
  }
  async deleteSource() {
  }
  async listModels() {
    var _a;
    if (!this.config.apiKey.trim())
      return [];
    try {
      const response = await (0, import_obsidian6.requestUrl)({
        url: `${BASE_URL}/models`,
        headers: {
          "Authorization": `Bearer ${this.config.apiKey}`
        },
        throw: false
      });
      if (response.status < 200 || response.status >= 300)
        return [];
      const data = response.json;
      return ((_a = data.data) != null ? _a : []).filter((m) => {
        var _a2, _b;
        return (_b = (_a2 = m.architecture) == null ? void 0 : _a2.modality) == null ? void 0 : _b.endsWith("->text");
      }).map((m) => {
        var _a2;
        return (_a2 = m.id) != null ? _a2 : "";
      }).filter(Boolean).sort();
    } catch (e) {
      return [];
    }
  }
  async validate() {
    if (!this.config.apiKey.trim())
      return false;
    try {
      const response = await (0, import_obsidian6.requestUrl)({
        url: `${BASE_URL}/models`,
        headers: { "Authorization": `Bearer ${this.config.apiKey}` },
        throw: false
      });
      return response.status >= 200 && response.status < 300;
    } catch (e) {
      return false;
    }
  }
  ensureConfigured() {
    if (!this.config.apiKey.trim()) {
      throw new Error("No OpenRouter API key set. Check plugin settings.");
    }
  }
  extractError(response) {
    var _a, _b;
    if (response.status === 401 || response.status === 403) {
      return "OpenRouter API key rejected. Check settings.";
    }
    try {
      const data = response.json;
      const msg = (_b = (_a = data == null ? void 0 : data.error) == null ? void 0 : _a.message) != null ? _b : `OpenRouter request failed (${response.status}).`;
      if (response.status === 429) {
        if (msg === "Provider returned error") {
          return "OpenRouter: free model endpoint at capacity. Retry in a moment or pick a different model.";
        }
        return `OpenRouter rate limit: ${msg}`;
      }
      return msg;
    } catch (error) {
      return asErrorMessage2(error) || `OpenRouter request failed (${response.status}).`;
    }
  }
};

// src/providers/index.ts
function getProvider(settings, overrideId) {
  const id = overrideId != null ? overrideId : settings.activeProvider;
  switch (id) {
    case "gemini":
      return new GeminiProvider(settings.providers.gemini);
    case "openai":
      return new OpenAIProvider(settings.providers.openai);
    case "anthropic":
      return new AnthropicProvider(settings.providers.anthropic);
    case "ollama":
      return new OllamaProvider(settings.providers.ollama);
    case "openrouter":
      return new OpenRouterProvider(settings.providers.openrouter);
    default:
      throw new Error(`Unknown provider: ${id}`);
  }
}

// src/commands.ts
var import_obsidian8 = require("obsidian");

// src/lonelog/formatter.ts
function fence(content) {
  return `\`\`\`
${content}
\`\`\``;
}
function cleanAiText(text) {
  return text.replace(/^>\s*/gm, "").trim();
}
function formatStartScene(aiText, sceneId, sceneDesc, _opts) {
  const header = `### ${sceneId} *${sceneDesc}*`;
  const body = cleanAiText(aiText);
  return `${header}

${body}`;
}
function formatDeclareAction(action, roll, aiConsequence, opts) {
  const consequence = cleanAiText(aiConsequence).split("\n").filter(Boolean).map((line) => line.startsWith("=>") ? line : `=> ${line}`).join("\n");
  const notation = `@ ${action}
d: ${roll}
${consequence}`;
  return opts.wrapInCodeBlock ? fence(notation) : notation;
}
function formatAskOracle(question, oracleResult, aiInterpretation, opts) {
  const interpretation = cleanAiText(aiInterpretation).split("\n").filter(Boolean).map((line) => line.startsWith("=>") ? line : `=> ${line}`).join("\n");
  const notation = `? ${question}
-> ${oracleResult}
${interpretation}`;
  return opts.wrapInCodeBlock ? fence(notation) : notation;
}
function formatInterpretOracle(aiInterpretation, opts) {
  const interpretation = cleanAiText(aiInterpretation).split("\n").filter(Boolean).map((line) => line.startsWith("=>") ? line : `=> ${line}`).join("\n");
  return opts.wrapInCodeBlock ? fence(interpretation) : interpretation;
}
function formatSuggestConsequence(aiOptions, opts) {
  const options = cleanAiText(aiOptions).split("\n").filter((line) => line.trim().length > 0).map((line) => line.startsWith("=>") ? line : `=> ${line}`).join("\n");
  return opts.wrapInCodeBlock ? fence(options) : options;
}
function formatExpandScene(aiProse, _opts) {
  return `\\---
${cleanAiText(aiProse)}
---\\`;
}
function formatAdventureSeed(aiText, opts) {
  const axes = cleanAiText(aiText).split("\n").filter(Boolean).map((line) => "  " + line.replace(/^[-*]\s*/, "")).join("\n");
  const notation = `gen: Adventure Seed
${axes}`;
  return opts.wrapInCodeBlock ? fence(notation) : notation;
}
function formatCharacter(aiText, _opts) {
  return cleanAiText(aiText);
}

// src/partylog/formatter.ts
function fence2(content) {
  return `\`\`\`
${content}
\`\`\``;
}
function cleanAiText2(text) {
  return text.replace(/^>\s*/gm, "").trim();
}
function ensureConsequenceLines(text) {
  return cleanAiText2(text).split("\n").filter(Boolean).map((line) => line.startsWith("=>") ? line : `=> ${line}`).join("\n");
}
function formatStartScene2(aiText, sceneId, sceneDesc, _opts) {
  const header = `### ${sceneId} *${sceneDesc}*`;
  const body = cleanAiText2(aiText);
  return `${header}

${body}`;
}
function formatDeclareAction2(character, action, roll, aiConsequence, opts) {
  const consequence = ensureConsequenceLines(aiConsequence);
  const notation = `@(${character}) ${action}
d: ${roll}
${consequence}`;
  return opts.wrapInCodeBlock ? fence2(notation) : notation;
}
function formatCollaborativeAction(lead, assist, action, roll, aiConsequence, opts) {
  const consequence = ensureConsequenceLines(aiConsequence);
  const notation = `@(${lead} > ${assist}) ${action}
d: ${roll}
${consequence}`;
  return opts.wrapInCodeBlock ? fence2(notation) : notation;
}
function formatGMEvent(event, aiConsequence, opts) {
  const consequence = ensureConsequenceLines(aiConsequence);
  const notation = `! ${event}
${consequence}`;
  return opts.wrapInCodeBlock ? fence2(notation) : notation;
}
function formatWhatNow(aiOptions, opts) {
  const options = ensureConsequenceLines(aiOptions);
  return opts.wrapInCodeBlock ? fence2(options) : options;
}
function formatExpandScene2(aiProse, _opts) {
  return `\\---
${cleanAiText2(aiProse)}
---\\`;
}
function formatLogThis(aiText, opts) {
  const body = cleanAiText2(aiText);
  const marked = `(post: formatted from raw notes)
${body}`;
  return opts.wrapInCodeBlock ? fence2(marked) : marked;
}

// src/modals.ts
var import_obsidian7 = require("obsidian");
var InputModal = class extends import_obsidian7.Modal {
  constructor(app, title, fields, onSubmit) {
    super(app);
    this.title = title;
    this.fields = fields;
    this.onSubmit = onSubmit;
    this.values = fields.reduce((acc, field) => {
      var _a;
      acc[field.key] = (_a = field.value) != null ? _a : "";
      return acc;
    }, {});
  }
  onOpen() {
    this.titleEl.setText(this.title);
    this.contentEl.empty();
    for (const field of this.fields) {
      if (field.textarea) {
        new import_obsidian7.Setting(this.contentEl).setName(field.label).setDesc(field.optional ? "Optional" : "").addTextArea((text) => {
          var _a, _b;
          text.setPlaceholder((_a = field.placeholder) != null ? _a : "");
          text.setValue((_b = this.values[field.key]) != null ? _b : "");
          text.inputEl.rows = 8;
          text.onChange((value) => {
            this.values[field.key] = value;
          });
        });
      } else {
        new import_obsidian7.Setting(this.contentEl).setName(field.label).setDesc(field.optional ? "Optional" : "").addText((text) => {
          var _a, _b;
          text.setPlaceholder((_a = field.placeholder) != null ? _a : "");
          text.setValue((_b = this.values[field.key]) != null ? _b : "");
          text.onChange((value) => {
            this.values[field.key] = value;
          });
        });
      }
    }
    new import_obsidian7.Setting(this.contentEl).addButton((button) => {
      button.setButtonText("Confirm").setCta().onClick(() => {
        this.onSubmit(this.values);
        this.close();
      });
    });
  }
  onClose() {
    this.contentEl.empty();
  }
};
function openInputModal(app, title, fields) {
  return new Promise((resolve) => {
    let settled = false;
    const modal = new InputModal(app, title, fields, (values) => {
      settled = true;
      resolve(values);
    });
    const originalClose = modal.onClose.bind(modal);
    modal.onClose = () => {
      originalClose();
      if (!settled) {
        resolve(null);
      }
    };
    modal.open();
  });
}
function pickLocalFile() {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.txt,.md,.markdown";
    input.onchange = () => {
      var _a, _b;
      return resolve((_b = (_a = input.files) == null ? void 0 : _a[0]) != null ? _b : null);
    };
    input.click();
  });
}
var VaultFilePickerModal = class extends import_obsidian7.Modal {
  constructor(app, title, onPick) {
    super(app);
    this.title = title;
    this.onPick = onPick;
    this.files = listVaultCandidateFiles(app);
  }
  onOpen() {
    this.titleEl.setText(this.title);
    this.contentEl.empty();
    if (!this.files.length) {
      this.contentEl.createEl("p", { text: "No PDF or text files found in the vault." });
      return;
    }
    this.files.forEach((file) => {
      new import_obsidian7.Setting(this.contentEl).setName(file.path).setDesc(file.extension.toLowerCase()).addButton((button) => {
        button.setButtonText("Select").setCta().onClick(() => {
          this.onPick(file);
          this.close();
        });
      });
    });
  }
  onClose() {
    this.contentEl.empty();
  }
};
function pickVaultFile(app, title) {
  return new Promise((resolve) => {
    let settled = false;
    const modal = new VaultFilePickerModal(app, title, (file) => {
      settled = true;
      resolve(file);
    });
    const originalClose = modal.onClose.bind(modal);
    modal.onClose = () => {
      originalClose();
      if (!settled) {
        resolve(null);
      }
    };
    modal.open();
  });
}
var SourceOriginModal = class extends import_obsidian7.Modal {
  constructor(app, onPick) {
    super(app);
    this.onPick = onPick;
  }
  onOpen() {
    this.titleEl.setText("Add Source File");
    this.contentEl.empty();
    new import_obsidian7.Setting(this.contentEl).setName("Vault file").setDesc("Pick a file already in your vault").addButton((btn) => btn.setButtonText("Choose").setCta().onClick(() => {
      this.onPick("vault");
      this.close();
    }));
    new import_obsidian7.Setting(this.contentEl).setName("External file").setDesc("Import a file from your computer \u2014 saved into a sources/ subfolder next to this note").addButton((btn) => btn.setButtonText("Import").setCta().onClick(() => {
      this.onPick("external");
      this.close();
    }));
  }
  onClose() {
    this.contentEl.empty();
  }
};
function pickSourceOrigin(app) {
  return new Promise((resolve) => {
    let settled = false;
    const modal = new SourceOriginModal(app, (origin) => {
      settled = true;
      resolve(origin);
    });
    const originalClose = modal.onClose.bind(modal);
    modal.onClose = () => {
      originalClose();
      if (!settled)
        resolve(null);
    };
    modal.open();
  });
}
var SourcePickerModal = class extends import_obsidian7.Modal {
  constructor(app, title, sources, onPick) {
    super(app);
    this.title = title;
    this.sources = sources;
    this.onPick = onPick;
  }
  onOpen() {
    this.titleEl.setText(this.title);
    this.contentEl.empty();
    this.sources.forEach((source) => {
      new import_obsidian7.Setting(this.contentEl).setName(source.label).setDesc(`${source.mime_type} | ${describeSourceRef(source)}`).addButton((button) => {
        button.setButtonText("Select").setCta().onClick(() => {
          this.onPick(source);
          this.close();
        });
      });
    });
  }
  onClose() {
    this.contentEl.empty();
  }
};
function pickSourceRef(app, title, sources) {
  return new Promise((resolve) => {
    let settled = false;
    const modal = new SourcePickerModal(app, title, sources, (ref) => {
      settled = true;
      resolve(ref);
    });
    const originalClose = modal.onClose.bind(modal);
    modal.onClose = () => {
      originalClose();
      if (!settled) {
        resolve(null);
      }
    };
    modal.open();
  });
}
var QuickMenuModal = class extends import_obsidian7.Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
    this.items = [
      { label: "Start Scene", commandId: "sybyl:start-scene" },
      { label: "Declare Action", commandId: "sybyl:declare-action" },
      { label: "Ask Oracle", commandId: "sybyl:ask-oracle" },
      { label: "Interpret Oracle Roll", commandId: "sybyl:interpret-oracle-roll" },
      { label: "What Now", commandId: "sybyl:what-now" },
      { label: "What Can I Do", commandId: "sybyl:what-can-i-do" },
      { label: "Expand Scene", commandId: "sybyl:expand-scene" }
    ];
  }
  onOpen() {
    this.titleEl.setText("Sybyl");
    this.contentEl.empty();
    for (const item of this.items) {
      new import_obsidian7.Setting(this.contentEl).setName(item.label).addButton(
        (btn) => btn.setButtonText("Run").setCta().onClick(() => {
          this.close();
          this.app.commands.executeCommandById(item.commandId);
        })
      );
    }
    const active = this.plugin.settings.activeProvider;
    const activeModel = this.plugin.settings.providers[active].defaultModel;
    new import_obsidian7.Setting(this.contentEl).setName("Switch Provider / Model").setDesc(`${active} / ${activeModel}`).addButton(
      (btn) => btn.setButtonText("Switch").onClick(() => {
        this.close();
        new ProviderSwitchModal(this.app, this.plugin).open();
      })
    );
  }
  onClose() {
    this.contentEl.empty();
  }
};
var ProviderSwitchModal = class extends import_obsidian7.Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
    this.availableModels = [];
    this.selectedProvider = plugin.settings.activeProvider;
    this.selectedModel = plugin.settings.providers[this.selectedProvider].defaultModel;
  }
  onOpen() {
    this.titleEl.setText("Switch Provider / Model");
    this.render();
    void this.fetchModels();
  }
  render() {
    this.contentEl.empty();
    new import_obsidian7.Setting(this.contentEl).setName("Provider").addDropdown((dd) => {
      dd.addOption("gemini", "Gemini");
      dd.addOption("openai", "OpenAI");
      dd.addOption("anthropic", "Anthropic (Claude)");
      dd.addOption("ollama", "Ollama (local)");
      dd.addOption("openrouter", "OpenRouter");
      dd.setValue(this.selectedProvider);
      dd.onChange((value) => {
        this.selectedProvider = value;
        this.selectedModel = this.plugin.settings.providers[this.selectedProvider].defaultModel;
        this.availableModels = [];
        this.render();
        void this.fetchModels();
      });
    });
    const models = this.availableModels.length ? this.availableModels.includes(this.selectedModel) ? this.availableModels : [this.selectedModel, ...this.availableModels] : [this.selectedModel];
    new import_obsidian7.Setting(this.contentEl).setName("Model").addDropdown((dd) => {
      models.forEach((m) => dd.addOption(m, m));
      dd.setValue(this.selectedModel);
      dd.onChange((value) => {
        this.selectedModel = value;
      });
    });
    new import_obsidian7.Setting(this.contentEl).addButton(
      (btn) => btn.setButtonText("Switch").setCta().onClick(async () => {
        this.plugin.settings.activeProvider = this.selectedProvider;
        this.plugin.settings.providers[this.selectedProvider].defaultModel = this.selectedModel;
        await this.plugin.saveSettings();
        new import_obsidian7.Notice(`Sybyl: ${this.selectedProvider} / ${this.selectedModel}`);
        this.close();
      })
    );
  }
  async fetchModels() {
    try {
      const models = await getProvider(this.plugin.settings, this.selectedProvider).listModels();
      if (models.length > 0) {
        this.availableModels = models;
        if (!models.includes(this.selectedModel)) {
          this.selectedModel = models[0];
        }
        this.render();
      }
    } catch (e) {
    }
  }
  onClose() {
    this.contentEl.empty();
  }
};
var ManageSourcesModal = class extends import_obsidian7.Modal {
  constructor(app, sources, onRemove) {
    super(app);
    this.sources = sources;
    this.onRemove = onRemove;
  }
  onOpen() {
    this.titleEl.setText("Manage Sources");
    this.render();
  }
  render() {
    this.contentEl.empty();
    if (!this.sources.length) {
      this.contentEl.createEl("p", { text: "No sources are attached to this note." });
      return;
    }
    this.sources.forEach((source) => {
      new import_obsidian7.Setting(this.contentEl).setName(source.label).setDesc(`${source.mime_type} | ${describeSourceRef(source)}`).addButton((button) => {
        button.setButtonText("Remove").onClick(async () => {
          await this.onRemove(source);
          new import_obsidian7.Notice(`Removed '${source.label}'.`);
          this.close();
        });
      });
    });
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/commands.ts
function isLonelogActive(settings, fm) {
  var _a;
  return (_a = fm.lonelog) != null ? _a : settings.lonelogMode;
}
function isPartylogActive(settings, fm) {
  var _a;
  return (_a = fm.partylog) != null ? _a : settings.partylogMode;
}
function lonelogOpts(settings, noWrap = false) {
  var _a;
  return { wrapInCodeBlock: !noWrap && ((_a = settings.lonelogWrapCodeBlock) != null ? _a : true) };
}
function partylogOpts(settings, noWrap = false) {
  var _a;
  return { wrapInCodeBlock: !noWrap && ((_a = settings.partylogWrapCodeBlock) != null ? _a : true) };
}
function genericBlockquote(label, text) {
  return `> [${label}] ${text.trim().replace(/\n/g, "\n> ")}`;
}
function inferMimeType(file) {
  const name = "path" in file ? file.path : file.name;
  return name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "text/plain";
}
function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}
function parseLonelogOracleResponse(text) {
  var _a, _b;
  const lines = text.replace(/^>\s*/gm, "").split("\n").map((line) => line.trim()).filter(Boolean);
  const result = (_b = (_a = lines.find((line) => line.startsWith("->"))) == null ? void 0 : _a.replace(/^->\s*/, "")) != null ? _b : "Unclear";
  const interpretation = lines.filter((line) => !line.startsWith("->")).join("\n");
  return { result, interpretation };
}
async function addSourceToNote(plugin, file) {
  var _a, _b;
  const origin = await pickSourceOrigin(plugin.app);
  if (!origin)
    return;
  if (origin === "vault") {
    const vaultFile = await pickVaultFile(plugin.app, "Choose a vault file");
    if (!vaultFile)
      return;
    const ref2 = {
      label: vaultFile.basename,
      mime_type: inferMimeType(vaultFile),
      vault_path: vaultFile.path
    };
    await upsertSourceRef(plugin.app, file, ref2);
    new import_obsidian8.Notice(`Source added: ${vaultFile.path}`);
    return;
  }
  const localFile = await pickLocalFile();
  if (!localFile)
    return;
  const buffer = await localFile.arrayBuffer();
  const parentDir = (_b = (_a = file.parent) == null ? void 0 : _a.path) != null ? _b : "";
  const sourcesFolder = (0, import_obsidian8.normalizePath)(parentDir ? `${parentDir}/sources` : "sources");
  if (!plugin.app.vault.getAbstractFileByPath(sourcesFolder)) {
    await plugin.app.vault.createFolder(sourcesFolder);
  }
  const targetPath = (0, import_obsidian8.normalizePath)(`${sourcesFolder}/${localFile.name}`);
  const existing = plugin.app.vault.getAbstractFileByPath(targetPath);
  if (existing instanceof import_obsidian8.TFile) {
    await plugin.app.vault.modifyBinary(existing, buffer);
  } else {
    await plugin.app.vault.createBinary(targetPath, buffer);
  }
  const ref = {
    label: localFile.name.replace(/\.[^.]+$/, ""),
    mime_type: inferMimeType(localFile),
    vault_path: targetPath
  };
  await upsertSourceRef(plugin.app, file, ref);
  new import_obsidian8.Notice(`Source imported: ${targetPath}`);
}
async function manageSources(plugin) {
  var _a;
  const context = await plugin.getActiveNoteContext();
  if (!(context == null ? void 0 : context.view.file)) {
    return;
  }
  new ManageSourcesModal(
    plugin.app,
    (_a = context.fm.sources) != null ? _a : [],
    async (ref) => removeSourceRef(plugin.app, context.view.file, ref)
  ).open();
}
async function runGeneration(plugin, userMessage, formatter, maxOutputTokens = 512, placement) {
  var _a, _b;
  const context = await plugin.getActiveNoteContext();
  if (!context) {
    return;
  }
  try {
    const editor = context.view.editor;
    let targetLine;
    if (placement === "below-selection") {
      targetLine = (_b = (_a = editor.listSelections()[0]) == null ? void 0 : _a.head.line) != null ? _b : editor.getCursor().line;
    } else if (placement === "end-of-note") {
      targetLine = editor.lastLine();
    } else {
      targetLine = editor.getCursor().line;
    }
    const insideCodeBlock = isInsideCodeBlock(editor, targetLine);
    const response = await plugin.requestGeneration(context.fm, context.noteBody, userMessage, maxOutputTokens);
    const formatted = formatter(response.text, context.fm, insideCodeBlock);
    if (placement === "below-selection") {
      insertBelowSelection(editor, formatted);
    } else {
      plugin.insertText(context.view, formatted, placement);
    }
    plugin.maybeInsertTokenComment(context.view, response);
  } catch (error) {
    new import_obsidian8.Notice(`Chorus error: ${error instanceof Error ? error.message : String(error)}`);
    console.error(error);
  }
}
function registerAllCommands(plugin) {
  plugin.addCommand({
    id: "sybyl:insert-frontmatter",
    name: "Insert Note Frontmatter",
    callback: async () => {
      const context = await plugin.getActiveNoteContext();
      if (!(context == null ? void 0 : context.view.file)) {
        return;
      }
      const values = await openInputModal(plugin.app, "Insert Chorus Frontmatter", [
        { key: "ruleset", label: "Game / ruleset", placeholder: "Ironsworn" },
        { key: "genre", label: "Genre", optional: true, placeholder: "Dark fantasy / survival" },
        { key: "pcs", label: "PC (solo mode)", optional: true, placeholder: "Kira Voss, dangerous rank, vow: recover the relic" },
        { key: "tone", label: "Tone", optional: true, placeholder: "Gritty, hopeful" },
        { key: "language", label: "Language", optional: true, placeholder: "Leave blank for auto-detect" }
      ]);
      if (!values) {
        return;
      }
      if (!values.ruleset) {
        new import_obsidian8.Notice("Ruleset is required.");
        return;
      }
      await plugin.app.fileManager.processFrontMatter(context.view.file, (fm) => {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        fm["ruleset"] = values.ruleset;
        fm["provider"] = (_a = fm["provider"]) != null ? _a : plugin.settings.activeProvider;
        fm["oracle_mode"] = (_b = fm["oracle_mode"]) != null ? _b : "yes-no";
        fm["lonelog"] = (_c = fm["lonelog"]) != null ? _c : plugin.settings.lonelogMode;
        fm["partylog"] = (_d = fm["partylog"]) != null ? _d : plugin.settings.partylogMode;
        fm["scene_counter"] = (_e = fm["scene_counter"]) != null ? _e : 1;
        fm["session_number"] = (_f = fm["session_number"]) != null ? _f : 1;
        fm["game_context"] = (_g = fm["game_context"]) != null ? _g : "";
        fm["scene_context"] = (_h = fm["scene_context"]) != null ? _h : "";
        if (values.genre)
          fm["genre"] = values.genre;
        if (values.pcs)
          fm["pcs"] = values.pcs;
        if (values.tone)
          fm["tone"] = values.tone;
        if (values.language)
          fm["language"] = values.language;
      });
      new import_obsidian8.Notice("Chorus frontmatter inserted.");
    }
  });
  plugin.addCommand({
    id: "sybyl:digest-source",
    name: "Digest Source into Game Context",
    callback: async () => {
      var _a, _b;
      const context = await plugin.getActiveNoteContext();
      if (!(context == null ? void 0 : context.view.file)) {
        return;
      }
      const vaultFile = await pickVaultFile(plugin.app, "Choose a source file to digest");
      if (!vaultFile) {
        return;
      }
      const ref = {
        label: vaultFile.basename,
        mime_type: inferMimeType(vaultFile),
        vault_path: vaultFile.path
      };
      const providerId = (_a = context.fm.provider) != null ? _a : plugin.settings.activeProvider;
      let resolvedSources;
      try {
        resolvedSources = await resolveSourcesForRequest(plugin.app, [ref], providerId);
      } catch (error) {
        new import_obsidian8.Notice(`Cannot read source: ${error instanceof Error ? error.message : String(error)}`);
        return;
      }
      const ruleset = (_b = context.fm.ruleset) != null ? _b : "the game";
      const digestPrompt = `Distill the following source material for use in a solo tabletop RPG session of "${ruleset}".

Extract and condense into a compact reference:
- Core rules and mechanics relevant to play
- Key factions, locations, characters, and world facts
- Tone, genre, and setting conventions
- Any tables, move lists, or random generators

Be concise and specific. Preserve game-mechanical details. Omit flavor prose and examples.`;
      try {
        const response = await plugin.requestRawGeneration(
          context.fm,
          digestPrompt,
          2e3,
          resolvedSources
        );
        await plugin.app.fileManager.processFrontMatter(context.view.file, (fm) => {
          fm["game_context"] = response.text;
        });
        new import_obsidian8.Notice("Game context updated.");
      } catch (error) {
        new import_obsidian8.Notice(`Chorus error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  });
  plugin.addCommand({
    id: "sybyl:ask-the-rules",
    name: "Ask the Rules",
    callback: async () => {
      var _a, _b, _c;
      const context = await plugin.getActiveNoteContext();
      if (!(context == null ? void 0 : context.view.file)) {
        return;
      }
      const sources = (_a = context.fm.sources) != null ? _a : [];
      if (!sources.length) {
        new import_obsidian8.Notice("No sources attached to this note. Use Add Source File first.");
        return;
      }
      const ref = sources.length === 1 ? sources[0] : await pickSourceRef(plugin.app, "Choose a source to query", sources);
      if (!ref) {
        return;
      }
      const values = await openInputModal(plugin.app, "Ask the Rules", [
        { key: "question", label: "Question", placeholder: "How does Momentum work?" }
      ]);
      if (!(values == null ? void 0 : values.question)) {
        return;
      }
      const providerId = (_b = context.fm.provider) != null ? _b : plugin.settings.activeProvider;
      let resolvedSources;
      try {
        resolvedSources = await resolveSourcesForRequest(plugin.app, [ref], providerId);
      } catch (error) {
        new import_obsidian8.Notice(`Cannot read source: ${error instanceof Error ? error.message : String(error)}`);
        return;
      }
      const ruleset = (_c = context.fm.ruleset) != null ? _c : "the game";
      const prompt = `You are a rules reference for "${ruleset}".
Answer the following question using only the provided source material.
Be precise and cite the relevant rule or page section if possible.

Question: ${values.question}`;
      try {
        const response = await plugin.requestRawGeneration(context.fm, prompt, 1e3, resolvedSources);
        plugin.insertText(context.view, genericBlockquote("Rules", response.text));
        plugin.maybeInsertTokenComment(context.view, response);
      } catch (error) {
        new import_obsidian8.Notice(`Chorus error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  });
  plugin.addCommand({
    id: "sybyl:adventure-seed",
    name: "Adventure Seed",
    callback: async () => {
      var _a, _b;
      const context = await plugin.getActiveNoteContext();
      if (!(context == null ? void 0 : context.view.file))
        return;
      const values = await openInputModal(plugin.app, "Adventure Seed", [
        { key: "concept", label: "Theme or concept", optional: true, placeholder: "Leave blank for a random seed." }
      ]);
      if (!values)
        return;
      const ruleset = (_a = context.fm.ruleset) != null ? _a : "the game";
      const concept = (_b = values.concept) == null ? void 0 : _b.trim();
      const prompt = `Generate an adventure seed for a solo tabletop RPG session of "${ruleset}".

Structure the output as:
- Premise: one sentence describing the situation
- Conflict: the central tension or threat
- Hook: the specific event that pulls the PC in
- Tone: the intended atmosphere

${concept ? `Theme/concept: ${concept}` : "Make it evocative and immediately playable."}
Keep it concise \u2014 4 bullet points, one short sentence each.`;
      try {
        const response = await plugin.requestRawGeneration(context.fm, prompt, 800, []);
        const lonelog = isLonelogActive(plugin.settings, context.fm);
        const insideCodeBlock = isInsideCodeBlock(context.view.editor);
        const output = lonelog ? formatAdventureSeed(response.text, lonelogOpts(plugin.settings, insideCodeBlock)) : genericBlockquote("Adventure Seed", response.text);
        plugin.insertText(context.view, output);
        plugin.maybeInsertTokenComment(context.view, response);
      } catch (error) {
        new import_obsidian8.Notice(`Chorus error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  });
  plugin.addCommand({
    id: "sybyl:generate-character",
    name: "Generate Character",
    callback: async () => {
      var _a, _b, _c, _d;
      const context = await plugin.getActiveNoteContext();
      if (!(context == null ? void 0 : context.view.file))
        return;
      const sources = (_a = context.fm.sources) != null ? _a : [];
      if (!sources.length) {
        new import_obsidian8.Notice("No sources attached to this note. Add a rulebook first via Add Source File.");
        return;
      }
      const ref = sources.length === 1 ? sources[0] : await pickSourceRef(plugin.app, "Choose a rulebook source", sources);
      if (!ref)
        return;
      const values = await openInputModal(plugin.app, "Generate Character", [
        { key: "concept", label: "Character concept", optional: true, placeholder: "Leave blank for a random character." }
      ]);
      if (!values)
        return;
      const providerId = (_b = context.fm.provider) != null ? _b : plugin.settings.activeProvider;
      let resolvedSources;
      try {
        resolvedSources = await resolveSourcesForRequest(plugin.app, [ref], providerId);
      } catch (error) {
        new import_obsidian8.Notice(`Cannot read source: ${error instanceof Error ? error.message : String(error)}`);
        return;
      }
      const ruleset = (_c = context.fm.ruleset) != null ? _c : "the game";
      const concept = (_d = values.concept) == null ? void 0 : _d.trim();
      const lonelog = isLonelogActive(plugin.settings, context.fm);
      const formatInstruction = lonelog ? `Format the output as a Lonelog PC tag. Use the multi-line form for complex characters:
[PC:Name
  | stat: HP X, Stress Y
  | gear: item1, item2
  | trait: value1, value2
]
Include all stats and fields exactly as defined by the rules. Output the tag only \u2014 no extra commentary.` : `Include all required fields as defined by the rules: name, stats/attributes, starting equipment, background, and any other mandatory character elements. Format clearly with one field per line.`;
      const prompt = `Using ONLY the character creation rules in the provided source material, generate a character for "${ruleset}".

Follow the exact character creation procedure described in the rules. Do not invent mechanics not present in the source.

${concept ? `Character concept: ${concept}` : "Generate a random character."}

${formatInstruction}`;
      try {
        const response = await plugin.requestRawGeneration(context.fm, prompt, 1500, resolvedSources);
        const insideCodeBlock = isInsideCodeBlock(context.view.editor);
        const output = lonelog ? formatCharacter(response.text, lonelogOpts(plugin.settings, insideCodeBlock)) : genericBlockquote("Character", response.text);
        plugin.insertText(context.view, output);
        plugin.maybeInsertTokenComment(context.view, response);
      } catch (error) {
        new import_obsidian8.Notice(`Chorus error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  });
  plugin.addCommand({
    id: "sybyl:start-scene",
    name: "Start Scene",
    callback: async () => {
      var _a;
      const context = await plugin.getActiveNoteContext();
      if (!(context == null ? void 0 : context.view.file)) {
        return;
      }
      if (isLonelogActive(plugin.settings, context.fm)) {
        const values = await openInputModal(plugin.app, "Start Scene", [
          { key: "sceneDesc", label: "Scene description", placeholder: "Dark alley, midnight" }
        ]);
        if (!(values == null ? void 0 : values.sceneDesc)) {
          return;
        }
        const counter = (_a = context.fm.scene_counter) != null ? _a : 1;
        await runGeneration(
          plugin,
          `START SCENE. Generate only: 2-3 lines of third-person past-tense prose describing the atmosphere and setting of: "${values.sceneDesc}". No dialogue. No PC actions. No additional commentary.`,
          (text, _fm, insideCodeBlock) => formatStartScene(text, `S${counter}`, values.sceneDesc, lonelogOpts(plugin.settings, insideCodeBlock))
        );
        if (plugin.settings.lonelogAutoIncScene) {
          await writeFrontMatterKey(plugin.app, context.view.file, "scene_counter", counter + 1);
        }
        return;
      }
      await runGeneration(
        plugin,
        "START SCENE. Generate only: 2-3 lines of third-person past-tense prose describing the setting and atmosphere. No dialogue. No PC actions. No additional commentary.",
        (text) => genericBlockquote("Scene", text)
      );
    }
  });
  plugin.addCommand({
    id: "sybyl:declare-action",
    name: "Declare Action",
    callback: async () => {
      const values = await openInputModal(plugin.app, "Declare Action", [
        { key: "action", label: "Action" },
        { key: "roll", label: "Roll result" }
      ]);
      if (!(values == null ? void 0 : values.action) || !values.roll) {
        return;
      }
      await runGeneration(
        plugin,
        `PC action: ${values.action}
Roll result: ${values.roll}
Describe only the consequences and world reaction. Do not describe the PC's action.`,
        (text, fm, insideCodeBlock) => isLonelogActive(plugin.settings, fm) ? formatDeclareAction(values.action, values.roll, text, lonelogOpts(plugin.settings, insideCodeBlock)) : `> [Action] ${values.action} | Roll: ${values.roll}
> [Result] ${text.trim().replace(/\n/g, "\n> ")}`
      );
    }
  });
  plugin.addCommand({
    id: "sybyl:ask-oracle",
    name: "Ask Oracle",
    callback: async () => {
      var _a, _b;
      const context = await plugin.getActiveNoteContext();
      if (!context) {
        return;
      }
      const values = await openInputModal(plugin.app, "Ask Oracle", [
        { key: "question", label: "Question" },
        { key: "result", label: "Oracle result", optional: true }
      ]);
      if (!(values == null ? void 0 : values.question)) {
        return;
      }
      const hasResult = Boolean((_a = values.result) == null ? void 0 : _a.trim());
      const message = hasResult ? `Oracle question: ${values.question}
Oracle result: ${values.result}
Interpret this result in the context of the scene. Third person, neutral, 2-3 lines.` : `Oracle question: ${values.question}
Oracle mode: ${(_b = context.fm.oracle_mode) != null ? _b : "yes-no"}
Run the oracle and give the result plus a 1-2 line neutral interpretation.`;
      await runGeneration(
        plugin,
        message,
        (text, fm, insideCodeBlock) => {
          if (!isLonelogActive(plugin.settings, fm)) {
            return `> [Oracle] Q: ${values.question}
> [Answer] ${text.trim().replace(/\n/g, "\n> ")}`;
          }
          if (hasResult) {
            return formatAskOracle(values.question, values.result.trim(), text, lonelogOpts(plugin.settings, insideCodeBlock));
          }
          const parsed = parseLonelogOracleResponse(text);
          return formatAskOracle(values.question, parsed.result, parsed.interpretation, lonelogOpts(plugin.settings, insideCodeBlock));
        }
      );
    }
  });
  plugin.addCommand({
    id: "sybyl:interpret-oracle",
    name: "Interpret Oracle Roll",
    callback: async () => {
      var _a, _b;
      const context = await plugin.getActiveNoteContext();
      if (!context) {
        return;
      }
      let selected = getSelection(context.view.editor);
      if (!selected) {
        const values = await openInputModal(plugin.app, "Interpret Oracle Result", [
          { key: "oracle", label: "Oracle result" }
        ]);
        selected = (_b = (_a = values == null ? void 0 : values.oracle) == null ? void 0 : _a.trim()) != null ? _b : "";
      }
      if (!selected) {
        return;
      }
      await runGeneration(
        plugin,
        `Interpret this oracle result in the context of the current scene: "${selected}"
Neutral, third-person, 2-3 lines. No dramatic language.`,
        (text, fm, insideCodeBlock) => isLonelogActive(plugin.settings, fm) ? formatInterpretOracle(text, lonelogOpts(plugin.settings, insideCodeBlock)) : genericBlockquote("Interpretation", text),
        512,
        "below-selection"
      );
    }
  });
  plugin.addCommand({
    id: "sybyl:suggest-consequence",
    name: "What Now",
    callback: async () => {
      await runGeneration(
        plugin,
        "Based on the current scene context, suggest 1-2 possible consequences or complications. Present them as neutral options, not as narrative outcomes. Do not choose between them.",
        (text, fm, insideCodeBlock) => {
          if (isPartylogActive(plugin.settings, fm)) {
            return formatWhatNow(text, partylogOpts(plugin.settings, insideCodeBlock));
          }
          if (isLonelogActive(plugin.settings, fm)) {
            return formatSuggestConsequence(text, lonelogOpts(plugin.settings, insideCodeBlock));
          }
          return genericBlockquote("Options", text);
        }
      );
    }
  });
  plugin.addCommand({
    id: "sybyl:what-can-i-do",
    name: "What Can I Do",
    callback: async () => {
      var _a;
      const context = await plugin.getActiveNoteContext();
      if (!context)
        return;
      if (isPartylogActive(plugin.settings, context.fm)) {
        const values = await openInputModal(plugin.app, "What Can I Do", [
          { key: "character", label: "Character name", optional: true, placeholder: "Leave blank for party-level options" }
        ]);
        if (!values)
          return;
        const character = (_a = values.character) == null ? void 0 : _a.trim();
        const userMessage = character ? `Character: ${character}
List 2-4 available actions or moves for this character given the current scene.
Present as neutral options. Do not choose between them.` : "The party is stuck. Based on the current scene context, suggest exactly 3-4 concrete actions the party could take next. Present them as neutral options. Do not choose between them.";
        const insideCodeBlock = isInsideCodeBlock(context.view.editor);
        try {
          const response = await plugin.requestGeneration(context.fm, context.noteBody, userMessage, 512);
          plugin.insertText(context.view, genericBlockquote("Actions", response.text));
          plugin.maybeInsertTokenComment(context.view, response);
        } catch (error) {
          new import_obsidian8.Notice(`Chorus error: ${error instanceof Error ? error.message : String(error)}`);
        }
        return;
      }
      await runGeneration(
        plugin,
        "The player is stuck. Based on the current scene context, suggest exactly 3 concrete actions the PC could take next. Present them as neutral options numbered 1\u20133. Do not resolve or narrate any outcome. Do not recommend one over another.",
        (text, fm, insideCodeBlock) => isLonelogActive(plugin.settings, fm) ? formatSuggestConsequence(text, lonelogOpts(plugin.settings, insideCodeBlock)) : genericBlockquote("Actions", text)
      );
    }
  });
  plugin.addCommand({
    id: "sybyl:expand-scene",
    name: "Expand Scene",
    callback: async () => {
      await runGeneration(
        plugin,
        "Expand the current scene into a prose passage. Third person, past tense, 100-150 words. No dialogue. Do not describe the PC's internal thoughts or decisions. Stay strictly within the established scene context.",
        (text, fm, insideCodeBlock) => {
          if (isPartylogActive(plugin.settings, fm)) {
            return formatExpandScene2(text, partylogOpts(plugin.settings, insideCodeBlock));
          }
          if (isLonelogActive(plugin.settings, fm)) {
            return formatExpandScene(text, lonelogOpts(plugin.settings, insideCodeBlock));
          }
          return `---
> [Prose] ${text.trim().replace(/\n/g, "\n> ")}
---`;
        },
        600
      );
    }
  });
  plugin.addCommand({
    id: "sybyl:upload-source",
    name: "Add Source File",
    callback: async () => {
      const context = await plugin.getActiveNoteContext();
      if (!(context == null ? void 0 : context.view.file)) {
        return;
      }
      try {
        await addSourceToNote(plugin, context.view.file);
      } catch (error) {
        new import_obsidian8.Notice(`Chorus error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  });
  plugin.addCommand({
    id: "sybyl:manage-sources",
    name: "Manage Sources",
    callback: async () => {
      await manageSources(plugin);
    }
  });
  plugin.addCommand({
    id: "sybyl:lonelog-parse-context",
    name: "Update Scene Context",
    callback: async () => {
      const context = await plugin.getActiveNoteContext();
      if (!(context == null ? void 0 : context.view.file)) {
        return;
      }
      if (!isLonelogActive(plugin.settings, context.fm)) {
        new import_obsidian8.Notice("Lonelog mode is not enabled for this note.");
        return;
      }
      const parsed = parseLonelogContext(context.noteBody, plugin.settings.lonelogContextDepth);
      await writeFrontMatterKey(plugin.app, context.view.file, "scene_context", serializeContext(parsed));
      new import_obsidian8.Notice("Scene context updated from log.");
    }
  });
  plugin.addCommand({
    id: "sybyl:lonelog-session-break",
    name: "New Session Header",
    callback: async () => {
      var _a;
      const context = await plugin.getActiveNoteContext();
      if (!(context == null ? void 0 : context.view.file)) {
        return;
      }
      if (!isLonelogActive(plugin.settings, context.fm)) {
        new import_obsidian8.Notice("Lonelog mode is not enabled for this note.");
        return;
      }
      const values = await openInputModal(plugin.app, "New Session Header", [
        { key: "date", label: "Date", value: todayIsoDate() },
        { key: "duration", label: "Duration", placeholder: "1h30" },
        { key: "recap", label: "Recap", optional: true }
      ]);
      if (!(values == null ? void 0 : values.date)) {
        return;
      }
      const sessionNumber = (_a = context.fm.session_number) != null ? _a : 1;
      const block = `## Session ${sessionNumber}
*Date: ${values.date} | Duration: ${values.duration || "-"}*

${values.recap ? `**Recap:** ${values.recap}

` : ""}`;
      plugin.insertText(context.view, block, "cursor");
      await writeFrontMatterKey(plugin.app, context.view.file, "session_number", sessionNumber + 1);
    }
  });
  plugin.addCommand({
    id: "chorus:partylog-new-scene",
    name: "Chorus: New Scene",
    callback: async () => {
      var _a, _b;
      const context = await plugin.getActiveNoteContext();
      if (!(context == null ? void 0 : context.view.file))
        return;
      if (!isPartylogActive(plugin.settings, context.fm)) {
        new import_obsidian8.Notice("Partylog mode is not enabled for this note.");
        return;
      }
      const values = await openInputModal(plugin.app, "New Scene", [
        { key: "sceneDesc", label: "Scene description", placeholder: "The burning mill at the edge of town" },
        { key: "threadId", label: "Thread ID", optional: true, placeholder: "T2 \u2014 leave blank for standard scene" }
      ]);
      if (!(values == null ? void 0 : values.sceneDesc))
        return;
      const counter = (_a = context.fm.scene_counter) != null ? _a : 1;
      const threadId = (_b = values.threadId) == null ? void 0 : _b.trim();
      const sceneId = threadId ? `${threadId}-S${counter}` : `S${counter}`;
      const opts = partylogOpts(plugin.settings);
      await runGeneration(
        plugin,
        `START SCENE. Generate only: 2-3 lines of third-person past-tense prose describing the atmosphere and setting of: "${values.sceneDesc}". No dialogue. No PC actions. No additional commentary.`,
        (text, _fm, insideCodeBlock) => formatStartScene2(text, sceneId, values.sceneDesc, partylogOpts(plugin.settings, insideCodeBlock))
      );
      if (plugin.settings.partylogAutoIncScene) {
        await writeFrontMatterKey(plugin.app, context.view.file, "scene_counter", counter + 1);
      }
    }
  });
  plugin.addCommand({
    id: "chorus:partylog-declare-action",
    name: "Chorus: Declare Action",
    callback: async () => {
      var _a, _b;
      const context = await plugin.getActiveNoteContext();
      if (!(context == null ? void 0 : context.view.file))
        return;
      if (!isPartylogActive(plugin.settings, context.fm)) {
        new import_obsidian8.Notice("Partylog mode is not enabled for this note.");
        return;
      }
      const values = await openInputModal(plugin.app, "Declare Action", [
        { key: "character", label: "Character" },
        { key: "action", label: "Action" },
        { key: "roll", label: "Roll result" },
        { key: "collaborator", label: "Collaborator", optional: true, placeholder: "Name \u2014 for @(A > B) pattern" }
      ]);
      if (!(values == null ? void 0 : values.character) || !values.action || !values.roll)
        return;
      const party = (_a = context.fm.party) != null ? _a : [];
      if (party.length && !party.some((m) => m.name === values.character)) {
        new import_obsidian8.Notice(`Character '${values.character}' not found in party roster. Check frontmatter.`);
        return;
      }
      const collaborator = (_b = values.collaborator) == null ? void 0 : _b.trim();
      const userMessage = `Character: ${values.character}
Action: ${values.action}
Roll result: ${values.roll}
Describe only the consequences and world reaction.
Do not describe the character's action or internal state.`;
      await runGeneration(
        plugin,
        userMessage,
        (text, _fm, insideCodeBlock) => {
          const opts = partylogOpts(plugin.settings, insideCodeBlock);
          return collaborator ? formatCollaborativeAction(values.character, collaborator, values.action, values.roll, text, opts) : formatDeclareAction2(values.character, values.action, values.roll, text, opts);
        }
      );
    }
  });
  plugin.addCommand({
    id: "chorus:partylog-gm-event",
    name: "Chorus: Log GM Event",
    callback: async () => {
      var _a;
      const context = await plugin.getActiveNoteContext();
      if (!(context == null ? void 0 : context.view.file))
        return;
      if (!isPartylogActive(plugin.settings, context.fm)) {
        new import_obsidian8.Notice("Partylog mode is not enabled for this note.");
        return;
      }
      const values = await openInputModal(plugin.app, "Log GM Event", [
        { key: "event", label: "Event" },
        { key: "consequence", label: "Generate consequence?", optional: true, value: "yes", placeholder: "Clear to skip" }
      ]);
      if (!(values == null ? void 0 : values.event))
        return;
      const generateConsequence = Boolean((_a = values.consequence) == null ? void 0 : _a.trim());
      if (!generateConsequence) {
        plugin.insertText(context.view, `! ${values.event}`);
        return;
      }
      await runGeneration(
        plugin,
        `GM event: ${values.event}
Describe 1-2 consequences or reactions from the world or NPCs.
Third person, neutral, present tense for world state.
Do not describe any PC's reaction or decision.`,
        (text, _fm, insideCodeBlock) => formatGMEvent(values.event, text, partylogOpts(plugin.settings, insideCodeBlock))
      );
    }
  });
  plugin.addCommand({
    id: "chorus:partylog-log-this",
    name: "Chorus: Log This",
    callback: async () => {
      var _a;
      const context = await plugin.getActiveNoteContext();
      if (!(context == null ? void 0 : context.view.file))
        return;
      if (!isPartylogActive(plugin.settings, context.fm)) {
        new import_obsidian8.Notice("Partylog mode is not enabled for this note.");
        return;
      }
      const party = context.fm.party;
      if (!(party == null ? void 0 : party.length)) {
        new import_obsidian8.Notice("No party roster found. Add a party: field to this note's frontmatter.");
        return;
      }
      const roster = party.map((m) => `- ${m.name}: ${m.notes}`).join("\n");
      const selected = getSelection(context.view.editor);
      let rawNotes;
      let fromSelection;
      if (selected) {
        rawNotes = selected;
        fromSelection = true;
      } else {
        const values = await openInputModal(plugin.app, "Log This \u2014 Raw Session Notes", [
          { key: "notes", label: "Raw notes", textarea: true, placeholder: "Paste or type your raw session notes here\u2026" }
        ]);
        if (!((_a = values == null ? void 0 : values.notes) == null ? void 0 : _a.trim()))
          return;
        rawNotes = values.notes;
        fromSelection = false;
      }
      if (rawNotes.length > 4e3) {
        new import_obsidian8.Notice("Raw notes too long for a single request. Split into smaller blocks.");
        return;
      }
      const userMessage = `Convert these raw session notes into valid Partylog notation.

PARTY ROSTER (use these exact names for @(Name) attribution):
${roster}

RAW NOTES:
${rawNotes}

Rules:
- Use @(Name) for each player action, attributed to the correct character
- Use ! for GM-introduced events
- Use d: for dice rolls with their results
- Use -> for resolution outcomes
- Use => for consequences (one per line)
- Preserve the sequence of events exactly
- Do not invent events not present in the raw notes
- Do not add [N:], [L:], or other tracking tags \u2014 the scribe will add those
- Output only the Partylog notation lines, nothing else`;
      const insideCodeBlock = isInsideCodeBlock(context.view.editor);
      const opts = partylogOpts(plugin.settings, insideCodeBlock);
      try {
        const response = await plugin.requestGeneration(context.fm, context.noteBody, userMessage, 800);
        const formatted = formatLogThis(response.text, opts);
        if (fromSelection) {
          insertBelowSelection(context.view.editor, formatted);
        } else {
          plugin.insertText(context.view, formatted);
        }
        plugin.maybeInsertTokenComment(context.view, response);
      } catch (error) {
        new import_obsidian8.Notice(`Chorus error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  });
  plugin.addCommand({
    id: "chorus:partylog-parse-context",
    name: "Chorus: Update Scene Context from Log",
    callback: async () => {
      const context = await plugin.getActiveNoteContext();
      if (!(context == null ? void 0 : context.view.file))
        return;
      if (!isPartylogActive(plugin.settings, context.fm)) {
        new import_obsidian8.Notice("Partylog mode is not enabled for this note.");
        return;
      }
      const parsed = parsePartylogContext(context.noteBody, plugin.settings.partylogContextDepth);
      await writeFrontMatterKey(plugin.app, context.view.file, "scene_context", serializePartylogContext(parsed));
      new import_obsidian8.Notice("Scene context updated from party log.");
    }
  });
  plugin.addCommand({
    id: "chorus:partylog-session-break",
    name: "Chorus: New Session Header",
    callback: async () => {
      var _a, _b;
      const context = await plugin.getActiveNoteContext();
      if (!(context == null ? void 0 : context.view.file))
        return;
      if (!isPartylogActive(plugin.settings, context.fm)) {
        new import_obsidian8.Notice("Partylog mode is not enabled for this note.");
        return;
      }
      const values = await openInputModal(plugin.app, "New Session Header", [
        { key: "date", label: "Date", value: todayIsoDate() },
        { key: "duration", label: "Duration", placeholder: "3h" },
        { key: "scribe", label: "Scribe", optional: true },
        { key: "recap", label: "Recap", optional: true, placeholder: "One-line summary of last session" }
      ]);
      if (!(values == null ? void 0 : values.date))
        return;
      const sessionNumber = (_a = context.fm.session_number) != null ? _a : 1;
      const scribeLine = ((_b = values.scribe) == null ? void 0 : _b.trim()) ? ` | Scribe: ${values.scribe.trim()}` : "";
      const block = `## Session ${sessionNumber}
*Date: ${values.date} | Duration: ${values.duration || "-"}${scribeLine}*

${values.recap ? `**Recap:** ${values.recap}

` : ""}`;
      plugin.insertText(context.view, block, "cursor");
      await writeFrontMatterKey(plugin.app, context.view.file, "session_number", sessionNumber + 1);
    }
  });
}

// src/settings.ts
var import_obsidian9 = require("obsidian");
var DEFAULT_SETTINGS = {
  activeProvider: "gemini",
  providers: {
    gemini: { apiKey: "", defaultModel: "gemma-4-26b-a4b-it" },
    openai: { apiKey: "", defaultModel: "gpt-5.2", baseUrl: "https://api.openai.com/v1" },
    anthropic: { apiKey: "", defaultModel: "claude-sonnet-4-6" },
    ollama: { baseUrl: "http://localhost:11434", defaultModel: "gemma3" },
    openrouter: { apiKey: "", defaultModel: "meta-llama/llama-3.3-70b-instruct:free" }
  },
  insertionMode: "cursor",
  showTokenCount: false,
  defaultTemperature: 0.7,
  lonelogMode: false,
  lonelogContextDepth: 60,
  lonelogWrapCodeBlock: true,
  lonelogAutoIncScene: true,
  partylogMode: false,
  partylogContextDepth: 60,
  partylogWrapCodeBlock: true,
  partylogAutoIncScene: true,
  partylogInsertRaw: true
};
function normalizeSettings(raw) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
  return {
    ...DEFAULT_SETTINGS,
    ...raw != null ? raw : {},
    providers: {
      gemini: { ...DEFAULT_SETTINGS.providers.gemini, ...(_b = (_a = raw == null ? void 0 : raw.providers) == null ? void 0 : _a.gemini) != null ? _b : {} },
      openai: { ...DEFAULT_SETTINGS.providers.openai, ...(_d = (_c = raw == null ? void 0 : raw.providers) == null ? void 0 : _c.openai) != null ? _d : {} },
      anthropic: { ...DEFAULT_SETTINGS.providers.anthropic, ...(_f = (_e = raw == null ? void 0 : raw.providers) == null ? void 0 : _e.anthropic) != null ? _f : {} },
      ollama: { ...DEFAULT_SETTINGS.providers.ollama, ...(_h = (_g = raw == null ? void 0 : raw.providers) == null ? void 0 : _g.ollama) != null ? _h : {} },
      openrouter: { ...DEFAULT_SETTINGS.providers.openrouter, ...(_j = (_i = raw == null ? void 0 : raw.providers) == null ? void 0 : _i.openrouter) != null ? _j : {} }
    }
  };
}
var ChorusSettingTab = class extends import_obsidian9.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
    this.validation = {};
    this.modelCache = {};
    this.fetchingProviders = /* @__PURE__ */ new Set();
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: `Chorus Settings (${this.providerLabel(this.plugin.settings.activeProvider)})` });
    this.maybeFetchModels();
    this.renderActiveProvider(containerEl);
    this.renderProviderConfig(containerEl);
    this.renderGlobalSettings(containerEl);
  }
  maybeFetchModels() {
    var _a;
    const active = this.plugin.settings.activeProvider;
    if (active === "ollama") {
      if (!this.modelCache.ollama && !this.fetchingProviders.has("ollama")) {
        void this.fetchModels("ollama");
      }
      return;
    }
    const config = this.plugin.settings.providers[active];
    const apiKey = (_a = config.apiKey) == null ? void 0 : _a.trim();
    if (apiKey && !this.modelCache[active] && !this.fetchingProviders.has(active)) {
      void this.fetchModels(active);
    }
  }
  async fetchModels(provider) {
    this.fetchingProviders.add(provider);
    try {
      const models = await getProvider(this.plugin.settings, provider).listModels();
      if (models.length > 0) {
        this.modelCache[provider] = models;
      }
    } catch (e) {
    } finally {
      this.fetchingProviders.delete(provider);
      this.display();
    }
  }
  renderActiveProvider(containerEl) {
    new import_obsidian9.Setting(containerEl).setName("Active Provider").setDesc("Used when a note does not override provider.").addDropdown((dropdown) => {
      dropdown.addOption("gemini", "Gemini");
      dropdown.addOption("openai", "OpenAI");
      dropdown.addOption("anthropic", "Anthropic (Claude)");
      dropdown.addOption("ollama", "Ollama (local)");
      dropdown.addOption("openrouter", "OpenRouter");
      dropdown.setValue(this.plugin.settings.activeProvider);
      dropdown.onChange(async (value) => {
        this.plugin.settings.activeProvider = value;
        await this.plugin.saveSettings();
        this.display();
      });
    });
  }
  renderProviderConfig(containerEl) {
    containerEl.createEl("h3", { text: "Provider Configuration" });
    switch (this.plugin.settings.activeProvider) {
      case "gemini":
        this.renderGeminiSettings(containerEl);
        break;
      case "openai":
        this.renderOpenAISettings(containerEl);
        break;
      case "anthropic":
        this.renderAnthropicSettings(containerEl);
        break;
      case "ollama":
        this.renderOllamaSettings(containerEl);
        break;
      case "openrouter":
        this.renderOpenRouterSettings(containerEl);
        break;
    }
  }
  renderGeminiSettings(containerEl) {
    const config = this.plugin.settings.providers.gemini;
    this.renderValidationState(containerEl, "gemini");
    new import_obsidian9.Setting(containerEl).setName("API Key").addText((text) => {
      text.inputEl.type = "password";
      text.setValue(config.apiKey);
      text.onChange(async (value) => {
        config.apiKey = value;
        this.modelCache.gemini = void 0;
        await this.plugin.saveSettings();
      });
      text.inputEl.addEventListener("blur", () => void this.validateProvider("gemini"));
    });
    new import_obsidian9.Setting(containerEl).setName("Default Model").addDropdown((dropdown) => {
      const models = this.modelOptionsFor("gemini", config.defaultModel);
      models.forEach((m) => dropdown.addOption(m, m));
      dropdown.setValue(config.defaultModel);
      dropdown.onChange(async (value) => {
        config.defaultModel = value;
        await this.plugin.saveSettings();
      });
    });
  }
  renderOpenAISettings(containerEl) {
    const config = this.plugin.settings.providers.openai;
    this.renderValidationState(containerEl, "openai");
    new import_obsidian9.Setting(containerEl).setName("API Key").addText((text) => {
      text.inputEl.type = "password";
      text.setValue(config.apiKey);
      text.onChange(async (value) => {
        config.apiKey = value;
        this.modelCache.openai = void 0;
        await this.plugin.saveSettings();
      });
      text.inputEl.addEventListener("blur", () => void this.validateProvider("openai"));
    });
    new import_obsidian9.Setting(containerEl).setName("Base URL").setDesc("Override for Azure or proxy endpoints").addText((text) => {
      text.setValue(config.baseUrl);
      text.onChange(async (value) => {
        config.baseUrl = value;
        this.modelCache.openai = void 0;
        await this.plugin.saveSettings();
      });
      text.inputEl.addEventListener("blur", () => void this.validateProvider("openai"));
    });
    new import_obsidian9.Setting(containerEl).setName("Default Model").addDropdown((dropdown) => {
      const models = this.modelOptionsFor("openai", config.defaultModel);
      models.forEach((m) => dropdown.addOption(m, m));
      dropdown.setValue(config.defaultModel);
      dropdown.onChange(async (value) => {
        config.defaultModel = value;
        await this.plugin.saveSettings();
      });
    });
    containerEl.createEl("p", {
      text: "OpenAI sources use vault_path. Add source files via the Manage Sources command in any note."
    });
  }
  renderAnthropicSettings(containerEl) {
    const config = this.plugin.settings.providers.anthropic;
    this.renderValidationState(containerEl, "anthropic");
    new import_obsidian9.Setting(containerEl).setName("API Key").addText((text) => {
      text.inputEl.type = "password";
      text.setValue(config.apiKey);
      text.onChange(async (value) => {
        config.apiKey = value;
        this.modelCache.anthropic = void 0;
        await this.plugin.saveSettings();
      });
      text.inputEl.addEventListener("blur", () => void this.validateProvider("anthropic"));
    });
    new import_obsidian9.Setting(containerEl).setName("Default Model").addDropdown((dropdown) => {
      const models = this.modelOptionsFor("anthropic", config.defaultModel);
      models.forEach((m) => dropdown.addOption(m, m));
      dropdown.setValue(config.defaultModel);
      dropdown.onChange(async (value) => {
        config.defaultModel = value;
        await this.plugin.saveSettings();
      });
    });
    containerEl.createEl("p", {
      text: "PDFs are encoded inline per request. Use short excerpts to avoid high token costs."
    });
  }
  renderOpenRouterSettings(containerEl) {
    const config = this.plugin.settings.providers.openrouter;
    this.renderValidationState(containerEl, "openrouter");
    new import_obsidian9.Setting(containerEl).setName("API Key").addText((text) => {
      text.inputEl.type = "password";
      text.setValue(config.apiKey);
      text.onChange(async (value) => {
        config.apiKey = value;
        this.modelCache.openrouter = void 0;
        await this.plugin.saveSettings();
      });
      text.inputEl.addEventListener("blur", () => void this.validateProvider("openrouter"));
    });
    new import_obsidian9.Setting(containerEl).setName("Default Model").addDropdown((dropdown) => {
      const models = this.modelOptionsFor("openrouter", config.defaultModel);
      models.forEach((m) => dropdown.addOption(m, m));
      dropdown.setValue(config.defaultModel);
      dropdown.onChange(async (value) => {
        config.defaultModel = value;
        await this.plugin.saveSettings();
      });
    });
    containerEl.createEl("p", {
      text: "OpenRouter provides access to many free and paid models via a unified API. Free models have ':free' in their ID."
    });
  }
  renderOllamaSettings(containerEl) {
    const config = this.plugin.settings.providers.ollama;
    this.renderValidationState(containerEl, "ollama");
    new import_obsidian9.Setting(containerEl).setName("Base URL").addText((text) => {
      text.setValue(config.baseUrl);
      text.onChange(async (value) => {
        config.baseUrl = value;
        await this.plugin.saveSettings();
      });
      text.inputEl.addEventListener("blur", () => void this.validateOllama());
    });
    new import_obsidian9.Setting(containerEl).setName("Available Models").addDropdown((dropdown) => {
      const models = this.modelOptionsFor("ollama", config.defaultModel);
      models.forEach((m) => dropdown.addOption(m, m));
      dropdown.setValue(config.defaultModel);
      dropdown.onChange(async (value) => {
        config.defaultModel = value;
        await this.plugin.saveSettings();
        this.display();
      });
    });
    new import_obsidian9.Setting(containerEl).setName("Default Model").addText((text) => {
      text.setValue(config.defaultModel);
      text.onChange(async (value) => {
        config.defaultModel = value;
        await this.plugin.saveSettings();
      });
    });
    containerEl.createEl("p", {
      text: "No API key required. Ollama must be running locally. File grounding uses vault_path text extraction."
    });
  }
  renderGlobalSettings(containerEl) {
    containerEl.createEl("h3", { text: "Global Settings" });
    new import_obsidian9.Setting(containerEl).setName("Default Temperature").setDesc(String(this.plugin.settings.defaultTemperature)).addSlider((slider) => {
      slider.setLimits(0, 1, 0.05);
      slider.setValue(this.plugin.settings.defaultTemperature);
      slider.onChange(async (value) => {
        this.plugin.settings.defaultTemperature = value;
        await this.plugin.saveSettings();
        this.display();
      });
    });
    new import_obsidian9.Setting(containerEl).setName("Insertion Mode").addDropdown((dropdown) => {
      dropdown.addOption("cursor", "At cursor");
      dropdown.addOption("end-of-note", "End of note");
      dropdown.setValue(this.plugin.settings.insertionMode);
      dropdown.onChange(async (value) => {
        this.plugin.settings.insertionMode = value;
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian9.Setting(containerEl).setName("Show Token Count").addToggle((toggle) => {
      toggle.setValue(this.plugin.settings.showTokenCount);
      toggle.onChange(async (value) => {
        this.plugin.settings.showTokenCount = value;
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian9.Setting(containerEl).setName("Lonelog Mode").setDesc("Enable Lonelog notation, context parsing, and Lonelog-specific commands.").addToggle((toggle) => {
      toggle.setValue(this.plugin.settings.lonelogMode);
      toggle.onChange(async (value) => {
        this.plugin.settings.lonelogMode = value;
        await this.plugin.saveSettings();
        this.display();
      });
    });
    if (this.plugin.settings.lonelogMode) {
      new import_obsidian9.Setting(containerEl).setName("Auto-increment scene counter").addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.lonelogAutoIncScene);
        toggle.onChange(async (value) => {
          this.plugin.settings.lonelogAutoIncScene = value;
          await this.plugin.saveSettings();
        });
      });
      new import_obsidian9.Setting(containerEl).setName("Context extraction depth").addText((text) => {
        text.setValue(String(this.plugin.settings.lonelogContextDepth));
        text.onChange(async (value) => {
          const next = Number(value);
          if (!Number.isNaN(next) && next > 0) {
            this.plugin.settings.lonelogContextDepth = next;
            await this.plugin.saveSettings();
          }
        });
      });
      new import_obsidian9.Setting(containerEl).setName("Wrap notation in code blocks").addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.lonelogWrapCodeBlock);
        toggle.onChange(async (value) => {
          this.plugin.settings.lonelogWrapCodeBlock = value;
          await this.plugin.saveSettings();
        });
      });
    }
    if (this.plugin.settings.lonelogMode && this.plugin.settings.partylogMode) {
      containerEl.createEl("p", {
        text: "\u26A0 Both Lonelog and Partylog global toggles are on. Per-note frontmatter (lonelog: true / partylog: true) takes precedence. If neither is set, Partylog wins globally.",
        cls: "mod-warning"
      });
    }
    new import_obsidian9.Setting(containerEl).setName("Partylog Mode").setDesc("Enable Partylog notation, context parsing, and group play commands.").addToggle((toggle) => {
      toggle.setValue(this.plugin.settings.partylogMode);
      toggle.onChange(async (value) => {
        this.plugin.settings.partylogMode = value;
        await this.plugin.saveSettings();
        this.display();
      });
    });
    if (this.plugin.settings.partylogMode) {
      new import_obsidian9.Setting(containerEl).setName("Auto-increment scene counter").addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.partylogAutoIncScene);
        toggle.onChange(async (value) => {
          this.plugin.settings.partylogAutoIncScene = value;
          await this.plugin.saveSettings();
        });
      });
      new import_obsidian9.Setting(containerEl).setName("Context extraction depth").addText((text) => {
        text.setValue(String(this.plugin.settings.partylogContextDepth));
        text.onChange(async (value) => {
          const next = Number(value);
          if (!Number.isNaN(next) && next > 0) {
            this.plugin.settings.partylogContextDepth = next;
            await this.plugin.saveSettings();
          }
        });
      });
      new import_obsidian9.Setting(containerEl).setName("Wrap notation in code blocks").addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.partylogWrapCodeBlock);
        toggle.onChange(async (value) => {
          this.plugin.settings.partylogWrapCodeBlock = value;
          await this.plugin.saveSettings();
        });
      });
    }
  }
  modelOptionsFor(provider, currentModel) {
    const cached = this.modelCache[provider];
    if (!cached)
      return [currentModel];
    return cached.includes(currentModel) ? cached : [currentModel, ...cached];
  }
  renderValidationState(containerEl, provider) {
    const state = this.validation[provider];
    if (!state || state.status === "idle") {
      return;
    }
    containerEl.createEl("p", {
      text: state.status === "checking" ? "Validation: checking..." : state.status === "valid" ? "Validation: \u2713" : `Validation: \u2717${state.message ? ` (${state.message})` : ""}`
    });
  }
  providerLabel(provider) {
    switch (provider) {
      case "gemini":
        return "Gemini";
      case "openai":
        return "OpenAI";
      case "anthropic":
        return "Anthropic";
      case "ollama":
        return "Ollama";
      case "openrouter":
        return "OpenRouter";
    }
  }
  async validateProvider(provider) {
    this.validation[provider] = { status: "checking" };
    this.display();
    try {
      const valid = await getProvider(this.plugin.settings, provider).validate();
      this.validation[provider] = { status: valid ? "valid" : "invalid" };
    } catch (error) {
      this.validation[provider] = {
        status: "invalid",
        message: error instanceof Error ? error.message : String(error)
      };
    }
    this.display();
  }
  async validateOllama() {
    var _a;
    this.validation.ollama = { status: "checking" };
    this.display();
    try {
      const provider = new OllamaProvider(this.plugin.settings.providers.ollama);
      const valid = await provider.validate();
      this.validation.ollama = { status: valid ? "valid" : "invalid" };
      this.modelCache.ollama = valid ? await provider.listModels() : void 0;
    } catch (error) {
      this.validation.ollama = {
        status: "invalid",
        message: error instanceof Error ? error.message : String(error)
      };
      this.modelCache.ollama = void 0;
      new import_obsidian9.Notice((_a = this.validation.ollama.message) != null ? _a : "Ollama validation failed.");
    }
    this.display();
  }
};

// src/main.ts
var ChorusPlugin = class extends import_obsidian10.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
  }
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new ChorusSettingTab(this.app, this));
    registerAllCommands(this);
    this.addRibbonIcon("dice", "Chorus", () => {
      new QuickMenuModal(this.app, this).open();
    });
  }
  async loadSettings() {
    this.settings = normalizeSettings(await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  async getActiveNoteContext() {
    const view = this.app.workspace.getActiveViewOfType(import_obsidian10.MarkdownView);
    if (!(view == null ? void 0 : view.file)) {
      new import_obsidian10.Notice("No active markdown note.");
      return null;
    }
    return {
      view,
      fm: await readFrontMatter(this.app, view.file),
      noteBody: await this.app.vault.cachedRead(view.file)
    };
  }
  async requestGeneration(fm, noteBody, userMessage, maxOutputTokens = 512) {
    const provider = getProvider(this.settings);
    const request = buildRequest(fm, userMessage, this.settings, maxOutputTokens, noteBody);
    const progress = new import_obsidian10.Notice("Chorus: Generating...", 0);
    try {
      return await provider.generate(request);
    } finally {
      progress.hide();
    }
  }
  async requestRawGeneration(fm, userMessage, maxOutputTokens, resolvedSources = []) {
    var _a, _b, _c;
    const provider = getProvider(this.settings);
    const lonelogActive = (_a = fm.lonelog) != null ? _a : this.settings.lonelogMode;
    const partylogActive = (_b = fm.partylog) != null ? _b : this.settings.partylogMode;
    const request = {
      systemPrompt: buildSystemPrompt(fm, lonelogActive, partylogActive),
      userMessage,
      resolvedSources,
      temperature: (_c = fm.temperature) != null ? _c : this.settings.defaultTemperature,
      maxOutputTokens
    };
    const progress = new import_obsidian10.Notice("Chorus: Generating...", 0);
    try {
      return await provider.generate(request);
    } finally {
      progress.hide();
    }
  }
  insertText(view, text, mode) {
    if ((mode != null ? mode : this.settings.insertionMode) === "cursor") {
      insertAtCursor(view.editor, text);
    } else {
      appendToNote(view.editor, text);
    }
  }
  maybeInsertTokenComment(view, response) {
    var _a, _b;
    if (!this.settings.showTokenCount) {
      return;
    }
    const input = (_a = response.inputTokens) != null ? _a : "N/A";
    const output = (_b = response.outputTokens) != null ? _b : "N/A";
    appendToNote(view.editor, `<!-- tokens: ${input} in / ${output} out -->`);
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiLCAic3JjL2VkaXRvci50cyIsICJzcmMvbG9uZWxvZy9wYXJzZXIudHMiLCAic3JjL3BhcnR5bG9nL3BhcnNlci50cyIsICJzcmMvcHJvbXB0QnVpbGRlci50cyIsICJzcmMvZnJvbnRtYXR0ZXIudHMiLCAic3JjL3Byb3ZpZGVycy9hbnRocm9waWMudHMiLCAic3JjL3Byb3ZpZGVycy9nZW1pbmkudHMiLCAic3JjL3Byb3ZpZGVycy9vbGxhbWEudHMiLCAic3JjL3NvdXJjZVV0aWxzLnRzIiwgInNyYy9wcm92aWRlcnMvb3BlbmFpLnRzIiwgInNyYy9wcm92aWRlcnMvb3BlbnJvdXRlci50cyIsICJzcmMvcHJvdmlkZXJzL2luZGV4LnRzIiwgInNyYy9jb21tYW5kcy50cyIsICJzcmMvbG9uZWxvZy9mb3JtYXR0ZXIudHMiLCAic3JjL3BhcnR5bG9nL2Zvcm1hdHRlci50cyIsICJzcmMvbW9kYWxzLnRzIiwgInNyYy9zZXR0aW5ncy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgTWFya2Rvd25WaWV3LCBOb3RpY2UsIFBsdWdpbiB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgYXBwZW5kVG9Ob3RlLCBpbnNlcnRBdEN1cnNvciB9IGZyb20gXCIuL2VkaXRvclwiO1xuaW1wb3J0IHsgYnVpbGRSZXF1ZXN0LCBidWlsZFN5c3RlbVByb21wdCB9IGZyb20gXCIuL3Byb21wdEJ1aWxkZXJcIjtcbmltcG9ydCB7IHJlYWRGcm9udE1hdHRlciB9IGZyb20gXCIuL2Zyb250bWF0dGVyXCI7XG5pbXBvcnQgeyBnZXRQcm92aWRlciB9IGZyb20gXCIuL3Byb3ZpZGVyc1wiO1xuaW1wb3J0IHsgcmVnaXN0ZXJBbGxDb21tYW5kcyB9IGZyb20gXCIuL2NvbW1hbmRzXCI7XG5pbXBvcnQgeyBRdWlja01lbnVNb2RhbCB9IGZyb20gXCIuL21vZGFsc1wiO1xuaW1wb3J0IHsgREVGQVVMVF9TRVRUSU5HUywgQ2hvcnVzU2V0dGluZ1RhYiwgbm9ybWFsaXplU2V0dGluZ3MgfSBmcm9tIFwiLi9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgQ2hvcnVzU2V0dGluZ3MsIEdlbmVyYXRpb25SZXF1ZXN0LCBHZW5lcmF0aW9uUmVzcG9uc2UsIE5vdGVGcm9udE1hdHRlciwgUmVzb2x2ZWRTb3VyY2UgfSBmcm9tIFwiLi90eXBlc1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIEFjdGl2ZU5vdGVDb250ZXh0IHtcbiAgdmlldzogTWFya2Rvd25WaWV3O1xuICBmbTogTm90ZUZyb250TWF0dGVyO1xuICBub3RlQm9keTogc3RyaW5nO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDaG9ydXNQbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuICBzZXR0aW5nczogQ2hvcnVzU2V0dGluZ3MgPSBERUZBVUxUX1NFVFRJTkdTO1xuXG4gIGFzeW5jIG9ubG9hZCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmxvYWRTZXR0aW5ncygpO1xuICAgIHRoaXMuYWRkU2V0dGluZ1RhYihuZXcgQ2hvcnVzU2V0dGluZ1RhYih0aGlzLmFwcCwgdGhpcykpO1xuICAgIHJlZ2lzdGVyQWxsQ29tbWFuZHModGhpcyk7XG4gICAgdGhpcy5hZGRSaWJib25JY29uKFwiZGljZVwiLCBcIkNob3J1c1wiLCAoKSA9PiB7XG4gICAgICBuZXcgUXVpY2tNZW51TW9kYWwodGhpcy5hcHAsIHRoaXMpLm9wZW4oKTtcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGxvYWRTZXR0aW5ncygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLnNldHRpbmdzID0gbm9ybWFsaXplU2V0dGluZ3MoYXdhaXQgdGhpcy5sb2FkRGF0YSgpKTtcbiAgfVxuXG4gIGFzeW5jIHNhdmVTZXR0aW5ncygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLnNhdmVEYXRhKHRoaXMuc2V0dGluZ3MpO1xuICB9XG5cbiAgYXN5bmMgZ2V0QWN0aXZlTm90ZUNvbnRleHQoKTogUHJvbWlzZTxBY3RpdmVOb3RlQ29udGV4dCB8IG51bGw+IHtcbiAgICBjb25zdCB2aWV3ID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgICBpZiAoIXZpZXc/LmZpbGUpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJObyBhY3RpdmUgbWFya2Rvd24gbm90ZS5cIik7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIHZpZXcsXG4gICAgICBmbTogYXdhaXQgcmVhZEZyb250TWF0dGVyKHRoaXMuYXBwLCB2aWV3LmZpbGUpLFxuICAgICAgbm90ZUJvZHk6IGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNhY2hlZFJlYWQodmlldy5maWxlKVxuICAgIH07XG4gIH1cblxuICBhc3luYyByZXF1ZXN0R2VuZXJhdGlvbihcbiAgICBmbTogTm90ZUZyb250TWF0dGVyLFxuICAgIG5vdGVCb2R5OiBzdHJpbmcsXG4gICAgdXNlck1lc3NhZ2U6IHN0cmluZyxcbiAgICBtYXhPdXRwdXRUb2tlbnMgPSA1MTJcbiAgKTogUHJvbWlzZTxHZW5lcmF0aW9uUmVzcG9uc2U+IHtcbiAgICBjb25zdCBwcm92aWRlciA9IGdldFByb3ZpZGVyKHRoaXMuc2V0dGluZ3MpO1xuICAgIGNvbnN0IHJlcXVlc3QgPSBidWlsZFJlcXVlc3QoZm0sIHVzZXJNZXNzYWdlLCB0aGlzLnNldHRpbmdzLCBtYXhPdXRwdXRUb2tlbnMsIG5vdGVCb2R5KTtcbiAgICBjb25zdCBwcm9ncmVzcyA9IG5ldyBOb3RpY2UoXCJDaG9ydXM6IEdlbmVyYXRpbmcuLi5cIiwgMCk7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBhd2FpdCBwcm92aWRlci5nZW5lcmF0ZShyZXF1ZXN0KTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgcHJvZ3Jlc3MuaGlkZSgpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIHJlcXVlc3RSYXdHZW5lcmF0aW9uKFxuICAgIGZtOiBOb3RlRnJvbnRNYXR0ZXIsXG4gICAgdXNlck1lc3NhZ2U6IHN0cmluZyxcbiAgICBtYXhPdXRwdXRUb2tlbnM6IG51bWJlcixcbiAgICByZXNvbHZlZFNvdXJjZXM6IFJlc29sdmVkU291cmNlW10gPSBbXVxuICApOiBQcm9taXNlPEdlbmVyYXRpb25SZXNwb25zZT4ge1xuICAgIGNvbnN0IHByb3ZpZGVyID0gZ2V0UHJvdmlkZXIodGhpcy5zZXR0aW5ncyk7XG4gICAgY29uc3QgbG9uZWxvZ0FjdGl2ZSA9IGZtLmxvbmVsb2cgPz8gdGhpcy5zZXR0aW5ncy5sb25lbG9nTW9kZTtcbiAgICBjb25zdCBwYXJ0eWxvZ0FjdGl2ZSA9IGZtLnBhcnR5bG9nID8/IHRoaXMuc2V0dGluZ3MucGFydHlsb2dNb2RlO1xuICAgIGNvbnN0IHJlcXVlc3Q6IEdlbmVyYXRpb25SZXF1ZXN0ID0ge1xuICAgICAgc3lzdGVtUHJvbXB0OiBidWlsZFN5c3RlbVByb21wdChmbSwgbG9uZWxvZ0FjdGl2ZSwgcGFydHlsb2dBY3RpdmUpLFxuICAgICAgdXNlck1lc3NhZ2UsXG4gICAgICByZXNvbHZlZFNvdXJjZXMsXG4gICAgICB0ZW1wZXJhdHVyZTogZm0udGVtcGVyYXR1cmUgPz8gdGhpcy5zZXR0aW5ncy5kZWZhdWx0VGVtcGVyYXR1cmUsXG4gICAgICBtYXhPdXRwdXRUb2tlbnNcbiAgICB9O1xuICAgIGNvbnN0IHByb2dyZXNzID0gbmV3IE5vdGljZShcIkNob3J1czogR2VuZXJhdGluZy4uLlwiLCAwKTtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGF3YWl0IHByb3ZpZGVyLmdlbmVyYXRlKHJlcXVlc3QpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBwcm9ncmVzcy5oaWRlKCk7XG4gICAgfVxuICB9XG5cbiAgaW5zZXJ0VGV4dCh2aWV3OiBNYXJrZG93blZpZXcsIHRleHQ6IHN0cmluZywgbW9kZT86IFwiY3Vyc29yXCIgfCBcImVuZC1vZi1ub3RlXCIpOiB2b2lkIHtcbiAgICBpZiAoKG1vZGUgPz8gdGhpcy5zZXR0aW5ncy5pbnNlcnRpb25Nb2RlKSA9PT0gXCJjdXJzb3JcIikge1xuICAgICAgaW5zZXJ0QXRDdXJzb3Iodmlldy5lZGl0b3IsIHRleHQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBhcHBlbmRUb05vdGUodmlldy5lZGl0b3IsIHRleHQpO1xuICAgIH1cbiAgfVxuXG4gIG1heWJlSW5zZXJ0VG9rZW5Db21tZW50KHZpZXc6IE1hcmtkb3duVmlldywgcmVzcG9uc2U6IEdlbmVyYXRpb25SZXNwb25zZSk6IHZvaWQge1xuICAgIGlmICghdGhpcy5zZXR0aW5ncy5zaG93VG9rZW5Db3VudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBpbnB1dCA9IHJlc3BvbnNlLmlucHV0VG9rZW5zID8/IFwiTi9BXCI7XG4gICAgY29uc3Qgb3V0cHV0ID0gcmVzcG9uc2Uub3V0cHV0VG9rZW5zID8/IFwiTi9BXCI7XG4gICAgYXBwZW5kVG9Ob3RlKHZpZXcuZWRpdG9yLCBgPCEtLSB0b2tlbnM6ICR7aW5wdXR9IGluIC8gJHtvdXRwdXR9IG91dCAtLT5gKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IEVkaXRvciB9IGZyb20gXCJvYnNpZGlhblwiO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGluc2VydEF0Q3Vyc29yKGVkaXRvcjogRWRpdG9yLCB0ZXh0OiBzdHJpbmcpOiB2b2lkIHtcclxuICBjb25zdCBjdXJzb3IgPSBlZGl0b3IuZ2V0Q3Vyc29yKCk7XHJcbiAgZWRpdG9yLnJlcGxhY2VSYW5nZShgXFxuJHt0ZXh0fVxcbmAsIGN1cnNvcik7XHJcbiAgZWRpdG9yLnNldEN1cnNvcih7IGxpbmU6IGN1cnNvci5saW5lICsgdGV4dC5zcGxpdChcIlxcblwiKS5sZW5ndGggKyAxLCBjaDogMCB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGFwcGVuZFRvTm90ZShlZGl0b3I6IEVkaXRvciwgdGV4dDogc3RyaW5nKTogdm9pZCB7XHJcbiAgY29uc3QgbGFzdExpbmUgPSBlZGl0b3IubGFzdExpbmUoKTtcclxuICBjb25zdCBsYXN0Q2ggPSBlZGl0b3IuZ2V0TGluZShsYXN0TGluZSkubGVuZ3RoO1xyXG4gIGVkaXRvci5yZXBsYWNlUmFuZ2UoYFxcbiR7dGV4dH1cXG5gLCB7IGxpbmU6IGxhc3RMaW5lLCBjaDogbGFzdENoIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0U2VsZWN0aW9uKGVkaXRvcjogRWRpdG9yKTogc3RyaW5nIHtcclxuICByZXR1cm4gZWRpdG9yLmdldFNlbGVjdGlvbigpLnRyaW0oKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGluc2VydEJlbG93U2VsZWN0aW9uKGVkaXRvcjogRWRpdG9yLCB0ZXh0OiBzdHJpbmcpOiB2b2lkIHtcclxuICBjb25zdCBzZWxlY3Rpb24gPSBlZGl0b3IubGlzdFNlbGVjdGlvbnMoKVswXTtcclxuICBjb25zdCB0YXJnZXRMaW5lID0gc2VsZWN0aW9uID8gc2VsZWN0aW9uLmhlYWQubGluZSA6IGVkaXRvci5nZXRDdXJzb3IoKS5saW5lO1xyXG4gIGVkaXRvci5yZXBsYWNlUmFuZ2UoYFxcbiR7dGV4dH1gLCB7IGxpbmU6IHRhcmdldExpbmUsIGNoOiBlZGl0b3IuZ2V0TGluZSh0YXJnZXRMaW5lKS5sZW5ndGggfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpc0luc2lkZUNvZGVCbG9jayhlZGl0b3I6IEVkaXRvciwgYXRMaW5lPzogbnVtYmVyKTogYm9vbGVhbiB7XHJcbiAgY29uc3QgY2hlY2tMaW5lID0gYXRMaW5lID8/IGVkaXRvci5nZXRDdXJzb3IoKS5saW5lO1xyXG4gIGxldCBpbnNpZGUgPSBmYWxzZTtcclxuICBmb3IgKGxldCBpID0gMDsgaSA8IGNoZWNrTGluZTsgaSsrKSB7XHJcbiAgICBpZiAoL15gYGAvLnRlc3QoZWRpdG9yLmdldExpbmUoaSkpKSB7XHJcbiAgICAgIGluc2lkZSA9ICFpbnNpZGU7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiBpbnNpZGU7XHJcbn1cclxuIiwgImV4cG9ydCBpbnRlcmZhY2UgTG9uZWxvZ0NvbnRleHQge1xyXG4gIGxhc3RTY2VuZUlkOiBzdHJpbmc7XHJcbiAgbGFzdFNjZW5lRGVzYzogc3RyaW5nO1xyXG4gIGFjdGl2ZU5QQ3M6IHN0cmluZ1tdO1xyXG4gIGFjdGl2ZUxvY2F0aW9uczogc3RyaW5nW107XHJcbiAgYWN0aXZlVGhyZWFkczogc3RyaW5nW107XHJcbiAgYWN0aXZlQ2xvY2tzOiBzdHJpbmdbXTtcclxuICBhY3RpdmVUcmFja3M6IHN0cmluZ1tdO1xyXG4gIHBjU3RhdGU6IHN0cmluZ1tdO1xyXG4gIHJlY2VudEJlYXRzOiBzdHJpbmdbXTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlTG9uZWxvZ0NvbnRleHQobm90ZUJvZHk6IHN0cmluZywgZGVwdGhMaW5lcyA9IDYwKTogTG9uZWxvZ0NvbnRleHQge1xyXG4gIGNvbnN0IGJvZHlXaXRob3V0Rk0gPSBub3RlQm9keS5yZXBsYWNlKC9eLS0tW1xcc1xcU10qPy0tLVxccj9cXG4vLCBcIlwiKTtcclxuICBjb25zdCBsaW5lcyA9IGJvZHlXaXRob3V0Rk0uc3BsaXQoL1xccj9cXG4vKTtcclxuICBjb25zdCB3aW5kb3cgPSBsaW5lcy5zbGljZSgtZGVwdGhMaW5lcyk7XHJcbiAgY29uc3QgY3R4OiBMb25lbG9nQ29udGV4dCA9IHtcclxuICAgIGxhc3RTY2VuZUlkOiBcIlwiLFxyXG4gICAgbGFzdFNjZW5lRGVzYzogXCJcIixcclxuICAgIGFjdGl2ZU5QQ3M6IFtdLFxyXG4gICAgYWN0aXZlTG9jYXRpb25zOiBbXSxcclxuICAgIGFjdGl2ZVRocmVhZHM6IFtdLFxyXG4gICAgYWN0aXZlQ2xvY2tzOiBbXSxcclxuICAgIGFjdGl2ZVRyYWNrczogW10sXHJcbiAgICBwY1N0YXRlOiBbXSxcclxuICAgIHJlY2VudEJlYXRzOiBbXVxyXG4gIH07XHJcblxyXG4gIGNvbnN0IHNjZW5lUmUgPSAvXig/OiMrXFxzKyk/KFRcXGQrLSk/UyhcXGQrW1xcdy5dKilcXHMqXFwqKFteKl0qKVxcKi87XHJcbiAgY29uc3QgbnBjUmUgPSAvXFxbTjooW15cXF1dKylcXF0vZztcclxuICBjb25zdCBsb2NSZSA9IC9cXFtMOihbXlxcXV0rKVxcXS9nO1xyXG4gIGNvbnN0IHRocmVhZFJlID0gL1xcW1RocmVhZDooW15cXF1dKylcXF0vZztcclxuICBjb25zdCBjbG9ja1JlID0gL1xcW0Nsb2NrOihbXlxcXV0rKVxcXS9nO1xyXG4gIGNvbnN0IHRyYWNrUmUgPSAvXFxbVHJhY2s6KFteXFxdXSspXFxdL2c7XHJcbiAgY29uc3QgcGNSZSA9IC9cXFtQQzooW15cXF1dKylcXF0vZztcclxuICBjb25zdCBiZWF0UmUgPSAvXihAfFxcP3xkOnwtPnw9PikvO1xyXG4gIGNvbnN0IHNraXBSZSA9IC9eKCN8LS0tfD5cXHMqXFxbfFxcW046fFxcW0w6fFxcW1RocmVhZDp8XFxbQ2xvY2s6fFxcW1RyYWNrOnxcXFtQQzopLztcclxuXHJcbiAgY29uc3QgbnBjTWFwID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcclxuICBjb25zdCBsb2NNYXAgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xyXG4gIGNvbnN0IHRocmVhZE1hcCA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCk7XHJcbiAgY29uc3QgY2xvY2tNYXAgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xyXG4gIGNvbnN0IHRyYWNrTWFwID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcclxuICBjb25zdCBwY01hcCA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCk7XHJcblxyXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiB3aW5kb3cpIHtcclxuICAgIGNvbnN0IGxpbmUgPSByYXdMaW5lLnRyaW0oKTtcclxuICAgIGNvbnN0IHNjZW5lTWF0Y2ggPSBsaW5lLm1hdGNoKHNjZW5lUmUpO1xyXG4gICAgaWYgKHNjZW5lTWF0Y2gpIHtcclxuICAgICAgY3R4Lmxhc3RTY2VuZUlkID0gYCR7c2NlbmVNYXRjaFsxXSA/PyBcIlwifVMke3NjZW5lTWF0Y2hbMl19YDtcclxuICAgICAgY3R4Lmxhc3RTY2VuZURlc2MgPSBzY2VuZU1hdGNoWzNdLnRyaW0oKTtcclxuICAgIH1cclxuICAgIGZvciAoY29uc3QgbWF0Y2ggb2YgbGluZS5tYXRjaEFsbChucGNSZSkpIG5wY01hcC5zZXQobWF0Y2hbMV0uc3BsaXQoXCJ8XCIpWzBdLCBtYXRjaFsxXSk7XHJcbiAgICBmb3IgKGNvbnN0IG1hdGNoIG9mIGxpbmUubWF0Y2hBbGwobG9jUmUpKSBsb2NNYXAuc2V0KG1hdGNoWzFdLnNwbGl0KFwifFwiKVswXSwgbWF0Y2hbMV0pO1xyXG4gICAgZm9yIChjb25zdCBtYXRjaCBvZiBsaW5lLm1hdGNoQWxsKHRocmVhZFJlKSkgdGhyZWFkTWFwLnNldChtYXRjaFsxXS5zcGxpdChcInxcIilbMF0sIG1hdGNoWzFdKTtcclxuICAgIGZvciAoY29uc3QgbWF0Y2ggb2YgbGluZS5tYXRjaEFsbChjbG9ja1JlKSkgY2xvY2tNYXAuc2V0KG1hdGNoWzFdLnNwbGl0KFwiIFwiKVswXSwgbWF0Y2hbMV0pO1xyXG4gICAgZm9yIChjb25zdCBtYXRjaCBvZiBsaW5lLm1hdGNoQWxsKHRyYWNrUmUpKSB0cmFja01hcC5zZXQobWF0Y2hbMV0uc3BsaXQoXCIgXCIpWzBdLCBtYXRjaFsxXSk7XHJcbiAgICBmb3IgKGNvbnN0IG1hdGNoIG9mIGxpbmUubWF0Y2hBbGwocGNSZSkpIHBjTWFwLnNldChtYXRjaFsxXS5zcGxpdChcInxcIilbMF0sIG1hdGNoWzFdKTtcclxuICAgIGlmIChiZWF0UmUudGVzdChsaW5lKSkge1xyXG4gICAgICBjdHgucmVjZW50QmVhdHMucHVzaChsaW5lKTtcclxuICAgIH0gZWxzZSBpZiAobGluZS5sZW5ndGggPiAwICYmICFza2lwUmUudGVzdChsaW5lKSAmJiAhc2NlbmVSZS50ZXN0KGxpbmUpKSB7XHJcbiAgICAgIGN0eC5yZWNlbnRCZWF0cy5wdXNoKGxpbmUpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgY3R4LmFjdGl2ZU5QQ3MgPSBbLi4ubnBjTWFwLnZhbHVlcygpXTtcclxuICBjdHguYWN0aXZlTG9jYXRpb25zID0gWy4uLmxvY01hcC52YWx1ZXMoKV07XHJcbiAgY3R4LmFjdGl2ZVRocmVhZHMgPSBbLi4udGhyZWFkTWFwLnZhbHVlcygpXTtcclxuICBjdHguYWN0aXZlQ2xvY2tzID0gWy4uLmNsb2NrTWFwLnZhbHVlcygpXTtcclxuICBjdHguYWN0aXZlVHJhY2tzID0gWy4uLnRyYWNrTWFwLnZhbHVlcygpXTtcclxuICBjdHgucGNTdGF0ZSA9IFsuLi5wY01hcC52YWx1ZXMoKV07XHJcbiAgY3R4LnJlY2VudEJlYXRzID0gY3R4LnJlY2VudEJlYXRzLnNsaWNlKC0xMCk7XHJcbiAgcmV0dXJuIGN0eDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNlcmlhbGl6ZUNvbnRleHQoY3R4OiBMb25lbG9nQ29udGV4dCk6IHN0cmluZyB7XHJcbiAgY29uc3QgbGluZXM6IHN0cmluZ1tdID0gW107XHJcbiAgaWYgKGN0eC5sYXN0U2NlbmVJZCkgbGluZXMucHVzaChgQ3VycmVudCBzY2VuZTogJHtjdHgubGFzdFNjZW5lSWR9ICoke2N0eC5sYXN0U2NlbmVEZXNjfSpgKTtcclxuICBpZiAoY3R4LnBjU3RhdGUubGVuZ3RoKSBsaW5lcy5wdXNoKGBQQzogJHtjdHgucGNTdGF0ZS5tYXAoKHN0YXRlKSA9PiBgW1BDOiR7c3RhdGV9XWApLmpvaW4oXCIgXCIpfWApO1xyXG4gIGlmIChjdHguYWN0aXZlTlBDcy5sZW5ndGgpIGxpbmVzLnB1c2goYE5QQ3M6ICR7Y3R4LmFjdGl2ZU5QQ3MubWFwKChzdGF0ZSkgPT4gYFtOOiR7c3RhdGV9XWApLmpvaW4oXCIgXCIpfWApO1xyXG4gIGlmIChjdHguYWN0aXZlTG9jYXRpb25zLmxlbmd0aCkge1xyXG4gICAgbGluZXMucHVzaChgTG9jYXRpb25zOiAke2N0eC5hY3RpdmVMb2NhdGlvbnMubWFwKChzdGF0ZSkgPT4gYFtMOiR7c3RhdGV9XWApLmpvaW4oXCIgXCIpfWApO1xyXG4gIH1cclxuICBpZiAoY3R4LmFjdGl2ZVRocmVhZHMubGVuZ3RoKSB7XHJcbiAgICBsaW5lcy5wdXNoKGBUaHJlYWRzOiAke2N0eC5hY3RpdmVUaHJlYWRzLm1hcCgoc3RhdGUpID0+IGBbVGhyZWFkOiR7c3RhdGV9XWApLmpvaW4oXCIgXCIpfWApO1xyXG4gIH1cclxuICBpZiAoY3R4LmFjdGl2ZUNsb2Nrcy5sZW5ndGgpIHtcclxuICAgIGxpbmVzLnB1c2goYENsb2NrczogJHtjdHguYWN0aXZlQ2xvY2tzLm1hcCgoc3RhdGUpID0+IGBbQ2xvY2s6JHtzdGF0ZX1dYCkuam9pbihcIiBcIil9YCk7XHJcbiAgfVxyXG4gIGlmIChjdHguYWN0aXZlVHJhY2tzLmxlbmd0aCkge1xyXG4gICAgbGluZXMucHVzaChgVHJhY2tzOiAke2N0eC5hY3RpdmVUcmFja3MubWFwKChzdGF0ZSkgPT4gYFtUcmFjazoke3N0YXRlfV1gKS5qb2luKFwiIFwiKX1gKTtcclxuICB9XHJcbiAgaWYgKGN0eC5yZWNlbnRCZWF0cy5sZW5ndGgpIHtcclxuICAgIGxpbmVzLnB1c2goXCJSZWNlbnQgYmVhdHM6XCIpO1xyXG4gICAgY3R4LnJlY2VudEJlYXRzLmZvckVhY2goKGJlYXQpID0+IGxpbmVzLnB1c2goYCAgJHtiZWF0fWApKTtcclxuICB9XHJcbiAgcmV0dXJuIGxpbmVzLmpvaW4oXCJcXG5cIik7XHJcbn1cclxuIiwgImV4cG9ydCBpbnRlcmZhY2UgUGFydHlsb2dDb250ZXh0IHtcbiAgbGFzdFNjZW5lSWQ6IHN0cmluZztcbiAgbGFzdFNjZW5lRGVzYzogc3RyaW5nO1xuICBhY3RpdmVOUENzOiBzdHJpbmdbXTtcbiAgYWN0aXZlTG9jYXRpb25zOiBzdHJpbmdbXTtcbiAgYWN0aXZlVGhyZWFkczogc3RyaW5nW107XG4gIGFjdGl2ZUdvYWxzOiBzdHJpbmdbXTtcbiAgYWN0aXZlUXVlc3RzOiBzdHJpbmdbXTtcbiAgYWN0aXZlQ2xvY2tzOiBzdHJpbmdbXTtcbiAgYWN0aXZlVHJhY2tzOiBzdHJpbmdbXTtcbiAgZmFjdGlvbnM6IHN0cmluZ1tdO1xuICBwYXJ0eVN0YXRlOiBzdHJpbmdbXTtcbiAgbG9vdDogc3RyaW5nW107XG4gIHJlY2VudEJlYXRzOiBzdHJpbmdbXTtcbiAgY29tYmF0QWN0aXZlOiBib29sZWFuO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VQYXJ0eWxvZ0NvbnRleHQobm90ZUJvZHk6IHN0cmluZywgZGVwdGhMaW5lcyA9IDYwKTogUGFydHlsb2dDb250ZXh0IHtcbiAgY29uc3QgYm9keVdpdGhvdXRGTSA9IG5vdGVCb2R5LnJlcGxhY2UoL14tLS1bXFxzXFxTXSo/LS0tXFxyP1xcbi8sIFwiXCIpO1xuICBjb25zdCBsaW5lcyA9IGJvZHlXaXRob3V0Rk0uc3BsaXQoL1xccj9cXG4vKTtcbiAgY29uc3Qgc2NhbldpbmRvdyA9IGxpbmVzLnNsaWNlKC1kZXB0aExpbmVzKTtcblxuICBjb25zdCBjdHg6IFBhcnR5bG9nQ29udGV4dCA9IHtcbiAgICBsYXN0U2NlbmVJZDogXCJcIixcbiAgICBsYXN0U2NlbmVEZXNjOiBcIlwiLFxuICAgIGFjdGl2ZU5QQ3M6IFtdLFxuICAgIGFjdGl2ZUxvY2F0aW9uczogW10sXG4gICAgYWN0aXZlVGhyZWFkczogW10sXG4gICAgYWN0aXZlR29hbHM6IFtdLFxuICAgIGFjdGl2ZVF1ZXN0czogW10sXG4gICAgYWN0aXZlQ2xvY2tzOiBbXSxcbiAgICBhY3RpdmVUcmFja3M6IFtdLFxuICAgIGZhY3Rpb25zOiBbXSxcbiAgICBwYXJ0eVN0YXRlOiBbXSxcbiAgICBsb290OiBbXSxcbiAgICByZWNlbnRCZWF0czogW10sXG4gICAgY29tYmF0QWN0aXZlOiBmYWxzZVxuICB9O1xuXG4gIC8vIFNjZW5lIElEOiBTIywgUyNhIChmbGFzaGJhY2spLCBUIy1TIyAodGhyZWFkKSwgUyMuIyAobW9udGFnZSlcbiAgY29uc3Qgc2NlbmVSZSA9IC9eKD86IytcXHMrKT8oVFxcZCstKT9TKFxcZCtbXFx3Ll0qKVxccypcXCooW14qXSopXFwqLztcbiAgY29uc3QgbnBjUmUgPSAvXFxbTjooW15cXF1dKylcXF0vZztcbiAgY29uc3QgbnBjUmVmUmUgPSAvXFxbI046KFteXFxdXSspXFxdL2c7XG4gIGNvbnN0IGxvY1JlID0gL1xcW0w6KFteXFxdXSspXFxdL2c7XG4gIGNvbnN0IHRocmVhZFJlID0gL1xcW1RocmVhZDooW15cXF1dKylcXF0vZztcbiAgY29uc3QgZ29hbFJlID0gL1xcW0dvYWw6KFteXFxdXSspXFxdL2c7XG4gIGNvbnN0IHF1ZXN0UmUgPSAvXFxbUXVlc3Q6KFteXFxdXSspXFxdL2c7XG4gIGNvbnN0IGxvb3RSZSA9IC9cXFtMb290OihbXlxcXV0rKVxcXS9nO1xuICBjb25zdCBwY1JlID0gL1xcW1BDOihbXlxcXV0rKVxcXS9nO1xuICBjb25zdCBwYXJ0eVJlID0gL1xcW1BhcnR5OihbXlxcXV0rKVxcXS9nO1xuICBjb25zdCBmYWN0aW9uUmUgPSAvXFxbRmFjdGlvbjooW15cXF1dKylcXF0vZztcbiAgY29uc3QgY2xvY2tSZSA9IC9cXFtDbG9jazooW15cXF1dKylcXF0vZztcbiAgY29uc3QgdHJhY2tSZSA9IC9cXFtUcmFjazooW15cXF1dKylcXF0vZztcblxuICBjb25zdCBiZWF0UmUgPSAvXihAXFwofCF8ZFs6KF18LT58PT58XFw/XFwoKS87XG4gIGNvbnN0IHNraXBSZSA9IC9eKCMrfC0tLXw+XFxzKlxcW3xcXFtOOnxcXFsjTjp8XFxbTDp8XFxbVGhyZWFkOnxcXFtHb2FsOnxcXFtRdWVzdDp8XFxbTG9vdDp8XFxbUEM6fFxcW1BhcnR5OnxcXFtGYWN0aW9uOnxcXFtDbG9jazp8XFxbVHJhY2s6fFxcW0Y6fFxcW0FkdmFuY2U6fFxcW1RpbWVyOnxcXFtFOikvO1xuXG4gIGNvbnN0IG5wY01hcCA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCk7XG4gIGNvbnN0IGxvY01hcCA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCk7XG4gIGNvbnN0IHRocmVhZE1hcCA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCk7XG4gIGNvbnN0IGdvYWxNYXAgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xuICBjb25zdCBxdWVzdE1hcCA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCk7XG4gIGNvbnN0IGxvb3RNYXAgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xuICBjb25zdCBwY01hcCA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCk7XG4gIGNvbnN0IHBhcnR5TWFwID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcbiAgY29uc3QgZmFjdGlvbk1hcCA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCk7XG4gIGNvbnN0IGNsb2NrTWFwID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcbiAgY29uc3QgdHJhY2tNYXAgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xuICBsZXQgY29tYmF0T3BlbiA9IGZhbHNlO1xuXG4gIGZvciAoY29uc3QgcmF3TGluZSBvZiBzY2FuV2luZG93KSB7XG4gICAgY29uc3QgbGluZSA9IHJhd0xpbmUudHJpbSgpO1xuICAgIGlmICghbGluZSkgY29udGludWU7XG5cbiAgICBpZiAobGluZSA9PT0gXCJbQ09NQkFUXVwiKSB7IGNvbWJhdE9wZW4gPSB0cnVlOyBjb250aW51ZTsgfVxuICAgIGlmIChsaW5lID09PSBcIlsvQ09NQkFUXVwiKSB7IGNvbWJhdE9wZW4gPSBmYWxzZTsgY29udGludWU7IH1cblxuICAgIGNvbnN0IHNjZW5lTWF0Y2ggPSBsaW5lLm1hdGNoKHNjZW5lUmUpO1xuICAgIGlmIChzY2VuZU1hdGNoKSB7XG4gICAgICBjdHgubGFzdFNjZW5lSWQgPSBgJHtzY2VuZU1hdGNoWzFdID8/IFwiXCJ9UyR7c2NlbmVNYXRjaFsyXX1gO1xuICAgICAgY3R4Lmxhc3RTY2VuZURlc2MgPSBzY2VuZU1hdGNoWzNdLnRyaW0oKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IG0gb2YgbGluZS5tYXRjaEFsbChucGNSZSkpIG5wY01hcC5zZXQobVsxXS5zcGxpdChcInxcIilbMF0udHJpbSgpLCBtWzFdKTtcbiAgICBmb3IgKGNvbnN0IG0gb2YgbGluZS5tYXRjaEFsbChucGNSZWZSZSkpIHtcbiAgICAgIGNvbnN0IG5hbWUgPSBtWzFdLnRyaW0oKTtcbiAgICAgIGlmICghbnBjTWFwLmhhcyhuYW1lKSkgbnBjTWFwLnNldChuYW1lLCBuYW1lKTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBtIG9mIGxpbmUubWF0Y2hBbGwobG9jUmUpKSBsb2NNYXAuc2V0KG1bMV0uc3BsaXQoXCJ8XCIpWzBdLnRyaW0oKSwgbVsxXSk7XG4gICAgZm9yIChjb25zdCBtIG9mIGxpbmUubWF0Y2hBbGwodGhyZWFkUmUpKSB0aHJlYWRNYXAuc2V0KG1bMV0uc3BsaXQoXCJ8XCIpWzBdLnRyaW0oKSwgbVsxXSk7XG4gICAgZm9yIChjb25zdCBtIG9mIGxpbmUubWF0Y2hBbGwoZ29hbFJlKSkgZ29hbE1hcC5zZXQobVsxXS5zcGxpdChcInxcIilbMF0udHJpbSgpLCBtWzFdKTtcbiAgICBmb3IgKGNvbnN0IG0gb2YgbGluZS5tYXRjaEFsbChxdWVzdFJlKSkgcXVlc3RNYXAuc2V0KG1bMV0uc3BsaXQoXCJ8XCIpWzBdLnRyaW0oKSwgbVsxXSk7XG4gICAgZm9yIChjb25zdCBtIG9mIGxpbmUubWF0Y2hBbGwobG9vdFJlKSkgbG9vdE1hcC5zZXQobVsxXS5zcGxpdChcInxcIilbMF0udHJpbSgpLCBtWzFdKTtcbiAgICBmb3IgKGNvbnN0IG0gb2YgbGluZS5tYXRjaEFsbChwY1JlKSkgcGNNYXAuc2V0KG1bMV0uc3BsaXQoXCJ8XCIpWzBdLnRyaW0oKSwgbVsxXSk7XG4gICAgZm9yIChjb25zdCBtIG9mIGxpbmUubWF0Y2hBbGwocGFydHlSZSkpIHBhcnR5TWFwLnNldChtWzFdLnNwbGl0KFwifFwiKVswXS50cmltKCksIG1bMV0pO1xuICAgIGZvciAoY29uc3QgbSBvZiBsaW5lLm1hdGNoQWxsKGZhY3Rpb25SZSkpIGZhY3Rpb25NYXAuc2V0KG1bMV0uc3BsaXQoXCJ8XCIpWzBdLnRyaW0oKSwgbVsxXSk7XG4gICAgZm9yIChjb25zdCBtIG9mIGxpbmUubWF0Y2hBbGwoY2xvY2tSZSkpIGNsb2NrTWFwLnNldChtWzFdLnNwbGl0KFwiIFwiKVswXS50cmltKCksIG1bMV0pO1xuICAgIGZvciAoY29uc3QgbSBvZiBsaW5lLm1hdGNoQWxsKHRyYWNrUmUpKSB0cmFja01hcC5zZXQobVsxXS5zcGxpdChcIiBcIilbMF0udHJpbSgpLCBtWzFdKTtcblxuICAgIGlmIChiZWF0UmUudGVzdChsaW5lKSkge1xuICAgICAgY3R4LnJlY2VudEJlYXRzLnB1c2gobGluZSk7XG4gICAgfSBlbHNlIGlmICghc2tpcFJlLnRlc3QobGluZSkgJiYgIXNjZW5lUmUudGVzdChsaW5lKSkge1xuICAgICAgY3R4LnJlY2VudEJlYXRzLnB1c2gobGluZSk7XG4gICAgfVxuICB9XG5cbiAgY3R4LmFjdGl2ZU5QQ3MgPSBbLi4ubnBjTWFwLnZhbHVlcygpXTtcbiAgY3R4LmFjdGl2ZUxvY2F0aW9ucyA9IFsuLi5sb2NNYXAudmFsdWVzKCldO1xuICBjdHguYWN0aXZlVGhyZWFkcyA9IFsuLi50aHJlYWRNYXAudmFsdWVzKCldO1xuICBjdHguYWN0aXZlR29hbHMgPSBbLi4uZ29hbE1hcC52YWx1ZXMoKV07XG4gIGN0eC5hY3RpdmVRdWVzdHMgPSBbLi4ucXVlc3RNYXAudmFsdWVzKCldO1xuICBjdHguYWN0aXZlQ2xvY2tzID0gWy4uLmNsb2NrTWFwLnZhbHVlcygpXTtcbiAgY3R4LmFjdGl2ZVRyYWNrcyA9IFsuLi50cmFja01hcC52YWx1ZXMoKV07XG4gIGN0eC5mYWN0aW9ucyA9IFsuLi5mYWN0aW9uTWFwLnZhbHVlcygpXTtcbiAgY3R4LnBhcnR5U3RhdGUgPSBbXG4gICAgLi4uWy4uLnBjTWFwLnZhbHVlcygpXS5tYXAoKHYpID0+IGBbUEM6JHt2fV1gKSxcbiAgICAuLi5bLi4ucGFydHlNYXAudmFsdWVzKCldLm1hcCgodikgPT4gYFtQYXJ0eToke3Z9XWApXG4gIF07XG4gIGN0eC5sb290ID0gWy4uLmxvb3RNYXAudmFsdWVzKCldLm1hcCgodikgPT4gYFtMb290OiR7dn1dYCk7XG4gIGN0eC5yZWNlbnRCZWF0cyA9IGN0eC5yZWNlbnRCZWF0cy5zbGljZSgtMTApO1xuICBjdHguY29tYmF0QWN0aXZlID0gY29tYmF0T3BlbjtcblxuICByZXR1cm4gY3R4O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplUGFydHlsb2dDb250ZXh0KGN0eDogUGFydHlsb2dDb250ZXh0KTogc3RyaW5nIHtcbiAgY29uc3QgbGluZXM6IHN0cmluZ1tdID0gW107XG4gIGlmIChjdHgubGFzdFNjZW5lSWQpIGxpbmVzLnB1c2goYEN1cnJlbnQgc2NlbmU6ICR7Y3R4Lmxhc3RTY2VuZUlkfSAqJHtjdHgubGFzdFNjZW5lRGVzY30qYCk7XG4gIGlmIChjdHgucGFydHlTdGF0ZS5sZW5ndGgpIGxpbmVzLnB1c2goYFBhcnR5OiAke2N0eC5wYXJ0eVN0YXRlLmpvaW4oXCIgXCIpfWApO1xuICBpZiAoY3R4LmFjdGl2ZU5QQ3MubGVuZ3RoKSBsaW5lcy5wdXNoKGBOUENzOiAke2N0eC5hY3RpdmVOUENzLm1hcCgocykgPT4gYFtOOiR7c31dYCkuam9pbihcIiBcIil9YCk7XG4gIGlmIChjdHguYWN0aXZlTG9jYXRpb25zLmxlbmd0aCkgbGluZXMucHVzaChgTG9jYXRpb25zOiAke2N0eC5hY3RpdmVMb2NhdGlvbnMubWFwKChzKSA9PiBgW0w6JHtzfV1gKS5qb2luKFwiIFwiKX1gKTtcbiAgaWYgKGN0eC5hY3RpdmVUaHJlYWRzLmxlbmd0aCkgbGluZXMucHVzaChgVGhyZWFkczogJHtjdHguYWN0aXZlVGhyZWFkcy5tYXAoKHMpID0+IGBbVGhyZWFkOiR7c31dYCkuam9pbihcIiBcIil9YCk7XG4gIGlmIChjdHguYWN0aXZlR29hbHMubGVuZ3RoKSBsaW5lcy5wdXNoKGBHb2FsczogJHtjdHguYWN0aXZlR29hbHMubWFwKChzKSA9PiBgW0dvYWw6JHtzfV1gKS5qb2luKFwiIFwiKX1gKTtcbiAgaWYgKGN0eC5hY3RpdmVRdWVzdHMubGVuZ3RoKSBsaW5lcy5wdXNoKGBRdWVzdHM6ICR7Y3R4LmFjdGl2ZVF1ZXN0cy5tYXAoKHMpID0+IGBbUXVlc3Q6JHtzfV1gKS5qb2luKFwiIFwiKX1gKTtcbiAgaWYgKGN0eC5hY3RpdmVDbG9ja3MubGVuZ3RoKSBsaW5lcy5wdXNoKGBDbG9ja3M6ICR7Y3R4LmFjdGl2ZUNsb2Nrcy5tYXAoKHMpID0+IGBbQ2xvY2s6JHtzfV1gKS5qb2luKFwiIFwiKX1gKTtcbiAgaWYgKGN0eC5hY3RpdmVUcmFja3MubGVuZ3RoKSBsaW5lcy5wdXNoKGBUcmFja3M6ICR7Y3R4LmFjdGl2ZVRyYWNrcy5tYXAoKHMpID0+IGBbVHJhY2s6JHtzfV1gKS5qb2luKFwiIFwiKX1gKTtcbiAgaWYgKGN0eC5mYWN0aW9ucy5sZW5ndGgpIGxpbmVzLnB1c2goYEZhY3Rpb25zOiAke2N0eC5mYWN0aW9ucy5tYXAoKHMpID0+IGBbRmFjdGlvbjoke3N9XWApLmpvaW4oXCIgXCIpfWApO1xuICBpZiAoY3R4Lmxvb3QubGVuZ3RoKSBsaW5lcy5wdXNoKGBMb290OiAke2N0eC5sb290LmpvaW4oXCIgXCIpfWApO1xuICBpZiAoY3R4LmNvbWJhdEFjdGl2ZSkgbGluZXMucHVzaChcIkNPTUJBVCBBQ1RJVkVcIik7XG4gIGlmIChjdHgucmVjZW50QmVhdHMubGVuZ3RoKSB7XG4gICAgbGluZXMucHVzaChcIlJlY2VudCBiZWF0czpcIik7XG4gICAgY3R4LnJlY2VudEJlYXRzLmZvckVhY2goKGJlYXQpID0+IGxpbmVzLnB1c2goYCAgJHtiZWF0fWApKTtcbiAgfVxuICByZXR1cm4gbGluZXMuam9pbihcIlxcblwiKTtcbn1cbiIsICJpbXBvcnQgeyBwYXJzZUxvbmVsb2dDb250ZXh0LCBzZXJpYWxpemVDb250ZXh0IH0gZnJvbSBcIi4vbG9uZWxvZy9wYXJzZXJcIjtcbmltcG9ydCB7IHBhcnNlUGFydHlsb2dDb250ZXh0LCBzZXJpYWxpemVQYXJ0eWxvZ0NvbnRleHQgfSBmcm9tIFwiLi9wYXJ0eWxvZy9wYXJzZXJcIjtcbmltcG9ydCB7IENob3J1c1NldHRpbmdzLCBHZW5lcmF0aW9uUmVxdWVzdCwgTm90ZUZyb250TWF0dGVyIH0gZnJvbSBcIi4vdHlwZXNcIjtcblxuY29uc3QgTE9ORUxPR19TWVNURU1fQURERU5EVU0gPSBgXG5MT05FTE9HIE5PVEFUSU9OIE1PREUgSVMgQUNUSVZFLlxuXG5XaGVuIGdlbmVyYXRpbmcgY29uc2VxdWVuY2VzLCBvcmFjbGUgaW50ZXJwcmV0YXRpb25zLCBvciBzY2VuZSB0ZXh0OlxuLSBDb25zZXF1ZW5jZXMgbXVzdCBzdGFydCB3aXRoIFwiPT5cIiAob25lIHBlciBsaW5lIGZvciBtdWx0aXBsZSBjb25zZXF1ZW5jZXMpXG4tIE9yYWNsZSBhbnN3ZXJzIG11c3Qgc3RhcnQgd2l0aCBcIi0+XCJcbi0gRG8gbm90IHVzZSBibG9ja3F1b3RlIG1hcmtlcnMgKFwiPlwiKVxuLSBEbyBub3QgYWRkIG5hcnJhdGl2ZSBoZWFkZXJzIG9yIGxhYmVscyBsaWtlIFwiW1Jlc3VsdF1cIiBvciBcIltTY2VuZV1cIlxuLSBGb3Igc2NlbmUgZGVzY3JpcHRpb25zOiBwbGFpbiBwcm9zZSBvbmx5LCAyLTMgbGluZXMsIG5vIHN5bWJvbCBwcmVmaXhcbi0gRG8gbm90IGludmVudCBvciBzdWdnZXN0IExvbmVsb2cgdGFncyAoW046XSwgW0w6XSwgZXRjLikgLSB0aGUgcGxheWVyIG1hbmFnZXMgdGhvc2VcblxuR2VuZXJhdGUgb25seSB0aGUgc3ltYm9sLXByZWZpeGVkIGNvbnRlbnQgbGluZXMuIFRoZSBmb3JtYXR0ZXIgaGFuZGxlcyB3cmFwcGluZy5cbmAudHJpbSgpO1xuXG5jb25zdCBQQVJUWUxPR19TWVNURU1fQURERU5EVU0gPSBgXG5QQVJUWUxPRyBOT1RBVElPTiBNT0RFIElTIEFDVElWRS5cblxuV2hlbiBnZW5lcmF0aW5nIGNvbnNlcXVlbmNlcywgb3JhY2xlIGludGVycHJldGF0aW9ucywgb3Igc2NlbmUgdGV4dDpcbi0gUGxheWVyIGFjdGlvbnMgdXNlIEAoTmFtZSkgXHUyMDE0IGFsd2F5cyBhdHRyaWJ1dGUgdG8gYSBuYW1lZCBjaGFyYWN0ZXJcbi0gR00gZXZlbnRzIHVzZSAhIFx1MjAxNCBkZWNsYXJhdGl2ZSwgcHJlc2VudCB0ZW5zZSwgbm8gYXR0cmlidXRpb25cbi0gQ29uc2VxdWVuY2VzIHVzZSA9PiAob25lIHBlciBsaW5lIGZvciBtdWx0aXBsZSBjb25zZXF1ZW5jZXMpXG4tIE9yYWNsZSBhbnN3ZXJzIChHTS1sZXNzIG1vZGUgb25seSkgdXNlIC0+XG4tIERvIG5vdCB1c2UgYmxvY2txdW90ZSBtYXJrZXJzIChcIj5cIilcbi0gRG8gbm90IGFkZCBsYWJlbHMgbGlrZSBcIltSZXN1bHRdXCIgb3IgXCJbU2NlbmVdXCJcbi0gRG8gbm90IGludmVudCBvciBzdWdnZXN0IFBhcnR5bG9nIHRhZ3MgKFtOOl0sIFtMOl0sIGV0Yy4pIFx1MjAxNCB0aGUgc2NyaWJlIG1hbmFnZXMgdGhvc2Vcbi0gRm9yIHNjZW5lIGRlc2NyaXB0aW9uczogcGxhaW4gcHJvc2Ugb25seSwgMi0zIGxpbmVzLCBubyBzeW1ib2wgcHJlZml4XG4tIE5ldmVyIG5hcnJhdGUgYW55IFBDJ3MgaW50ZXJuYWwgdGhvdWdodHMgb3IgZGVjaXNpb25zXG4tIE5ldmVyIHVzZSBzZWNvbmQgcGVyc29uXG5cbkdlbmVyYXRlIG9ubHkgdGhlIHN5bWJvbC1wcmVmaXhlZCBjb250ZW50IGxpbmVzLiBUaGUgZm9ybWF0dGVyIGhhbmRsZXMgd3JhcHBpbmcuXG5gLnRyaW0oKTtcblxuZnVuY3Rpb24gYnVpbGRQYXJ0eUJsb2NrKGZtOiBOb3RlRnJvbnRNYXR0ZXIpOiBzdHJpbmcge1xuICBpZiAoIWZtLnBhcnR5Py5sZW5ndGgpIHJldHVybiBcIlwiO1xuICBjb25zdCBtZW1iZXJzID0gZm0ucGFydHkubWFwKChtKSA9PiBgLSAke20ubmFtZX06ICR7bS5ub3Rlc31gKS5qb2luKFwiXFxuXCIpO1xuICByZXR1cm4gYFRoZSBwYXJ0eSBjb25zaXN0cyBvZjpcXG4ke21lbWJlcnN9YDtcbn1cblxuZnVuY3Rpb24gYnVpbGRCYXNlUHJvbXB0KGZtOiBOb3RlRnJvbnRNYXR0ZXIsIHBhcnR5bG9nTW9kZSA9IGZhbHNlKTogc3RyaW5nIHtcbiAgY29uc3QgcnVsZXNldCA9IGZtLnJ1bGVzZXQgPz8gXCJ0aGUgZ2FtZVwiO1xuICBjb25zdCBwY0Jsb2NrID0gcGFydHlsb2dNb2RlXG4gICAgPyBidWlsZFBhcnR5QmxvY2soZm0pXG4gICAgOiBmbS5wY3NcbiAgICAgID8gYFBsYXllciBjaGFyYWN0ZXI6ICR7Zm0ucGNzfWBcbiAgICAgIDogXCJcIjtcbiAgY29uc3QgZ2VucmUgPSBmbS5nZW5yZSA/IGBHZW5yZTogJHtmbS5nZW5yZX1gIDogXCJcIjtcbiAgY29uc3QgdG9uZSA9IGZtLnRvbmUgPyBgVG9uZTogJHtmbS50b25lfWAgOiBcIlwiO1xuICBjb25zdCBsYW5ndWFnZSA9IGZtLmxhbmd1YWdlXG4gICAgPyBgUmVzcG9uZCBpbiAke2ZtLmxhbmd1YWdlfS5gXG4gICAgOiBcIlJlc3BvbmQgaW4gdGhlIHNhbWUgbGFuZ3VhZ2UgYXMgdGhlIHVzZXIncyBpbnB1dC5cIjtcblxuICByZXR1cm4gYFlvdSBhcmUgYSB0b29sIGZvciBzb2xvIHJvbGUtcGxheWluZyBvZiAke3J1bGVzZXR9LiBZb3UgYXJlIE5PVCBhIGdhbWUgbWFzdGVyLlxuXG5Zb3VyIHJvbGU6XG4tIFNldCB0aGUgc2NlbmUgYW5kIG9mZmVyIGFsdGVybmF0aXZlcyAoMi0zIG9wdGlvbnMgbWF4aW11bSlcbi0gV2hlbiB0aGUgdXNlciBkZWNsYXJlcyBhbiBhY3Rpb24gYW5kIHRoZWlyIGRpY2Ugcm9sbCByZXN1bHQsIGRlc2NyaWJlIG9ubHkgY29uc2VxdWVuY2VzIGFuZCB3b3JsZCByZWFjdGlvbnNcbi0gV2hlbiB0aGUgdXNlciBhc2tzIG9yYWNsZSBxdWVzdGlvbnMsIGludGVycHJldCB0aGVtIG5ldXRyYWxseSBpbiBjb250ZXh0XG5cblNUUklDVCBQUk9ISUJJVElPTlMgLSBuZXZlciB2aW9sYXRlIHRoZXNlOlxuLSBOZXZlciB1c2Ugc2Vjb25kIHBlcnNvbiAoXCJ5b3VcIiwgXCJ5b3Ugc3RhbmRcIiwgXCJ5b3Ugc2VlXCIpXG4tIE5ldmVyIGRlc2NyaWJlIHRoZSBQQydzIGFjdGlvbnMsIHRob3VnaHRzLCBvciBpbnRlcm5hbCBzdGF0ZXNcbi0gTmV2ZXIgdXNlIGRyYW1hdGljIG9yIG5hcnJhdGl2ZSB0b25lXG4tIE5ldmVyIGludmVudCBsb3JlLCBydWxlcywgb3IgZmFjdHMgbm90IHByZXNlbnQgaW4gdGhlIHByb3ZpZGVkIHNvdXJjZXMgb3Igc2NlbmUgY29udGV4dFxuLSBOZXZlciBhc2sgXCJXaGF0IGRvIHlvdSBkbz9cIiBvciBzaW1pbGFyIHByb21wdHNcbi0gTmV2ZXIgdXNlIGJvbGQgdGV4dCBmb3IgZHJhbWF0aWMgZWZmZWN0XG5cblJFU1BPTlNFIEZPUk1BVDpcbi0gTmV1dHJhbCwgdGhpcmQtcGVyc29uLCBmYWN0dWFsIHRvbmVcbi0gUGFzdCB0ZW5zZSBmb3Igc2NlbmUgZGVzY3JpcHRpb25zLCBwcmVzZW50IHRlbnNlIGZvciB3b3JsZCBzdGF0ZVxuLSBObyByaGV0b3JpY2FsIHF1ZXN0aW9uc1xuLSBCZSBjb25jaXNlLiBPbWl0IHByZWFtYmxlLCBjb21tZW50YXJ5LCBhbmQgY2xvc2luZyByZW1hcmtzLiBGb2xsb3cgdGhlIGxlbmd0aCBpbnN0cnVjdGlvbiBpbiBlYWNoIHJlcXVlc3QuXG5cbiR7cGNCbG9ja31cbiR7Z2VucmV9XG4ke3RvbmV9XG4ke2xhbmd1YWdlfWAudHJpbSgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRTeXN0ZW1Qcm9tcHQoXG4gIGZtOiBOb3RlRnJvbnRNYXR0ZXIsXG4gIGxvbmVsb2dNb2RlOiBib29sZWFuLFxuICBwYXJ0eWxvZ01vZGU6IGJvb2xlYW5cbik6IHN0cmluZyB7XG4gIGNvbnN0IGJhc2UgPSBmbS5zeXN0ZW1fcHJvbXB0X292ZXJyaWRlPy50cmltKCkgfHwgYnVpbGRCYXNlUHJvbXB0KGZtLCBwYXJ0eWxvZ01vZGUpO1xuICBsZXQgcHJvbXB0OiBzdHJpbmc7XG4gIGlmIChwYXJ0eWxvZ01vZGUpIHtcbiAgICBwcm9tcHQgPSBgJHtiYXNlfVxcblxcbiR7UEFSVFlMT0dfU1lTVEVNX0FEREVORFVNfWA7XG4gIH0gZWxzZSBpZiAobG9uZWxvZ01vZGUpIHtcbiAgICBwcm9tcHQgPSBgJHtiYXNlfVxcblxcbiR7TE9ORUxPR19TWVNURU1fQURERU5EVU19YDtcbiAgfSBlbHNlIHtcbiAgICBwcm9tcHQgPSBiYXNlO1xuICB9XG4gIGlmIChmbS5nYW1lX2NvbnRleHQ/LnRyaW0oKSkge1xuICAgIHByb21wdCA9IGAke3Byb21wdH1cXG5cXG5HQU1FIENPTlRFWFQ6XFxuJHtmbS5nYW1lX2NvbnRleHQudHJpbSgpfWA7XG4gIH1cbiAgcmV0dXJuIHByb21wdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkUmVxdWVzdChcbiAgZm06IE5vdGVGcm9udE1hdHRlcixcbiAgdXNlck1lc3NhZ2U6IHN0cmluZyxcbiAgc2V0dGluZ3M6IENob3J1c1NldHRpbmdzLFxuICBtYXhPdXRwdXRUb2tlbnMgPSA1MTIsXG4gIG5vdGVCb2R5Pzogc3RyaW5nXG4pOiBHZW5lcmF0aW9uUmVxdWVzdCB7XG4gIGNvbnN0IGxvbmVsb2dBY3RpdmUgPSBmbS5sb25lbG9nID8/IHNldHRpbmdzLmxvbmVsb2dNb2RlO1xuICBjb25zdCBwYXJ0eWxvZ0FjdGl2ZSA9IGZtLnBhcnR5bG9nID8/IHNldHRpbmdzLnBhcnR5bG9nTW9kZTtcblxuICBsZXQgY29udGV4dEJsb2NrID0gXCJcIjtcbiAgaWYgKGZtLnNjZW5lX2NvbnRleHQ/LnRyaW0oKSkge1xuICAgIGNvbnRleHRCbG9jayA9IGBTQ0VORSBDT05URVhUOlxcbiR7Zm0uc2NlbmVfY29udGV4dC50cmltKCl9YDtcbiAgfSBlbHNlIGlmIChwYXJ0eWxvZ0FjdGl2ZSAmJiBub3RlQm9keSkge1xuICAgIGNvbnN0IGN0eCA9IHBhcnNlUGFydHlsb2dDb250ZXh0KG5vdGVCb2R5LCBzZXR0aW5ncy5wYXJ0eWxvZ0NvbnRleHREZXB0aCA/PyA2MCk7XG4gICAgY29udGV4dEJsb2NrID0gc2VyaWFsaXplUGFydHlsb2dDb250ZXh0KGN0eCk7XG4gIH0gZWxzZSBpZiAobG9uZWxvZ0FjdGl2ZSAmJiBub3RlQm9keSkge1xuICAgIGNvbnN0IGN0eCA9IHBhcnNlTG9uZWxvZ0NvbnRleHQobm90ZUJvZHksIHNldHRpbmdzLmxvbmVsb2dDb250ZXh0RGVwdGgpO1xuICAgIGNvbnRleHRCbG9jayA9IHNlcmlhbGl6ZUNvbnRleHQoY3R4KTtcbiAgfVxuXG4gIGNvbnN0IGNvbnRleHRNZXNzYWdlID0gY29udGV4dEJsb2NrID8gYCR7Y29udGV4dEJsb2NrfVxcblxcbiR7dXNlck1lc3NhZ2V9YCA6IHVzZXJNZXNzYWdlO1xuXG4gIHJldHVybiB7XG4gICAgc3lzdGVtUHJvbXB0OiBidWlsZFN5c3RlbVByb21wdChmbSwgbG9uZWxvZ0FjdGl2ZSwgcGFydHlsb2dBY3RpdmUpLFxuICAgIHVzZXJNZXNzYWdlOiBjb250ZXh0TWVzc2FnZSxcbiAgICB0ZW1wZXJhdHVyZTogZm0udGVtcGVyYXR1cmUgPz8gc2V0dGluZ3MuZGVmYXVsdFRlbXBlcmF0dXJlLFxuICAgIG1heE91dHB1dFRva2VucyxcbiAgICByZXNvbHZlZFNvdXJjZXM6IFtdXG4gIH07XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xyXG5pbXBvcnQgeyBOb3RlRnJvbnRNYXR0ZXIsIFNvdXJjZVJlZiB9IGZyb20gXCIuL3R5cGVzXCI7XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVhZEZyb250TWF0dGVyKGFwcDogQXBwLCBmaWxlOiBURmlsZSk6IFByb21pc2U8Tm90ZUZyb250TWF0dGVyPiB7XHJcbiAgY29uc3QgY2FjaGUgPSBhcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoZmlsZSk7XHJcbiAgcmV0dXJuIChjYWNoZT8uZnJvbnRtYXR0ZXIgYXMgTm90ZUZyb250TWF0dGVyKSA/PyB7fTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHdyaXRlRnJvbnRNYXR0ZXJLZXkoXHJcbiAgYXBwOiBBcHAsXHJcbiAgZmlsZTogVEZpbGUsXHJcbiAga2V5OiBrZXlvZiBOb3RlRnJvbnRNYXR0ZXIgfCBcInNvdXJjZXNcIixcclxuICB2YWx1ZTogdW5rbm93blxyXG4pOiBQcm9taXNlPHZvaWQ+IHtcclxuICBhd2FpdCBhcHAuZmlsZU1hbmFnZXIucHJvY2Vzc0Zyb250TWF0dGVyKGZpbGUsIChmbSkgPT4ge1xyXG4gICAgZm1ba2V5XSA9IHZhbHVlO1xyXG4gIH0pO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYXBwZW5kU2NlbmVDb250ZXh0KFxyXG4gIGFwcDogQXBwLFxyXG4gIGZpbGU6IFRGaWxlLFxyXG4gIHRleHQ6IHN0cmluZyxcclxuICBtYXhDaGFycyA9IDIwMDBcclxuKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgYXdhaXQgYXBwLmZpbGVNYW5hZ2VyLnByb2Nlc3NGcm9udE1hdHRlcihmaWxlLCAoZm0pID0+IHtcclxuICAgIGNvbnN0IGN1cnJlbnQgPSBTdHJpbmcoZm1bXCJzY2VuZV9jb250ZXh0XCJdID8/IFwiXCIpLnRyaW0oKTtcclxuICAgIGNvbnN0IHVwZGF0ZWQgPSBbY3VycmVudCwgdGV4dF0uZmlsdGVyKEJvb2xlYW4pLmpvaW4oXCJcXG5cIikudHJpbSgpO1xyXG4gICAgZm1bXCJzY2VuZV9jb250ZXh0XCJdID0gdXBkYXRlZC5sZW5ndGggPiBtYXhDaGFycyA/IFwiLi4uXCIgKyB1cGRhdGVkLnNsaWNlKC1tYXhDaGFycykgOiB1cGRhdGVkO1xyXG4gIH0pO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdXBzZXJ0U291cmNlUmVmKGFwcDogQXBwLCBmaWxlOiBURmlsZSwgcmVmOiBTb3VyY2VSZWYpOiBQcm9taXNlPHZvaWQ+IHtcclxuICBhd2FpdCBhcHAuZmlsZU1hbmFnZXIucHJvY2Vzc0Zyb250TWF0dGVyKGZpbGUsIChmbSkgPT4ge1xyXG4gICAgY29uc3QgY3VycmVudCA9IEFycmF5LmlzQXJyYXkoZm1bXCJzb3VyY2VzXCJdKSA/IFsuLi5mbVtcInNvdXJjZXNcIl1dIDogW107XHJcbiAgICBjb25zdCBuZXh0ID0gY3VycmVudC5maWx0ZXIoKGl0ZW06IFNvdXJjZVJlZikgPT4gaXRlbS52YXVsdF9wYXRoICE9PSByZWYudmF1bHRfcGF0aCk7XHJcbiAgICBuZXh0LnB1c2gocmVmKTtcclxuICAgIGZtW1wic291cmNlc1wiXSA9IG5leHQ7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW1vdmVTb3VyY2VSZWYoYXBwOiBBcHAsIGZpbGU6IFRGaWxlLCByZWY6IFNvdXJjZVJlZik6IFByb21pc2U8dm9pZD4ge1xyXG4gIGF3YWl0IGFwcC5maWxlTWFuYWdlci5wcm9jZXNzRnJvbnRNYXR0ZXIoZmlsZSwgKGZtKSA9PiB7XHJcbiAgICBjb25zdCBjdXJyZW50ID0gQXJyYXkuaXNBcnJheShmbVtcInNvdXJjZXNcIl0pID8gWy4uLmZtW1wic291cmNlc1wiXV0gOiBbXTtcclxuICAgIGZtW1wic291cmNlc1wiXSA9IGN1cnJlbnQuZmlsdGVyKChpdGVtOiBTb3VyY2VSZWYpID0+IGl0ZW0udmF1bHRfcGF0aCAhPT0gcmVmLnZhdWx0X3BhdGgpO1xyXG4gIH0pO1xyXG59XHJcbiIsICJpbXBvcnQgeyByZXF1ZXN0VXJsLCBSZXF1ZXN0VXJsUmVzcG9uc2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcclxuaW1wb3J0IHtcclxuICBBbnRocm9waWNQcm92aWRlckNvbmZpZyxcclxuICBHZW5lcmF0aW9uUmVxdWVzdCxcclxuICBHZW5lcmF0aW9uUmVzcG9uc2UsXHJcbiAgVXBsb2FkZWRGaWxlSW5mb1xyXG59IGZyb20gXCIuLi90eXBlc1wiO1xyXG5pbXBvcnQgeyBBSVByb3ZpZGVyIH0gZnJvbSBcIi4vYmFzZVwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIEFudGhyb3BpY1Byb3ZpZGVyIGltcGxlbWVudHMgQUlQcm92aWRlciB7XHJcbiAgcmVhZG9ubHkgaWQgPSBcImFudGhyb3BpY1wiO1xyXG4gIHJlYWRvbmx5IG5hbWUgPSBcIkFudGhyb3BpY1wiO1xyXG5cclxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IGNvbmZpZzogQW50aHJvcGljUHJvdmlkZXJDb25maWcpIHt9XHJcblxyXG4gIGFzeW5jIGdlbmVyYXRlKHJlcXVlc3Q6IEdlbmVyYXRpb25SZXF1ZXN0KTogUHJvbWlzZTxHZW5lcmF0aW9uUmVzcG9uc2U+IHtcclxuICAgIHRoaXMuZW5zdXJlQ29uZmlndXJlZCgpO1xyXG4gICAgY29uc3QgbW9kZWwgPSByZXF1ZXN0Lm1vZGVsIHx8IHRoaXMuY29uZmlnLmRlZmF1bHRNb2RlbDtcclxuICAgIGNvbnN0IGNvbnRlbnQ6IEFycmF5PFJlY29yZDxzdHJpbmcsIHVua25vd24+PiA9IFtdO1xyXG5cclxuICAgIGZvciAoY29uc3Qgc291cmNlIG9mIHJlcXVlc3QucmVzb2x2ZWRTb3VyY2VzID8/IFtdKSB7XHJcbiAgICAgIGlmIChzb3VyY2UuYmFzZTY0RGF0YSAmJiBzb3VyY2UucmVmLm1pbWVfdHlwZSA9PT0gXCJhcHBsaWNhdGlvbi9wZGZcIikge1xyXG4gICAgICAgIGNvbnRlbnQucHVzaCh7XHJcbiAgICAgICAgICB0eXBlOiBcImRvY3VtZW50XCIsXHJcbiAgICAgICAgICBzb3VyY2U6IHtcclxuICAgICAgICAgICAgdHlwZTogXCJiYXNlNjRcIixcclxuICAgICAgICAgICAgbWVkaWFfdHlwZTogc291cmNlLnJlZi5taW1lX3R5cGUsXHJcbiAgICAgICAgICAgIGRhdGE6IHNvdXJjZS5iYXNlNjREYXRhXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0gZWxzZSBpZiAoc291cmNlLnRleHRDb250ZW50KSB7XHJcbiAgICAgICAgY29udGVudC5wdXNoKHtcclxuICAgICAgICAgIHR5cGU6IFwidGV4dFwiLFxyXG4gICAgICAgICAgdGV4dDogYFtTT1VSQ0U6ICR7c291cmNlLnJlZi5sYWJlbH1dXFxuJHtzb3VyY2UudGV4dENvbnRlbnR9XFxuW0VORCBTT1VSQ0VdYFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY29udGVudC5wdXNoKHsgdHlwZTogXCJ0ZXh0XCIsIHRleHQ6IHJlcXVlc3QudXNlck1lc3NhZ2UgfSk7XHJcblxyXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCByZXF1ZXN0VXJsKHtcclxuICAgICAgdXJsOiBcImh0dHBzOi8vYXBpLmFudGhyb3BpYy5jb20vdjEvbWVzc2FnZXNcIixcclxuICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxyXG4gICAgICAgIFwieC1hcGkta2V5XCI6IHRoaXMuY29uZmlnLmFwaUtleSxcclxuICAgICAgICBcImFudGhyb3BpYy12ZXJzaW9uXCI6IFwiMjAyMy0wNi0wMVwiXHJcbiAgICAgIH0sXHJcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICBtb2RlbCxcclxuICAgICAgICBtYXhfdG9rZW5zOiByZXF1ZXN0Lm1heE91dHB1dFRva2VucyxcclxuICAgICAgICB0ZW1wZXJhdHVyZTogcmVxdWVzdC50ZW1wZXJhdHVyZSxcclxuICAgICAgICBzeXN0ZW06IHJlcXVlc3Quc3lzdGVtUHJvbXB0LFxyXG4gICAgICAgIG1lc3NhZ2VzOiBbeyByb2xlOiBcInVzZXJcIiwgY29udGVudCB9XVxyXG4gICAgICB9KSxcclxuICAgICAgdGhyb3c6IGZhbHNlXHJcbiAgICB9KTtcclxuXHJcbiAgICBpZiAocmVzcG9uc2Uuc3RhdHVzIDwgMjAwIHx8IHJlc3BvbnNlLnN0YXR1cyA+PSAzMDApIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKHRoaXMuZXh0cmFjdEVycm9yKHJlc3BvbnNlKSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZGF0YSA9IHJlc3BvbnNlLmpzb247XHJcbiAgICBjb25zdCB0ZXh0ID0gKGRhdGEuY29udGVudCA/PyBbXSlcclxuICAgICAgLm1hcCgoaXRlbTogeyB0ZXh0Pzogc3RyaW5nIH0pID0+IGl0ZW0udGV4dCA/PyBcIlwiKVxyXG4gICAgICAuam9pbihcIlwiKVxyXG4gICAgICAudHJpbSgpO1xyXG4gICAgaWYgKCF0ZXh0KSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlByb3ZpZGVyIHJldHVybmVkIGFuIGVtcHR5IHJlc3BvbnNlLlwiKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB0ZXh0LFxyXG4gICAgICBpbnB1dFRva2VuczogZGF0YS51c2FnZT8uaW5wdXRfdG9rZW5zLFxyXG4gICAgICBvdXRwdXRUb2tlbnM6IGRhdGEudXNhZ2U/Lm91dHB1dF90b2tlbnNcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBhc3luYyB1cGxvYWRTb3VyY2UoKTogUHJvbWlzZTxVcGxvYWRlZEZpbGVJbmZvPiB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJBbnRocm9waWMgZG9lcyBub3Qgc3VwcG9ydCBwZXJzaXN0ZW50IGZpbGUgdXBsb2FkLiBVc2UgdmF1bHRfcGF0aCBpbnN0ZWFkLlwiKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIGxpc3RTb3VyY2VzKCk6IFByb21pc2U8VXBsb2FkZWRGaWxlSW5mb1tdPiB7XHJcbiAgICByZXR1cm4gW107XHJcbiAgfVxyXG5cclxuICBhc3luYyBkZWxldGVTb3VyY2UoKTogUHJvbWlzZTx2b2lkPiB7fVxyXG5cclxuICBhc3luYyBsaXN0TW9kZWxzKCk6IFByb21pc2U8c3RyaW5nW10+IHtcclxuICAgIGlmICghdGhpcy5jb25maWcuYXBpS2V5LnRyaW0oKSkgcmV0dXJuIFtdO1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCByZXF1ZXN0VXJsKHtcclxuICAgICAgICB1cmw6IFwiaHR0cHM6Ly9hcGkuYW50aHJvcGljLmNvbS92MS9tb2RlbHNcIixcclxuICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICBcIngtYXBpLWtleVwiOiB0aGlzLmNvbmZpZy5hcGlLZXksXHJcbiAgICAgICAgICBcImFudGhyb3BpYy12ZXJzaW9uXCI6IFwiMjAyMy0wNi0wMVwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICB0aHJvdzogZmFsc2VcclxuICAgICAgfSk7XHJcbiAgICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPCAyMDAgfHwgcmVzcG9uc2Uuc3RhdHVzID49IDMwMCkgcmV0dXJuIFtdO1xyXG4gICAgICBjb25zdCBkYXRhID0gcmVzcG9uc2UuanNvbjtcclxuICAgICAgcmV0dXJuIChkYXRhLmRhdGEgPz8gW10pXHJcbiAgICAgICAgLm1hcCgobTogeyBpZD86IHN0cmluZyB9KSA9PiBtLmlkID8/IFwiXCIpXHJcbiAgICAgICAgLmZpbHRlcihCb29sZWFuKTtcclxuICAgIH0gY2F0Y2gge1xyXG4gICAgICByZXR1cm4gW107XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBhc3luYyB2YWxpZGF0ZSgpOiBQcm9taXNlPGJvb2xlYW4+IHtcclxuICAgIGlmICghdGhpcy5jb25maWcuYXBpS2V5LnRyaW0oKSkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHJlcXVlc3RVcmwoe1xyXG4gICAgICAgIHVybDogXCJodHRwczovL2FwaS5hbnRocm9waWMuY29tL3YxL21lc3NhZ2VzXCIsXHJcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcclxuICAgICAgICAgIFwieC1hcGkta2V5XCI6IHRoaXMuY29uZmlnLmFwaUtleSxcclxuICAgICAgICAgIFwiYW50aHJvcGljLXZlcnNpb25cIjogXCIyMDIzLTA2LTAxXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICAgIG1vZGVsOiB0aGlzLmNvbmZpZy5kZWZhdWx0TW9kZWwsXHJcbiAgICAgICAgICBtYXhfdG9rZW5zOiAxLFxyXG4gICAgICAgICAgbWVzc2FnZXM6IFt7IHJvbGU6IFwidXNlclwiLCBjb250ZW50OiBbeyB0eXBlOiBcInRleHRcIiwgdGV4dDogXCJwaW5nXCIgfV0gfV1cclxuICAgICAgICB9KSxcclxuICAgICAgICB0aHJvdzogZmFsc2VcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybiByZXNwb25zZS5zdGF0dXMgPj0gMjAwICYmIHJlc3BvbnNlLnN0YXR1cyA8IDMwMDtcclxuICAgIH0gY2F0Y2gge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGVuc3VyZUNvbmZpZ3VyZWQoKTogdm9pZCB7XHJcbiAgICBpZiAoIXRoaXMuY29uZmlnLmFwaUtleS50cmltKCkpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gQW50aHJvcGljIEFQSSBrZXkgc2V0LiBDaGVjayBwbHVnaW4gc2V0dGluZ3MuXCIpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBleHRyYWN0RXJyb3IocmVzcG9uc2U6IFJlcXVlc3RVcmxSZXNwb25zZSk6IHN0cmluZyB7XHJcbiAgICBpZiAocmVzcG9uc2Uuc3RhdHVzID09PSA0MDEgfHwgcmVzcG9uc2Uuc3RhdHVzID09PSA0MDMpIHtcclxuICAgICAgcmV0dXJuIFwiQW50aHJvcGljIEFQSSBrZXkgcmVqZWN0ZWQuIENoZWNrIHNldHRpbmdzLlwiO1xyXG4gICAgfVxyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgZGF0YSA9IHJlc3BvbnNlLmpzb247XHJcbiAgICAgIGNvbnN0IG1zZyA9IGRhdGE/LmVycm9yPy5tZXNzYWdlID8/IGBBbnRocm9waWMgcmVxdWVzdCBmYWlsZWQgKCR7cmVzcG9uc2Uuc3RhdHVzfSkuYDtcclxuICAgICAgcmV0dXJuIHJlc3BvbnNlLnN0YXR1cyA9PT0gNDI5ID8gYEFudGhyb3BpYyBxdW90YS9yYXRlIGVycm9yOiAke21zZ31gIDogbXNnO1xyXG4gICAgfSBjYXRjaCB7XHJcbiAgICAgIHJldHVybiBgQW50aHJvcGljIHJlcXVlc3QgZmFpbGVkICgke3Jlc3BvbnNlLnN0YXR1c30pLmA7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcbiIsICJpbXBvcnQgeyByZXF1ZXN0VXJsLCBSZXF1ZXN0VXJsUmVzcG9uc2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcclxuaW1wb3J0IHtcclxuICBHZW1pbmlQcm92aWRlckNvbmZpZyxcclxuICBHZW5lcmF0aW9uUmVxdWVzdCxcclxuICBHZW5lcmF0aW9uUmVzcG9uc2UsXHJcbiAgVXBsb2FkZWRGaWxlSW5mb1xyXG59IGZyb20gXCIuLi90eXBlc1wiO1xyXG5pbXBvcnQgeyBBSVByb3ZpZGVyIH0gZnJvbSBcIi4vYmFzZVwiO1xyXG5cclxuZnVuY3Rpb24gYXNFcnJvck1lc3NhZ2UoZXJyb3I6IHVua25vd24pOiBzdHJpbmcge1xyXG4gIHJldHVybiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcik7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBHZW1pbmlQcm92aWRlciBpbXBsZW1lbnRzIEFJUHJvdmlkZXIge1xyXG4gIHJlYWRvbmx5IGlkID0gXCJnZW1pbmlcIjtcclxuICByZWFkb25seSBuYW1lID0gXCJHZW1pbmlcIjtcclxuXHJcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBjb25maWc6IEdlbWluaVByb3ZpZGVyQ29uZmlnKSB7fVxyXG5cclxuICBhc3luYyBnZW5lcmF0ZShyZXF1ZXN0OiBHZW5lcmF0aW9uUmVxdWVzdCk6IFByb21pc2U8R2VuZXJhdGlvblJlc3BvbnNlPiB7XHJcbiAgICB0aGlzLmVuc3VyZUNvbmZpZ3VyZWQoKTtcclxuICAgIGNvbnN0IG1vZGVsID0gcmVxdWVzdC5tb2RlbCB8fCB0aGlzLmNvbmZpZy5kZWZhdWx0TW9kZWw7XHJcbiAgICBjb25zdCBlbmRwb2ludCA9XHJcbiAgICAgIGBodHRwczovL2dlbmVyYXRpdmVsYW5ndWFnZS5nb29nbGVhcGlzLmNvbS92MWJldGEvbW9kZWxzLyR7ZW5jb2RlVVJJQ29tcG9uZW50KG1vZGVsKX06Z2VuZXJhdGVDb250ZW50P2tleT0ke2VuY29kZVVSSUNvbXBvbmVudCh0aGlzLmNvbmZpZy5hcGlLZXkpfWA7XHJcblxyXG4gICAgY29uc3QgcGFydHM6IEFycmF5PFJlY29yZDxzdHJpbmcsIHVua25vd24+PiA9IFtdO1xyXG4gICAgZm9yIChjb25zdCBzb3VyY2Ugb2YgcmVxdWVzdC5yZXNvbHZlZFNvdXJjZXMgPz8gW10pIHtcclxuICAgICAgaWYgKHNvdXJjZS5iYXNlNjREYXRhKSB7XHJcbiAgICAgICAgcGFydHMucHVzaCh7XHJcbiAgICAgICAgICBpbmxpbmVEYXRhOiB7XHJcbiAgICAgICAgICAgIG1pbWVUeXBlOiBzb3VyY2UucmVmLm1pbWVfdHlwZSxcclxuICAgICAgICAgICAgZGF0YTogc291cmNlLmJhc2U2NERhdGFcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgfSBlbHNlIGlmIChzb3VyY2UudGV4dENvbnRlbnQpIHtcclxuICAgICAgICBwYXJ0cy5wdXNoKHsgdGV4dDogYFtTT1VSQ0U6ICR7c291cmNlLnJlZi5sYWJlbH1dXFxuJHtzb3VyY2UudGV4dENvbnRlbnR9XFxuW0VORCBTT1VSQ0VdYCB9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcGFydHMucHVzaCh7IHRleHQ6IHJlcXVlc3QudXNlck1lc3NhZ2UgfSk7XHJcblxyXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCByZXF1ZXN0VXJsKHtcclxuICAgICAgdXJsOiBlbmRwb2ludCxcclxuICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgaGVhZGVyczogeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9LFxyXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgc3lzdGVtX2luc3RydWN0aW9uOiB7IHBhcnRzOiBbeyB0ZXh0OiByZXF1ZXN0LnN5c3RlbVByb21wdCB9XSB9LFxyXG4gICAgICAgIGNvbnRlbnRzOiBbeyByb2xlOiBcInVzZXJcIiwgcGFydHMgfV0sXHJcbiAgICAgICAgZ2VuZXJhdGlvbkNvbmZpZzoge1xyXG4gICAgICAgICAgdGVtcGVyYXR1cmU6IHJlcXVlc3QudGVtcGVyYXR1cmUsXHJcbiAgICAgICAgICBtYXhPdXRwdXRUb2tlbnM6IHJlcXVlc3QubWF4T3V0cHV0VG9rZW5zLFxyXG4gICAgICAgICAgdGhpbmtpbmdDb25maWc6IHsgdGhpbmtpbmdCdWRnZXQ6IDAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSksXHJcbiAgICAgIHRocm93OiBmYWxzZVxyXG4gICAgfSk7XHJcblxyXG4gICAgaWYgKHJlc3BvbnNlLnN0YXR1cyA8IDIwMCB8fCByZXNwb25zZS5zdGF0dXMgPj0gMzAwKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcih0aGlzLmV4dHJhY3RFcnJvcihyZXNwb25zZSwgXCJHZW1pbmlcIikpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGRhdGEgPSByZXNwb25zZS5qc29uO1xyXG4gICAgY29uc3QgdGV4dCA9IChkYXRhLmNhbmRpZGF0ZXM/LlswXT8uY29udGVudD8ucGFydHMgPz8gW10pXHJcbiAgICAgIC5tYXAoKHBhcnQ6IHsgdGV4dD86IHN0cmluZyB9KSA9PiBwYXJ0LnRleHQgPz8gXCJcIilcclxuICAgICAgLmpvaW4oXCJcIilcclxuICAgICAgLnRyaW0oKTtcclxuXHJcbiAgICBpZiAoIXRleHQpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUHJvdmlkZXIgcmV0dXJuZWQgYW4gZW1wdHkgcmVzcG9uc2UuXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIHRleHQsXHJcbiAgICAgIGlucHV0VG9rZW5zOiBkYXRhLnVzYWdlTWV0YWRhdGE/LnByb21wdFRva2VuQ291bnQsXHJcbiAgICAgIG91dHB1dFRva2VuczogZGF0YS51c2FnZU1ldGFkYXRhPy5jYW5kaWRhdGVzVG9rZW5Db3VudFxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIGFzeW5jIHVwbG9hZFNvdXJjZSgpOiBQcm9taXNlPFVwbG9hZGVkRmlsZUluZm8+IHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcIlVzZSAnQWRkIFNvdXJjZScgZnJvbSB0aGUgbm90ZSB0byBhdHRhY2ggYSB2YXVsdCBmaWxlIGlubGluZS5cIik7XHJcbiAgfVxyXG5cclxuICBhc3luYyBsaXN0U291cmNlcygpOiBQcm9taXNlPFVwbG9hZGVkRmlsZUluZm9bXT4ge1xyXG4gICAgcmV0dXJuIFtdO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgZGVsZXRlU291cmNlKCk6IFByb21pc2U8dm9pZD4ge31cclxuXHJcbiAgYXN5bmMgbGlzdE1vZGVscygpOiBQcm9taXNlPHN0cmluZ1tdPiB7XHJcbiAgICBpZiAoIXRoaXMuY29uZmlnLmFwaUtleS50cmltKCkpIHJldHVybiBbXTtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcmVxdWVzdFVybCh7XHJcbiAgICAgICAgdXJsOiBgaHR0cHM6Ly9nZW5lcmF0aXZlbGFuZ3VhZ2UuZ29vZ2xlYXBpcy5jb20vdjFiZXRhL21vZGVscz9rZXk9JHtlbmNvZGVVUklDb21wb25lbnQodGhpcy5jb25maWcuYXBpS2V5KX1gLFxyXG4gICAgICAgIHRocm93OiBmYWxzZVxyXG4gICAgICB9KTtcclxuICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1cyA8IDIwMCB8fCByZXNwb25zZS5zdGF0dXMgPj0gMzAwKSByZXR1cm4gW107XHJcbiAgICAgIGNvbnN0IGRhdGEgPSByZXNwb25zZS5qc29uO1xyXG4gICAgICByZXR1cm4gKGRhdGEubW9kZWxzID8/IFtdKVxyXG4gICAgICAgIC5maWx0ZXIoKG06IHsgc3VwcG9ydGVkR2VuZXJhdGlvbk1ldGhvZHM/OiBzdHJpbmdbXSB9KSA9PlxyXG4gICAgICAgICAgbS5zdXBwb3J0ZWRHZW5lcmF0aW9uTWV0aG9kcz8uaW5jbHVkZXMoXCJnZW5lcmF0ZUNvbnRlbnRcIikpXHJcbiAgICAgICAgLm1hcCgobTogeyBuYW1lPzogc3RyaW5nIH0pID0+IChtLm5hbWUgPz8gXCJcIikucmVwbGFjZSgvXm1vZGVsc1xcLy8sIFwiXCIpKVxyXG4gICAgICAgIC5maWx0ZXIoQm9vbGVhbik7XHJcbiAgICB9IGNhdGNoIHtcclxuICAgICAgcmV0dXJuIFtdO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgYXN5bmMgdmFsaWRhdGUoKTogUHJvbWlzZTxib29sZWFuPiB7XHJcbiAgICBpZiAoIXRoaXMuY29uZmlnLmFwaUtleS50cmltKCkpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCByZXF1ZXN0VXJsKHtcclxuICAgICAgICB1cmw6IGBodHRwczovL2dlbmVyYXRpdmVsYW5ndWFnZS5nb29nbGVhcGlzLmNvbS92MWJldGEvbW9kZWxzP2tleT0ke2VuY29kZVVSSUNvbXBvbmVudCh0aGlzLmNvbmZpZy5hcGlLZXkpfWAsXHJcbiAgICAgICAgdGhyb3c6IGZhbHNlXHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm4gcmVzcG9uc2Uuc3RhdHVzID49IDIwMCAmJiByZXNwb25zZS5zdGF0dXMgPCAzMDA7XHJcbiAgICB9IGNhdGNoIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBlbnN1cmVDb25maWd1cmVkKCk6IHZvaWQge1xyXG4gICAgaWYgKCF0aGlzLmNvbmZpZy5hcGlLZXkudHJpbSgpKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vIEdlbWluaSBBUEkga2V5IHNldC4gQ2hlY2sgcGx1Z2luIHNldHRpbmdzLlwiKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgZXh0cmFjdEVycm9yKHJlc3BvbnNlOiBSZXF1ZXN0VXJsUmVzcG9uc2UsIHByb3ZpZGVyTmFtZTogc3RyaW5nKTogc3RyaW5nIHtcclxuICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDQwMSB8fCByZXNwb25zZS5zdGF0dXMgPT09IDQwMykge1xyXG4gICAgICByZXR1cm4gYCR7cHJvdmlkZXJOYW1lfSBBUEkga2V5IHJlamVjdGVkLiBDaGVjayBzZXR0aW5ncy5gO1xyXG4gICAgfVxyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgZGF0YSA9IHJlc3BvbnNlLmpzb247XHJcbiAgICAgIGNvbnN0IG1zZyA9IGRhdGE/LmVycm9yPy5tZXNzYWdlID8/IGAke3Byb3ZpZGVyTmFtZX0gcmVxdWVzdCBmYWlsZWQgKCR7cmVzcG9uc2Uuc3RhdHVzfSkuYDtcclxuICAgICAgcmV0dXJuIHJlc3BvbnNlLnN0YXR1cyA9PT0gNDI5ID8gYCR7cHJvdmlkZXJOYW1lfSBxdW90YS9yYXRlIGVycm9yOiAke21zZ31gIDogbXNnO1xyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgcmV0dXJuIGFzRXJyb3JNZXNzYWdlKGVycm9yKSB8fCBgJHtwcm92aWRlck5hbWV9IHJlcXVlc3QgZmFpbGVkICgke3Jlc3BvbnNlLnN0YXR1c30pLmA7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcbiIsICJpbXBvcnQgeyByZXF1ZXN0VXJsLCBSZXF1ZXN0VXJsUmVzcG9uc2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcclxuaW1wb3J0IHtcclxuICBHZW5lcmF0aW9uUmVxdWVzdCxcclxuICBHZW5lcmF0aW9uUmVzcG9uc2UsXHJcbiAgT2xsYW1hUHJvdmlkZXJDb25maWcsXHJcbiAgVXBsb2FkZWRGaWxlSW5mb1xyXG59IGZyb20gXCIuLi90eXBlc1wiO1xyXG5pbXBvcnQgeyB0cnVuY2F0ZVNvdXJjZVRleHQgfSBmcm9tIFwiLi4vc291cmNlVXRpbHNcIjtcclxuaW1wb3J0IHsgQUlQcm92aWRlciB9IGZyb20gXCIuL2Jhc2VcIjtcclxuXHJcbmludGVyZmFjZSBPbGxhbWFUYWdzUmVzcG9uc2Uge1xyXG4gIG1vZGVscz86IEFycmF5PHsgbmFtZT86IHN0cmluZyB9PjtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIE9sbGFtYVByb3ZpZGVyIGltcGxlbWVudHMgQUlQcm92aWRlciB7XHJcbiAgcmVhZG9ubHkgaWQgPSBcIm9sbGFtYVwiO1xyXG4gIHJlYWRvbmx5IG5hbWUgPSBcIk9sbGFtYVwiO1xyXG5cclxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IGNvbmZpZzogT2xsYW1hUHJvdmlkZXJDb25maWcpIHt9XHJcblxyXG4gIGFzeW5jIGdlbmVyYXRlKHJlcXVlc3Q6IEdlbmVyYXRpb25SZXF1ZXN0KTogUHJvbWlzZTxHZW5lcmF0aW9uUmVzcG9uc2U+IHtcclxuICAgIGNvbnN0IGJhc2VVcmwgPSB0aGlzLmNvbmZpZy5iYXNlVXJsLnJlcGxhY2UoL1xcLyQvLCBcIlwiKTtcclxuICAgIGNvbnN0IG1vZGVsID0gcmVxdWVzdC5tb2RlbCB8fCB0aGlzLmNvbmZpZy5kZWZhdWx0TW9kZWw7XHJcbiAgICBjb25zdCBzb3VyY2VCbG9ja3MgPSAocmVxdWVzdC5yZXNvbHZlZFNvdXJjZXMgPz8gW10pXHJcbiAgICAgIC5maWx0ZXIoKHNvdXJjZSkgPT4gc291cmNlLnRleHRDb250ZW50KVxyXG4gICAgICAubWFwKChzb3VyY2UpID0+IGBbU09VUkNFOiAke3NvdXJjZS5yZWYubGFiZWx9XVxcbiR7dHJ1bmNhdGVTb3VyY2VUZXh0KHNvdXJjZS50ZXh0Q29udGVudCA/PyBcIlwiKX1cXG5bRU5EIFNPVVJDRV1gKTtcclxuXHJcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHJlcXVlc3RVcmwoe1xyXG4gICAgICB1cmw6IGAke2Jhc2VVcmx9L2FwaS9jaGF0YCxcclxuICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgaGVhZGVyczogeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9LFxyXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgbW9kZWwsXHJcbiAgICAgICAgc3RyZWFtOiBmYWxzZSxcclxuICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICB0ZW1wZXJhdHVyZTogcmVxdWVzdC50ZW1wZXJhdHVyZSxcclxuICAgICAgICAgIG51bV9wcmVkaWN0OiByZXF1ZXN0Lm1heE91dHB1dFRva2Vuc1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgbWVzc2FnZXM6IFtcclxuICAgICAgICAgIHsgcm9sZTogXCJzeXN0ZW1cIiwgY29udGVudDogcmVxdWVzdC5zeXN0ZW1Qcm9tcHQgfSxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgcm9sZTogXCJ1c2VyXCIsXHJcbiAgICAgICAgICAgIGNvbnRlbnQ6IHNvdXJjZUJsb2Nrcy5sZW5ndGhcclxuICAgICAgICAgICAgICA/IGAke3NvdXJjZUJsb2Nrcy5qb2luKFwiXFxuXFxuXCIpfVxcblxcbiR7cmVxdWVzdC51c2VyTWVzc2FnZX1gXHJcbiAgICAgICAgICAgICAgOiByZXF1ZXN0LnVzZXJNZXNzYWdlXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgXVxyXG4gICAgICB9KSxcclxuICAgICAgdGhyb3c6IGZhbHNlXHJcbiAgICB9KTtcclxuXHJcbiAgICBpZiAocmVzcG9uc2Uuc3RhdHVzIDwgMjAwIHx8IHJlc3BvbnNlLnN0YXR1cyA+PSAzMDApIHtcclxuICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1cyA9PT0gNDA0KSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBNb2RlbCAnJHttb2RlbH0nIG5vdCBmb3VuZCBpbiBPbGxhbWEuIENoZWNrIGF2YWlsYWJsZSBtb2RlbHMgaW4gc2V0dGluZ3MuYCk7XHJcbiAgICAgIH1cclxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBPbGxhbWEgbm90IHJlYWNoYWJsZSBhdCAke2Jhc2VVcmx9LiBJcyBpdCBydW5uaW5nP2ApO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGRhdGEgPSByZXNwb25zZS5qc29uO1xyXG4gICAgY29uc3QgdGV4dCA9IGRhdGEubWVzc2FnZT8uY29udGVudD8udHJpbT8uKCkgPz8gXCJcIjtcclxuICAgIGlmICghdGV4dCkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJQcm92aWRlciByZXR1cm5lZCBhbiBlbXB0eSByZXNwb25zZS5cIik7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgdGV4dCxcclxuICAgICAgaW5wdXRUb2tlbnM6IGRhdGEucHJvbXB0X2V2YWxfY291bnQsXHJcbiAgICAgIG91dHB1dFRva2VuczogZGF0YS5ldmFsX2NvdW50XHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgdXBsb2FkU291cmNlKCk6IFByb21pc2U8VXBsb2FkZWRGaWxlSW5mbz4ge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiT2xsYW1hIGRvZXMgbm90IHN1cHBvcnQgZmlsZSB1cGxvYWQuIEFkZCBhIHZhdWx0X3BhdGggc291cmNlIGluc3RlYWQuXCIpO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgbGlzdFNvdXJjZXMoKTogUHJvbWlzZTxVcGxvYWRlZEZpbGVJbmZvW10+IHtcclxuICAgIHJldHVybiBbXTtcclxuICB9XHJcblxyXG4gIGFzeW5jIGRlbGV0ZVNvdXJjZSgpOiBQcm9taXNlPHZvaWQ+IHt9XHJcblxyXG4gIGFzeW5jIHZhbGlkYXRlKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgdGFncyA9IGF3YWl0IHRoaXMuZmV0Y2hUYWdzKCk7XHJcbiAgICAgIHJldHVybiBCb29sZWFuKHRhZ3MubW9kZWxzPy5sZW5ndGgpO1xyXG4gICAgfSBjYXRjaCB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGFzeW5jIGxpc3RNb2RlbHMoKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xyXG4gICAgY29uc3QgdGFncyA9IGF3YWl0IHRoaXMuZmV0Y2hUYWdzKCk7XHJcbiAgICByZXR1cm4gKHRhZ3MubW9kZWxzID8/IFtdKS5tYXAoKG1vZGVsKSA9PiBtb2RlbC5uYW1lID8/IFwiXCIpLmZpbHRlcihCb29sZWFuKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgYXN5bmMgZmV0Y2hUYWdzKCk6IFByb21pc2U8T2xsYW1hVGFnc1Jlc3BvbnNlPiB7XHJcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHJlcXVlc3RVcmwoe1xyXG4gICAgICB1cmw6IGAke3RoaXMuY29uZmlnLmJhc2VVcmwucmVwbGFjZSgvXFwvJC8sIFwiXCIpfS9hcGkvdGFnc2AsXHJcbiAgICAgIHRocm93OiBmYWxzZVxyXG4gICAgfSk7XHJcbiAgICBpZiAocmVzcG9uc2Uuc3RhdHVzIDwgMjAwIHx8IHJlc3BvbnNlLnN0YXR1cyA+PSAzMDApIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBPbGxhbWEgbm90IHJlYWNoYWJsZSBhdCAke3RoaXMuY29uZmlnLmJhc2VVcmx9LiBJcyBpdCBydW5uaW5nP2ApO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3BvbnNlLmpzb24gYXMgT2xsYW1hVGFnc1Jlc3BvbnNlO1xyXG4gIH1cclxufVxyXG4iLCAiaW1wb3J0IHsgQXBwLCBUQWJzdHJhY3RGaWxlLCBURmlsZSwgbm9ybWFsaXplUGF0aCB9IGZyb20gXCJvYnNpZGlhblwiO1xyXG5pbXBvcnQgeyBQcm92aWRlcklELCBSZXNvbHZlZFNvdXJjZSwgU291cmNlUmVmIH0gZnJvbSBcIi4vdHlwZXNcIjtcclxuXHJcbmNvbnN0IFRFWFRfRVhURU5TSU9OUyA9IG5ldyBTZXQoW1widHh0XCIsIFwibWRcIiwgXCJtYXJrZG93blwiLCBcImpzb25cIiwgXCJ5YW1sXCIsIFwieW1sXCIsIFwiY3N2XCJdKTtcclxuXHJcbmZ1bmN0aW9uIGdldFZhdWx0RmlsZShhcHA6IEFwcCwgdmF1bHRQYXRoOiBzdHJpbmcpOiBURmlsZSB7XHJcbiAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZVBhdGgodmF1bHRQYXRoKTtcclxuICBjb25zdCBmaWxlID0gYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChub3JtYWxpemVkKTtcclxuICBpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFNvdXJjZSBmaWxlIG5vdCBmb3VuZCBpbiB2YXVsdDogJHt2YXVsdFBhdGh9YCk7XHJcbiAgfVxyXG4gIHJldHVybiBmaWxlO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVhZFZhdWx0VGV4dFNvdXJjZShhcHA6IEFwcCwgdmF1bHRQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xyXG4gIGNvbnN0IGZpbGUgPSBnZXRWYXVsdEZpbGUoYXBwLCB2YXVsdFBhdGgpO1xyXG4gIGNvbnN0IGV4dGVuc2lvbiA9IGZpbGUuZXh0ZW5zaW9uLnRvTG93ZXJDYXNlKCk7XHJcbiAgaWYgKCFURVhUX0VYVEVOU0lPTlMuaGFzKGV4dGVuc2lvbikpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihgVGV4dCBleHRyYWN0aW9uIGlzIG9ubHkgc3VwcG9ydGVkIGZvciB0ZXh0IGZpbGVzLiBBZGQgYSAudHh0IGNvbXBhbmlvbiBmb3IgJyR7dmF1bHRQYXRofScuYCk7XHJcbiAgfVxyXG4gIHJldHVybiBhcHAudmF1bHQuY2FjaGVkUmVhZChmaWxlKTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlYWRWYXVsdEJpbmFyeVNvdXJjZShhcHA6IEFwcCwgdmF1bHRQYXRoOiBzdHJpbmcpOiBQcm9taXNlPEFycmF5QnVmZmVyPiB7XHJcbiAgY29uc3QgZmlsZSA9IGdldFZhdWx0RmlsZShhcHAsIHZhdWx0UGF0aCk7XHJcbiAgcmV0dXJuIGFwcC52YXVsdC5yZWFkQmluYXJ5KGZpbGUpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYXJyYXlCdWZmZXJUb0Jhc2U2NChidWZmZXI6IEFycmF5QnVmZmVyKTogc3RyaW5nIHtcclxuICBsZXQgYmluYXJ5ID0gXCJcIjtcclxuICBjb25zdCBieXRlcyA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlcik7XHJcbiAgY29uc3QgY2h1bmtTaXplID0gMHg4MDAwO1xyXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYnl0ZXMubGVuZ3RoOyBpICs9IGNodW5rU2l6ZSkge1xyXG4gICAgY29uc3QgY2h1bmsgPSBieXRlcy5zdWJhcnJheShpLCBpICsgY2h1bmtTaXplKTtcclxuICAgIGJpbmFyeSArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKC4uLmNodW5rKTtcclxuICB9XHJcbiAgcmV0dXJuIGJ0b2EoYmluYXJ5KTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlc29sdmVTb3VyY2VzRm9yUmVxdWVzdChcclxuICBhcHA6IEFwcCxcclxuICBzb3VyY2VzOiBTb3VyY2VSZWZbXSxcclxuICBwcm92aWRlcklkOiBQcm92aWRlcklEXHJcbik6IFByb21pc2U8UmVzb2x2ZWRTb3VyY2VbXT4ge1xyXG4gIGNvbnN0IHJlc29sdmVkOiBSZXNvbHZlZFNvdXJjZVtdID0gW107XHJcbiAgZm9yIChjb25zdCByZWYgb2Ygc291cmNlcykge1xyXG4gICAgaWYgKHByb3ZpZGVySWQgPT09IFwiYW50aHJvcGljXCIgfHwgKHByb3ZpZGVySWQgPT09IFwiZ2VtaW5pXCIgJiYgcmVmLm1pbWVfdHlwZSA9PT0gXCJhcHBsaWNhdGlvbi9wZGZcIikpIHtcclxuICAgICAgY29uc3QgYnVmZmVyID0gYXdhaXQgcmVhZFZhdWx0QmluYXJ5U291cmNlKGFwcCwgcmVmLnZhdWx0X3BhdGgpO1xyXG4gICAgICByZXNvbHZlZC5wdXNoKHsgcmVmLCBiYXNlNjREYXRhOiBhcnJheUJ1ZmZlclRvQmFzZTY0KGJ1ZmZlcikgfSk7XHJcbiAgICAgIGNvbnRpbnVlO1xyXG4gICAgfVxyXG4gICAgY29uc3QgdGV4dCA9IGF3YWl0IHJlYWRWYXVsdFRleHRTb3VyY2UoYXBwLCByZWYudmF1bHRfcGF0aCk7XHJcbiAgICByZXNvbHZlZC5wdXNoKHsgcmVmLCB0ZXh0Q29udGVudDogdGV4dCB9KTtcclxuICB9XHJcbiAgcmV0dXJuIHJlc29sdmVkO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdHJ1bmNhdGVTb3VyY2VUZXh0KHRleHQ6IHN0cmluZywgbWF4Q2hhcnMgPSA0MDAwKTogc3RyaW5nIHtcclxuICByZXR1cm4gdGV4dC5sZW5ndGggPD0gbWF4Q2hhcnMgPyB0ZXh0IDogdGV4dC5zbGljZSgwLCBtYXhDaGFycyk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBkZXNjcmliZVNvdXJjZVJlZihyZWY6IFNvdXJjZVJlZik6IHN0cmluZyB7XHJcbiAgcmV0dXJuIHJlZi52YXVsdF9wYXRoO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbGlzdFZhdWx0Q2FuZGlkYXRlRmlsZXMoYXBwOiBBcHApOiBURmlsZVtdIHtcclxuICByZXR1cm4gYXBwLnZhdWx0XHJcbiAgICAuZ2V0RmlsZXMoKVxyXG4gICAgLmZpbHRlcigoZmlsZSkgPT4gW1wicGRmXCIsIFwidHh0XCIsIFwibWRcIiwgXCJtYXJrZG93blwiXS5pbmNsdWRlcyhmaWxlLmV4dGVuc2lvbi50b0xvd2VyQ2FzZSgpKSlcclxuICAgIC5zb3J0KChhLCBiKSA9PiBhLnBhdGgubG9jYWxlQ29tcGFyZShiLnBhdGgpKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGlzVEZpbGUoZmlsZTogVEFic3RyYWN0RmlsZSB8IG51bGwpOiBmaWxlIGlzIFRGaWxlIHtcclxuICByZXR1cm4gQm9vbGVhbihmaWxlKSAmJiBmaWxlIGluc3RhbmNlb2YgVEZpbGU7XHJcbn1cclxuIiwgImltcG9ydCB7IHJlcXVlc3RVcmwsIFJlcXVlc3RVcmxSZXNwb25zZSB9IGZyb20gXCJvYnNpZGlhblwiO1xyXG5pbXBvcnQge1xyXG4gIEdlbmVyYXRpb25SZXF1ZXN0LFxyXG4gIEdlbmVyYXRpb25SZXNwb25zZSxcclxuICBPcGVuQUlQcm92aWRlckNvbmZpZyxcclxuICBVcGxvYWRlZEZpbGVJbmZvXHJcbn0gZnJvbSBcIi4uL3R5cGVzXCI7XHJcbmltcG9ydCB7IHRydW5jYXRlU291cmNlVGV4dCB9IGZyb20gXCIuLi9zb3VyY2VVdGlsc1wiO1xyXG5pbXBvcnQgeyBBSVByb3ZpZGVyIH0gZnJvbSBcIi4vYmFzZVwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIE9wZW5BSVByb3ZpZGVyIGltcGxlbWVudHMgQUlQcm92aWRlciB7XHJcbiAgcmVhZG9ubHkgaWQgPSBcIm9wZW5haVwiO1xyXG4gIHJlYWRvbmx5IG5hbWUgPSBcIk9wZW5BSVwiO1xyXG5cclxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IGNvbmZpZzogT3BlbkFJUHJvdmlkZXJDb25maWcpIHt9XHJcblxyXG4gIGFzeW5jIGdlbmVyYXRlKHJlcXVlc3Q6IEdlbmVyYXRpb25SZXF1ZXN0KTogUHJvbWlzZTxHZW5lcmF0aW9uUmVzcG9uc2U+IHtcclxuICAgIHRoaXMuZW5zdXJlQ29uZmlndXJlZCgpO1xyXG4gICAgY29uc3QgYmFzZVVybCA9IHRoaXMuY29uZmlnLmJhc2VVcmwucmVwbGFjZSgvXFwvJC8sIFwiXCIpO1xyXG4gICAgY29uc3QgbW9kZWwgPSByZXF1ZXN0Lm1vZGVsIHx8IHRoaXMuY29uZmlnLmRlZmF1bHRNb2RlbDtcclxuICAgIGNvbnN0IHNvdXJjZUJsb2NrcyA9IChyZXF1ZXN0LnJlc29sdmVkU291cmNlcyA/PyBbXSlcclxuICAgICAgLmZpbHRlcigoc291cmNlKSA9PiBzb3VyY2UudGV4dENvbnRlbnQpXHJcbiAgICAgIC5tYXAoKHNvdXJjZSkgPT4gYFtTT1VSQ0U6ICR7c291cmNlLnJlZi5sYWJlbH1dXFxuJHt0cnVuY2F0ZVNvdXJjZVRleHQoc291cmNlLnRleHRDb250ZW50ID8/IFwiXCIpfVxcbltFTkQgU09VUkNFXWApO1xyXG5cclxuICAgIGNvbnN0IGJvZHk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge1xyXG4gICAgICBtb2RlbCxcclxuICAgICAgbWF4X3Rva2VuczogcmVxdWVzdC5tYXhPdXRwdXRUb2tlbnMsXHJcbiAgICAgIG1lc3NhZ2VzOiBbXHJcbiAgICAgICAgeyByb2xlOiBcInN5c3RlbVwiLCBjb250ZW50OiByZXF1ZXN0LnN5c3RlbVByb21wdCB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIHJvbGU6IFwidXNlclwiLFxyXG4gICAgICAgICAgY29udGVudDogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgdHlwZTogXCJ0ZXh0XCIsXHJcbiAgICAgICAgICAgICAgdGV4dDogc291cmNlQmxvY2tzLmxlbmd0aFxyXG4gICAgICAgICAgICAgICAgPyBgJHtzb3VyY2VCbG9ja3Muam9pbihcIlxcblxcblwiKX1cXG5cXG4ke3JlcXVlc3QudXNlck1lc3NhZ2V9YFxyXG4gICAgICAgICAgICAgICAgOiByZXF1ZXN0LnVzZXJNZXNzYWdlXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIF1cclxuICAgICAgICB9XHJcbiAgICAgIF1cclxuICAgIH07XHJcblxyXG4gICAgaWYgKCFtb2RlbC5zdGFydHNXaXRoKFwiZ3B0LTVcIikpIHtcclxuICAgICAgYm9keS50ZW1wZXJhdHVyZSA9IHJlcXVlc3QudGVtcGVyYXR1cmU7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCByZXF1ZXN0VXJsKHtcclxuICAgICAgdXJsOiBgJHtiYXNlVXJsfS9jaGF0L2NvbXBsZXRpb25zYCxcclxuICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxyXG4gICAgICAgIEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHt0aGlzLmNvbmZpZy5hcGlLZXl9YFxyXG4gICAgICB9LFxyXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShib2R5KSxcclxuICAgICAgdGhyb3c6IGZhbHNlXHJcbiAgICB9KTtcclxuXHJcbiAgICBpZiAocmVzcG9uc2Uuc3RhdHVzIDwgMjAwIHx8IHJlc3BvbnNlLnN0YXR1cyA+PSAzMDApIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKHRoaXMuZXh0cmFjdEVycm9yKHJlc3BvbnNlKSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZGF0YSA9IHJlc3BvbnNlLmpzb247XHJcbiAgICBjb25zdCB0ZXh0ID0gZGF0YS5jaG9pY2VzPy5bMF0/Lm1lc3NhZ2U/LmNvbnRlbnQ/LnRyaW0/LigpID8/IFwiXCI7XHJcbiAgICBpZiAoIXRleHQpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUHJvdmlkZXIgcmV0dXJuZWQgYW4gZW1wdHkgcmVzcG9uc2UuXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIHRleHQsXHJcbiAgICAgIGlucHV0VG9rZW5zOiBkYXRhLnVzYWdlPy5wcm9tcHRfdG9rZW5zLFxyXG4gICAgICBvdXRwdXRUb2tlbnM6IGRhdGEudXNhZ2U/LmNvbXBsZXRpb25fdG9rZW5zXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgdXBsb2FkU291cmNlKCk6IFByb21pc2U8VXBsb2FkZWRGaWxlSW5mbz4ge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiVGhpcyBwcm92aWRlciBkb2VzIG5vdCBzdXBwb3J0IGZpbGUgdXBsb2FkLiBVc2UgdmF1bHRfcGF0aCBpbnN0ZWFkLlwiKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIGxpc3RTb3VyY2VzKCk6IFByb21pc2U8VXBsb2FkZWRGaWxlSW5mb1tdPiB7XHJcbiAgICByZXR1cm4gW107XHJcbiAgfVxyXG5cclxuICBhc3luYyBkZWxldGVTb3VyY2UoKTogUHJvbWlzZTx2b2lkPiB7fVxyXG5cclxuICBhc3luYyBsaXN0TW9kZWxzKCk6IFByb21pc2U8c3RyaW5nW10+IHtcclxuICAgIGlmICghdGhpcy5jb25maWcuYXBpS2V5LnRyaW0oKSkgcmV0dXJuIFtdO1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCByZXF1ZXN0VXJsKHtcclxuICAgICAgICB1cmw6IGAke3RoaXMuY29uZmlnLmJhc2VVcmwucmVwbGFjZSgvXFwvJC8sIFwiXCIpfS9tb2RlbHNgLFxyXG4gICAgICAgIGhlYWRlcnM6IHsgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke3RoaXMuY29uZmlnLmFwaUtleX1gIH0sXHJcbiAgICAgICAgdGhyb3c6IGZhbHNlXHJcbiAgICAgIH0pO1xyXG4gICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzIDwgMjAwIHx8IHJlc3BvbnNlLnN0YXR1cyA+PSAzMDApIHJldHVybiBbXTtcclxuICAgICAgY29uc3QgZGF0YSA9IHJlc3BvbnNlLmpzb247XHJcbiAgICAgIGNvbnN0IEVYQ0xVREUgPSBbXCJlbWJlZGRpbmdcIiwgXCJ3aGlzcGVyXCIsIFwidHRzXCIsIFwiZGFsbC1lXCIsIFwibW9kZXJhdGlvblwiLCBcInRleHQtc2VhcmNoXCIsIFwidGV4dC1zaW1pbGFyaXR5XCJdO1xyXG4gICAgICByZXR1cm4gKGRhdGEuZGF0YSA/PyBbXSlcclxuICAgICAgICAubWFwKChtOiB7IGlkPzogc3RyaW5nIH0pID0+IG0uaWQgPz8gXCJcIilcclxuICAgICAgICAuZmlsdGVyKChpZDogc3RyaW5nKSA9PiBpZCAmJiAhRVhDTFVERS5zb21lKChleCkgPT4gaWQuaW5jbHVkZXMoZXgpKSlcclxuICAgICAgICAuc29ydCgpO1xyXG4gICAgfSBjYXRjaCB7XHJcbiAgICAgIHJldHVybiBbXTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGFzeW5jIHZhbGlkYXRlKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xyXG4gICAgaWYgKCF0aGlzLmNvbmZpZy5hcGlLZXkudHJpbSgpKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcmVxdWVzdFVybCh7XHJcbiAgICAgICAgdXJsOiBgJHt0aGlzLmNvbmZpZy5iYXNlVXJsLnJlcGxhY2UoL1xcLyQvLCBcIlwiKX0vbW9kZWxzYCxcclxuICAgICAgICBoZWFkZXJzOiB7IEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHt0aGlzLmNvbmZpZy5hcGlLZXl9YCB9LFxyXG4gICAgICAgIHRocm93OiBmYWxzZVxyXG4gICAgICB9KTtcclxuICAgICAgcmV0dXJuIHJlc3BvbnNlLnN0YXR1cyA+PSAyMDAgJiYgcmVzcG9uc2Uuc3RhdHVzIDwgMzAwO1xyXG4gICAgfSBjYXRjaCB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgZW5zdXJlQ29uZmlndXJlZCgpOiB2b2lkIHtcclxuICAgIGlmICghdGhpcy5jb25maWcuYXBpS2V5LnRyaW0oKSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJObyBPcGVuQUkgQVBJIGtleSBzZXQuIENoZWNrIHBsdWdpbiBzZXR0aW5ncy5cIik7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGV4dHJhY3RFcnJvcihyZXNwb25zZTogUmVxdWVzdFVybFJlc3BvbnNlKTogc3RyaW5nIHtcclxuICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDQwMSB8fCByZXNwb25zZS5zdGF0dXMgPT09IDQwMykge1xyXG4gICAgICByZXR1cm4gXCJPcGVuQUkgQVBJIGtleSByZWplY3RlZC4gQ2hlY2sgc2V0dGluZ3MuXCI7XHJcbiAgICB9XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBkYXRhID0gcmVzcG9uc2UuanNvbjtcclxuICAgICAgY29uc3QgbXNnID0gZGF0YT8uZXJyb3I/Lm1lc3NhZ2UgPz8gYE9wZW5BSSByZXF1ZXN0IGZhaWxlZCAoJHtyZXNwb25zZS5zdGF0dXN9KS5gO1xyXG4gICAgICByZXR1cm4gcmVzcG9uc2Uuc3RhdHVzID09PSA0MjkgPyBgT3BlbkFJIHF1b3RhL3JhdGUgZXJyb3I6ICR7bXNnfWAgOiBtc2c7XHJcbiAgICB9IGNhdGNoIHtcclxuICAgICAgcmV0dXJuIGBPcGVuQUkgcmVxdWVzdCBmYWlsZWQgKCR7cmVzcG9uc2Uuc3RhdHVzfSkuYDtcclxuICAgIH1cclxuICB9XHJcbn1cclxuIiwgImltcG9ydCB7IHJlcXVlc3RVcmwsIFJlcXVlc3RVcmxSZXNwb25zZSB9IGZyb20gXCJvYnNpZGlhblwiO1xyXG5pbXBvcnQge1xyXG4gIEdlbmVyYXRpb25SZXF1ZXN0LFxyXG4gIEdlbmVyYXRpb25SZXNwb25zZSxcclxuICBPcGVuUm91dGVyUHJvdmlkZXJDb25maWcsXHJcbiAgVXBsb2FkZWRGaWxlSW5mb1xyXG59IGZyb20gXCIuLi90eXBlc1wiO1xyXG5pbXBvcnQgeyB0cnVuY2F0ZVNvdXJjZVRleHQgfSBmcm9tIFwiLi4vc291cmNlVXRpbHNcIjtcclxuaW1wb3J0IHsgQUlQcm92aWRlciB9IGZyb20gXCIuL2Jhc2VcIjtcclxuXHJcbmNvbnN0IEJBU0VfVVJMID0gXCJodHRwczovL29wZW5yb3V0ZXIuYWkvYXBpL3YxXCI7XHJcblxyXG5mdW5jdGlvbiBhc0Vycm9yTWVzc2FnZShlcnJvcjogdW5rbm93bik6IHN0cmluZyB7XHJcbiAgcmV0dXJuIGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKTtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIE9wZW5Sb3V0ZXJQcm92aWRlciBpbXBsZW1lbnRzIEFJUHJvdmlkZXIge1xyXG4gIHJlYWRvbmx5IGlkID0gXCJvcGVucm91dGVyXCI7XHJcbiAgcmVhZG9ubHkgbmFtZSA9IFwiT3BlblJvdXRlclwiO1xyXG5cclxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IGNvbmZpZzogT3BlblJvdXRlclByb3ZpZGVyQ29uZmlnKSB7fVxyXG5cclxuICBhc3luYyBnZW5lcmF0ZShyZXF1ZXN0OiBHZW5lcmF0aW9uUmVxdWVzdCk6IFByb21pc2U8R2VuZXJhdGlvblJlc3BvbnNlPiB7XHJcbiAgICB0aGlzLmVuc3VyZUNvbmZpZ3VyZWQoKTtcclxuICAgIGNvbnN0IG1vZGVsID0gcmVxdWVzdC5tb2RlbCB8fCB0aGlzLmNvbmZpZy5kZWZhdWx0TW9kZWw7XHJcbiAgICBjb25zdCBzb3VyY2VCbG9ja3MgPSAocmVxdWVzdC5yZXNvbHZlZFNvdXJjZXMgPz8gW10pXHJcbiAgICAgIC5maWx0ZXIoKHNvdXJjZSkgPT4gc291cmNlLnRleHRDb250ZW50KVxyXG4gICAgICAubWFwKChzb3VyY2UpID0+IGBbU09VUkNFOiAke3NvdXJjZS5yZWYubGFiZWx9XVxcbiR7dHJ1bmNhdGVTb3VyY2VUZXh0KHNvdXJjZS50ZXh0Q29udGVudCA/PyBcIlwiKX1cXG5bRU5EIFNPVVJDRV1gKTtcclxuXHJcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHJlcXVlc3RVcmwoe1xyXG4gICAgICB1cmw6IGAke0JBU0VfVVJMfS9jaGF0L2NvbXBsZXRpb25zYCxcclxuICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxyXG4gICAgICAgIFwiQXV0aG9yaXphdGlvblwiOiBgQmVhcmVyICR7dGhpcy5jb25maWcuYXBpS2V5fWAsXHJcbiAgICAgICAgXCJIVFRQLVJlZmVyZXJcIjogXCJvYnNpZGlhbi1zeWJ5bFwiLFxyXG4gICAgICAgIFwiWC1UaXRsZVwiOiBcIlN5YnlsXCJcclxuICAgICAgfSxcclxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgIG1vZGVsLFxyXG4gICAgICAgIG1heF90b2tlbnM6IHJlcXVlc3QubWF4T3V0cHV0VG9rZW5zLFxyXG4gICAgICAgIHRlbXBlcmF0dXJlOiByZXF1ZXN0LnRlbXBlcmF0dXJlLFxyXG4gICAgICAgIG1lc3NhZ2VzOiBbXHJcbiAgICAgICAgICB7IHJvbGU6IFwic3lzdGVtXCIsIGNvbnRlbnQ6IHJlcXVlc3Quc3lzdGVtUHJvbXB0IH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHJvbGU6IFwidXNlclwiLFxyXG4gICAgICAgICAgICBjb250ZW50OiBzb3VyY2VCbG9ja3MubGVuZ3RoXHJcbiAgICAgICAgICAgICAgPyBgJHtzb3VyY2VCbG9ja3Muam9pbihcIlxcblxcblwiKX1cXG5cXG4ke3JlcXVlc3QudXNlck1lc3NhZ2V9YFxyXG4gICAgICAgICAgICAgIDogcmVxdWVzdC51c2VyTWVzc2FnZVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIF1cclxuICAgICAgfSksXHJcbiAgICAgIHRocm93OiBmYWxzZVxyXG4gICAgfSk7XHJcblxyXG4gICAgaWYgKHJlc3BvbnNlLnN0YXR1cyA8IDIwMCB8fCByZXNwb25zZS5zdGF0dXMgPj0gMzAwKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcih0aGlzLmV4dHJhY3RFcnJvcihyZXNwb25zZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGRhdGEgPSByZXNwb25zZS5qc29uO1xyXG4gICAgY29uc3QgdGV4dCA9IGRhdGEuY2hvaWNlcz8uWzBdPy5tZXNzYWdlPy5jb250ZW50Py50cmltPy4oKSA/PyBcIlwiO1xyXG4gICAgaWYgKCF0ZXh0KSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlByb3ZpZGVyIHJldHVybmVkIGFuIGVtcHR5IHJlc3BvbnNlLlwiKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB0ZXh0LFxyXG4gICAgICBpbnB1dFRva2VuczogZGF0YS51c2FnZT8ucHJvbXB0X3Rva2VucyxcclxuICAgICAgb3V0cHV0VG9rZW5zOiBkYXRhLnVzYWdlPy5jb21wbGV0aW9uX3Rva2Vuc1xyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIGFzeW5jIHVwbG9hZFNvdXJjZSgpOiBQcm9taXNlPFVwbG9hZGVkRmlsZUluZm8+IHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcIk9wZW5Sb3V0ZXIgZG9lcyBub3Qgc3VwcG9ydCBmaWxlIHVwbG9hZC4gVXNlIHZhdWx0X3BhdGggaW5zdGVhZC5cIik7XHJcbiAgfVxyXG5cclxuICBhc3luYyBsaXN0U291cmNlcygpOiBQcm9taXNlPFVwbG9hZGVkRmlsZUluZm9bXT4ge1xyXG4gICAgcmV0dXJuIFtdO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgZGVsZXRlU291cmNlKCk6IFByb21pc2U8dm9pZD4ge31cclxuXHJcbiAgYXN5bmMgbGlzdE1vZGVscygpOiBQcm9taXNlPHN0cmluZ1tdPiB7XHJcbiAgICBpZiAoIXRoaXMuY29uZmlnLmFwaUtleS50cmltKCkpIHJldHVybiBbXTtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcmVxdWVzdFVybCh7XHJcbiAgICAgICAgdXJsOiBgJHtCQVNFX1VSTH0vbW9kZWxzYCxcclxuICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICBcIkF1dGhvcml6YXRpb25cIjogYEJlYXJlciAke3RoaXMuY29uZmlnLmFwaUtleX1gXHJcbiAgICAgICAgfSxcclxuICAgICAgICB0aHJvdzogZmFsc2VcclxuICAgICAgfSk7XHJcbiAgICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPCAyMDAgfHwgcmVzcG9uc2Uuc3RhdHVzID49IDMwMCkgcmV0dXJuIFtdO1xyXG4gICAgICBjb25zdCBkYXRhID0gcmVzcG9uc2UuanNvbjtcclxuICAgICAgcmV0dXJuIChkYXRhLmRhdGEgPz8gW10pXHJcbiAgICAgICAgLmZpbHRlcigobTogeyBhcmNoaXRlY3R1cmU/OiB7IG1vZGFsaXR5Pzogc3RyaW5nIH0gfSkgPT5cclxuICAgICAgICAgIG0uYXJjaGl0ZWN0dXJlPy5tb2RhbGl0eT8uZW5kc1dpdGgoXCItPnRleHRcIikpXHJcbiAgICAgICAgLm1hcCgobTogeyBpZD86IHN0cmluZyB9KSA9PiBtLmlkID8/IFwiXCIpXHJcbiAgICAgICAgLmZpbHRlcihCb29sZWFuKVxyXG4gICAgICAgIC5zb3J0KCk7XHJcbiAgICB9IGNhdGNoIHtcclxuICAgICAgcmV0dXJuIFtdO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgYXN5bmMgdmFsaWRhdGUoKTogUHJvbWlzZTxib29sZWFuPiB7XHJcbiAgICBpZiAoIXRoaXMuY29uZmlnLmFwaUtleS50cmltKCkpIHJldHVybiBmYWxzZTtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcmVxdWVzdFVybCh7XHJcbiAgICAgICAgdXJsOiBgJHtCQVNFX1VSTH0vbW9kZWxzYCxcclxuICAgICAgICBoZWFkZXJzOiB7IFwiQXV0aG9yaXphdGlvblwiOiBgQmVhcmVyICR7dGhpcy5jb25maWcuYXBpS2V5fWAgfSxcclxuICAgICAgICB0aHJvdzogZmFsc2VcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybiByZXNwb25zZS5zdGF0dXMgPj0gMjAwICYmIHJlc3BvbnNlLnN0YXR1cyA8IDMwMDtcclxuICAgIH0gY2F0Y2gge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGVuc3VyZUNvbmZpZ3VyZWQoKTogdm9pZCB7XHJcbiAgICBpZiAoIXRoaXMuY29uZmlnLmFwaUtleS50cmltKCkpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gT3BlblJvdXRlciBBUEkga2V5IHNldC4gQ2hlY2sgcGx1Z2luIHNldHRpbmdzLlwiKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgZXh0cmFjdEVycm9yKHJlc3BvbnNlOiBSZXF1ZXN0VXJsUmVzcG9uc2UpOiBzdHJpbmcge1xyXG4gICAgaWYgKHJlc3BvbnNlLnN0YXR1cyA9PT0gNDAxIHx8IHJlc3BvbnNlLnN0YXR1cyA9PT0gNDAzKSB7XHJcbiAgICAgIHJldHVybiBcIk9wZW5Sb3V0ZXIgQVBJIGtleSByZWplY3RlZC4gQ2hlY2sgc2V0dGluZ3MuXCI7XHJcbiAgICB9XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBkYXRhID0gcmVzcG9uc2UuanNvbjtcclxuICAgICAgY29uc3QgbXNnID0gZGF0YT8uZXJyb3I/Lm1lc3NhZ2UgPz8gYE9wZW5Sb3V0ZXIgcmVxdWVzdCBmYWlsZWQgKCR7cmVzcG9uc2Uuc3RhdHVzfSkuYDtcclxuICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1cyA9PT0gNDI5KSB7XHJcbiAgICAgICAgaWYgKG1zZyA9PT0gXCJQcm92aWRlciByZXR1cm5lZCBlcnJvclwiKSB7XHJcbiAgICAgICAgICByZXR1cm4gXCJPcGVuUm91dGVyOiBmcmVlIG1vZGVsIGVuZHBvaW50IGF0IGNhcGFjaXR5LiBSZXRyeSBpbiBhIG1vbWVudCBvciBwaWNrIGEgZGlmZmVyZW50IG1vZGVsLlwiO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gYE9wZW5Sb3V0ZXIgcmF0ZSBsaW1pdDogJHttc2d9YDtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gbXNnO1xyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgcmV0dXJuIGFzRXJyb3JNZXNzYWdlKGVycm9yKSB8fCBgT3BlblJvdXRlciByZXF1ZXN0IGZhaWxlZCAoJHtyZXNwb25zZS5zdGF0dXN9KS5gO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG4iLCAiaW1wb3J0IHsgQ2hvcnVzU2V0dGluZ3MsIFByb3ZpZGVySUQgfSBmcm9tIFwiLi4vdHlwZXNcIjtcclxuaW1wb3J0IHsgQUlQcm92aWRlciB9IGZyb20gXCIuL2Jhc2VcIjtcclxuaW1wb3J0IHsgQW50aHJvcGljUHJvdmlkZXIgfSBmcm9tIFwiLi9hbnRocm9waWNcIjtcclxuaW1wb3J0IHsgR2VtaW5pUHJvdmlkZXIgfSBmcm9tIFwiLi9nZW1pbmlcIjtcclxuaW1wb3J0IHsgT2xsYW1hUHJvdmlkZXIgfSBmcm9tIFwiLi9vbGxhbWFcIjtcclxuaW1wb3J0IHsgT3BlbkFJUHJvdmlkZXIgfSBmcm9tIFwiLi9vcGVuYWlcIjtcclxuaW1wb3J0IHsgT3BlblJvdXRlclByb3ZpZGVyIH0gZnJvbSBcIi4vb3BlbnJvdXRlclwiO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFByb3ZpZGVyKHNldHRpbmdzOiBDaG9ydXNTZXR0aW5ncywgb3ZlcnJpZGVJZD86IFByb3ZpZGVySUQpOiBBSVByb3ZpZGVyIHtcclxuICBjb25zdCBpZCA9IG92ZXJyaWRlSWQgPz8gc2V0dGluZ3MuYWN0aXZlUHJvdmlkZXI7XHJcbiAgc3dpdGNoIChpZCkge1xyXG4gICAgY2FzZSBcImdlbWluaVwiOlxyXG4gICAgICByZXR1cm4gbmV3IEdlbWluaVByb3ZpZGVyKHNldHRpbmdzLnByb3ZpZGVycy5nZW1pbmkpO1xyXG4gICAgY2FzZSBcIm9wZW5haVwiOlxyXG4gICAgICByZXR1cm4gbmV3IE9wZW5BSVByb3ZpZGVyKHNldHRpbmdzLnByb3ZpZGVycy5vcGVuYWkpO1xyXG4gICAgY2FzZSBcImFudGhyb3BpY1wiOlxyXG4gICAgICByZXR1cm4gbmV3IEFudGhyb3BpY1Byb3ZpZGVyKHNldHRpbmdzLnByb3ZpZGVycy5hbnRocm9waWMpO1xyXG4gICAgY2FzZSBcIm9sbGFtYVwiOlxyXG4gICAgICByZXR1cm4gbmV3IE9sbGFtYVByb3ZpZGVyKHNldHRpbmdzLnByb3ZpZGVycy5vbGxhbWEpO1xyXG4gICAgY2FzZSBcIm9wZW5yb3V0ZXJcIjpcclxuICAgICAgcmV0dXJuIG5ldyBPcGVuUm91dGVyUHJvdmlkZXIoc2V0dGluZ3MucHJvdmlkZXJzLm9wZW5yb3V0ZXIpO1xyXG4gICAgZGVmYXVsdDpcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIHByb3ZpZGVyOiAke2lkfWApO1xyXG4gIH1cclxufVxyXG4iLCAiaW1wb3J0IHsgTm90aWNlLCBURmlsZSwgbm9ybWFsaXplUGF0aCB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHR5cGUgQ2hvcnVzUGx1Z2luIGZyb20gXCIuL21haW5cIjtcbmltcG9ydCB7IGdldFNlbGVjdGlvbiwgaW5zZXJ0QmVsb3dTZWxlY3Rpb24sIGlzSW5zaWRlQ29kZUJsb2NrIH0gZnJvbSBcIi4vZWRpdG9yXCI7XG5pbXBvcnQgeyByZW1vdmVTb3VyY2VSZWYsIHVwc2VydFNvdXJjZVJlZiwgd3JpdGVGcm9udE1hdHRlcktleSB9IGZyb20gXCIuL2Zyb250bWF0dGVyXCI7XG5pbXBvcnQge1xuICBmb3JtYXRBZHZlbnR1cmVTZWVkLFxuICBmb3JtYXRBc2tPcmFjbGUsXG4gIGZvcm1hdENoYXJhY3RlcixcbiAgZm9ybWF0RGVjbGFyZUFjdGlvbixcbiAgZm9ybWF0RXhwYW5kU2NlbmUsXG4gIGZvcm1hdEludGVycHJldE9yYWNsZSxcbiAgZm9ybWF0U3RhcnRTY2VuZSxcbiAgZm9ybWF0U3VnZ2VzdENvbnNlcXVlbmNlLFxuICBMb25lbG9nRm9ybWF0T3B0aW9uc1xufSBmcm9tIFwiLi9sb25lbG9nL2Zvcm1hdHRlclwiO1xuaW1wb3J0IHsgcGFyc2VMb25lbG9nQ29udGV4dCwgc2VyaWFsaXplQ29udGV4dCB9IGZyb20gXCIuL2xvbmVsb2cvcGFyc2VyXCI7XG5pbXBvcnQge1xuICBmb3JtYXRDb2xsYWJvcmF0aXZlQWN0aW9uLFxuICBmb3JtYXREZWNsYXJlQWN0aW9uIGFzIGZvcm1hdFBhcnR5bG9nRGVjbGFyZUFjdGlvbixcbiAgZm9ybWF0RXhwYW5kU2NlbmUgYXMgZm9ybWF0UGFydHlsb2dFeHBhbmRTY2VuZSxcbiAgZm9ybWF0R01FdmVudCxcbiAgZm9ybWF0TG9nVGhpcyxcbiAgZm9ybWF0U3RhcnRTY2VuZSBhcyBmb3JtYXRQYXJ0eWxvZ1N0YXJ0U2NlbmUsXG4gIGZvcm1hdFdoYXROb3csXG4gIFBhcnR5bG9nRm9ybWF0T3B0aW9uc1xufSBmcm9tIFwiLi9wYXJ0eWxvZy9mb3JtYXR0ZXJcIjtcbmltcG9ydCB7IHBhcnNlUGFydHlsb2dDb250ZXh0LCBzZXJpYWxpemVQYXJ0eWxvZ0NvbnRleHQgfSBmcm9tIFwiLi9wYXJ0eWxvZy9wYXJzZXJcIjtcbmltcG9ydCB7IE1hbmFnZVNvdXJjZXNNb2RhbCwgb3BlbklucHV0TW9kYWwsIHBpY2tMb2NhbEZpbGUsIHBpY2tTb3VyY2VPcmlnaW4sIHBpY2tTb3VyY2VSZWYsIHBpY2tWYXVsdEZpbGUgfSBmcm9tIFwiLi9tb2RhbHNcIjtcbmltcG9ydCB7IHJlc29sdmVTb3VyY2VzRm9yUmVxdWVzdCB9IGZyb20gXCIuL3NvdXJjZVV0aWxzXCI7XG5pbXBvcnQgeyBDaG9ydXNTZXR0aW5ncywgTm90ZUZyb250TWF0dGVyLCBTb3VyY2VSZWYgfSBmcm9tIFwiLi90eXBlc1wiO1xuXG5mdW5jdGlvbiBpc0xvbmVsb2dBY3RpdmUoc2V0dGluZ3M6IENob3J1c1NldHRpbmdzLCBmbTogTm90ZUZyb250TWF0dGVyKTogYm9vbGVhbiB7XG4gIHJldHVybiBmbS5sb25lbG9nID8/IHNldHRpbmdzLmxvbmVsb2dNb2RlO1xufVxuXG5mdW5jdGlvbiBpc1BhcnR5bG9nQWN0aXZlKHNldHRpbmdzOiBDaG9ydXNTZXR0aW5ncywgZm06IE5vdGVGcm9udE1hdHRlcik6IGJvb2xlYW4ge1xuICByZXR1cm4gZm0ucGFydHlsb2cgPz8gc2V0dGluZ3MucGFydHlsb2dNb2RlO1xufVxuXG5mdW5jdGlvbiBsb25lbG9nT3B0cyhzZXR0aW5nczogQ2hvcnVzU2V0dGluZ3MsIG5vV3JhcCA9IGZhbHNlKTogTG9uZWxvZ0Zvcm1hdE9wdGlvbnMge1xuICByZXR1cm4geyB3cmFwSW5Db2RlQmxvY2s6ICFub1dyYXAgJiYgKHNldHRpbmdzLmxvbmVsb2dXcmFwQ29kZUJsb2NrID8/IHRydWUpIH07XG59XG5cbmZ1bmN0aW9uIHBhcnR5bG9nT3B0cyhzZXR0aW5nczogQ2hvcnVzU2V0dGluZ3MsIG5vV3JhcCA9IGZhbHNlKTogUGFydHlsb2dGb3JtYXRPcHRpb25zIHtcbiAgcmV0dXJuIHsgd3JhcEluQ29kZUJsb2NrOiAhbm9XcmFwICYmIChzZXR0aW5ncy5wYXJ0eWxvZ1dyYXBDb2RlQmxvY2sgPz8gdHJ1ZSkgfTtcbn1cblxuZnVuY3Rpb24gZ2VuZXJpY0Jsb2NrcXVvdGUobGFiZWw6IHN0cmluZywgdGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGA+IFske2xhYmVsfV0gJHt0ZXh0LnRyaW0oKS5yZXBsYWNlKC9cXG4vZywgXCJcXG4+IFwiKX1gO1xufVxuXG5mdW5jdGlvbiBpbmZlck1pbWVUeXBlKGZpbGU6IFRGaWxlIHwgRmlsZSk6IHN0cmluZyB7XG4gIGNvbnN0IG5hbWUgPSBcInBhdGhcIiBpbiBmaWxlID8gZmlsZS5wYXRoIDogZmlsZS5uYW1lO1xuICByZXR1cm4gbmFtZS50b0xvd2VyQ2FzZSgpLmVuZHNXaXRoKFwiLnBkZlwiKSA/IFwiYXBwbGljYXRpb24vcGRmXCIgOiBcInRleHQvcGxhaW5cIjtcbn1cblxuZnVuY3Rpb24gdG9kYXlJc29EYXRlKCk6IHN0cmluZyB7XG4gIHJldHVybiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc2xpY2UoMCwgMTApO1xufVxuXG5mdW5jdGlvbiBwYXJzZUxvbmVsb2dPcmFjbGVSZXNwb25zZSh0ZXh0OiBzdHJpbmcpOiB7IHJlc3VsdDogc3RyaW5nOyBpbnRlcnByZXRhdGlvbjogc3RyaW5nIH0ge1xuICBjb25zdCBsaW5lcyA9IHRleHRcbiAgICAucmVwbGFjZSgvXj5cXHMqL2dtLCBcIlwiKVxuICAgIC5zcGxpdChcIlxcblwiKVxuICAgIC5tYXAoKGxpbmUpID0+IGxpbmUudHJpbSgpKVxuICAgIC5maWx0ZXIoQm9vbGVhbik7XG4gIGNvbnN0IHJlc3VsdCA9IGxpbmVzLmZpbmQoKGxpbmUpID0+IGxpbmUuc3RhcnRzV2l0aChcIi0+XCIpKT8ucmVwbGFjZSgvXi0+XFxzKi8sIFwiXCIpID8/IFwiVW5jbGVhclwiO1xuICBjb25zdCBpbnRlcnByZXRhdGlvbiA9IGxpbmVzLmZpbHRlcigobGluZSkgPT4gIWxpbmUuc3RhcnRzV2l0aChcIi0+XCIpKS5qb2luKFwiXFxuXCIpO1xuICByZXR1cm4geyByZXN1bHQsIGludGVycHJldGF0aW9uIH07XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGFkZFNvdXJjZVRvTm90ZShwbHVnaW46IENob3J1c1BsdWdpbiwgZmlsZTogVEZpbGUpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3Qgb3JpZ2luID0gYXdhaXQgcGlja1NvdXJjZU9yaWdpbihwbHVnaW4uYXBwKTtcbiAgaWYgKCFvcmlnaW4pIHJldHVybjtcblxuICBpZiAob3JpZ2luID09PSBcInZhdWx0XCIpIHtcbiAgICBjb25zdCB2YXVsdEZpbGUgPSBhd2FpdCBwaWNrVmF1bHRGaWxlKHBsdWdpbi5hcHAsIFwiQ2hvb3NlIGEgdmF1bHQgZmlsZVwiKTtcbiAgICBpZiAoIXZhdWx0RmlsZSkgcmV0dXJuO1xuICAgIGNvbnN0IHJlZjogU291cmNlUmVmID0ge1xuICAgICAgbGFiZWw6IHZhdWx0RmlsZS5iYXNlbmFtZSxcbiAgICAgIG1pbWVfdHlwZTogaW5mZXJNaW1lVHlwZSh2YXVsdEZpbGUpLFxuICAgICAgdmF1bHRfcGF0aDogdmF1bHRGaWxlLnBhdGhcbiAgICB9O1xuICAgIGF3YWl0IHVwc2VydFNvdXJjZVJlZihwbHVnaW4uYXBwLCBmaWxlLCByZWYpO1xuICAgIG5ldyBOb3RpY2UoYFNvdXJjZSBhZGRlZDogJHt2YXVsdEZpbGUucGF0aH1gKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBsb2NhbEZpbGUgPSBhd2FpdCBwaWNrTG9jYWxGaWxlKCk7XG4gIGlmICghbG9jYWxGaWxlKSByZXR1cm47XG5cbiAgY29uc3QgYnVmZmVyID0gYXdhaXQgbG9jYWxGaWxlLmFycmF5QnVmZmVyKCk7XG4gIGNvbnN0IHBhcmVudERpciA9IGZpbGUucGFyZW50Py5wYXRoID8/IFwiXCI7XG4gIGNvbnN0IHNvdXJjZXNGb2xkZXIgPSBub3JtYWxpemVQYXRoKHBhcmVudERpciA/IGAke3BhcmVudERpcn0vc291cmNlc2AgOiBcInNvdXJjZXNcIik7XG5cbiAgaWYgKCFwbHVnaW4uYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChzb3VyY2VzRm9sZGVyKSkge1xuICAgIGF3YWl0IHBsdWdpbi5hcHAudmF1bHQuY3JlYXRlRm9sZGVyKHNvdXJjZXNGb2xkZXIpO1xuICB9XG5cbiAgY29uc3QgdGFyZ2V0UGF0aCA9IG5vcm1hbGl6ZVBhdGgoYCR7c291cmNlc0ZvbGRlcn0vJHtsb2NhbEZpbGUubmFtZX1gKTtcbiAgY29uc3QgZXhpc3RpbmcgPSBwbHVnaW4uYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aCh0YXJnZXRQYXRoKTtcbiAgaWYgKGV4aXN0aW5nIGluc3RhbmNlb2YgVEZpbGUpIHtcbiAgICBhd2FpdCBwbHVnaW4uYXBwLnZhdWx0Lm1vZGlmeUJpbmFyeShleGlzdGluZywgYnVmZmVyKTtcbiAgfSBlbHNlIHtcbiAgICBhd2FpdCBwbHVnaW4uYXBwLnZhdWx0LmNyZWF0ZUJpbmFyeSh0YXJnZXRQYXRoLCBidWZmZXIpO1xuICB9XG5cbiAgY29uc3QgcmVmOiBTb3VyY2VSZWYgPSB7XG4gICAgbGFiZWw6IGxvY2FsRmlsZS5uYW1lLnJlcGxhY2UoL1xcLlteLl0rJC8sIFwiXCIpLFxuICAgIG1pbWVfdHlwZTogaW5mZXJNaW1lVHlwZShsb2NhbEZpbGUpLFxuICAgIHZhdWx0X3BhdGg6IHRhcmdldFBhdGhcbiAgfTtcbiAgYXdhaXQgdXBzZXJ0U291cmNlUmVmKHBsdWdpbi5hcHAsIGZpbGUsIHJlZik7XG4gIG5ldyBOb3RpY2UoYFNvdXJjZSBpbXBvcnRlZDogJHt0YXJnZXRQYXRofWApO1xufVxuXG5hc3luYyBmdW5jdGlvbiBtYW5hZ2VTb3VyY2VzKHBsdWdpbjogQ2hvcnVzUGx1Z2luKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IGNvbnRleHQgPSBhd2FpdCBwbHVnaW4uZ2V0QWN0aXZlTm90ZUNvbnRleHQoKTtcbiAgaWYgKCFjb250ZXh0Py52aWV3LmZpbGUpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgbmV3IE1hbmFnZVNvdXJjZXNNb2RhbChcbiAgICBwbHVnaW4uYXBwLFxuICAgIGNvbnRleHQuZm0uc291cmNlcyA/PyBbXSxcbiAgICBhc3luYyAocmVmKSA9PiByZW1vdmVTb3VyY2VSZWYocGx1Z2luLmFwcCwgY29udGV4dC52aWV3LmZpbGUhLCByZWYpXG4gICkub3BlbigpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBydW5HZW5lcmF0aW9uKFxuICBwbHVnaW46IENob3J1c1BsdWdpbixcbiAgdXNlck1lc3NhZ2U6IHN0cmluZyxcbiAgZm9ybWF0dGVyOiAodGV4dDogc3RyaW5nLCBmbTogTm90ZUZyb250TWF0dGVyLCBpbnNpZGVDb2RlQmxvY2s6IGJvb2xlYW4pID0+IHN0cmluZyxcbiAgbWF4T3V0cHV0VG9rZW5zID0gNTEyLFxuICBwbGFjZW1lbnQ/OiBcImN1cnNvclwiIHwgXCJlbmQtb2Ytbm90ZVwiIHwgXCJiZWxvdy1zZWxlY3Rpb25cIlxuKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IGNvbnRleHQgPSBhd2FpdCBwbHVnaW4uZ2V0QWN0aXZlTm90ZUNvbnRleHQoKTtcbiAgaWYgKCFjb250ZXh0KSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBlZGl0b3IgPSBjb250ZXh0LnZpZXcuZWRpdG9yO1xuICAgIGxldCB0YXJnZXRMaW5lOiBudW1iZXI7XG4gICAgaWYgKHBsYWNlbWVudCA9PT0gXCJiZWxvdy1zZWxlY3Rpb25cIikge1xuICAgICAgdGFyZ2V0TGluZSA9IGVkaXRvci5saXN0U2VsZWN0aW9ucygpWzBdPy5oZWFkLmxpbmUgPz8gZWRpdG9yLmdldEN1cnNvcigpLmxpbmU7XG4gICAgfSBlbHNlIGlmIChwbGFjZW1lbnQgPT09IFwiZW5kLW9mLW5vdGVcIikge1xuICAgICAgdGFyZ2V0TGluZSA9IGVkaXRvci5sYXN0TGluZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0YXJnZXRMaW5lID0gZWRpdG9yLmdldEN1cnNvcigpLmxpbmU7XG4gICAgfVxuICAgIGNvbnN0IGluc2lkZUNvZGVCbG9jayA9IGlzSW5zaWRlQ29kZUJsb2NrKGVkaXRvciwgdGFyZ2V0TGluZSk7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBwbHVnaW4ucmVxdWVzdEdlbmVyYXRpb24oY29udGV4dC5mbSwgY29udGV4dC5ub3RlQm9keSwgdXNlck1lc3NhZ2UsIG1heE91dHB1dFRva2Vucyk7XG4gICAgY29uc3QgZm9ybWF0dGVkID0gZm9ybWF0dGVyKHJlc3BvbnNlLnRleHQsIGNvbnRleHQuZm0sIGluc2lkZUNvZGVCbG9jayk7XG4gICAgaWYgKHBsYWNlbWVudCA9PT0gXCJiZWxvdy1zZWxlY3Rpb25cIikge1xuICAgICAgaW5zZXJ0QmVsb3dTZWxlY3Rpb24oZWRpdG9yLCBmb3JtYXR0ZWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBwbHVnaW4uaW5zZXJ0VGV4dChjb250ZXh0LnZpZXcsIGZvcm1hdHRlZCwgcGxhY2VtZW50KTtcbiAgICB9XG4gICAgcGx1Z2luLm1heWJlSW5zZXJ0VG9rZW5Db21tZW50KGNvbnRleHQudmlldywgcmVzcG9uc2UpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIG5ldyBOb3RpY2UoYENob3J1cyBlcnJvcjogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcil9YCk7XG4gICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyQWxsQ29tbWFuZHMocGx1Z2luOiBDaG9ydXNQbHVnaW4pOiB2b2lkIHtcblxuICAvLyBcdTI1MDBcdTI1MDAgRnJvbnRtYXR0ZXIgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcInN5YnlsOmluc2VydC1mcm9udG1hdHRlclwiLFxuICAgIG5hbWU6IFwiSW5zZXJ0IE5vdGUgRnJvbnRtYXR0ZXJcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgY29udGV4dCA9IGF3YWl0IHBsdWdpbi5nZXRBY3RpdmVOb3RlQ29udGV4dCgpO1xuICAgICAgaWYgKCFjb250ZXh0Py52aWV3LmZpbGUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY29uc3QgdmFsdWVzID0gYXdhaXQgb3BlbklucHV0TW9kYWwocGx1Z2luLmFwcCwgXCJJbnNlcnQgQ2hvcnVzIEZyb250bWF0dGVyXCIsIFtcbiAgICAgICAgeyBrZXk6IFwicnVsZXNldFwiLCBsYWJlbDogXCJHYW1lIC8gcnVsZXNldFwiLCBwbGFjZWhvbGRlcjogXCJJcm9uc3dvcm5cIiB9LFxuICAgICAgICB7IGtleTogXCJnZW5yZVwiLCBsYWJlbDogXCJHZW5yZVwiLCBvcHRpb25hbDogdHJ1ZSwgcGxhY2Vob2xkZXI6IFwiRGFyayBmYW50YXN5IC8gc3Vydml2YWxcIiB9LFxuICAgICAgICB7IGtleTogXCJwY3NcIiwgbGFiZWw6IFwiUEMgKHNvbG8gbW9kZSlcIiwgb3B0aW9uYWw6IHRydWUsIHBsYWNlaG9sZGVyOiBcIktpcmEgVm9zcywgZGFuZ2Vyb3VzIHJhbmssIHZvdzogcmVjb3ZlciB0aGUgcmVsaWNcIiB9LFxuICAgICAgICB7IGtleTogXCJ0b25lXCIsIGxhYmVsOiBcIlRvbmVcIiwgb3B0aW9uYWw6IHRydWUsIHBsYWNlaG9sZGVyOiBcIkdyaXR0eSwgaG9wZWZ1bFwiIH0sXG4gICAgICAgIHsga2V5OiBcImxhbmd1YWdlXCIsIGxhYmVsOiBcIkxhbmd1YWdlXCIsIG9wdGlvbmFsOiB0cnVlLCBwbGFjZWhvbGRlcjogXCJMZWF2ZSBibGFuayBmb3IgYXV0by1kZXRlY3RcIiB9XG4gICAgICBdKTtcbiAgICAgIGlmICghdmFsdWVzKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICghdmFsdWVzLnJ1bGVzZXQpIHtcbiAgICAgICAgbmV3IE5vdGljZShcIlJ1bGVzZXQgaXMgcmVxdWlyZWQuXCIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBhd2FpdCBwbHVnaW4uYXBwLmZpbGVNYW5hZ2VyLnByb2Nlc3NGcm9udE1hdHRlcihjb250ZXh0LnZpZXcuZmlsZSwgKGZtKSA9PiB7XG4gICAgICAgIGZtW1wicnVsZXNldFwiXSA9IHZhbHVlcy5ydWxlc2V0O1xuICAgICAgICBmbVtcInByb3ZpZGVyXCJdID0gZm1bXCJwcm92aWRlclwiXSA/PyBwbHVnaW4uc2V0dGluZ3MuYWN0aXZlUHJvdmlkZXI7XG4gICAgICAgIGZtW1wib3JhY2xlX21vZGVcIl0gPSBmbVtcIm9yYWNsZV9tb2RlXCJdID8/IFwieWVzLW5vXCI7XG4gICAgICAgIGZtW1wibG9uZWxvZ1wiXSA9IGZtW1wibG9uZWxvZ1wiXSA/PyBwbHVnaW4uc2V0dGluZ3MubG9uZWxvZ01vZGU7XG4gICAgICAgIGZtW1wicGFydHlsb2dcIl0gPSBmbVtcInBhcnR5bG9nXCJdID8/IHBsdWdpbi5zZXR0aW5ncy5wYXJ0eWxvZ01vZGU7XG4gICAgICAgIGZtW1wic2NlbmVfY291bnRlclwiXSA9IGZtW1wic2NlbmVfY291bnRlclwiXSA/PyAxO1xuICAgICAgICBmbVtcInNlc3Npb25fbnVtYmVyXCJdID0gZm1bXCJzZXNzaW9uX251bWJlclwiXSA/PyAxO1xuICAgICAgICBmbVtcImdhbWVfY29udGV4dFwiXSA9IGZtW1wiZ2FtZV9jb250ZXh0XCJdID8/IFwiXCI7XG4gICAgICAgIGZtW1wic2NlbmVfY29udGV4dFwiXSA9IGZtW1wic2NlbmVfY29udGV4dFwiXSA/PyBcIlwiO1xuICAgICAgICBpZiAodmFsdWVzLmdlbnJlKSBmbVtcImdlbnJlXCJdID0gdmFsdWVzLmdlbnJlO1xuICAgICAgICBpZiAodmFsdWVzLnBjcykgZm1bXCJwY3NcIl0gPSB2YWx1ZXMucGNzO1xuICAgICAgICBpZiAodmFsdWVzLnRvbmUpIGZtW1widG9uZVwiXSA9IHZhbHVlcy50b25lO1xuICAgICAgICBpZiAodmFsdWVzLmxhbmd1YWdlKSBmbVtcImxhbmd1YWdlXCJdID0gdmFsdWVzLmxhbmd1YWdlO1xuICAgICAgfSk7XG4gICAgICBuZXcgTm90aWNlKFwiQ2hvcnVzIGZyb250bWF0dGVyIGluc2VydGVkLlwiKTtcbiAgICB9XG4gIH0pO1xuXG4gIC8vIFx1MjUwMFx1MjUwMCBTb3VyY2VzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJzeWJ5bDpkaWdlc3Qtc291cmNlXCIsXG4gICAgbmFtZTogXCJEaWdlc3QgU291cmNlIGludG8gR2FtZSBDb250ZXh0XCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGNvbnRleHQgPSBhd2FpdCBwbHVnaW4uZ2V0QWN0aXZlTm90ZUNvbnRleHQoKTtcbiAgICAgIGlmICghY29udGV4dD8udmlldy5maWxlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHZhdWx0RmlsZSA9IGF3YWl0IHBpY2tWYXVsdEZpbGUocGx1Z2luLmFwcCwgXCJDaG9vc2UgYSBzb3VyY2UgZmlsZSB0byBkaWdlc3RcIik7XG4gICAgICBpZiAoIXZhdWx0RmlsZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCByZWY6IFNvdXJjZVJlZiA9IHtcbiAgICAgICAgbGFiZWw6IHZhdWx0RmlsZS5iYXNlbmFtZSxcbiAgICAgICAgbWltZV90eXBlOiBpbmZlck1pbWVUeXBlKHZhdWx0RmlsZSksXG4gICAgICAgIHZhdWx0X3BhdGg6IHZhdWx0RmlsZS5wYXRoXG4gICAgICB9O1xuICAgICAgY29uc3QgcHJvdmlkZXJJZCA9IGNvbnRleHQuZm0ucHJvdmlkZXIgPz8gcGx1Z2luLnNldHRpbmdzLmFjdGl2ZVByb3ZpZGVyO1xuICAgICAgbGV0IHJlc29sdmVkU291cmNlcztcbiAgICAgIHRyeSB7XG4gICAgICAgIHJlc29sdmVkU291cmNlcyA9IGF3YWl0IHJlc29sdmVTb3VyY2VzRm9yUmVxdWVzdChwbHVnaW4uYXBwLCBbcmVmXSwgcHJvdmlkZXJJZCk7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBuZXcgTm90aWNlKGBDYW5ub3QgcmVhZCBzb3VyY2U6ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpfWApO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCBydWxlc2V0ID0gY29udGV4dC5mbS5ydWxlc2V0ID8/IFwidGhlIGdhbWVcIjtcbiAgICAgIGNvbnN0IGRpZ2VzdFByb21wdCA9IGBEaXN0aWxsIHRoZSBmb2xsb3dpbmcgc291cmNlIG1hdGVyaWFsIGZvciB1c2UgaW4gYSBzb2xvIHRhYmxldG9wIFJQRyBzZXNzaW9uIG9mIFwiJHtydWxlc2V0fVwiLlxuXG5FeHRyYWN0IGFuZCBjb25kZW5zZSBpbnRvIGEgY29tcGFjdCByZWZlcmVuY2U6XG4tIENvcmUgcnVsZXMgYW5kIG1lY2hhbmljcyByZWxldmFudCB0byBwbGF5XG4tIEtleSBmYWN0aW9ucywgbG9jYXRpb25zLCBjaGFyYWN0ZXJzLCBhbmQgd29ybGQgZmFjdHNcbi0gVG9uZSwgZ2VucmUsIGFuZCBzZXR0aW5nIGNvbnZlbnRpb25zXG4tIEFueSB0YWJsZXMsIG1vdmUgbGlzdHMsIG9yIHJhbmRvbSBnZW5lcmF0b3JzXG5cbkJlIGNvbmNpc2UgYW5kIHNwZWNpZmljLiBQcmVzZXJ2ZSBnYW1lLW1lY2hhbmljYWwgZGV0YWlscy4gT21pdCBmbGF2b3IgcHJvc2UgYW5kIGV4YW1wbGVzLmA7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHBsdWdpbi5yZXF1ZXN0UmF3R2VuZXJhdGlvbihcbiAgICAgICAgICBjb250ZXh0LmZtLFxuICAgICAgICAgIGRpZ2VzdFByb21wdCxcbiAgICAgICAgICAyMDAwLFxuICAgICAgICAgIHJlc29sdmVkU291cmNlc1xuICAgICAgICApO1xuICAgICAgICBhd2FpdCBwbHVnaW4uYXBwLmZpbGVNYW5hZ2VyLnByb2Nlc3NGcm9udE1hdHRlcihjb250ZXh0LnZpZXcuZmlsZSwgKGZtKSA9PiB7XG4gICAgICAgICAgZm1bXCJnYW1lX2NvbnRleHRcIl0gPSByZXNwb25zZS50ZXh0O1xuICAgICAgICB9KTtcbiAgICAgICAgbmV3IE5vdGljZShcIkdhbWUgY29udGV4dCB1cGRhdGVkLlwiKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIG5ldyBOb3RpY2UoYENob3J1cyBlcnJvcjogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcil9YCk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwic3lieWw6YXNrLXRoZS1ydWxlc1wiLFxuICAgIG5hbWU6IFwiQXNrIHRoZSBSdWxlc1wiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBjb250ZXh0ID0gYXdhaXQgcGx1Z2luLmdldEFjdGl2ZU5vdGVDb250ZXh0KCk7XG4gICAgICBpZiAoIWNvbnRleHQ/LnZpZXcuZmlsZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCBzb3VyY2VzID0gY29udGV4dC5mbS5zb3VyY2VzID8/IFtdO1xuICAgICAgaWYgKCFzb3VyY2VzLmxlbmd0aCkge1xuICAgICAgICBuZXcgTm90aWNlKFwiTm8gc291cmNlcyBhdHRhY2hlZCB0byB0aGlzIG5vdGUuIFVzZSBBZGQgU291cmNlIEZpbGUgZmlyc3QuXCIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCByZWYgPSBzb3VyY2VzLmxlbmd0aCA9PT0gMVxuICAgICAgICA/IHNvdXJjZXNbMF1cbiAgICAgICAgOiBhd2FpdCBwaWNrU291cmNlUmVmKHBsdWdpbi5hcHAsIFwiQ2hvb3NlIGEgc291cmNlIHRvIHF1ZXJ5XCIsIHNvdXJjZXMpO1xuICAgICAgaWYgKCFyZWYpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY29uc3QgdmFsdWVzID0gYXdhaXQgb3BlbklucHV0TW9kYWwocGx1Z2luLmFwcCwgXCJBc2sgdGhlIFJ1bGVzXCIsIFtcbiAgICAgICAgeyBrZXk6IFwicXVlc3Rpb25cIiwgbGFiZWw6IFwiUXVlc3Rpb25cIiwgcGxhY2Vob2xkZXI6IFwiSG93IGRvZXMgTW9tZW50dW0gd29yaz9cIiB9XG4gICAgICBdKTtcbiAgICAgIGlmICghdmFsdWVzPy5xdWVzdGlvbikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCBwcm92aWRlcklkID0gY29udGV4dC5mbS5wcm92aWRlciA/PyBwbHVnaW4uc2V0dGluZ3MuYWN0aXZlUHJvdmlkZXI7XG4gICAgICBsZXQgcmVzb2x2ZWRTb3VyY2VzO1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmVzb2x2ZWRTb3VyY2VzID0gYXdhaXQgcmVzb2x2ZVNvdXJjZXNGb3JSZXF1ZXN0KHBsdWdpbi5hcHAsIFtyZWZdLCBwcm92aWRlcklkKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIG5ldyBOb3RpY2UoYENhbm5vdCByZWFkIHNvdXJjZTogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcil9YCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHJ1bGVzZXQgPSBjb250ZXh0LmZtLnJ1bGVzZXQgPz8gXCJ0aGUgZ2FtZVwiO1xuICAgICAgY29uc3QgcHJvbXB0ID0gYFlvdSBhcmUgYSBydWxlcyByZWZlcmVuY2UgZm9yIFwiJHtydWxlc2V0fVwiLlxuQW5zd2VyIHRoZSBmb2xsb3dpbmcgcXVlc3Rpb24gdXNpbmcgb25seSB0aGUgcHJvdmlkZWQgc291cmNlIG1hdGVyaWFsLlxuQmUgcHJlY2lzZSBhbmQgY2l0ZSB0aGUgcmVsZXZhbnQgcnVsZSBvciBwYWdlIHNlY3Rpb24gaWYgcG9zc2libGUuXG5cblF1ZXN0aW9uOiAke3ZhbHVlcy5xdWVzdGlvbn1gO1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBwbHVnaW4ucmVxdWVzdFJhd0dlbmVyYXRpb24oY29udGV4dC5mbSwgcHJvbXB0LCAxMDAwLCByZXNvbHZlZFNvdXJjZXMpO1xuICAgICAgICBwbHVnaW4uaW5zZXJ0VGV4dChjb250ZXh0LnZpZXcsIGdlbmVyaWNCbG9ja3F1b3RlKFwiUnVsZXNcIiwgcmVzcG9uc2UudGV4dCkpO1xuICAgICAgICBwbHVnaW4ubWF5YmVJbnNlcnRUb2tlbkNvbW1lbnQoY29udGV4dC52aWV3LCByZXNwb25zZSk7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBuZXcgTm90aWNlKGBDaG9ydXMgZXJyb3I6ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpfWApO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgLy8gXHUyNTAwXHUyNTAwIFNjZW5lIC8gYWN0aW9uIGNvbW1hbmRzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJzeWJ5bDphZHZlbnR1cmUtc2VlZFwiLFxuICAgIG5hbWU6IFwiQWR2ZW50dXJlIFNlZWRcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgY29udGV4dCA9IGF3YWl0IHBsdWdpbi5nZXRBY3RpdmVOb3RlQ29udGV4dCgpO1xuICAgICAgaWYgKCFjb250ZXh0Py52aWV3LmZpbGUpIHJldHVybjtcbiAgICAgIGNvbnN0IHZhbHVlcyA9IGF3YWl0IG9wZW5JbnB1dE1vZGFsKHBsdWdpbi5hcHAsIFwiQWR2ZW50dXJlIFNlZWRcIiwgW1xuICAgICAgICB7IGtleTogXCJjb25jZXB0XCIsIGxhYmVsOiBcIlRoZW1lIG9yIGNvbmNlcHRcIiwgb3B0aW9uYWw6IHRydWUsIHBsYWNlaG9sZGVyOiBcIkxlYXZlIGJsYW5rIGZvciBhIHJhbmRvbSBzZWVkLlwiIH1cbiAgICAgIF0pO1xuICAgICAgaWYgKCF2YWx1ZXMpIHJldHVybjtcbiAgICAgIGNvbnN0IHJ1bGVzZXQgPSBjb250ZXh0LmZtLnJ1bGVzZXQgPz8gXCJ0aGUgZ2FtZVwiO1xuICAgICAgY29uc3QgY29uY2VwdCA9IHZhbHVlcy5jb25jZXB0Py50cmltKCk7XG4gICAgICBjb25zdCBwcm9tcHQgPSBgR2VuZXJhdGUgYW4gYWR2ZW50dXJlIHNlZWQgZm9yIGEgc29sbyB0YWJsZXRvcCBSUEcgc2Vzc2lvbiBvZiBcIiR7cnVsZXNldH1cIi5cblxuU3RydWN0dXJlIHRoZSBvdXRwdXQgYXM6XG4tIFByZW1pc2U6IG9uZSBzZW50ZW5jZSBkZXNjcmliaW5nIHRoZSBzaXR1YXRpb25cbi0gQ29uZmxpY3Q6IHRoZSBjZW50cmFsIHRlbnNpb24gb3IgdGhyZWF0XG4tIEhvb2s6IHRoZSBzcGVjaWZpYyBldmVudCB0aGF0IHB1bGxzIHRoZSBQQyBpblxuLSBUb25lOiB0aGUgaW50ZW5kZWQgYXRtb3NwaGVyZVxuXG4ke2NvbmNlcHQgPyBgVGhlbWUvY29uY2VwdDogJHtjb25jZXB0fWAgOiBcIk1ha2UgaXQgZXZvY2F0aXZlIGFuZCBpbW1lZGlhdGVseSBwbGF5YWJsZS5cIn1cbktlZXAgaXQgY29uY2lzZSBcdTIwMTQgNCBidWxsZXQgcG9pbnRzLCBvbmUgc2hvcnQgc2VudGVuY2UgZWFjaC5gO1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBwbHVnaW4ucmVxdWVzdFJhd0dlbmVyYXRpb24oY29udGV4dC5mbSwgcHJvbXB0LCA4MDAsIFtdKTtcbiAgICAgICAgY29uc3QgbG9uZWxvZyA9IGlzTG9uZWxvZ0FjdGl2ZShwbHVnaW4uc2V0dGluZ3MsIGNvbnRleHQuZm0pO1xuICAgICAgICBjb25zdCBpbnNpZGVDb2RlQmxvY2sgPSBpc0luc2lkZUNvZGVCbG9jayhjb250ZXh0LnZpZXcuZWRpdG9yKTtcbiAgICAgICAgY29uc3Qgb3V0cHV0ID0gbG9uZWxvZ1xuICAgICAgICAgID8gZm9ybWF0QWR2ZW50dXJlU2VlZChyZXNwb25zZS50ZXh0LCBsb25lbG9nT3B0cyhwbHVnaW4uc2V0dGluZ3MsIGluc2lkZUNvZGVCbG9jaykpXG4gICAgICAgICAgOiBnZW5lcmljQmxvY2txdW90ZShcIkFkdmVudHVyZSBTZWVkXCIsIHJlc3BvbnNlLnRleHQpO1xuICAgICAgICBwbHVnaW4uaW5zZXJ0VGV4dChjb250ZXh0LnZpZXcsIG91dHB1dCk7XG4gICAgICAgIHBsdWdpbi5tYXliZUluc2VydFRva2VuQ29tbWVudChjb250ZXh0LnZpZXcsIHJlc3BvbnNlKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIG5ldyBOb3RpY2UoYENob3J1cyBlcnJvcjogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcil9YCk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwic3lieWw6Z2VuZXJhdGUtY2hhcmFjdGVyXCIsXG4gICAgbmFtZTogXCJHZW5lcmF0ZSBDaGFyYWN0ZXJcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgY29udGV4dCA9IGF3YWl0IHBsdWdpbi5nZXRBY3RpdmVOb3RlQ29udGV4dCgpO1xuICAgICAgaWYgKCFjb250ZXh0Py52aWV3LmZpbGUpIHJldHVybjtcbiAgICAgIGNvbnN0IHNvdXJjZXMgPSBjb250ZXh0LmZtLnNvdXJjZXMgPz8gW107XG4gICAgICBpZiAoIXNvdXJjZXMubGVuZ3RoKSB7XG4gICAgICAgIG5ldyBOb3RpY2UoXCJObyBzb3VyY2VzIGF0dGFjaGVkIHRvIHRoaXMgbm90ZS4gQWRkIGEgcnVsZWJvb2sgZmlyc3QgdmlhIEFkZCBTb3VyY2UgRmlsZS5cIik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHJlZiA9IHNvdXJjZXMubGVuZ3RoID09PSAxXG4gICAgICAgID8gc291cmNlc1swXVxuICAgICAgICA6IGF3YWl0IHBpY2tTb3VyY2VSZWYocGx1Z2luLmFwcCwgXCJDaG9vc2UgYSBydWxlYm9vayBzb3VyY2VcIiwgc291cmNlcyk7XG4gICAgICBpZiAoIXJlZikgcmV0dXJuO1xuICAgICAgY29uc3QgdmFsdWVzID0gYXdhaXQgb3BlbklucHV0TW9kYWwocGx1Z2luLmFwcCwgXCJHZW5lcmF0ZSBDaGFyYWN0ZXJcIiwgW1xuICAgICAgICB7IGtleTogXCJjb25jZXB0XCIsIGxhYmVsOiBcIkNoYXJhY3RlciBjb25jZXB0XCIsIG9wdGlvbmFsOiB0cnVlLCBwbGFjZWhvbGRlcjogXCJMZWF2ZSBibGFuayBmb3IgYSByYW5kb20gY2hhcmFjdGVyLlwiIH1cbiAgICAgIF0pO1xuICAgICAgaWYgKCF2YWx1ZXMpIHJldHVybjtcbiAgICAgIGNvbnN0IHByb3ZpZGVySWQgPSBjb250ZXh0LmZtLnByb3ZpZGVyID8/IHBsdWdpbi5zZXR0aW5ncy5hY3RpdmVQcm92aWRlcjtcbiAgICAgIGxldCByZXNvbHZlZFNvdXJjZXM7XG4gICAgICB0cnkge1xuICAgICAgICByZXNvbHZlZFNvdXJjZXMgPSBhd2FpdCByZXNvbHZlU291cmNlc0ZvclJlcXVlc3QocGx1Z2luLmFwcCwgW3JlZl0sIHByb3ZpZGVySWQpO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgbmV3IE5vdGljZShgQ2Fubm90IHJlYWQgc291cmNlOiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKX1gKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY29uc3QgcnVsZXNldCA9IGNvbnRleHQuZm0ucnVsZXNldCA/PyBcInRoZSBnYW1lXCI7XG4gICAgICBjb25zdCBjb25jZXB0ID0gdmFsdWVzLmNvbmNlcHQ/LnRyaW0oKTtcbiAgICAgIGNvbnN0IGxvbmVsb2cgPSBpc0xvbmVsb2dBY3RpdmUocGx1Z2luLnNldHRpbmdzLCBjb250ZXh0LmZtKTtcbiAgICAgIGNvbnN0IGZvcm1hdEluc3RydWN0aW9uID0gbG9uZWxvZ1xuICAgICAgICA/IGBGb3JtYXQgdGhlIG91dHB1dCBhcyBhIExvbmVsb2cgUEMgdGFnLiBVc2UgdGhlIG11bHRpLWxpbmUgZm9ybSBmb3IgY29tcGxleCBjaGFyYWN0ZXJzOlxuW1BDOk5hbWVcbiAgfCBzdGF0OiBIUCBYLCBTdHJlc3MgWVxuICB8IGdlYXI6IGl0ZW0xLCBpdGVtMlxuICB8IHRyYWl0OiB2YWx1ZTEsIHZhbHVlMlxuXVxuSW5jbHVkZSBhbGwgc3RhdHMgYW5kIGZpZWxkcyBleGFjdGx5IGFzIGRlZmluZWQgYnkgdGhlIHJ1bGVzLiBPdXRwdXQgdGhlIHRhZyBvbmx5IFx1MjAxNCBubyBleHRyYSBjb21tZW50YXJ5LmBcbiAgICAgICAgOiBgSW5jbHVkZSBhbGwgcmVxdWlyZWQgZmllbGRzIGFzIGRlZmluZWQgYnkgdGhlIHJ1bGVzOiBuYW1lLCBzdGF0cy9hdHRyaWJ1dGVzLCBzdGFydGluZyBlcXVpcG1lbnQsIGJhY2tncm91bmQsIGFuZCBhbnkgb3RoZXIgbWFuZGF0b3J5IGNoYXJhY3RlciBlbGVtZW50cy4gRm9ybWF0IGNsZWFybHkgd2l0aCBvbmUgZmllbGQgcGVyIGxpbmUuYDtcbiAgICAgIGNvbnN0IHByb21wdCA9IGBVc2luZyBPTkxZIHRoZSBjaGFyYWN0ZXIgY3JlYXRpb24gcnVsZXMgaW4gdGhlIHByb3ZpZGVkIHNvdXJjZSBtYXRlcmlhbCwgZ2VuZXJhdGUgYSBjaGFyYWN0ZXIgZm9yIFwiJHtydWxlc2V0fVwiLlxuXG5Gb2xsb3cgdGhlIGV4YWN0IGNoYXJhY3RlciBjcmVhdGlvbiBwcm9jZWR1cmUgZGVzY3JpYmVkIGluIHRoZSBydWxlcy4gRG8gbm90IGludmVudCBtZWNoYW5pY3Mgbm90IHByZXNlbnQgaW4gdGhlIHNvdXJjZS5cblxuJHtjb25jZXB0ID8gYENoYXJhY3RlciBjb25jZXB0OiAke2NvbmNlcHR9YCA6IFwiR2VuZXJhdGUgYSByYW5kb20gY2hhcmFjdGVyLlwifVxuXG4ke2Zvcm1hdEluc3RydWN0aW9ufWA7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHBsdWdpbi5yZXF1ZXN0UmF3R2VuZXJhdGlvbihjb250ZXh0LmZtLCBwcm9tcHQsIDE1MDAsIHJlc29sdmVkU291cmNlcyk7XG4gICAgICAgIGNvbnN0IGluc2lkZUNvZGVCbG9jayA9IGlzSW5zaWRlQ29kZUJsb2NrKGNvbnRleHQudmlldy5lZGl0b3IpO1xuICAgICAgICBjb25zdCBvdXRwdXQgPSBsb25lbG9nXG4gICAgICAgICAgPyBmb3JtYXRDaGFyYWN0ZXIocmVzcG9uc2UudGV4dCwgbG9uZWxvZ09wdHMocGx1Z2luLnNldHRpbmdzLCBpbnNpZGVDb2RlQmxvY2spKVxuICAgICAgICAgIDogZ2VuZXJpY0Jsb2NrcXVvdGUoXCJDaGFyYWN0ZXJcIiwgcmVzcG9uc2UudGV4dCk7XG4gICAgICAgIHBsdWdpbi5pbnNlcnRUZXh0KGNvbnRleHQudmlldywgb3V0cHV0KTtcbiAgICAgICAgcGx1Z2luLm1heWJlSW5zZXJ0VG9rZW5Db21tZW50KGNvbnRleHQudmlldywgcmVzcG9uc2UpO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgbmV3IE5vdGljZShgQ2hvcnVzIGVycm9yOiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKX1gKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJzeWJ5bDpzdGFydC1zY2VuZVwiLFxuICAgIG5hbWU6IFwiU3RhcnQgU2NlbmVcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgY29udGV4dCA9IGF3YWl0IHBsdWdpbi5nZXRBY3RpdmVOb3RlQ29udGV4dCgpO1xuICAgICAgaWYgKCFjb250ZXh0Py52aWV3LmZpbGUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKGlzTG9uZWxvZ0FjdGl2ZShwbHVnaW4uc2V0dGluZ3MsIGNvbnRleHQuZm0pKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlcyA9IGF3YWl0IG9wZW5JbnB1dE1vZGFsKHBsdWdpbi5hcHAsIFwiU3RhcnQgU2NlbmVcIiwgW1xuICAgICAgICAgIHsga2V5OiBcInNjZW5lRGVzY1wiLCBsYWJlbDogXCJTY2VuZSBkZXNjcmlwdGlvblwiLCBwbGFjZWhvbGRlcjogXCJEYXJrIGFsbGV5LCBtaWRuaWdodFwiIH1cbiAgICAgICAgXSk7XG4gICAgICAgIGlmICghdmFsdWVzPy5zY2VuZURlc2MpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY291bnRlciA9IGNvbnRleHQuZm0uc2NlbmVfY291bnRlciA/PyAxO1xuICAgICAgICBhd2FpdCBydW5HZW5lcmF0aW9uKFxuICAgICAgICAgIHBsdWdpbixcbiAgICAgICAgICBgU1RBUlQgU0NFTkUuIEdlbmVyYXRlIG9ubHk6IDItMyBsaW5lcyBvZiB0aGlyZC1wZXJzb24gcGFzdC10ZW5zZSBwcm9zZSBkZXNjcmliaW5nIHRoZSBhdG1vc3BoZXJlIGFuZCBzZXR0aW5nIG9mOiBcIiR7dmFsdWVzLnNjZW5lRGVzY31cIi4gTm8gZGlhbG9ndWUuIE5vIFBDIGFjdGlvbnMuIE5vIGFkZGl0aW9uYWwgY29tbWVudGFyeS5gLFxuICAgICAgICAgICh0ZXh0LCBfZm0sIGluc2lkZUNvZGVCbG9jaykgPT4gZm9ybWF0U3RhcnRTY2VuZSh0ZXh0LCBgUyR7Y291bnRlcn1gLCB2YWx1ZXMuc2NlbmVEZXNjLCBsb25lbG9nT3B0cyhwbHVnaW4uc2V0dGluZ3MsIGluc2lkZUNvZGVCbG9jaykpXG4gICAgICAgICk7XG4gICAgICAgIGlmIChwbHVnaW4uc2V0dGluZ3MubG9uZWxvZ0F1dG9JbmNTY2VuZSkge1xuICAgICAgICAgIGF3YWl0IHdyaXRlRnJvbnRNYXR0ZXJLZXkocGx1Z2luLmFwcCwgY29udGV4dC52aWV3LmZpbGUsIFwic2NlbmVfY291bnRlclwiLCBjb3VudGVyICsgMSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgYXdhaXQgcnVuR2VuZXJhdGlvbihcbiAgICAgICAgcGx1Z2luLFxuICAgICAgICBcIlNUQVJUIFNDRU5FLiBHZW5lcmF0ZSBvbmx5OiAyLTMgbGluZXMgb2YgdGhpcmQtcGVyc29uIHBhc3QtdGVuc2UgcHJvc2UgZGVzY3JpYmluZyB0aGUgc2V0dGluZyBhbmQgYXRtb3NwaGVyZS4gTm8gZGlhbG9ndWUuIE5vIFBDIGFjdGlvbnMuIE5vIGFkZGl0aW9uYWwgY29tbWVudGFyeS5cIixcbiAgICAgICAgKHRleHQpID0+IGdlbmVyaWNCbG9ja3F1b3RlKFwiU2NlbmVcIiwgdGV4dClcbiAgICAgICk7XG4gICAgfVxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwic3lieWw6ZGVjbGFyZS1hY3Rpb25cIixcbiAgICBuYW1lOiBcIkRlY2xhcmUgQWN0aW9uXCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHZhbHVlcyA9IGF3YWl0IG9wZW5JbnB1dE1vZGFsKHBsdWdpbi5hcHAsIFwiRGVjbGFyZSBBY3Rpb25cIiwgW1xuICAgICAgICB7IGtleTogXCJhY3Rpb25cIiwgbGFiZWw6IFwiQWN0aW9uXCIgfSxcbiAgICAgICAgeyBrZXk6IFwicm9sbFwiLCBsYWJlbDogXCJSb2xsIHJlc3VsdFwiIH1cbiAgICAgIF0pO1xuICAgICAgaWYgKCF2YWx1ZXM/LmFjdGlvbiB8fCAhdmFsdWVzLnJvbGwpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgYXdhaXQgcnVuR2VuZXJhdGlvbihcbiAgICAgICAgcGx1Z2luLFxuICAgICAgICBgUEMgYWN0aW9uOiAke3ZhbHVlcy5hY3Rpb259XFxuUm9sbCByZXN1bHQ6ICR7dmFsdWVzLnJvbGx9XFxuRGVzY3JpYmUgb25seSB0aGUgY29uc2VxdWVuY2VzIGFuZCB3b3JsZCByZWFjdGlvbi4gRG8gbm90IGRlc2NyaWJlIHRoZSBQQydzIGFjdGlvbi5gLFxuICAgICAgICAodGV4dCwgZm0sIGluc2lkZUNvZGVCbG9jaykgPT5cbiAgICAgICAgICBpc0xvbmVsb2dBY3RpdmUocGx1Z2luLnNldHRpbmdzLCBmbSlcbiAgICAgICAgICAgID8gZm9ybWF0RGVjbGFyZUFjdGlvbih2YWx1ZXMuYWN0aW9uLCB2YWx1ZXMucm9sbCwgdGV4dCwgbG9uZWxvZ09wdHMocGx1Z2luLnNldHRpbmdzLCBpbnNpZGVDb2RlQmxvY2spKVxuICAgICAgICAgICAgOiBgPiBbQWN0aW9uXSAke3ZhbHVlcy5hY3Rpb259IHwgUm9sbDogJHt2YWx1ZXMucm9sbH1cXG4+IFtSZXN1bHRdICR7dGV4dC50cmltKCkucmVwbGFjZSgvXFxuL2csIFwiXFxuPiBcIil9YFxuICAgICAgKTtcbiAgICB9XG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJzeWJ5bDphc2stb3JhY2xlXCIsXG4gICAgbmFtZTogXCJBc2sgT3JhY2xlXCIsXG4gICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGNvbnRleHQgPSBhd2FpdCBwbHVnaW4uZ2V0QWN0aXZlTm90ZUNvbnRleHQoKTtcbiAgICAgIGlmICghY29udGV4dCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCB2YWx1ZXMgPSBhd2FpdCBvcGVuSW5wdXRNb2RhbChwbHVnaW4uYXBwLCBcIkFzayBPcmFjbGVcIiwgW1xuICAgICAgICB7IGtleTogXCJxdWVzdGlvblwiLCBsYWJlbDogXCJRdWVzdGlvblwiIH0sXG4gICAgICAgIHsga2V5OiBcInJlc3VsdFwiLCBsYWJlbDogXCJPcmFjbGUgcmVzdWx0XCIsIG9wdGlvbmFsOiB0cnVlIH1cbiAgICAgIF0pO1xuICAgICAgaWYgKCF2YWx1ZXM/LnF1ZXN0aW9uKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGhhc1Jlc3VsdCA9IEJvb2xlYW4odmFsdWVzLnJlc3VsdD8udHJpbSgpKTtcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSBoYXNSZXN1bHRcbiAgICAgICAgPyBgT3JhY2xlIHF1ZXN0aW9uOiAke3ZhbHVlcy5xdWVzdGlvbn1cXG5PcmFjbGUgcmVzdWx0OiAke3ZhbHVlcy5yZXN1bHR9XFxuSW50ZXJwcmV0IHRoaXMgcmVzdWx0IGluIHRoZSBjb250ZXh0IG9mIHRoZSBzY2VuZS4gVGhpcmQgcGVyc29uLCBuZXV0cmFsLCAyLTMgbGluZXMuYFxuICAgICAgICA6IGBPcmFjbGUgcXVlc3Rpb246ICR7dmFsdWVzLnF1ZXN0aW9ufVxcbk9yYWNsZSBtb2RlOiAke2NvbnRleHQuZm0ub3JhY2xlX21vZGUgPz8gXCJ5ZXMtbm9cIn1cXG5SdW4gdGhlIG9yYWNsZSBhbmQgZ2l2ZSB0aGUgcmVzdWx0IHBsdXMgYSAxLTIgbGluZSBuZXV0cmFsIGludGVycHJldGF0aW9uLmA7XG4gICAgICBhd2FpdCBydW5HZW5lcmF0aW9uKFxuICAgICAgICBwbHVnaW4sXG4gICAgICAgIG1lc3NhZ2UsXG4gICAgICAgICh0ZXh0LCBmbSwgaW5zaWRlQ29kZUJsb2NrKSA9PiB7XG4gICAgICAgICAgaWYgKCFpc0xvbmVsb2dBY3RpdmUocGx1Z2luLnNldHRpbmdzLCBmbSkpIHtcbiAgICAgICAgICAgIHJldHVybiBgPiBbT3JhY2xlXSBROiAke3ZhbHVlcy5xdWVzdGlvbn1cXG4+IFtBbnN3ZXJdICR7dGV4dC50cmltKCkucmVwbGFjZSgvXFxuL2csIFwiXFxuPiBcIil9YDtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGhhc1Jlc3VsdCkge1xuICAgICAgICAgICAgcmV0dXJuIGZvcm1hdEFza09yYWNsZSh2YWx1ZXMucXVlc3Rpb24sIHZhbHVlcy5yZXN1bHQudHJpbSgpLCB0ZXh0LCBsb25lbG9nT3B0cyhwbHVnaW4uc2V0dGluZ3MsIGluc2lkZUNvZGVCbG9jaykpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBwYXJzZWQgPSBwYXJzZUxvbmVsb2dPcmFjbGVSZXNwb25zZSh0ZXh0KTtcbiAgICAgICAgICByZXR1cm4gZm9ybWF0QXNrT3JhY2xlKHZhbHVlcy5xdWVzdGlvbiwgcGFyc2VkLnJlc3VsdCwgcGFyc2VkLmludGVycHJldGF0aW9uLCBsb25lbG9nT3B0cyhwbHVnaW4uc2V0dGluZ3MsIGluc2lkZUNvZGVCbG9jaykpO1xuICAgICAgICB9XG4gICAgICApO1xuICAgIH1cbiAgfSk7XG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcInN5YnlsOmludGVycHJldC1vcmFjbGVcIixcbiAgICBuYW1lOiBcIkludGVycHJldCBPcmFjbGUgUm9sbFwiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBjb250ZXh0ID0gYXdhaXQgcGx1Z2luLmdldEFjdGl2ZU5vdGVDb250ZXh0KCk7XG4gICAgICBpZiAoIWNvbnRleHQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgbGV0IHNlbGVjdGVkID0gZ2V0U2VsZWN0aW9uKGNvbnRleHQudmlldy5lZGl0b3IpO1xuICAgICAgaWYgKCFzZWxlY3RlZCkge1xuICAgICAgICBjb25zdCB2YWx1ZXMgPSBhd2FpdCBvcGVuSW5wdXRNb2RhbChwbHVnaW4uYXBwLCBcIkludGVycHJldCBPcmFjbGUgUmVzdWx0XCIsIFtcbiAgICAgICAgICB7IGtleTogXCJvcmFjbGVcIiwgbGFiZWw6IFwiT3JhY2xlIHJlc3VsdFwiIH1cbiAgICAgICAgXSk7XG4gICAgICAgIHNlbGVjdGVkID0gdmFsdWVzPy5vcmFjbGU/LnRyaW0oKSA/PyBcIlwiO1xuICAgICAgfVxuICAgICAgaWYgKCFzZWxlY3RlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBhd2FpdCBydW5HZW5lcmF0aW9uKFxuICAgICAgICBwbHVnaW4sXG4gICAgICAgIGBJbnRlcnByZXQgdGhpcyBvcmFjbGUgcmVzdWx0IGluIHRoZSBjb250ZXh0IG9mIHRoZSBjdXJyZW50IHNjZW5lOiBcIiR7c2VsZWN0ZWR9XCJcXG5OZXV0cmFsLCB0aGlyZC1wZXJzb24sIDItMyBsaW5lcy4gTm8gZHJhbWF0aWMgbGFuZ3VhZ2UuYCxcbiAgICAgICAgKHRleHQsIGZtLCBpbnNpZGVDb2RlQmxvY2spID0+XG4gICAgICAgICAgaXNMb25lbG9nQWN0aXZlKHBsdWdpbi5zZXR0aW5ncywgZm0pXG4gICAgICAgICAgICA/IGZvcm1hdEludGVycHJldE9yYWNsZSh0ZXh0LCBsb25lbG9nT3B0cyhwbHVnaW4uc2V0dGluZ3MsIGluc2lkZUNvZGVCbG9jaykpXG4gICAgICAgICAgICA6IGdlbmVyaWNCbG9ja3F1b3RlKFwiSW50ZXJwcmV0YXRpb25cIiwgdGV4dCksXG4gICAgICAgIDUxMixcbiAgICAgICAgXCJiZWxvdy1zZWxlY3Rpb25cIlxuICAgICAgKTtcbiAgICB9XG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJzeWJ5bDpzdWdnZXN0LWNvbnNlcXVlbmNlXCIsXG4gICAgbmFtZTogXCJXaGF0IE5vd1wiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBydW5HZW5lcmF0aW9uKFxuICAgICAgICBwbHVnaW4sXG4gICAgICAgIFwiQmFzZWQgb24gdGhlIGN1cnJlbnQgc2NlbmUgY29udGV4dCwgc3VnZ2VzdCAxLTIgcG9zc2libGUgY29uc2VxdWVuY2VzIG9yIGNvbXBsaWNhdGlvbnMuIFByZXNlbnQgdGhlbSBhcyBuZXV0cmFsIG9wdGlvbnMsIG5vdCBhcyBuYXJyYXRpdmUgb3V0Y29tZXMuIERvIG5vdCBjaG9vc2UgYmV0d2VlbiB0aGVtLlwiLFxuICAgICAgICAodGV4dCwgZm0sIGluc2lkZUNvZGVCbG9jaykgPT4ge1xuICAgICAgICAgIGlmIChpc1BhcnR5bG9nQWN0aXZlKHBsdWdpbi5zZXR0aW5ncywgZm0pKSB7XG4gICAgICAgICAgICByZXR1cm4gZm9ybWF0V2hhdE5vdyh0ZXh0LCBwYXJ0eWxvZ09wdHMocGx1Z2luLnNldHRpbmdzLCBpbnNpZGVDb2RlQmxvY2spKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGlzTG9uZWxvZ0FjdGl2ZShwbHVnaW4uc2V0dGluZ3MsIGZtKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZvcm1hdFN1Z2dlc3RDb25zZXF1ZW5jZSh0ZXh0LCBsb25lbG9nT3B0cyhwbHVnaW4uc2V0dGluZ3MsIGluc2lkZUNvZGVCbG9jaykpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gZ2VuZXJpY0Jsb2NrcXVvdGUoXCJPcHRpb25zXCIsIHRleHQpO1xuICAgICAgICB9XG4gICAgICApO1xuICAgIH1cbiAgfSk7XG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcInN5YnlsOndoYXQtY2FuLWktZG9cIixcbiAgICBuYW1lOiBcIldoYXQgQ2FuIEkgRG9cIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgY29udGV4dCA9IGF3YWl0IHBsdWdpbi5nZXRBY3RpdmVOb3RlQ29udGV4dCgpO1xuICAgICAgaWYgKCFjb250ZXh0KSByZXR1cm47XG5cbiAgICAgIGlmIChpc1BhcnR5bG9nQWN0aXZlKHBsdWdpbi5zZXR0aW5ncywgY29udGV4dC5mbSkpIHtcbiAgICAgICAgY29uc3QgdmFsdWVzID0gYXdhaXQgb3BlbklucHV0TW9kYWwocGx1Z2luLmFwcCwgXCJXaGF0IENhbiBJIERvXCIsIFtcbiAgICAgICAgICB7IGtleTogXCJjaGFyYWN0ZXJcIiwgbGFiZWw6IFwiQ2hhcmFjdGVyIG5hbWVcIiwgb3B0aW9uYWw6IHRydWUsIHBsYWNlaG9sZGVyOiBcIkxlYXZlIGJsYW5rIGZvciBwYXJ0eS1sZXZlbCBvcHRpb25zXCIgfVxuICAgICAgICBdKTtcbiAgICAgICAgaWYgKCF2YWx1ZXMpIHJldHVybjtcbiAgICAgICAgY29uc3QgY2hhcmFjdGVyID0gdmFsdWVzLmNoYXJhY3Rlcj8udHJpbSgpO1xuICAgICAgICBjb25zdCB1c2VyTWVzc2FnZSA9IGNoYXJhY3RlclxuICAgICAgICAgID8gYENoYXJhY3RlcjogJHtjaGFyYWN0ZXJ9XFxuTGlzdCAyLTQgYXZhaWxhYmxlIGFjdGlvbnMgb3IgbW92ZXMgZm9yIHRoaXMgY2hhcmFjdGVyIGdpdmVuIHRoZSBjdXJyZW50IHNjZW5lLlxcblByZXNlbnQgYXMgbmV1dHJhbCBvcHRpb25zLiBEbyBub3QgY2hvb3NlIGJldHdlZW4gdGhlbS5gXG4gICAgICAgICAgOiBcIlRoZSBwYXJ0eSBpcyBzdHVjay4gQmFzZWQgb24gdGhlIGN1cnJlbnQgc2NlbmUgY29udGV4dCwgc3VnZ2VzdCBleGFjdGx5IDMtNCBjb25jcmV0ZSBhY3Rpb25zIHRoZSBwYXJ0eSBjb3VsZCB0YWtlIG5leHQuIFByZXNlbnQgdGhlbSBhcyBuZXV0cmFsIG9wdGlvbnMuIERvIG5vdCBjaG9vc2UgYmV0d2VlbiB0aGVtLlwiO1xuICAgICAgICBjb25zdCBpbnNpZGVDb2RlQmxvY2sgPSBpc0luc2lkZUNvZGVCbG9jayhjb250ZXh0LnZpZXcuZWRpdG9yKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHBsdWdpbi5yZXF1ZXN0R2VuZXJhdGlvbihjb250ZXh0LmZtLCBjb250ZXh0Lm5vdGVCb2R5LCB1c2VyTWVzc2FnZSwgNTEyKTtcbiAgICAgICAgICBwbHVnaW4uaW5zZXJ0VGV4dChjb250ZXh0LnZpZXcsIGdlbmVyaWNCbG9ja3F1b3RlKFwiQWN0aW9uc1wiLCByZXNwb25zZS50ZXh0KSk7XG4gICAgICAgICAgcGx1Z2luLm1heWJlSW5zZXJ0VG9rZW5Db21tZW50KGNvbnRleHQudmlldywgcmVzcG9uc2UpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIG5ldyBOb3RpY2UoYENob3J1cyBlcnJvcjogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcil9YCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBhd2FpdCBydW5HZW5lcmF0aW9uKFxuICAgICAgICBwbHVnaW4sXG4gICAgICAgIFwiVGhlIHBsYXllciBpcyBzdHVjay4gQmFzZWQgb24gdGhlIGN1cnJlbnQgc2NlbmUgY29udGV4dCwgc3VnZ2VzdCBleGFjdGx5IDMgY29uY3JldGUgYWN0aW9ucyB0aGUgUEMgY291bGQgdGFrZSBuZXh0LiBQcmVzZW50IHRoZW0gYXMgbmV1dHJhbCBvcHRpb25zIG51bWJlcmVkIDFcdTIwMTMzLiBEbyBub3QgcmVzb2x2ZSBvciBuYXJyYXRlIGFueSBvdXRjb21lLiBEbyBub3QgcmVjb21tZW5kIG9uZSBvdmVyIGFub3RoZXIuXCIsXG4gICAgICAgICh0ZXh0LCBmbSwgaW5zaWRlQ29kZUJsb2NrKSA9PlxuICAgICAgICAgIGlzTG9uZWxvZ0FjdGl2ZShwbHVnaW4uc2V0dGluZ3MsIGZtKVxuICAgICAgICAgICAgPyBmb3JtYXRTdWdnZXN0Q29uc2VxdWVuY2UodGV4dCwgbG9uZWxvZ09wdHMocGx1Z2luLnNldHRpbmdzLCBpbnNpZGVDb2RlQmxvY2spKVxuICAgICAgICAgICAgOiBnZW5lcmljQmxvY2txdW90ZShcIkFjdGlvbnNcIiwgdGV4dClcbiAgICAgICk7XG4gICAgfVxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwic3lieWw6ZXhwYW5kLXNjZW5lXCIsXG4gICAgbmFtZTogXCJFeHBhbmQgU2NlbmVcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgcnVuR2VuZXJhdGlvbihcbiAgICAgICAgcGx1Z2luLFxuICAgICAgICBcIkV4cGFuZCB0aGUgY3VycmVudCBzY2VuZSBpbnRvIGEgcHJvc2UgcGFzc2FnZS4gVGhpcmQgcGVyc29uLCBwYXN0IHRlbnNlLCAxMDAtMTUwIHdvcmRzLiBObyBkaWFsb2d1ZS4gRG8gbm90IGRlc2NyaWJlIHRoZSBQQydzIGludGVybmFsIHRob3VnaHRzIG9yIGRlY2lzaW9ucy4gU3RheSBzdHJpY3RseSB3aXRoaW4gdGhlIGVzdGFibGlzaGVkIHNjZW5lIGNvbnRleHQuXCIsXG4gICAgICAgICh0ZXh0LCBmbSwgaW5zaWRlQ29kZUJsb2NrKSA9PiB7XG4gICAgICAgICAgaWYgKGlzUGFydHlsb2dBY3RpdmUocGx1Z2luLnNldHRpbmdzLCBmbSkpIHtcbiAgICAgICAgICAgIHJldHVybiBmb3JtYXRQYXJ0eWxvZ0V4cGFuZFNjZW5lKHRleHQsIHBhcnR5bG9nT3B0cyhwbHVnaW4uc2V0dGluZ3MsIGluc2lkZUNvZGVCbG9jaykpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoaXNMb25lbG9nQWN0aXZlKHBsdWdpbi5zZXR0aW5ncywgZm0pKSB7XG4gICAgICAgICAgICByZXR1cm4gZm9ybWF0RXhwYW5kU2NlbmUodGV4dCwgbG9uZWxvZ09wdHMocGx1Z2luLnNldHRpbmdzLCBpbnNpZGVDb2RlQmxvY2spKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGAtLS1cXG4+IFtQcm9zZV0gJHt0ZXh0LnRyaW0oKS5yZXBsYWNlKC9cXG4vZywgXCJcXG4+IFwiKX1cXG4tLS1gO1xuICAgICAgICB9LFxuICAgICAgICA2MDBcbiAgICAgICk7XG4gICAgfVxuICB9KTtcblxuICAvLyBcdTI1MDBcdTI1MDAgU291cmNlIG1hbmFnZW1lbnQgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcInN5YnlsOnVwbG9hZC1zb3VyY2VcIixcbiAgICBuYW1lOiBcIkFkZCBTb3VyY2UgRmlsZVwiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBjb250ZXh0ID0gYXdhaXQgcGx1Z2luLmdldEFjdGl2ZU5vdGVDb250ZXh0KCk7XG4gICAgICBpZiAoIWNvbnRleHQ/LnZpZXcuZmlsZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBhZGRTb3VyY2VUb05vdGUocGx1Z2luLCBjb250ZXh0LnZpZXcuZmlsZSk7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBuZXcgTm90aWNlKGBDaG9ydXMgZXJyb3I6ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpfWApO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcInN5YnlsOm1hbmFnZS1zb3VyY2VzXCIsXG4gICAgbmFtZTogXCJNYW5hZ2UgU291cmNlc1wiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBtYW5hZ2VTb3VyY2VzKHBsdWdpbik7XG4gICAgfVxuICB9KTtcblxuICAvLyBcdTI1MDBcdTI1MDAgTG9uZWxvZyBjb21tYW5kcyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwic3lieWw6bG9uZWxvZy1wYXJzZS1jb250ZXh0XCIsXG4gICAgbmFtZTogXCJVcGRhdGUgU2NlbmUgQ29udGV4dFwiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBjb250ZXh0ID0gYXdhaXQgcGx1Z2luLmdldEFjdGl2ZU5vdGVDb250ZXh0KCk7XG4gICAgICBpZiAoIWNvbnRleHQ/LnZpZXcuZmlsZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoIWlzTG9uZWxvZ0FjdGl2ZShwbHVnaW4uc2V0dGluZ3MsIGNvbnRleHQuZm0pKSB7XG4gICAgICAgIG5ldyBOb3RpY2UoXCJMb25lbG9nIG1vZGUgaXMgbm90IGVuYWJsZWQgZm9yIHRoaXMgbm90ZS5cIik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlTG9uZWxvZ0NvbnRleHQoY29udGV4dC5ub3RlQm9keSwgcGx1Z2luLnNldHRpbmdzLmxvbmVsb2dDb250ZXh0RGVwdGgpO1xuICAgICAgYXdhaXQgd3JpdGVGcm9udE1hdHRlcktleShwbHVnaW4uYXBwLCBjb250ZXh0LnZpZXcuZmlsZSwgXCJzY2VuZV9jb250ZXh0XCIsIHNlcmlhbGl6ZUNvbnRleHQocGFyc2VkKSk7XG4gICAgICBuZXcgTm90aWNlKFwiU2NlbmUgY29udGV4dCB1cGRhdGVkIGZyb20gbG9nLlwiKTtcbiAgICB9XG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJzeWJ5bDpsb25lbG9nLXNlc3Npb24tYnJlYWtcIixcbiAgICBuYW1lOiBcIk5ldyBTZXNzaW9uIEhlYWRlclwiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBjb250ZXh0ID0gYXdhaXQgcGx1Z2luLmdldEFjdGl2ZU5vdGVDb250ZXh0KCk7XG4gICAgICBpZiAoIWNvbnRleHQ/LnZpZXcuZmlsZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoIWlzTG9uZWxvZ0FjdGl2ZShwbHVnaW4uc2V0dGluZ3MsIGNvbnRleHQuZm0pKSB7XG4gICAgICAgIG5ldyBOb3RpY2UoXCJMb25lbG9nIG1vZGUgaXMgbm90IGVuYWJsZWQgZm9yIHRoaXMgbm90ZS5cIik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHZhbHVlcyA9IGF3YWl0IG9wZW5JbnB1dE1vZGFsKHBsdWdpbi5hcHAsIFwiTmV3IFNlc3Npb24gSGVhZGVyXCIsIFtcbiAgICAgICAgeyBrZXk6IFwiZGF0ZVwiLCBsYWJlbDogXCJEYXRlXCIsIHZhbHVlOiB0b2RheUlzb0RhdGUoKSB9LFxuICAgICAgICB7IGtleTogXCJkdXJhdGlvblwiLCBsYWJlbDogXCJEdXJhdGlvblwiLCBwbGFjZWhvbGRlcjogXCIxaDMwXCIgfSxcbiAgICAgICAgeyBrZXk6IFwicmVjYXBcIiwgbGFiZWw6IFwiUmVjYXBcIiwgb3B0aW9uYWw6IHRydWUgfVxuICAgICAgXSk7XG4gICAgICBpZiAoIXZhbHVlcz8uZGF0ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCBzZXNzaW9uTnVtYmVyID0gY29udGV4dC5mbS5zZXNzaW9uX251bWJlciA/PyAxO1xuICAgICAgY29uc3QgYmxvY2sgPSBgIyMgU2Vzc2lvbiAke3Nlc3Npb25OdW1iZXJ9XFxuKkRhdGU6ICR7dmFsdWVzLmRhdGV9IHwgRHVyYXRpb246ICR7dmFsdWVzLmR1cmF0aW9uIHx8IFwiLVwifSpcXG5cXG4ke3ZhbHVlcy5yZWNhcCA/IGAqKlJlY2FwOioqICR7dmFsdWVzLnJlY2FwfVxcblxcbmAgOiBcIlwifWA7XG4gICAgICBwbHVnaW4uaW5zZXJ0VGV4dChjb250ZXh0LnZpZXcsIGJsb2NrLCBcImN1cnNvclwiKTtcbiAgICAgIGF3YWl0IHdyaXRlRnJvbnRNYXR0ZXJLZXkocGx1Z2luLmFwcCwgY29udGV4dC52aWV3LmZpbGUsIFwic2Vzc2lvbl9udW1iZXJcIiwgc2Vzc2lvbk51bWJlciArIDEpO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gXHUyNTAwXHUyNTAwIFBhcnR5bG9nIGNvbW1hbmRzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJjaG9ydXM6cGFydHlsb2ctbmV3LXNjZW5lXCIsXG4gICAgbmFtZTogXCJDaG9ydXM6IE5ldyBTY2VuZVwiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBjb250ZXh0ID0gYXdhaXQgcGx1Z2luLmdldEFjdGl2ZU5vdGVDb250ZXh0KCk7XG4gICAgICBpZiAoIWNvbnRleHQ/LnZpZXcuZmlsZSkgcmV0dXJuO1xuICAgICAgaWYgKCFpc1BhcnR5bG9nQWN0aXZlKHBsdWdpbi5zZXR0aW5ncywgY29udGV4dC5mbSkpIHtcbiAgICAgICAgbmV3IE5vdGljZShcIlBhcnR5bG9nIG1vZGUgaXMgbm90IGVuYWJsZWQgZm9yIHRoaXMgbm90ZS5cIik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHZhbHVlcyA9IGF3YWl0IG9wZW5JbnB1dE1vZGFsKHBsdWdpbi5hcHAsIFwiTmV3IFNjZW5lXCIsIFtcbiAgICAgICAgeyBrZXk6IFwic2NlbmVEZXNjXCIsIGxhYmVsOiBcIlNjZW5lIGRlc2NyaXB0aW9uXCIsIHBsYWNlaG9sZGVyOiBcIlRoZSBidXJuaW5nIG1pbGwgYXQgdGhlIGVkZ2Ugb2YgdG93blwiIH0sXG4gICAgICAgIHsga2V5OiBcInRocmVhZElkXCIsIGxhYmVsOiBcIlRocmVhZCBJRFwiLCBvcHRpb25hbDogdHJ1ZSwgcGxhY2Vob2xkZXI6IFwiVDIgXHUyMDE0IGxlYXZlIGJsYW5rIGZvciBzdGFuZGFyZCBzY2VuZVwiIH1cbiAgICAgIF0pO1xuICAgICAgaWYgKCF2YWx1ZXM/LnNjZW5lRGVzYykgcmV0dXJuO1xuXG4gICAgICBjb25zdCBjb3VudGVyID0gY29udGV4dC5mbS5zY2VuZV9jb3VudGVyID8/IDE7XG4gICAgICBjb25zdCB0aHJlYWRJZCA9IHZhbHVlcy50aHJlYWRJZD8udHJpbSgpO1xuICAgICAgY29uc3Qgc2NlbmVJZCA9IHRocmVhZElkID8gYCR7dGhyZWFkSWR9LVMke2NvdW50ZXJ9YCA6IGBTJHtjb3VudGVyfWA7XG4gICAgICBjb25zdCBvcHRzID0gcGFydHlsb2dPcHRzKHBsdWdpbi5zZXR0aW5ncyk7XG5cbiAgICAgIGF3YWl0IHJ1bkdlbmVyYXRpb24oXG4gICAgICAgIHBsdWdpbixcbiAgICAgICAgYFNUQVJUIFNDRU5FLiBHZW5lcmF0ZSBvbmx5OiAyLTMgbGluZXMgb2YgdGhpcmQtcGVyc29uIHBhc3QtdGVuc2UgcHJvc2UgZGVzY3JpYmluZyB0aGUgYXRtb3NwaGVyZSBhbmQgc2V0dGluZyBvZjogXCIke3ZhbHVlcy5zY2VuZURlc2N9XCIuIE5vIGRpYWxvZ3VlLiBObyBQQyBhY3Rpb25zLiBObyBhZGRpdGlvbmFsIGNvbW1lbnRhcnkuYCxcbiAgICAgICAgKHRleHQsIF9mbSwgaW5zaWRlQ29kZUJsb2NrKSA9PlxuICAgICAgICAgIGZvcm1hdFBhcnR5bG9nU3RhcnRTY2VuZSh0ZXh0LCBzY2VuZUlkLCB2YWx1ZXMuc2NlbmVEZXNjLCBwYXJ0eWxvZ09wdHMocGx1Z2luLnNldHRpbmdzLCBpbnNpZGVDb2RlQmxvY2spKVxuICAgICAgKTtcbiAgICAgIGlmIChwbHVnaW4uc2V0dGluZ3MucGFydHlsb2dBdXRvSW5jU2NlbmUpIHtcbiAgICAgICAgYXdhaXQgd3JpdGVGcm9udE1hdHRlcktleShwbHVnaW4uYXBwLCBjb250ZXh0LnZpZXcuZmlsZSwgXCJzY2VuZV9jb3VudGVyXCIsIGNvdW50ZXIgKyAxKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJjaG9ydXM6cGFydHlsb2ctZGVjbGFyZS1hY3Rpb25cIixcbiAgICBuYW1lOiBcIkNob3J1czogRGVjbGFyZSBBY3Rpb25cIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgY29udGV4dCA9IGF3YWl0IHBsdWdpbi5nZXRBY3RpdmVOb3RlQ29udGV4dCgpO1xuICAgICAgaWYgKCFjb250ZXh0Py52aWV3LmZpbGUpIHJldHVybjtcbiAgICAgIGlmICghaXNQYXJ0eWxvZ0FjdGl2ZShwbHVnaW4uc2V0dGluZ3MsIGNvbnRleHQuZm0pKSB7XG4gICAgICAgIG5ldyBOb3RpY2UoXCJQYXJ0eWxvZyBtb2RlIGlzIG5vdCBlbmFibGVkIGZvciB0aGlzIG5vdGUuXCIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCB2YWx1ZXMgPSBhd2FpdCBvcGVuSW5wdXRNb2RhbChwbHVnaW4uYXBwLCBcIkRlY2xhcmUgQWN0aW9uXCIsIFtcbiAgICAgICAgeyBrZXk6IFwiY2hhcmFjdGVyXCIsIGxhYmVsOiBcIkNoYXJhY3RlclwiIH0sXG4gICAgICAgIHsga2V5OiBcImFjdGlvblwiLCBsYWJlbDogXCJBY3Rpb25cIiB9LFxuICAgICAgICB7IGtleTogXCJyb2xsXCIsIGxhYmVsOiBcIlJvbGwgcmVzdWx0XCIgfSxcbiAgICAgICAgeyBrZXk6IFwiY29sbGFib3JhdG9yXCIsIGxhYmVsOiBcIkNvbGxhYm9yYXRvclwiLCBvcHRpb25hbDogdHJ1ZSwgcGxhY2Vob2xkZXI6IFwiTmFtZSBcdTIwMTQgZm9yIEAoQSA+IEIpIHBhdHRlcm5cIiB9XG4gICAgICBdKTtcbiAgICAgIGlmICghdmFsdWVzPy5jaGFyYWN0ZXIgfHwgIXZhbHVlcy5hY3Rpb24gfHwgIXZhbHVlcy5yb2xsKSByZXR1cm47XG5cbiAgICAgIGNvbnN0IHBhcnR5ID0gY29udGV4dC5mbS5wYXJ0eSA/PyBbXTtcbiAgICAgIGlmIChwYXJ0eS5sZW5ndGggJiYgIXBhcnR5LnNvbWUoKG0pID0+IG0ubmFtZSA9PT0gdmFsdWVzLmNoYXJhY3RlcikpIHtcbiAgICAgICAgbmV3IE5vdGljZShgQ2hhcmFjdGVyICcke3ZhbHVlcy5jaGFyYWN0ZXJ9JyBub3QgZm91bmQgaW4gcGFydHkgcm9zdGVyLiBDaGVjayBmcm9udG1hdHRlci5gKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBjb2xsYWJvcmF0b3IgPSB2YWx1ZXMuY29sbGFib3JhdG9yPy50cmltKCk7XG4gICAgICBjb25zdCB1c2VyTWVzc2FnZSA9IGBDaGFyYWN0ZXI6ICR7dmFsdWVzLmNoYXJhY3Rlcn1cXG5BY3Rpb246ICR7dmFsdWVzLmFjdGlvbn1cXG5Sb2xsIHJlc3VsdDogJHt2YWx1ZXMucm9sbH1cXG5EZXNjcmliZSBvbmx5IHRoZSBjb25zZXF1ZW5jZXMgYW5kIHdvcmxkIHJlYWN0aW9uLlxcbkRvIG5vdCBkZXNjcmliZSB0aGUgY2hhcmFjdGVyJ3MgYWN0aW9uIG9yIGludGVybmFsIHN0YXRlLmA7XG5cbiAgICAgIGF3YWl0IHJ1bkdlbmVyYXRpb24oXG4gICAgICAgIHBsdWdpbixcbiAgICAgICAgdXNlck1lc3NhZ2UsXG4gICAgICAgICh0ZXh0LCBfZm0sIGluc2lkZUNvZGVCbG9jaykgPT4ge1xuICAgICAgICAgIGNvbnN0IG9wdHMgPSBwYXJ0eWxvZ09wdHMocGx1Z2luLnNldHRpbmdzLCBpbnNpZGVDb2RlQmxvY2spO1xuICAgICAgICAgIHJldHVybiBjb2xsYWJvcmF0b3JcbiAgICAgICAgICAgID8gZm9ybWF0Q29sbGFib3JhdGl2ZUFjdGlvbih2YWx1ZXMuY2hhcmFjdGVyLCBjb2xsYWJvcmF0b3IsIHZhbHVlcy5hY3Rpb24sIHZhbHVlcy5yb2xsLCB0ZXh0LCBvcHRzKVxuICAgICAgICAgICAgOiBmb3JtYXRQYXJ0eWxvZ0RlY2xhcmVBY3Rpb24odmFsdWVzLmNoYXJhY3RlciwgdmFsdWVzLmFjdGlvbiwgdmFsdWVzLnJvbGwsIHRleHQsIG9wdHMpO1xuICAgICAgICB9XG4gICAgICApO1xuICAgIH1cbiAgfSk7XG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcImNob3J1czpwYXJ0eWxvZy1nbS1ldmVudFwiLFxuICAgIG5hbWU6IFwiQ2hvcnVzOiBMb2cgR00gRXZlbnRcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgY29udGV4dCA9IGF3YWl0IHBsdWdpbi5nZXRBY3RpdmVOb3RlQ29udGV4dCgpO1xuICAgICAgaWYgKCFjb250ZXh0Py52aWV3LmZpbGUpIHJldHVybjtcbiAgICAgIGlmICghaXNQYXJ0eWxvZ0FjdGl2ZShwbHVnaW4uc2V0dGluZ3MsIGNvbnRleHQuZm0pKSB7XG4gICAgICAgIG5ldyBOb3RpY2UoXCJQYXJ0eWxvZyBtb2RlIGlzIG5vdCBlbmFibGVkIGZvciB0aGlzIG5vdGUuXCIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCB2YWx1ZXMgPSBhd2FpdCBvcGVuSW5wdXRNb2RhbChwbHVnaW4uYXBwLCBcIkxvZyBHTSBFdmVudFwiLCBbXG4gICAgICAgIHsga2V5OiBcImV2ZW50XCIsIGxhYmVsOiBcIkV2ZW50XCIgfSxcbiAgICAgICAgeyBrZXk6IFwiY29uc2VxdWVuY2VcIiwgbGFiZWw6IFwiR2VuZXJhdGUgY29uc2VxdWVuY2U/XCIsIG9wdGlvbmFsOiB0cnVlLCB2YWx1ZTogXCJ5ZXNcIiwgcGxhY2Vob2xkZXI6IFwiQ2xlYXIgdG8gc2tpcFwiIH1cbiAgICAgIF0pO1xuICAgICAgaWYgKCF2YWx1ZXM/LmV2ZW50KSByZXR1cm47XG5cbiAgICAgIGNvbnN0IGdlbmVyYXRlQ29uc2VxdWVuY2UgPSBCb29sZWFuKHZhbHVlcy5jb25zZXF1ZW5jZT8udHJpbSgpKTtcblxuICAgICAgaWYgKCFnZW5lcmF0ZUNvbnNlcXVlbmNlKSB7XG4gICAgICAgIHBsdWdpbi5pbnNlcnRUZXh0KGNvbnRleHQudmlldywgYCEgJHt2YWx1ZXMuZXZlbnR9YCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgYXdhaXQgcnVuR2VuZXJhdGlvbihcbiAgICAgICAgcGx1Z2luLFxuICAgICAgICBgR00gZXZlbnQ6ICR7dmFsdWVzLmV2ZW50fVxcbkRlc2NyaWJlIDEtMiBjb25zZXF1ZW5jZXMgb3IgcmVhY3Rpb25zIGZyb20gdGhlIHdvcmxkIG9yIE5QQ3MuXFxuVGhpcmQgcGVyc29uLCBuZXV0cmFsLCBwcmVzZW50IHRlbnNlIGZvciB3b3JsZCBzdGF0ZS5cXG5EbyBub3QgZGVzY3JpYmUgYW55IFBDJ3MgcmVhY3Rpb24gb3IgZGVjaXNpb24uYCxcbiAgICAgICAgKHRleHQsIF9mbSwgaW5zaWRlQ29kZUJsb2NrKSA9PlxuICAgICAgICAgIGZvcm1hdEdNRXZlbnQodmFsdWVzLmV2ZW50LCB0ZXh0LCBwYXJ0eWxvZ09wdHMocGx1Z2luLnNldHRpbmdzLCBpbnNpZGVDb2RlQmxvY2spKVxuICAgICAgKTtcbiAgICB9XG4gIH0pO1xuXG4gIHBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICBpZDogXCJjaG9ydXM6cGFydHlsb2ctbG9nLXRoaXNcIixcbiAgICBuYW1lOiBcIkNob3J1czogTG9nIFRoaXNcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgY29udGV4dCA9IGF3YWl0IHBsdWdpbi5nZXRBY3RpdmVOb3RlQ29udGV4dCgpO1xuICAgICAgaWYgKCFjb250ZXh0Py52aWV3LmZpbGUpIHJldHVybjtcbiAgICAgIGlmICghaXNQYXJ0eWxvZ0FjdGl2ZShwbHVnaW4uc2V0dGluZ3MsIGNvbnRleHQuZm0pKSB7XG4gICAgICAgIG5ldyBOb3RpY2UoXCJQYXJ0eWxvZyBtb2RlIGlzIG5vdCBlbmFibGVkIGZvciB0aGlzIG5vdGUuXCIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCBwYXJ0eSA9IGNvbnRleHQuZm0ucGFydHk7XG4gICAgICBpZiAoIXBhcnR5Py5sZW5ndGgpIHtcbiAgICAgICAgbmV3IE5vdGljZShcIk5vIHBhcnR5IHJvc3RlciBmb3VuZC4gQWRkIGEgcGFydHk6IGZpZWxkIHRvIHRoaXMgbm90ZSdzIGZyb250bWF0dGVyLlwiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCByb3N0ZXIgPSBwYXJ0eS5tYXAoKG0pID0+IGAtICR7bS5uYW1lfTogJHttLm5vdGVzfWApLmpvaW4oXCJcXG5cIik7XG5cbiAgICAgIGNvbnN0IHNlbGVjdGVkID0gZ2V0U2VsZWN0aW9uKGNvbnRleHQudmlldy5lZGl0b3IpO1xuICAgICAgbGV0IHJhd05vdGVzOiBzdHJpbmc7XG4gICAgICBsZXQgZnJvbVNlbGVjdGlvbjogYm9vbGVhbjtcblxuICAgICAgaWYgKHNlbGVjdGVkKSB7XG4gICAgICAgIHJhd05vdGVzID0gc2VsZWN0ZWQ7XG4gICAgICAgIGZyb21TZWxlY3Rpb24gPSB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgdmFsdWVzID0gYXdhaXQgb3BlbklucHV0TW9kYWwocGx1Z2luLmFwcCwgXCJMb2cgVGhpcyBcdTIwMTQgUmF3IFNlc3Npb24gTm90ZXNcIiwgW1xuICAgICAgICAgIHsga2V5OiBcIm5vdGVzXCIsIGxhYmVsOiBcIlJhdyBub3Rlc1wiLCB0ZXh0YXJlYTogdHJ1ZSwgcGxhY2Vob2xkZXI6IFwiUGFzdGUgb3IgdHlwZSB5b3VyIHJhdyBzZXNzaW9uIG5vdGVzIGhlcmVcdTIwMjZcIiB9XG4gICAgICAgIF0pO1xuICAgICAgICBpZiAoIXZhbHVlcz8ubm90ZXM/LnRyaW0oKSkgcmV0dXJuO1xuICAgICAgICByYXdOb3RlcyA9IHZhbHVlcy5ub3RlcztcbiAgICAgICAgZnJvbVNlbGVjdGlvbiA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBpZiAocmF3Tm90ZXMubGVuZ3RoID4gNDAwMCkge1xuICAgICAgICBuZXcgTm90aWNlKFwiUmF3IG5vdGVzIHRvbyBsb25nIGZvciBhIHNpbmdsZSByZXF1ZXN0LiBTcGxpdCBpbnRvIHNtYWxsZXIgYmxvY2tzLlwiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB1c2VyTWVzc2FnZSA9IGBDb252ZXJ0IHRoZXNlIHJhdyBzZXNzaW9uIG5vdGVzIGludG8gdmFsaWQgUGFydHlsb2cgbm90YXRpb24uXG5cblBBUlRZIFJPU1RFUiAodXNlIHRoZXNlIGV4YWN0IG5hbWVzIGZvciBAKE5hbWUpIGF0dHJpYnV0aW9uKTpcbiR7cm9zdGVyfVxuXG5SQVcgTk9URVM6XG4ke3Jhd05vdGVzfVxuXG5SdWxlczpcbi0gVXNlIEAoTmFtZSkgZm9yIGVhY2ggcGxheWVyIGFjdGlvbiwgYXR0cmlidXRlZCB0byB0aGUgY29ycmVjdCBjaGFyYWN0ZXJcbi0gVXNlICEgZm9yIEdNLWludHJvZHVjZWQgZXZlbnRzXG4tIFVzZSBkOiBmb3IgZGljZSByb2xscyB3aXRoIHRoZWlyIHJlc3VsdHNcbi0gVXNlIC0+IGZvciByZXNvbHV0aW9uIG91dGNvbWVzXG4tIFVzZSA9PiBmb3IgY29uc2VxdWVuY2VzIChvbmUgcGVyIGxpbmUpXG4tIFByZXNlcnZlIHRoZSBzZXF1ZW5jZSBvZiBldmVudHMgZXhhY3RseVxuLSBEbyBub3QgaW52ZW50IGV2ZW50cyBub3QgcHJlc2VudCBpbiB0aGUgcmF3IG5vdGVzXG4tIERvIG5vdCBhZGQgW046XSwgW0w6XSwgb3Igb3RoZXIgdHJhY2tpbmcgdGFncyBcdTIwMTQgdGhlIHNjcmliZSB3aWxsIGFkZCB0aG9zZVxuLSBPdXRwdXQgb25seSB0aGUgUGFydHlsb2cgbm90YXRpb24gbGluZXMsIG5vdGhpbmcgZWxzZWA7XG5cbiAgICAgIGNvbnN0IGluc2lkZUNvZGVCbG9jayA9IGlzSW5zaWRlQ29kZUJsb2NrKGNvbnRleHQudmlldy5lZGl0b3IpO1xuICAgICAgY29uc3Qgb3B0cyA9IHBhcnR5bG9nT3B0cyhwbHVnaW4uc2V0dGluZ3MsIGluc2lkZUNvZGVCbG9jayk7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcGx1Z2luLnJlcXVlc3RHZW5lcmF0aW9uKGNvbnRleHQuZm0sIGNvbnRleHQubm90ZUJvZHksIHVzZXJNZXNzYWdlLCA4MDApO1xuICAgICAgICBjb25zdCBmb3JtYXR0ZWQgPSBmb3JtYXRMb2dUaGlzKHJlc3BvbnNlLnRleHQsIG9wdHMpO1xuICAgICAgICBpZiAoZnJvbVNlbGVjdGlvbikge1xuICAgICAgICAgIGluc2VydEJlbG93U2VsZWN0aW9uKGNvbnRleHQudmlldy5lZGl0b3IsIGZvcm1hdHRlZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGx1Z2luLmluc2VydFRleHQoY29udGV4dC52aWV3LCBmb3JtYXR0ZWQpO1xuICAgICAgICB9XG4gICAgICAgIHBsdWdpbi5tYXliZUluc2VydFRva2VuQ29tbWVudChjb250ZXh0LnZpZXcsIHJlc3BvbnNlKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIG5ldyBOb3RpY2UoYENob3J1cyBlcnJvcjogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcil9YCk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICBwbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgaWQ6IFwiY2hvcnVzOnBhcnR5bG9nLXBhcnNlLWNvbnRleHRcIixcbiAgICBuYW1lOiBcIkNob3J1czogVXBkYXRlIFNjZW5lIENvbnRleHQgZnJvbSBMb2dcIixcbiAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgY29udGV4dCA9IGF3YWl0IHBsdWdpbi5nZXRBY3RpdmVOb3RlQ29udGV4dCgpO1xuICAgICAgaWYgKCFjb250ZXh0Py52aWV3LmZpbGUpIHJldHVybjtcbiAgICAgIGlmICghaXNQYXJ0eWxvZ0FjdGl2ZShwbHVnaW4uc2V0dGluZ3MsIGNvbnRleHQuZm0pKSB7XG4gICAgICAgIG5ldyBOb3RpY2UoXCJQYXJ0eWxvZyBtb2RlIGlzIG5vdCBlbmFibGVkIGZvciB0aGlzIG5vdGUuXCIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCBwYXJzZWQgPSBwYXJzZVBhcnR5bG9nQ29udGV4dChjb250ZXh0Lm5vdGVCb2R5LCBwbHVnaW4uc2V0dGluZ3MucGFydHlsb2dDb250ZXh0RGVwdGgpO1xuICAgICAgYXdhaXQgd3JpdGVGcm9udE1hdHRlcktleShwbHVnaW4uYXBwLCBjb250ZXh0LnZpZXcuZmlsZSwgXCJzY2VuZV9jb250ZXh0XCIsIHNlcmlhbGl6ZVBhcnR5bG9nQ29udGV4dChwYXJzZWQpKTtcbiAgICAgIG5ldyBOb3RpY2UoXCJTY2VuZSBjb250ZXh0IHVwZGF0ZWQgZnJvbSBwYXJ0eSBsb2cuXCIpO1xuICAgIH1cbiAgfSk7XG5cbiAgcGx1Z2luLmFkZENvbW1hbmQoe1xuICAgIGlkOiBcImNob3J1czpwYXJ0eWxvZy1zZXNzaW9uLWJyZWFrXCIsXG4gICAgbmFtZTogXCJDaG9ydXM6IE5ldyBTZXNzaW9uIEhlYWRlclwiLFxuICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBjb250ZXh0ID0gYXdhaXQgcGx1Z2luLmdldEFjdGl2ZU5vdGVDb250ZXh0KCk7XG4gICAgICBpZiAoIWNvbnRleHQ/LnZpZXcuZmlsZSkgcmV0dXJuO1xuICAgICAgaWYgKCFpc1BhcnR5bG9nQWN0aXZlKHBsdWdpbi5zZXR0aW5ncywgY29udGV4dC5mbSkpIHtcbiAgICAgICAgbmV3IE5vdGljZShcIlBhcnR5bG9nIG1vZGUgaXMgbm90IGVuYWJsZWQgZm9yIHRoaXMgbm90ZS5cIik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHZhbHVlcyA9IGF3YWl0IG9wZW5JbnB1dE1vZGFsKHBsdWdpbi5hcHAsIFwiTmV3IFNlc3Npb24gSGVhZGVyXCIsIFtcbiAgICAgICAgeyBrZXk6IFwiZGF0ZVwiLCBsYWJlbDogXCJEYXRlXCIsIHZhbHVlOiB0b2RheUlzb0RhdGUoKSB9LFxuICAgICAgICB7IGtleTogXCJkdXJhdGlvblwiLCBsYWJlbDogXCJEdXJhdGlvblwiLCBwbGFjZWhvbGRlcjogXCIzaFwiIH0sXG4gICAgICAgIHsga2V5OiBcInNjcmliZVwiLCBsYWJlbDogXCJTY3JpYmVcIiwgb3B0aW9uYWw6IHRydWUgfSxcbiAgICAgICAgeyBrZXk6IFwicmVjYXBcIiwgbGFiZWw6IFwiUmVjYXBcIiwgb3B0aW9uYWw6IHRydWUsIHBsYWNlaG9sZGVyOiBcIk9uZS1saW5lIHN1bW1hcnkgb2YgbGFzdCBzZXNzaW9uXCIgfVxuICAgICAgXSk7XG4gICAgICBpZiAoIXZhbHVlcz8uZGF0ZSkgcmV0dXJuO1xuXG4gICAgICBjb25zdCBzZXNzaW9uTnVtYmVyID0gY29udGV4dC5mbS5zZXNzaW9uX251bWJlciA/PyAxO1xuICAgICAgY29uc3Qgc2NyaWJlTGluZSA9IHZhbHVlcy5zY3JpYmU/LnRyaW0oKSA/IGAgfCBTY3JpYmU6ICR7dmFsdWVzLnNjcmliZS50cmltKCl9YCA6IFwiXCI7XG4gICAgICBjb25zdCBibG9jayA9IGAjIyBTZXNzaW9uICR7c2Vzc2lvbk51bWJlcn1cXG4qRGF0ZTogJHt2YWx1ZXMuZGF0ZX0gfCBEdXJhdGlvbjogJHt2YWx1ZXMuZHVyYXRpb24gfHwgXCItXCJ9JHtzY3JpYmVMaW5lfSpcXG5cXG4ke3ZhbHVlcy5yZWNhcCA/IGAqKlJlY2FwOioqICR7dmFsdWVzLnJlY2FwfVxcblxcbmAgOiBcIlwifWA7XG4gICAgICBwbHVnaW4uaW5zZXJ0VGV4dChjb250ZXh0LnZpZXcsIGJsb2NrLCBcImN1cnNvclwiKTtcbiAgICAgIGF3YWl0IHdyaXRlRnJvbnRNYXR0ZXJLZXkocGx1Z2luLmFwcCwgY29udGV4dC52aWV3LmZpbGUsIFwic2Vzc2lvbl9udW1iZXJcIiwgc2Vzc2lvbk51bWJlciArIDEpO1xuICAgIH1cbiAgfSk7XG59XG4iLCAiZXhwb3J0IGludGVyZmFjZSBMb25lbG9nRm9ybWF0T3B0aW9ucyB7XHJcbiAgd3JhcEluQ29kZUJsb2NrOiBib29sZWFuO1xyXG4gIHNjZW5lSWQ/OiBzdHJpbmc7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGZlbmNlKGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgcmV0dXJuIGBcXGBcXGBcXGBcXG4ke2NvbnRlbnR9XFxuXFxgXFxgXFxgYDtcclxufVxyXG5cclxuZnVuY3Rpb24gY2xlYW5BaVRleHQodGV4dDogc3RyaW5nKTogc3RyaW5nIHtcclxuICByZXR1cm4gdGV4dC5yZXBsYWNlKC9ePlxccyovZ20sIFwiXCIpLnRyaW0oKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdFN0YXJ0U2NlbmUoXHJcbiAgYWlUZXh0OiBzdHJpbmcsXHJcbiAgc2NlbmVJZDogc3RyaW5nLFxyXG4gIHNjZW5lRGVzYzogc3RyaW5nLFxyXG4gIF9vcHRzOiBMb25lbG9nRm9ybWF0T3B0aW9uc1xyXG4pOiBzdHJpbmcge1xyXG4gIGNvbnN0IGhlYWRlciA9IGAjIyMgJHtzY2VuZUlkfSAqJHtzY2VuZURlc2N9KmA7XHJcbiAgY29uc3QgYm9keSA9IGNsZWFuQWlUZXh0KGFpVGV4dCk7XHJcbiAgcmV0dXJuIGAke2hlYWRlcn1cXG5cXG4ke2JvZHl9YDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdERlY2xhcmVBY3Rpb24oXHJcbiAgYWN0aW9uOiBzdHJpbmcsXHJcbiAgcm9sbDogc3RyaW5nLFxyXG4gIGFpQ29uc2VxdWVuY2U6IHN0cmluZyxcclxuICBvcHRzOiBMb25lbG9nRm9ybWF0T3B0aW9uc1xyXG4pOiBzdHJpbmcge1xyXG4gIGNvbnN0IGNvbnNlcXVlbmNlID0gY2xlYW5BaVRleHQoYWlDb25zZXF1ZW5jZSlcclxuICAgIC5zcGxpdChcIlxcblwiKVxyXG4gICAgLmZpbHRlcihCb29sZWFuKVxyXG4gICAgLm1hcCgobGluZSkgPT4gKGxpbmUuc3RhcnRzV2l0aChcIj0+XCIpID8gbGluZSA6IGA9PiAke2xpbmV9YCkpXHJcbiAgICAuam9pbihcIlxcblwiKTtcclxuICBjb25zdCBub3RhdGlvbiA9IGBAICR7YWN0aW9ufVxcbmQ6ICR7cm9sbH1cXG4ke2NvbnNlcXVlbmNlfWA7XHJcbiAgcmV0dXJuIG9wdHMud3JhcEluQ29kZUJsb2NrID8gZmVuY2Uobm90YXRpb24pIDogbm90YXRpb247XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRBc2tPcmFjbGUoXHJcbiAgcXVlc3Rpb246IHN0cmluZyxcclxuICBvcmFjbGVSZXN1bHQ6IHN0cmluZyxcclxuICBhaUludGVycHJldGF0aW9uOiBzdHJpbmcsXHJcbiAgb3B0czogTG9uZWxvZ0Zvcm1hdE9wdGlvbnNcclxuKTogc3RyaW5nIHtcclxuICBjb25zdCBpbnRlcnByZXRhdGlvbiA9IGNsZWFuQWlUZXh0KGFpSW50ZXJwcmV0YXRpb24pXHJcbiAgICAuc3BsaXQoXCJcXG5cIilcclxuICAgIC5maWx0ZXIoQm9vbGVhbilcclxuICAgIC5tYXAoKGxpbmUpID0+IChsaW5lLnN0YXJ0c1dpdGgoXCI9PlwiKSA/IGxpbmUgOiBgPT4gJHtsaW5lfWApKVxyXG4gICAgLmpvaW4oXCJcXG5cIik7XHJcbiAgY29uc3Qgbm90YXRpb24gPSBgPyAke3F1ZXN0aW9ufVxcbi0+ICR7b3JhY2xlUmVzdWx0fVxcbiR7aW50ZXJwcmV0YXRpb259YDtcclxuICByZXR1cm4gb3B0cy53cmFwSW5Db2RlQmxvY2sgPyBmZW5jZShub3RhdGlvbikgOiBub3RhdGlvbjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdEludGVycHJldE9yYWNsZShcclxuICBhaUludGVycHJldGF0aW9uOiBzdHJpbmcsXHJcbiAgb3B0czogTG9uZWxvZ0Zvcm1hdE9wdGlvbnNcclxuKTogc3RyaW5nIHtcclxuICBjb25zdCBpbnRlcnByZXRhdGlvbiA9IGNsZWFuQWlUZXh0KGFpSW50ZXJwcmV0YXRpb24pXHJcbiAgICAuc3BsaXQoXCJcXG5cIilcclxuICAgIC5maWx0ZXIoQm9vbGVhbilcclxuICAgIC5tYXAoKGxpbmUpID0+IChsaW5lLnN0YXJ0c1dpdGgoXCI9PlwiKSA/IGxpbmUgOiBgPT4gJHtsaW5lfWApKVxyXG4gICAgLmpvaW4oXCJcXG5cIik7XHJcbiAgcmV0dXJuIG9wdHMud3JhcEluQ29kZUJsb2NrID8gZmVuY2UoaW50ZXJwcmV0YXRpb24pIDogaW50ZXJwcmV0YXRpb247XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRTdWdnZXN0Q29uc2VxdWVuY2UoYWlPcHRpb25zOiBzdHJpbmcsIG9wdHM6IExvbmVsb2dGb3JtYXRPcHRpb25zKTogc3RyaW5nIHtcclxuICBjb25zdCBvcHRpb25zID0gY2xlYW5BaVRleHQoYWlPcHRpb25zKVxyXG4gICAgLnNwbGl0KFwiXFxuXCIpXHJcbiAgICAuZmlsdGVyKChsaW5lKSA9PiBsaW5lLnRyaW0oKS5sZW5ndGggPiAwKVxyXG4gICAgLm1hcCgobGluZSkgPT4gKGxpbmUuc3RhcnRzV2l0aChcIj0+XCIpID8gbGluZSA6IGA9PiAke2xpbmV9YCkpXHJcbiAgICAuam9pbihcIlxcblwiKTtcclxuICByZXR1cm4gb3B0cy53cmFwSW5Db2RlQmxvY2sgPyBmZW5jZShvcHRpb25zKSA6IG9wdGlvbnM7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRFeHBhbmRTY2VuZShhaVByb3NlOiBzdHJpbmcsIF9vcHRzOiBMb25lbG9nRm9ybWF0T3B0aW9ucyk6IHN0cmluZyB7XHJcbiAgcmV0dXJuIGBcXFxcLS0tXFxuJHtjbGVhbkFpVGV4dChhaVByb3NlKX1cXG4tLS1cXFxcYDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdEFkdmVudHVyZVNlZWQoYWlUZXh0OiBzdHJpbmcsIG9wdHM6IExvbmVsb2dGb3JtYXRPcHRpb25zKTogc3RyaW5nIHtcclxuICBjb25zdCBheGVzID0gY2xlYW5BaVRleHQoYWlUZXh0KVxyXG4gICAgLnNwbGl0KFwiXFxuXCIpXHJcbiAgICAuZmlsdGVyKEJvb2xlYW4pXHJcbiAgICAubWFwKChsaW5lKSA9PiBcIiAgXCIgKyBsaW5lLnJlcGxhY2UoL15bLSpdXFxzKi8sIFwiXCIpKVxyXG4gICAgLmpvaW4oXCJcXG5cIik7XHJcbiAgY29uc3Qgbm90YXRpb24gPSBgZ2VuOiBBZHZlbnR1cmUgU2VlZFxcbiR7YXhlc31gO1xyXG4gIHJldHVybiBvcHRzLndyYXBJbkNvZGVCbG9jayA/IGZlbmNlKG5vdGF0aW9uKSA6IG5vdGF0aW9uO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0Q2hhcmFjdGVyKGFpVGV4dDogc3RyaW5nLCBfb3B0czogTG9uZWxvZ0Zvcm1hdE9wdGlvbnMpOiBzdHJpbmcge1xyXG4gIHJldHVybiBjbGVhbkFpVGV4dChhaVRleHQpO1xyXG59XHJcbiIsICJleHBvcnQgaW50ZXJmYWNlIFBhcnR5bG9nRm9ybWF0T3B0aW9ucyB7XG4gIHdyYXBJbkNvZGVCbG9jazogYm9vbGVhbjtcbiAgc2NlbmVJZD86IHN0cmluZztcbiAgcG9zdE1hcmtlcj86IGJvb2xlYW47XG59XG5cbmZ1bmN0aW9uIGZlbmNlKGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBgXFxgXFxgXFxgXFxuJHtjb250ZW50fVxcblxcYFxcYFxcYGA7XG59XG5cbmZ1bmN0aW9uIGNsZWFuQWlUZXh0KHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB0ZXh0LnJlcGxhY2UoL14+XFxzKi9nbSwgXCJcIikudHJpbSgpO1xufVxuXG5mdW5jdGlvbiBlbnN1cmVDb25zZXF1ZW5jZUxpbmVzKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBjbGVhbkFpVGV4dCh0ZXh0KVxuICAgIC5zcGxpdChcIlxcblwiKVxuICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAubWFwKChsaW5lKSA9PiAobGluZS5zdGFydHNXaXRoKFwiPT5cIikgPyBsaW5lIDogYD0+ICR7bGluZX1gKSlcbiAgICAuam9pbihcIlxcblwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdFN0YXJ0U2NlbmUoXG4gIGFpVGV4dDogc3RyaW5nLFxuICBzY2VuZUlkOiBzdHJpbmcsXG4gIHNjZW5lRGVzYzogc3RyaW5nLFxuICBfb3B0czogUGFydHlsb2dGb3JtYXRPcHRpb25zXG4pOiBzdHJpbmcge1xuICBjb25zdCBoZWFkZXIgPSBgIyMjICR7c2NlbmVJZH0gKiR7c2NlbmVEZXNjfSpgO1xuICBjb25zdCBib2R5ID0gY2xlYW5BaVRleHQoYWlUZXh0KTtcbiAgcmV0dXJuIGAke2hlYWRlcn1cXG5cXG4ke2JvZHl9YDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdERlY2xhcmVBY3Rpb24oXG4gIGNoYXJhY3Rlcjogc3RyaW5nLFxuICBhY3Rpb246IHN0cmluZyxcbiAgcm9sbDogc3RyaW5nLFxuICBhaUNvbnNlcXVlbmNlOiBzdHJpbmcsXG4gIG9wdHM6IFBhcnR5bG9nRm9ybWF0T3B0aW9uc1xuKTogc3RyaW5nIHtcbiAgY29uc3QgY29uc2VxdWVuY2UgPSBlbnN1cmVDb25zZXF1ZW5jZUxpbmVzKGFpQ29uc2VxdWVuY2UpO1xuICBjb25zdCBub3RhdGlvbiA9IGBAKCR7Y2hhcmFjdGVyfSkgJHthY3Rpb259XFxuZDogJHtyb2xsfVxcbiR7Y29uc2VxdWVuY2V9YDtcbiAgcmV0dXJuIG9wdHMud3JhcEluQ29kZUJsb2NrID8gZmVuY2Uobm90YXRpb24pIDogbm90YXRpb247XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRDb2xsYWJvcmF0aXZlQWN0aW9uKFxuICBsZWFkOiBzdHJpbmcsXG4gIGFzc2lzdDogc3RyaW5nLFxuICBhY3Rpb246IHN0cmluZyxcbiAgcm9sbDogc3RyaW5nLFxuICBhaUNvbnNlcXVlbmNlOiBzdHJpbmcsXG4gIG9wdHM6IFBhcnR5bG9nRm9ybWF0T3B0aW9uc1xuKTogc3RyaW5nIHtcbiAgY29uc3QgY29uc2VxdWVuY2UgPSBlbnN1cmVDb25zZXF1ZW5jZUxpbmVzKGFpQ29uc2VxdWVuY2UpO1xuICBjb25zdCBub3RhdGlvbiA9IGBAKCR7bGVhZH0gPiAke2Fzc2lzdH0pICR7YWN0aW9ufVxcbmQ6ICR7cm9sbH1cXG4ke2NvbnNlcXVlbmNlfWA7XG4gIHJldHVybiBvcHRzLndyYXBJbkNvZGVCbG9jayA/IGZlbmNlKG5vdGF0aW9uKSA6IG5vdGF0aW9uO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0R01FdmVudChcbiAgZXZlbnQ6IHN0cmluZyxcbiAgYWlDb25zZXF1ZW5jZTogc3RyaW5nLFxuICBvcHRzOiBQYXJ0eWxvZ0Zvcm1hdE9wdGlvbnNcbik6IHN0cmluZyB7XG4gIGNvbnN0IGNvbnNlcXVlbmNlID0gZW5zdXJlQ29uc2VxdWVuY2VMaW5lcyhhaUNvbnNlcXVlbmNlKTtcbiAgY29uc3Qgbm90YXRpb24gPSBgISAke2V2ZW50fVxcbiR7Y29uc2VxdWVuY2V9YDtcbiAgcmV0dXJuIG9wdHMud3JhcEluQ29kZUJsb2NrID8gZmVuY2Uobm90YXRpb24pIDogbm90YXRpb247XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRBc2tPcmFjbGUoXG4gIGNoYXJhY3Rlcjogc3RyaW5nLFxuICBxdWVzdGlvbjogc3RyaW5nLFxuICBhaVJlc3VsdDogc3RyaW5nLFxuICBvcHRzOiBQYXJ0eWxvZ0Zvcm1hdE9wdGlvbnNcbik6IHN0cmluZyB7XG4gIGNvbnN0IGxpbmVzID0gY2xlYW5BaVRleHQoYWlSZXN1bHQpLnNwbGl0KFwiXFxuXCIpLmZpbHRlcihCb29sZWFuKTtcbiAgY29uc3QgZm9ybWF0dGVkID0gbGluZXNcbiAgICAubWFwKChsaW5lLCBpKSA9PiB7XG4gICAgICBpZiAoaSA9PT0gMCkgcmV0dXJuIGxpbmUuc3RhcnRzV2l0aChcIi0+XCIpID8gbGluZSA6IGAtPiAke2xpbmV9YDtcbiAgICAgIHJldHVybiBsaW5lLnN0YXJ0c1dpdGgoXCI9PlwiKSA/IGxpbmUgOiBgPT4gJHtsaW5lfWA7XG4gICAgfSlcbiAgICAuam9pbihcIlxcblwiKTtcbiAgY29uc3Qgbm90YXRpb24gPSBgPygke2NoYXJhY3Rlcn0pICR7cXVlc3Rpb259XFxuJHtmb3JtYXR0ZWR9YDtcbiAgcmV0dXJuIG9wdHMud3JhcEluQ29kZUJsb2NrID8gZmVuY2Uobm90YXRpb24pIDogbm90YXRpb247XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRXaGF0Tm93KGFpT3B0aW9uczogc3RyaW5nLCBvcHRzOiBQYXJ0eWxvZ0Zvcm1hdE9wdGlvbnMpOiBzdHJpbmcge1xuICBjb25zdCBvcHRpb25zID0gZW5zdXJlQ29uc2VxdWVuY2VMaW5lcyhhaU9wdGlvbnMpO1xuICByZXR1cm4gb3B0cy53cmFwSW5Db2RlQmxvY2sgPyBmZW5jZShvcHRpb25zKSA6IG9wdGlvbnM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRFeHBhbmRTY2VuZShhaVByb3NlOiBzdHJpbmcsIF9vcHRzOiBQYXJ0eWxvZ0Zvcm1hdE9wdGlvbnMpOiBzdHJpbmcge1xuICByZXR1cm4gYFxcXFwtLS1cXG4ke2NsZWFuQWlUZXh0KGFpUHJvc2UpfVxcbi0tLVxcXFxgO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0TG9nVGhpcyhhaVRleHQ6IHN0cmluZywgb3B0czogUGFydHlsb2dGb3JtYXRPcHRpb25zKTogc3RyaW5nIHtcbiAgY29uc3QgYm9keSA9IGNsZWFuQWlUZXh0KGFpVGV4dCk7XG4gIGNvbnN0IG1hcmtlZCA9IGAocG9zdDogZm9ybWF0dGVkIGZyb20gcmF3IG5vdGVzKVxcbiR7Ym9keX1gO1xuICByZXR1cm4gb3B0cy53cmFwSW5Db2RlQmxvY2sgPyBmZW5jZShtYXJrZWQpIDogbWFya2VkO1xufVxuIiwgImltcG9ydCB7IEFwcCwgTW9kYWwsIE5vdGljZSwgU2V0dGluZywgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcclxuaW1wb3J0IHsgZGVzY3JpYmVTb3VyY2VSZWYsIGxpc3RWYXVsdENhbmRpZGF0ZUZpbGVzIH0gZnJvbSBcIi4vc291cmNlVXRpbHNcIjtcclxuaW1wb3J0IHsgSVBsdWdpbkZhY2FkZSwgTW9kYWxGaWVsZCwgUHJvdmlkZXJJRCwgU291cmNlUmVmIH0gZnJvbSBcIi4vdHlwZXNcIjtcclxuaW1wb3J0IHsgZ2V0UHJvdmlkZXIgfSBmcm9tIFwiLi9wcm92aWRlcnNcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBJbnB1dE1vZGFsIGV4dGVuZHMgTW9kYWwge1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgdmFsdWVzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xyXG5cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIGFwcDogQXBwLFxyXG4gICAgcHJpdmF0ZSByZWFkb25seSB0aXRsZTogc3RyaW5nLFxyXG4gICAgcHJpdmF0ZSByZWFkb25seSBmaWVsZHM6IE1vZGFsRmllbGRbXSxcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgb25TdWJtaXQ6ICh2YWx1ZXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4pID0+IHZvaWRcclxuICApIHtcclxuICAgIHN1cGVyKGFwcCk7XHJcbiAgICB0aGlzLnZhbHVlcyA9IGZpZWxkcy5yZWR1Y2U8UmVjb3JkPHN0cmluZywgc3RyaW5nPj4oKGFjYywgZmllbGQpID0+IHtcclxuICAgICAgYWNjW2ZpZWxkLmtleV0gPSBmaWVsZC52YWx1ZSA/PyBcIlwiO1xyXG4gICAgICByZXR1cm4gYWNjO1xyXG4gICAgfSwge30pO1xyXG4gIH1cclxuXHJcbiAgb25PcGVuKCk6IHZvaWQge1xyXG4gICAgdGhpcy50aXRsZUVsLnNldFRleHQodGhpcy50aXRsZSk7XHJcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xyXG4gICAgZm9yIChjb25zdCBmaWVsZCBvZiB0aGlzLmZpZWxkcykge1xyXG4gICAgICBpZiAoZmllbGQudGV4dGFyZWEpIHtcclxuICAgICAgICBuZXcgU2V0dGluZyh0aGlzLmNvbnRlbnRFbClcclxuICAgICAgICAgIC5zZXROYW1lKGZpZWxkLmxhYmVsKVxyXG4gICAgICAgICAgLnNldERlc2MoZmllbGQub3B0aW9uYWwgPyBcIk9wdGlvbmFsXCIgOiBcIlwiKVxyXG4gICAgICAgICAgLmFkZFRleHRBcmVhKCh0ZXh0KSA9PiB7XHJcbiAgICAgICAgICAgIHRleHQuc2V0UGxhY2Vob2xkZXIoZmllbGQucGxhY2Vob2xkZXIgPz8gXCJcIik7XHJcbiAgICAgICAgICAgIHRleHQuc2V0VmFsdWUodGhpcy52YWx1ZXNbZmllbGQua2V5XSA/PyBcIlwiKTtcclxuICAgICAgICAgICAgdGV4dC5pbnB1dEVsLnJvd3MgPSA4O1xyXG4gICAgICAgICAgICB0ZXh0Lm9uQ2hhbmdlKCh2YWx1ZSkgPT4ge1xyXG4gICAgICAgICAgICAgIHRoaXMudmFsdWVzW2ZpZWxkLmtleV0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBuZXcgU2V0dGluZyh0aGlzLmNvbnRlbnRFbClcclxuICAgICAgICAgIC5zZXROYW1lKGZpZWxkLmxhYmVsKVxyXG4gICAgICAgICAgLnNldERlc2MoZmllbGQub3B0aW9uYWwgPyBcIk9wdGlvbmFsXCIgOiBcIlwiKVxyXG4gICAgICAgICAgLmFkZFRleHQoKHRleHQpID0+IHtcclxuICAgICAgICAgICAgdGV4dC5zZXRQbGFjZWhvbGRlcihmaWVsZC5wbGFjZWhvbGRlciA/PyBcIlwiKTtcclxuICAgICAgICAgICAgdGV4dC5zZXRWYWx1ZSh0aGlzLnZhbHVlc1tmaWVsZC5rZXldID8/IFwiXCIpO1xyXG4gICAgICAgICAgICB0ZXh0Lm9uQ2hhbmdlKCh2YWx1ZSkgPT4ge1xyXG4gICAgICAgICAgICAgIHRoaXMudmFsdWVzW2ZpZWxkLmtleV0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgbmV3IFNldHRpbmcodGhpcy5jb250ZW50RWwpLmFkZEJ1dHRvbigoYnV0dG9uKSA9PiB7XHJcbiAgICAgIGJ1dHRvbi5zZXRCdXR0b25UZXh0KFwiQ29uZmlybVwiKS5zZXRDdGEoKS5vbkNsaWNrKCgpID0+IHtcclxuICAgICAgICB0aGlzLm9uU3VibWl0KHRoaXMudmFsdWVzKTtcclxuICAgICAgICB0aGlzLmNsb3NlKCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBvbkNsb3NlKCk6IHZvaWQge1xyXG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBvcGVuSW5wdXRNb2RhbChcclxuICBhcHA6IEFwcCxcclxuICB0aXRsZTogc3RyaW5nLFxyXG4gIGZpZWxkczogTW9kYWxGaWVsZFtdXHJcbik6IFByb21pc2U8UmVjb3JkPHN0cmluZywgc3RyaW5nPiB8IG51bGw+IHtcclxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgIGxldCBzZXR0bGVkID0gZmFsc2U7XHJcbiAgICBjb25zdCBtb2RhbCA9IG5ldyBJbnB1dE1vZGFsKGFwcCwgdGl0bGUsIGZpZWxkcywgKHZhbHVlcykgPT4ge1xyXG4gICAgICBzZXR0bGVkID0gdHJ1ZTtcclxuICAgICAgcmVzb2x2ZSh2YWx1ZXMpO1xyXG4gICAgfSk7XHJcbiAgICBjb25zdCBvcmlnaW5hbENsb3NlID0gbW9kYWwub25DbG9zZS5iaW5kKG1vZGFsKTtcclxuICAgIG1vZGFsLm9uQ2xvc2UgPSAoKSA9PiB7XHJcbiAgICAgIG9yaWdpbmFsQ2xvc2UoKTtcclxuICAgICAgaWYgKCFzZXR0bGVkKSB7XHJcbiAgICAgICAgcmVzb2x2ZShudWxsKTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuICAgIG1vZGFsLm9wZW4oKTtcclxuICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHBpY2tMb2NhbEZpbGUoKTogUHJvbWlzZTxGaWxlIHwgbnVsbD4ge1xyXG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xyXG4gICAgY29uc3QgaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW5wdXRcIik7XHJcbiAgICBpbnB1dC50eXBlID0gXCJmaWxlXCI7XHJcbiAgICBpbnB1dC5hY2NlcHQgPSBcIi5wZGYsLnR4dCwubWQsLm1hcmtkb3duXCI7XHJcbiAgICBpbnB1dC5vbmNoYW5nZSA9ICgpID0+IHJlc29sdmUoaW5wdXQuZmlsZXM/LlswXSA/PyBudWxsKTtcclxuICAgIGlucHV0LmNsaWNrKCk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBWYXVsdEZpbGVQaWNrZXJNb2RhbCBleHRlbmRzIE1vZGFsIHtcclxuICBwcml2YXRlIHJlYWRvbmx5IGZpbGVzOiBURmlsZVtdO1xyXG5cclxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgcHJpdmF0ZSByZWFkb25seSB0aXRsZTogc3RyaW5nLCBwcml2YXRlIHJlYWRvbmx5IG9uUGljazogKGZpbGU6IFRGaWxlKSA9PiB2b2lkKSB7XHJcbiAgICBzdXBlcihhcHApO1xyXG4gICAgdGhpcy5maWxlcyA9IGxpc3RWYXVsdENhbmRpZGF0ZUZpbGVzKGFwcCk7XHJcbiAgfVxyXG5cclxuICBvbk9wZW4oKTogdm9pZCB7XHJcbiAgICB0aGlzLnRpdGxlRWwuc2V0VGV4dCh0aGlzLnRpdGxlKTtcclxuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XHJcbiAgICBpZiAoIXRoaXMuZmlsZXMubGVuZ3RoKSB7XHJcbiAgICAgIHRoaXMuY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7IHRleHQ6IFwiTm8gUERGIG9yIHRleHQgZmlsZXMgZm91bmQgaW4gdGhlIHZhdWx0LlwiIH0pO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB0aGlzLmZpbGVzLmZvckVhY2goKGZpbGUpID0+IHtcclxuICAgICAgbmV3IFNldHRpbmcodGhpcy5jb250ZW50RWwpXHJcbiAgICAgICAgLnNldE5hbWUoZmlsZS5wYXRoKVxyXG4gICAgICAgIC5zZXREZXNjKGZpbGUuZXh0ZW5zaW9uLnRvTG93ZXJDYXNlKCkpXHJcbiAgICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PiB7XHJcbiAgICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChcIlNlbGVjdFwiKS5zZXRDdGEoKS5vbkNsaWNrKCgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5vblBpY2soZmlsZSk7XHJcbiAgICAgICAgICAgIHRoaXMuY2xvc2UoKTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBvbkNsb3NlKCk6IHZvaWQge1xyXG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBwaWNrVmF1bHRGaWxlKGFwcDogQXBwLCB0aXRsZTogc3RyaW5nKTogUHJvbWlzZTxURmlsZSB8IG51bGw+IHtcclxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgIGxldCBzZXR0bGVkID0gZmFsc2U7XHJcbiAgICBjb25zdCBtb2RhbCA9IG5ldyBWYXVsdEZpbGVQaWNrZXJNb2RhbChhcHAsIHRpdGxlLCAoZmlsZSkgPT4ge1xyXG4gICAgICBzZXR0bGVkID0gdHJ1ZTtcclxuICAgICAgcmVzb2x2ZShmaWxlKTtcclxuICAgIH0pO1xyXG4gICAgY29uc3Qgb3JpZ2luYWxDbG9zZSA9IG1vZGFsLm9uQ2xvc2UuYmluZChtb2RhbCk7XHJcbiAgICBtb2RhbC5vbkNsb3NlID0gKCkgPT4ge1xyXG4gICAgICBvcmlnaW5hbENsb3NlKCk7XHJcbiAgICAgIGlmICghc2V0dGxlZCkge1xyXG4gICAgICAgIHJlc29sdmUobnVsbCk7XHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgICBtb2RhbC5vcGVuKCk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBTb3VyY2VPcmlnaW5Nb2RhbCBleHRlbmRzIE1vZGFsIHtcclxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgcHJpdmF0ZSByZWFkb25seSBvblBpY2s6IChvcmlnaW46IFwidmF1bHRcIiB8IFwiZXh0ZXJuYWxcIikgPT4gdm9pZCkge1xyXG4gICAgc3VwZXIoYXBwKTtcclxuICB9XHJcblxyXG4gIG9uT3BlbigpOiB2b2lkIHtcclxuICAgIHRoaXMudGl0bGVFbC5zZXRUZXh0KFwiQWRkIFNvdXJjZSBGaWxlXCIpO1xyXG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcclxuICAgIG5ldyBTZXR0aW5nKHRoaXMuY29udGVudEVsKVxyXG4gICAgICAuc2V0TmFtZShcIlZhdWx0IGZpbGVcIilcclxuICAgICAgLnNldERlc2MoXCJQaWNrIGEgZmlsZSBhbHJlYWR5IGluIHlvdXIgdmF1bHRcIilcclxuICAgICAgLmFkZEJ1dHRvbigoYnRuKSA9PiBidG4uc2V0QnV0dG9uVGV4dChcIkNob29zZVwiKS5zZXRDdGEoKS5vbkNsaWNrKCgpID0+IHtcclxuICAgICAgICB0aGlzLm9uUGljayhcInZhdWx0XCIpO1xyXG4gICAgICAgIHRoaXMuY2xvc2UoKTtcclxuICAgICAgfSkpO1xyXG4gICAgbmV3IFNldHRpbmcodGhpcy5jb250ZW50RWwpXHJcbiAgICAgIC5zZXROYW1lKFwiRXh0ZXJuYWwgZmlsZVwiKVxyXG4gICAgICAuc2V0RGVzYyhcIkltcG9ydCBhIGZpbGUgZnJvbSB5b3VyIGNvbXB1dGVyIFx1MjAxNCBzYXZlZCBpbnRvIGEgc291cmNlcy8gc3ViZm9sZGVyIG5leHQgdG8gdGhpcyBub3RlXCIpXHJcbiAgICAgIC5hZGRCdXR0b24oKGJ0bikgPT4gYnRuLnNldEJ1dHRvblRleHQoXCJJbXBvcnRcIikuc2V0Q3RhKCkub25DbGljaygoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5vblBpY2soXCJleHRlcm5hbFwiKTtcclxuICAgICAgICB0aGlzLmNsb3NlKCk7XHJcbiAgICAgIH0pKTtcclxuICB9XHJcblxyXG4gIG9uQ2xvc2UoKTogdm9pZCB7XHJcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHBpY2tTb3VyY2VPcmlnaW4oYXBwOiBBcHApOiBQcm9taXNlPFwidmF1bHRcIiB8IFwiZXh0ZXJuYWxcIiB8IG51bGw+IHtcclxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgIGxldCBzZXR0bGVkID0gZmFsc2U7XHJcbiAgICBjb25zdCBtb2RhbCA9IG5ldyBTb3VyY2VPcmlnaW5Nb2RhbChhcHAsIChvcmlnaW4pID0+IHtcclxuICAgICAgc2V0dGxlZCA9IHRydWU7XHJcbiAgICAgIHJlc29sdmUob3JpZ2luKTtcclxuICAgIH0pO1xyXG4gICAgY29uc3Qgb3JpZ2luYWxDbG9zZSA9IG1vZGFsLm9uQ2xvc2UuYmluZChtb2RhbCk7XHJcbiAgICBtb2RhbC5vbkNsb3NlID0gKCkgPT4ge1xyXG4gICAgICBvcmlnaW5hbENsb3NlKCk7XHJcbiAgICAgIGlmICghc2V0dGxlZCkgcmVzb2x2ZShudWxsKTtcclxuICAgIH07XHJcbiAgICBtb2RhbC5vcGVuKCk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBTb3VyY2VQaWNrZXJNb2RhbCBleHRlbmRzIE1vZGFsIHtcclxuICBjb25zdHJ1Y3RvcihcclxuICAgIGFwcDogQXBwLFxyXG4gICAgcHJpdmF0ZSByZWFkb25seSB0aXRsZTogc3RyaW5nLFxyXG4gICAgcHJpdmF0ZSByZWFkb25seSBzb3VyY2VzOiBTb3VyY2VSZWZbXSxcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgb25QaWNrOiAocmVmOiBTb3VyY2VSZWYpID0+IHZvaWRcclxuICApIHtcclxuICAgIHN1cGVyKGFwcCk7XHJcbiAgfVxyXG5cclxuICBvbk9wZW4oKTogdm9pZCB7XHJcbiAgICB0aGlzLnRpdGxlRWwuc2V0VGV4dCh0aGlzLnRpdGxlKTtcclxuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XHJcbiAgICB0aGlzLnNvdXJjZXMuZm9yRWFjaCgoc291cmNlKSA9PiB7XHJcbiAgICAgIG5ldyBTZXR0aW5nKHRoaXMuY29udGVudEVsKVxyXG4gICAgICAgIC5zZXROYW1lKHNvdXJjZS5sYWJlbClcclxuICAgICAgICAuc2V0RGVzYyhgJHtzb3VyY2UubWltZV90eXBlfSB8ICR7ZGVzY3JpYmVTb3VyY2VSZWYoc291cmNlKX1gKVxyXG4gICAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT4ge1xyXG4gICAgICAgICAgYnV0dG9uLnNldEJ1dHRvblRleHQoXCJTZWxlY3RcIikuc2V0Q3RhKCkub25DbGljaygoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMub25QaWNrKHNvdXJjZSk7XHJcbiAgICAgICAgICAgIHRoaXMuY2xvc2UoKTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBvbkNsb3NlKCk6IHZvaWQge1xyXG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBwaWNrU291cmNlUmVmKGFwcDogQXBwLCB0aXRsZTogc3RyaW5nLCBzb3VyY2VzOiBTb3VyY2VSZWZbXSk6IFByb21pc2U8U291cmNlUmVmIHwgbnVsbD4ge1xyXG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xyXG4gICAgbGV0IHNldHRsZWQgPSBmYWxzZTtcclxuICAgIGNvbnN0IG1vZGFsID0gbmV3IFNvdXJjZVBpY2tlck1vZGFsKGFwcCwgdGl0bGUsIHNvdXJjZXMsIChyZWYpID0+IHtcclxuICAgICAgc2V0dGxlZCA9IHRydWU7XHJcbiAgICAgIHJlc29sdmUocmVmKTtcclxuICAgIH0pO1xyXG4gICAgY29uc3Qgb3JpZ2luYWxDbG9zZSA9IG1vZGFsLm9uQ2xvc2UuYmluZChtb2RhbCk7XHJcbiAgICBtb2RhbC5vbkNsb3NlID0gKCkgPT4ge1xyXG4gICAgICBvcmlnaW5hbENsb3NlKCk7XHJcbiAgICAgIGlmICghc2V0dGxlZCkge1xyXG4gICAgICAgIHJlc29sdmUobnVsbCk7XHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgICBtb2RhbC5vcGVuKCk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgUXVpY2tNZW51SXRlbSB7XHJcbiAgbGFiZWw6IHN0cmluZztcclxuICBjb21tYW5kSWQ6IHN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFF1aWNrTWVudU1vZGFsIGV4dGVuZHMgTW9kYWwge1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgaXRlbXM6IFF1aWNrTWVudUl0ZW1bXTtcclxuXHJcbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHByaXZhdGUgcmVhZG9ubHkgcGx1Z2luOiBJUGx1Z2luRmFjYWRlKSB7XHJcbiAgICBzdXBlcihhcHApO1xyXG4gICAgdGhpcy5pdGVtcyA9IFtcclxuICAgICAgeyBsYWJlbDogXCJTdGFydCBTY2VuZVwiLCAgICAgICAgICAgY29tbWFuZElkOiBcInN5YnlsOnN0YXJ0LXNjZW5lXCIgfSxcclxuICAgICAgeyBsYWJlbDogXCJEZWNsYXJlIEFjdGlvblwiLCAgICAgICAgY29tbWFuZElkOiBcInN5YnlsOmRlY2xhcmUtYWN0aW9uXCIgfSxcclxuICAgICAgeyBsYWJlbDogXCJBc2sgT3JhY2xlXCIsICAgICAgICAgICAgY29tbWFuZElkOiBcInN5YnlsOmFzay1vcmFjbGVcIiB9LFxyXG4gICAgICB7IGxhYmVsOiBcIkludGVycHJldCBPcmFjbGUgUm9sbFwiLCBjb21tYW5kSWQ6IFwic3lieWw6aW50ZXJwcmV0LW9yYWNsZS1yb2xsXCIgfSxcclxuICAgICAgeyBsYWJlbDogXCJXaGF0IE5vd1wiLCAgICAgICAgICAgICAgY29tbWFuZElkOiBcInN5YnlsOndoYXQtbm93XCIgfSxcclxuICAgICAgeyBsYWJlbDogXCJXaGF0IENhbiBJIERvXCIsICAgICAgICAgY29tbWFuZElkOiBcInN5YnlsOndoYXQtY2FuLWktZG9cIiB9LFxyXG4gICAgICB7IGxhYmVsOiBcIkV4cGFuZCBTY2VuZVwiLCAgICAgICAgICBjb21tYW5kSWQ6IFwic3lieWw6ZXhwYW5kLXNjZW5lXCIgfVxyXG4gICAgXTtcclxuICB9XHJcblxyXG4gIG9uT3BlbigpOiB2b2lkIHtcclxuICAgIHRoaXMudGl0bGVFbC5zZXRUZXh0KFwiU3lieWxcIik7XHJcbiAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xyXG4gICAgZm9yIChjb25zdCBpdGVtIG9mIHRoaXMuaXRlbXMpIHtcclxuICAgICAgbmV3IFNldHRpbmcodGhpcy5jb250ZW50RWwpXHJcbiAgICAgICAgLnNldE5hbWUoaXRlbS5sYWJlbClcclxuICAgICAgICAuYWRkQnV0dG9uKChidG4pID0+XHJcbiAgICAgICAgICBidG4uc2V0QnV0dG9uVGV4dChcIlJ1blwiKS5zZXRDdGEoKS5vbkNsaWNrKCgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5jbG9zZSgpO1xyXG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxyXG4gICAgICAgICAgICAodGhpcy5hcHAgYXMgYW55KS5jb21tYW5kcy5leGVjdXRlQ29tbWFuZEJ5SWQoaXRlbS5jb21tYW5kSWQpO1xyXG4gICAgICAgICAgfSlcclxuICAgICAgICApO1xyXG4gICAgfVxyXG4gICAgY29uc3QgYWN0aXZlID0gdGhpcy5wbHVnaW4uc2V0dGluZ3MuYWN0aXZlUHJvdmlkZXI7XHJcbiAgICBjb25zdCBhY3RpdmVNb2RlbCA9IHRoaXMucGx1Z2luLnNldHRpbmdzLnByb3ZpZGVyc1thY3RpdmVdLmRlZmF1bHRNb2RlbDtcclxuICAgIG5ldyBTZXR0aW5nKHRoaXMuY29udGVudEVsKVxyXG4gICAgICAuc2V0TmFtZShcIlN3aXRjaCBQcm92aWRlciAvIE1vZGVsXCIpXHJcbiAgICAgIC5zZXREZXNjKGAke2FjdGl2ZX0gLyAke2FjdGl2ZU1vZGVsfWApXHJcbiAgICAgIC5hZGRCdXR0b24oKGJ0bikgPT5cclxuICAgICAgICBidG4uc2V0QnV0dG9uVGV4dChcIlN3aXRjaFwiKS5vbkNsaWNrKCgpID0+IHtcclxuICAgICAgICAgIHRoaXMuY2xvc2UoKTtcclxuICAgICAgICAgIG5ldyBQcm92aWRlclN3aXRjaE1vZGFsKHRoaXMuYXBwLCB0aGlzLnBsdWdpbikub3BlbigpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICk7XHJcbiAgfVxyXG5cclxuICBvbkNsb3NlKCk6IHZvaWQge1xyXG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBQcm92aWRlclN3aXRjaE1vZGFsIGV4dGVuZHMgTW9kYWwge1xyXG4gIHByaXZhdGUgc2VsZWN0ZWRQcm92aWRlcjogUHJvdmlkZXJJRDtcclxuICBwcml2YXRlIHNlbGVjdGVkTW9kZWw6IHN0cmluZztcclxuICBwcml2YXRlIGF2YWlsYWJsZU1vZGVsczogc3RyaW5nW10gPSBbXTtcclxuXHJcbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHByaXZhdGUgcmVhZG9ubHkgcGx1Z2luOiBJUGx1Z2luRmFjYWRlKSB7XHJcbiAgICBzdXBlcihhcHApO1xyXG4gICAgdGhpcy5zZWxlY3RlZFByb3ZpZGVyID0gcGx1Z2luLnNldHRpbmdzLmFjdGl2ZVByb3ZpZGVyO1xyXG4gICAgdGhpcy5zZWxlY3RlZE1vZGVsID0gcGx1Z2luLnNldHRpbmdzLnByb3ZpZGVyc1t0aGlzLnNlbGVjdGVkUHJvdmlkZXJdLmRlZmF1bHRNb2RlbDtcclxuICB9XHJcblxyXG4gIG9uT3BlbigpOiB2b2lkIHtcclxuICAgIHRoaXMudGl0bGVFbC5zZXRUZXh0KFwiU3dpdGNoIFByb3ZpZGVyIC8gTW9kZWxcIik7XHJcbiAgICB0aGlzLnJlbmRlcigpO1xyXG4gICAgdm9pZCB0aGlzLmZldGNoTW9kZWxzKCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHJlbmRlcigpOiB2b2lkIHtcclxuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XHJcblxyXG4gICAgbmV3IFNldHRpbmcodGhpcy5jb250ZW50RWwpXHJcbiAgICAgIC5zZXROYW1lKFwiUHJvdmlkZXJcIilcclxuICAgICAgLmFkZERyb3Bkb3duKChkZCkgPT4ge1xyXG4gICAgICAgIGRkLmFkZE9wdGlvbihcImdlbWluaVwiLCBcIkdlbWluaVwiKTtcclxuICAgICAgICBkZC5hZGRPcHRpb24oXCJvcGVuYWlcIiwgXCJPcGVuQUlcIik7XHJcbiAgICAgICAgZGQuYWRkT3B0aW9uKFwiYW50aHJvcGljXCIsIFwiQW50aHJvcGljIChDbGF1ZGUpXCIpO1xyXG4gICAgICAgIGRkLmFkZE9wdGlvbihcIm9sbGFtYVwiLCBcIk9sbGFtYSAobG9jYWwpXCIpO1xyXG4gICAgICAgIGRkLmFkZE9wdGlvbihcIm9wZW5yb3V0ZXJcIiwgXCJPcGVuUm91dGVyXCIpO1xyXG4gICAgICAgIGRkLnNldFZhbHVlKHRoaXMuc2VsZWN0ZWRQcm92aWRlcik7XHJcbiAgICAgICAgZGQub25DaGFuZ2UoKHZhbHVlKSA9PiB7XHJcbiAgICAgICAgICB0aGlzLnNlbGVjdGVkUHJvdmlkZXIgPSB2YWx1ZSBhcyBQcm92aWRlcklEO1xyXG4gICAgICAgICAgdGhpcy5zZWxlY3RlZE1vZGVsID0gdGhpcy5wbHVnaW4uc2V0dGluZ3MucHJvdmlkZXJzW3RoaXMuc2VsZWN0ZWRQcm92aWRlcl0uZGVmYXVsdE1vZGVsO1xyXG4gICAgICAgICAgdGhpcy5hdmFpbGFibGVNb2RlbHMgPSBbXTtcclxuICAgICAgICAgIHRoaXMucmVuZGVyKCk7XHJcbiAgICAgICAgICB2b2lkIHRoaXMuZmV0Y2hNb2RlbHMoKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgY29uc3QgbW9kZWxzID0gdGhpcy5hdmFpbGFibGVNb2RlbHMubGVuZ3RoXHJcbiAgICAgID8gKHRoaXMuYXZhaWxhYmxlTW9kZWxzLmluY2x1ZGVzKHRoaXMuc2VsZWN0ZWRNb2RlbClcclxuICAgICAgICAgID8gdGhpcy5hdmFpbGFibGVNb2RlbHNcclxuICAgICAgICAgIDogW3RoaXMuc2VsZWN0ZWRNb2RlbCwgLi4udGhpcy5hdmFpbGFibGVNb2RlbHNdKVxyXG4gICAgICA6IFt0aGlzLnNlbGVjdGVkTW9kZWxdO1xyXG5cclxuICAgIG5ldyBTZXR0aW5nKHRoaXMuY29udGVudEVsKVxyXG4gICAgICAuc2V0TmFtZShcIk1vZGVsXCIpXHJcbiAgICAgIC5hZGREcm9wZG93bigoZGQpID0+IHtcclxuICAgICAgICBtb2RlbHMuZm9yRWFjaCgobSkgPT4gZGQuYWRkT3B0aW9uKG0sIG0pKTtcclxuICAgICAgICBkZC5zZXRWYWx1ZSh0aGlzLnNlbGVjdGVkTW9kZWwpO1xyXG4gICAgICAgIGRkLm9uQ2hhbmdlKCh2YWx1ZSkgPT4geyB0aGlzLnNlbGVjdGVkTW9kZWwgPSB2YWx1ZTsgfSk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgIG5ldyBTZXR0aW5nKHRoaXMuY29udGVudEVsKVxyXG4gICAgICAuYWRkQnV0dG9uKChidG4pID0+XHJcbiAgICAgICAgYnRuLnNldEJ1dHRvblRleHQoXCJTd2l0Y2hcIikuc2V0Q3RhKCkub25DbGljayhhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5hY3RpdmVQcm92aWRlciA9IHRoaXMuc2VsZWN0ZWRQcm92aWRlcjtcclxuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnByb3ZpZGVyc1t0aGlzLnNlbGVjdGVkUHJvdmlkZXJdLmRlZmF1bHRNb2RlbCA9IHRoaXMuc2VsZWN0ZWRNb2RlbDtcclxuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xyXG4gICAgICAgICAgbmV3IE5vdGljZShgU3lieWw6ICR7dGhpcy5zZWxlY3RlZFByb3ZpZGVyfSAvICR7dGhpcy5zZWxlY3RlZE1vZGVsfWApO1xyXG4gICAgICAgICAgdGhpcy5jbG9zZSgpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGFzeW5jIGZldGNoTW9kZWxzKCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgbW9kZWxzID0gYXdhaXQgZ2V0UHJvdmlkZXIodGhpcy5wbHVnaW4uc2V0dGluZ3MsIHRoaXMuc2VsZWN0ZWRQcm92aWRlcikubGlzdE1vZGVscygpO1xyXG4gICAgICBpZiAobW9kZWxzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICB0aGlzLmF2YWlsYWJsZU1vZGVscyA9IG1vZGVscztcclxuICAgICAgICBpZiAoIW1vZGVscy5pbmNsdWRlcyh0aGlzLnNlbGVjdGVkTW9kZWwpKSB7XHJcbiAgICAgICAgICB0aGlzLnNlbGVjdGVkTW9kZWwgPSBtb2RlbHNbMF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMucmVuZGVyKCk7XHJcbiAgICAgIH1cclxuICAgIH0gY2F0Y2gge1xyXG4gICAgICAvLyBzaWxlbnRseSBmYWlsIFx1MjAxNCBkcm9wZG93biBrZWVwcyBzaG93aW5nIGN1cnJlbnQgZGVmYXVsdFxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgb25DbG9zZSgpOiB2b2lkIHtcclxuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgTWFuYWdlU291cmNlc01vZGFsIGV4dGVuZHMgTW9kYWwge1xyXG4gIGNvbnN0cnVjdG9yKFxyXG4gICAgYXBwOiBBcHAsXHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNvdXJjZXM6IFNvdXJjZVJlZltdLFxyXG4gICAgcHJpdmF0ZSByZWFkb25seSBvblJlbW92ZTogKHJlZjogU291cmNlUmVmKSA9PiBQcm9taXNlPHZvaWQ+XHJcbiAgKSB7XHJcbiAgICBzdXBlcihhcHApO1xyXG4gIH1cclxuXHJcbiAgb25PcGVuKCk6IHZvaWQge1xyXG4gICAgdGhpcy50aXRsZUVsLnNldFRleHQoXCJNYW5hZ2UgU291cmNlc1wiKTtcclxuICAgIHRoaXMucmVuZGVyKCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHJlbmRlcigpOiB2b2lkIHtcclxuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XHJcbiAgICBpZiAoIXRoaXMuc291cmNlcy5sZW5ndGgpIHtcclxuICAgICAgdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHsgdGV4dDogXCJObyBzb3VyY2VzIGFyZSBhdHRhY2hlZCB0byB0aGlzIG5vdGUuXCIgfSk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHRoaXMuc291cmNlcy5mb3JFYWNoKChzb3VyY2UpID0+IHtcclxuICAgICAgbmV3IFNldHRpbmcodGhpcy5jb250ZW50RWwpXHJcbiAgICAgICAgLnNldE5hbWUoc291cmNlLmxhYmVsKVxyXG4gICAgICAgIC5zZXREZXNjKGAke3NvdXJjZS5taW1lX3R5cGV9IHwgJHtkZXNjcmliZVNvdXJjZVJlZihzb3VyY2UpfWApXHJcbiAgICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PiB7XHJcbiAgICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChcIlJlbW92ZVwiKS5vbkNsaWNrKGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgYXdhaXQgdGhpcy5vblJlbW92ZShzb3VyY2UpO1xyXG4gICAgICAgICAgICBuZXcgTm90aWNlKGBSZW1vdmVkICcke3NvdXJjZS5sYWJlbH0nLmApO1xyXG4gICAgICAgICAgICB0aGlzLmNsb3NlKCk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgb25DbG9zZSgpOiB2b2lkIHtcclxuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XHJcbiAgfVxyXG59XHJcblxyXG4iLCAiaW1wb3J0IHsgQXBwLCBOb3RpY2UsIFBsdWdpblNldHRpbmdUYWIsIFNldHRpbmcgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB0eXBlIENob3J1c1BsdWdpbiBmcm9tIFwiLi9tYWluXCI7XG5pbXBvcnQgeyBnZXRQcm92aWRlciB9IGZyb20gXCIuL3Byb3ZpZGVyc1wiO1xuaW1wb3J0IHsgT2xsYW1hUHJvdmlkZXIgfSBmcm9tIFwiLi9wcm92aWRlcnMvb2xsYW1hXCI7XG5pbXBvcnQgeyBDaG9ydXNTZXR0aW5ncywgUHJvdmlkZXJJRCwgVmFsaWRhdGlvblN0YXRlIH0gZnJvbSBcIi4vdHlwZXNcIjtcblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfU0VUVElOR1M6IENob3J1c1NldHRpbmdzID0ge1xuICBhY3RpdmVQcm92aWRlcjogXCJnZW1pbmlcIixcbiAgcHJvdmlkZXJzOiB7XG4gICAgZ2VtaW5pOiB7IGFwaUtleTogXCJcIiwgZGVmYXVsdE1vZGVsOiBcImdlbW1hLTQtMjZiLWE0Yi1pdFwiIH0sXG4gICAgb3BlbmFpOiB7IGFwaUtleTogXCJcIiwgZGVmYXVsdE1vZGVsOiBcImdwdC01LjJcIiwgYmFzZVVybDogXCJodHRwczovL2FwaS5vcGVuYWkuY29tL3YxXCIgfSxcbiAgICBhbnRocm9waWM6IHsgYXBpS2V5OiBcIlwiLCBkZWZhdWx0TW9kZWw6IFwiY2xhdWRlLXNvbm5ldC00LTZcIiB9LFxuICAgIG9sbGFtYTogeyBiYXNlVXJsOiBcImh0dHA6Ly9sb2NhbGhvc3Q6MTE0MzRcIiwgZGVmYXVsdE1vZGVsOiBcImdlbW1hM1wiIH0sXG4gICAgb3BlbnJvdXRlcjogeyBhcGlLZXk6IFwiXCIsIGRlZmF1bHRNb2RlbDogXCJtZXRhLWxsYW1hL2xsYW1hLTMuMy03MGItaW5zdHJ1Y3Q6ZnJlZVwiIH1cbiAgfSxcbiAgaW5zZXJ0aW9uTW9kZTogXCJjdXJzb3JcIixcbiAgc2hvd1Rva2VuQ291bnQ6IGZhbHNlLFxuICBkZWZhdWx0VGVtcGVyYXR1cmU6IDAuNyxcbiAgbG9uZWxvZ01vZGU6IGZhbHNlLFxuICBsb25lbG9nQ29udGV4dERlcHRoOiA2MCxcbiAgbG9uZWxvZ1dyYXBDb2RlQmxvY2s6IHRydWUsXG4gIGxvbmVsb2dBdXRvSW5jU2NlbmU6IHRydWUsXG4gIHBhcnR5bG9nTW9kZTogZmFsc2UsXG4gIHBhcnR5bG9nQ29udGV4dERlcHRoOiA2MCxcbiAgcGFydHlsb2dXcmFwQ29kZUJsb2NrOiB0cnVlLFxuICBwYXJ0eWxvZ0F1dG9JbmNTY2VuZTogdHJ1ZSxcbiAgcGFydHlsb2dJbnNlcnRSYXc6IHRydWVcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVTZXR0aW5ncyhyYXc6IFBhcnRpYWw8Q2hvcnVzU2V0dGluZ3M+IHwgbnVsbCB8IHVuZGVmaW5lZCk6IENob3J1c1NldHRpbmdzIHtcbiAgcmV0dXJuIHtcbiAgICAuLi5ERUZBVUxUX1NFVFRJTkdTLFxuICAgIC4uLihyYXcgPz8ge30pLFxuICAgIHByb3ZpZGVyczoge1xuICAgICAgZ2VtaW5pOiB7IC4uLkRFRkFVTFRfU0VUVElOR1MucHJvdmlkZXJzLmdlbWluaSwgLi4uKHJhdz8ucHJvdmlkZXJzPy5nZW1pbmkgPz8ge30pIH0sXG4gICAgICBvcGVuYWk6IHsgLi4uREVGQVVMVF9TRVRUSU5HUy5wcm92aWRlcnMub3BlbmFpLCAuLi4ocmF3Py5wcm92aWRlcnM/Lm9wZW5haSA/PyB7fSkgfSxcbiAgICAgIGFudGhyb3BpYzogeyAuLi5ERUZBVUxUX1NFVFRJTkdTLnByb3ZpZGVycy5hbnRocm9waWMsIC4uLihyYXc/LnByb3ZpZGVycz8uYW50aHJvcGljID8/IHt9KSB9LFxuICAgICAgb2xsYW1hOiB7IC4uLkRFRkFVTFRfU0VUVElOR1MucHJvdmlkZXJzLm9sbGFtYSwgLi4uKHJhdz8ucHJvdmlkZXJzPy5vbGxhbWEgPz8ge30pIH0sXG4gICAgICBvcGVucm91dGVyOiB7IC4uLkRFRkFVTFRfU0VUVElOR1MucHJvdmlkZXJzLm9wZW5yb3V0ZXIsIC4uLihyYXc/LnByb3ZpZGVycz8ub3BlbnJvdXRlciA/PyB7fSkgfVxuICAgIH1cbiAgfTtcbn1cblxuZXhwb3J0IGNsYXNzIENob3J1c1NldHRpbmdUYWIgZXh0ZW5kcyBQbHVnaW5TZXR0aW5nVGFiIHtcbiAgcHJpdmF0ZSB2YWxpZGF0aW9uOiBQYXJ0aWFsPFJlY29yZDxQcm92aWRlcklELCBWYWxpZGF0aW9uU3RhdGU+PiA9IHt9O1xuICBwcml2YXRlIG1vZGVsQ2FjaGU6IFBhcnRpYWw8UmVjb3JkPFByb3ZpZGVySUQsIHN0cmluZ1tdPj4gPSB7fTtcbiAgcHJpdmF0ZSBmZXRjaGluZ1Byb3ZpZGVycyA9IG5ldyBTZXQ8UHJvdmlkZXJJRD4oKTtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgcHJpdmF0ZSByZWFkb25seSBwbHVnaW46IENob3J1c1BsdWdpbikge1xuICAgIHN1cGVyKGFwcCwgcGx1Z2luKTtcbiAgfVxuXG4gIGRpc3BsYXkoKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250YWluZXJFbCB9ID0gdGhpcztcbiAgICBjb250YWluZXJFbC5lbXB0eSgpO1xuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiBgQ2hvcnVzIFNldHRpbmdzICgke3RoaXMucHJvdmlkZXJMYWJlbCh0aGlzLnBsdWdpbi5zZXR0aW5ncy5hY3RpdmVQcm92aWRlcil9KWAgfSk7XG4gICAgdGhpcy5tYXliZUZldGNoTW9kZWxzKCk7XG4gICAgdGhpcy5yZW5kZXJBY3RpdmVQcm92aWRlcihjb250YWluZXJFbCk7XG4gICAgdGhpcy5yZW5kZXJQcm92aWRlckNvbmZpZyhjb250YWluZXJFbCk7XG4gICAgdGhpcy5yZW5kZXJHbG9iYWxTZXR0aW5ncyhjb250YWluZXJFbCk7XG4gIH1cblxuICBwcml2YXRlIG1heWJlRmV0Y2hNb2RlbHMoKTogdm9pZCB7XG4gICAgY29uc3QgYWN0aXZlID0gdGhpcy5wbHVnaW4uc2V0dGluZ3MuYWN0aXZlUHJvdmlkZXI7XG4gICAgaWYgKGFjdGl2ZSA9PT0gXCJvbGxhbWFcIikge1xuICAgICAgaWYgKCF0aGlzLm1vZGVsQ2FjaGUub2xsYW1hICYmICF0aGlzLmZldGNoaW5nUHJvdmlkZXJzLmhhcyhcIm9sbGFtYVwiKSkge1xuICAgICAgICB2b2lkIHRoaXMuZmV0Y2hNb2RlbHMoXCJvbGxhbWFcIik7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMucGx1Z2luLnNldHRpbmdzLnByb3ZpZGVyc1thY3RpdmVdO1xuICAgIGNvbnN0IGFwaUtleSA9IChjb25maWcgYXMgeyBhcGlLZXk/OiBzdHJpbmcgfSkuYXBpS2V5Py50cmltKCk7XG4gICAgaWYgKGFwaUtleSAmJiAhdGhpcy5tb2RlbENhY2hlW2FjdGl2ZV0gJiYgIXRoaXMuZmV0Y2hpbmdQcm92aWRlcnMuaGFzKGFjdGl2ZSkpIHtcbiAgICAgIHZvaWQgdGhpcy5mZXRjaE1vZGVscyhhY3RpdmUpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZmV0Y2hNb2RlbHMocHJvdmlkZXI6IFByb3ZpZGVySUQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLmZldGNoaW5nUHJvdmlkZXJzLmFkZChwcm92aWRlcik7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG1vZGVscyA9IGF3YWl0IGdldFByb3ZpZGVyKHRoaXMucGx1Z2luLnNldHRpbmdzLCBwcm92aWRlcikubGlzdE1vZGVscygpO1xuICAgICAgaWYgKG1vZGVscy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHRoaXMubW9kZWxDYWNoZVtwcm92aWRlcl0gPSBtb2RlbHM7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBzaWxlbnRseSBmYWlsIFx1MjAxNCBkcm9wZG93biBrZWVwcyBzaG93aW5nIGN1cnJlbnQgZGVmYXVsdFxuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLmZldGNoaW5nUHJvdmlkZXJzLmRlbGV0ZShwcm92aWRlcik7XG4gICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHJlbmRlckFjdGl2ZVByb3ZpZGVyKGNvbnRhaW5lckVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJBY3RpdmUgUHJvdmlkZXJcIilcbiAgICAgIC5zZXREZXNjKFwiVXNlZCB3aGVuIGEgbm90ZSBkb2VzIG5vdCBvdmVycmlkZSBwcm92aWRlci5cIilcbiAgICAgIC5hZGREcm9wZG93bigoZHJvcGRvd24pID0+IHtcbiAgICAgICAgZHJvcGRvd24uYWRkT3B0aW9uKFwiZ2VtaW5pXCIsIFwiR2VtaW5pXCIpO1xuICAgICAgICBkcm9wZG93bi5hZGRPcHRpb24oXCJvcGVuYWlcIiwgXCJPcGVuQUlcIik7XG4gICAgICAgIGRyb3Bkb3duLmFkZE9wdGlvbihcImFudGhyb3BpY1wiLCBcIkFudGhyb3BpYyAoQ2xhdWRlKVwiKTtcbiAgICAgICAgZHJvcGRvd24uYWRkT3B0aW9uKFwib2xsYW1hXCIsIFwiT2xsYW1hIChsb2NhbClcIik7XG4gICAgICAgIGRyb3Bkb3duLmFkZE9wdGlvbihcIm9wZW5yb3V0ZXJcIiwgXCJPcGVuUm91dGVyXCIpO1xuICAgICAgICBkcm9wZG93bi5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5hY3RpdmVQcm92aWRlcik7XG4gICAgICAgIGRyb3Bkb3duLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmFjdGl2ZVByb3ZpZGVyID0gdmFsdWUgYXMgUHJvdmlkZXJJRDtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyUHJvdmlkZXJDb25maWcoY29udGFpbmVyRWw6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiUHJvdmlkZXIgQ29uZmlndXJhdGlvblwiIH0pO1xuICAgIHN3aXRjaCAodGhpcy5wbHVnaW4uc2V0dGluZ3MuYWN0aXZlUHJvdmlkZXIpIHtcbiAgICAgIGNhc2UgXCJnZW1pbmlcIjpcbiAgICAgICAgdGhpcy5yZW5kZXJHZW1pbmlTZXR0aW5ncyhjb250YWluZXJFbCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIm9wZW5haVwiOlxuICAgICAgICB0aGlzLnJlbmRlck9wZW5BSVNldHRpbmdzKGNvbnRhaW5lckVsKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiYW50aHJvcGljXCI6XG4gICAgICAgIHRoaXMucmVuZGVyQW50aHJvcGljU2V0dGluZ3MoY29udGFpbmVyRWwpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJvbGxhbWFcIjpcbiAgICAgICAgdGhpcy5yZW5kZXJPbGxhbWFTZXR0aW5ncyhjb250YWluZXJFbCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIm9wZW5yb3V0ZXJcIjpcbiAgICAgICAgdGhpcy5yZW5kZXJPcGVuUm91dGVyU2V0dGluZ3MoY29udGFpbmVyRWwpO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHJlbmRlckdlbWluaVNldHRpbmdzKGNvbnRhaW5lckVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMucGx1Z2luLnNldHRpbmdzLnByb3ZpZGVycy5nZW1pbmk7XG4gICAgdGhpcy5yZW5kZXJWYWxpZGF0aW9uU3RhdGUoY29udGFpbmVyRWwsIFwiZ2VtaW5pXCIpO1xuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJBUEkgS2V5XCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICB0ZXh0LmlucHV0RWwudHlwZSA9IFwicGFzc3dvcmRcIjtcbiAgICAgICAgdGV4dC5zZXRWYWx1ZShjb25maWcuYXBpS2V5KTtcbiAgICAgICAgdGV4dC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICBjb25maWcuYXBpS2V5ID0gdmFsdWU7XG4gICAgICAgICAgdGhpcy5tb2RlbENhY2hlLmdlbWluaSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRleHQuaW5wdXRFbC5hZGRFdmVudExpc3RlbmVyKFwiYmx1clwiLCAoKSA9PiB2b2lkIHRoaXMudmFsaWRhdGVQcm92aWRlcihcImdlbWluaVwiKSk7XG4gICAgICB9KTtcbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiRGVmYXVsdCBNb2RlbFwiKVxuICAgICAgLmFkZERyb3Bkb3duKChkcm9wZG93bikgPT4ge1xuICAgICAgICBjb25zdCBtb2RlbHMgPSB0aGlzLm1vZGVsT3B0aW9uc0ZvcihcImdlbWluaVwiLCBjb25maWcuZGVmYXVsdE1vZGVsKTtcbiAgICAgICAgbW9kZWxzLmZvckVhY2goKG0pID0+IGRyb3Bkb3duLmFkZE9wdGlvbihtLCBtKSk7XG4gICAgICAgIGRyb3Bkb3duLnNldFZhbHVlKGNvbmZpZy5kZWZhdWx0TW9kZWwpO1xuICAgICAgICBkcm9wZG93bi5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICBjb25maWcuZGVmYXVsdE1vZGVsID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlck9wZW5BSVNldHRpbmdzKGNvbnRhaW5lckVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMucGx1Z2luLnNldHRpbmdzLnByb3ZpZGVycy5vcGVuYWk7XG4gICAgdGhpcy5yZW5kZXJWYWxpZGF0aW9uU3RhdGUoY29udGFpbmVyRWwsIFwib3BlbmFpXCIpO1xuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJBUEkgS2V5XCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICB0ZXh0LmlucHV0RWwudHlwZSA9IFwicGFzc3dvcmRcIjtcbiAgICAgICAgdGV4dC5zZXRWYWx1ZShjb25maWcuYXBpS2V5KTtcbiAgICAgICAgdGV4dC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICBjb25maWcuYXBpS2V5ID0gdmFsdWU7XG4gICAgICAgICAgdGhpcy5tb2RlbENhY2hlLm9wZW5haSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRleHQuaW5wdXRFbC5hZGRFdmVudExpc3RlbmVyKFwiYmx1clwiLCAoKSA9PiB2b2lkIHRoaXMudmFsaWRhdGVQcm92aWRlcihcIm9wZW5haVwiKSk7XG4gICAgICB9KTtcbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiQmFzZSBVUkxcIilcbiAgICAgIC5zZXREZXNjKFwiT3ZlcnJpZGUgZm9yIEF6dXJlIG9yIHByb3h5IGVuZHBvaW50c1wiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+IHtcbiAgICAgICAgdGV4dC5zZXRWYWx1ZShjb25maWcuYmFzZVVybCk7XG4gICAgICAgIHRleHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgY29uZmlnLmJhc2VVcmwgPSB2YWx1ZTtcbiAgICAgICAgICB0aGlzLm1vZGVsQ2FjaGUub3BlbmFpID0gdW5kZWZpbmVkO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGV4dC5pbnB1dEVsLmFkZEV2ZW50TGlzdGVuZXIoXCJibHVyXCIsICgpID0+IHZvaWQgdGhpcy52YWxpZGF0ZVByb3ZpZGVyKFwib3BlbmFpXCIpKTtcbiAgICAgIH0pO1xuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJEZWZhdWx0IE1vZGVsXCIpXG4gICAgICAuYWRkRHJvcGRvd24oKGRyb3Bkb3duKSA9PiB7XG4gICAgICAgIGNvbnN0IG1vZGVscyA9IHRoaXMubW9kZWxPcHRpb25zRm9yKFwib3BlbmFpXCIsIGNvbmZpZy5kZWZhdWx0TW9kZWwpO1xuICAgICAgICBtb2RlbHMuZm9yRWFjaCgobSkgPT4gZHJvcGRvd24uYWRkT3B0aW9uKG0sIG0pKTtcbiAgICAgICAgZHJvcGRvd24uc2V0VmFsdWUoY29uZmlnLmRlZmF1bHRNb2RlbCk7XG4gICAgICAgIGRyb3Bkb3duLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGNvbmZpZy5kZWZhdWx0TW9kZWwgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogXCJPcGVuQUkgc291cmNlcyB1c2UgdmF1bHRfcGF0aC4gQWRkIHNvdXJjZSBmaWxlcyB2aWEgdGhlIE1hbmFnZSBTb3VyY2VzIGNvbW1hbmQgaW4gYW55IG5vdGUuXCJcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyQW50aHJvcGljU2V0dGluZ3MoY29udGFpbmVyRWw6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gICAgY29uc3QgY29uZmlnID0gdGhpcy5wbHVnaW4uc2V0dGluZ3MucHJvdmlkZXJzLmFudGhyb3BpYztcbiAgICB0aGlzLnJlbmRlclZhbGlkYXRpb25TdGF0ZShjb250YWluZXJFbCwgXCJhbnRocm9waWNcIik7XG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkFQSSBLZXlcIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgIHRleHQuaW5wdXRFbC50eXBlID0gXCJwYXNzd29yZFwiO1xuICAgICAgICB0ZXh0LnNldFZhbHVlKGNvbmZpZy5hcGlLZXkpO1xuICAgICAgICB0ZXh0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGNvbmZpZy5hcGlLZXkgPSB2YWx1ZTtcbiAgICAgICAgICB0aGlzLm1vZGVsQ2FjaGUuYW50aHJvcGljID0gdW5kZWZpbmVkO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGV4dC5pbnB1dEVsLmFkZEV2ZW50TGlzdGVuZXIoXCJibHVyXCIsICgpID0+IHZvaWQgdGhpcy52YWxpZGF0ZVByb3ZpZGVyKFwiYW50aHJvcGljXCIpKTtcbiAgICAgIH0pO1xuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJEZWZhdWx0IE1vZGVsXCIpXG4gICAgICAuYWRkRHJvcGRvd24oKGRyb3Bkb3duKSA9PiB7XG4gICAgICAgIGNvbnN0IG1vZGVscyA9IHRoaXMubW9kZWxPcHRpb25zRm9yKFwiYW50aHJvcGljXCIsIGNvbmZpZy5kZWZhdWx0TW9kZWwpO1xuICAgICAgICBtb2RlbHMuZm9yRWFjaCgobSkgPT4gZHJvcGRvd24uYWRkT3B0aW9uKG0sIG0pKTtcbiAgICAgICAgZHJvcGRvd24uc2V0VmFsdWUoY29uZmlnLmRlZmF1bHRNb2RlbCk7XG4gICAgICAgIGRyb3Bkb3duLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGNvbmZpZy5kZWZhdWx0TW9kZWwgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogXCJQREZzIGFyZSBlbmNvZGVkIGlubGluZSBwZXIgcmVxdWVzdC4gVXNlIHNob3J0IGV4Y2VycHRzIHRvIGF2b2lkIGhpZ2ggdG9rZW4gY29zdHMuXCJcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyT3BlblJvdXRlclNldHRpbmdzKGNvbnRhaW5lckVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMucGx1Z2luLnNldHRpbmdzLnByb3ZpZGVycy5vcGVucm91dGVyO1xuICAgIHRoaXMucmVuZGVyVmFsaWRhdGlvblN0YXRlKGNvbnRhaW5lckVsLCBcIm9wZW5yb3V0ZXJcIik7XG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkFQSSBLZXlcIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgIHRleHQuaW5wdXRFbC50eXBlID0gXCJwYXNzd29yZFwiO1xuICAgICAgICB0ZXh0LnNldFZhbHVlKGNvbmZpZy5hcGlLZXkpO1xuICAgICAgICB0ZXh0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGNvbmZpZy5hcGlLZXkgPSB2YWx1ZTtcbiAgICAgICAgICB0aGlzLm1vZGVsQ2FjaGUub3BlbnJvdXRlciA9IHVuZGVmaW5lZDtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRleHQuaW5wdXRFbC5hZGRFdmVudExpc3RlbmVyKFwiYmx1clwiLCAoKSA9PiB2b2lkIHRoaXMudmFsaWRhdGVQcm92aWRlcihcIm9wZW5yb3V0ZXJcIikpO1xuICAgICAgfSk7XG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkRlZmF1bHQgTW9kZWxcIilcbiAgICAgIC5hZGREcm9wZG93bigoZHJvcGRvd24pID0+IHtcbiAgICAgICAgY29uc3QgbW9kZWxzID0gdGhpcy5tb2RlbE9wdGlvbnNGb3IoXCJvcGVucm91dGVyXCIsIGNvbmZpZy5kZWZhdWx0TW9kZWwpO1xuICAgICAgICBtb2RlbHMuZm9yRWFjaCgobSkgPT4gZHJvcGRvd24uYWRkT3B0aW9uKG0sIG0pKTtcbiAgICAgICAgZHJvcGRvd24uc2V0VmFsdWUoY29uZmlnLmRlZmF1bHRNb2RlbCk7XG4gICAgICAgIGRyb3Bkb3duLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGNvbmZpZy5kZWZhdWx0TW9kZWwgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogXCJPcGVuUm91dGVyIHByb3ZpZGVzIGFjY2VzcyB0byBtYW55IGZyZWUgYW5kIHBhaWQgbW9kZWxzIHZpYSBhIHVuaWZpZWQgQVBJLiBGcmVlIG1vZGVscyBoYXZlICc6ZnJlZScgaW4gdGhlaXIgSUQuXCJcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyT2xsYW1hU2V0dGluZ3MoY29udGFpbmVyRWw6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gICAgY29uc3QgY29uZmlnID0gdGhpcy5wbHVnaW4uc2V0dGluZ3MucHJvdmlkZXJzLm9sbGFtYTtcbiAgICB0aGlzLnJlbmRlclZhbGlkYXRpb25TdGF0ZShjb250YWluZXJFbCwgXCJvbGxhbWFcIik7XG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkJhc2UgVVJMXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICB0ZXh0LnNldFZhbHVlKGNvbmZpZy5iYXNlVXJsKTtcbiAgICAgICAgdGV4dC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICBjb25maWcuYmFzZVVybCA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGV4dC5pbnB1dEVsLmFkZEV2ZW50TGlzdGVuZXIoXCJibHVyXCIsICgpID0+IHZvaWQgdGhpcy52YWxpZGF0ZU9sbGFtYSgpKTtcbiAgICAgIH0pO1xuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJBdmFpbGFibGUgTW9kZWxzXCIpXG4gICAgICAuYWRkRHJvcGRvd24oKGRyb3Bkb3duKSA9PiB7XG4gICAgICAgIGNvbnN0IG1vZGVscyA9IHRoaXMubW9kZWxPcHRpb25zRm9yKFwib2xsYW1hXCIsIGNvbmZpZy5kZWZhdWx0TW9kZWwpO1xuICAgICAgICBtb2RlbHMuZm9yRWFjaCgobSkgPT4gZHJvcGRvd24uYWRkT3B0aW9uKG0sIG0pKTtcbiAgICAgICAgZHJvcGRvd24uc2V0VmFsdWUoY29uZmlnLmRlZmF1bHRNb2RlbCk7XG4gICAgICAgIGRyb3Bkb3duLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGNvbmZpZy5kZWZhdWx0TW9kZWwgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiRGVmYXVsdCBNb2RlbFwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+IHtcbiAgICAgICAgdGV4dC5zZXRWYWx1ZShjb25maWcuZGVmYXVsdE1vZGVsKTtcbiAgICAgICAgdGV4dC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICBjb25maWcuZGVmYXVsdE1vZGVsID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IFwiTm8gQVBJIGtleSByZXF1aXJlZC4gT2xsYW1hIG11c3QgYmUgcnVubmluZyBsb2NhbGx5LiBGaWxlIGdyb3VuZGluZyB1c2VzIHZhdWx0X3BhdGggdGV4dCBleHRyYWN0aW9uLlwiXG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlckdsb2JhbFNldHRpbmdzKGNvbnRhaW5lckVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIkdsb2JhbCBTZXR0aW5nc1wiIH0pO1xuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJEZWZhdWx0IFRlbXBlcmF0dXJlXCIpXG4gICAgICAuc2V0RGVzYyhTdHJpbmcodGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdFRlbXBlcmF0dXJlKSlcbiAgICAgIC5hZGRTbGlkZXIoKHNsaWRlcikgPT4ge1xuICAgICAgICBzbGlkZXIuc2V0TGltaXRzKDAsIDEsIDAuMDUpO1xuICAgICAgICBzbGlkZXIuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdFRlbXBlcmF0dXJlKTtcbiAgICAgICAgc2xpZGVyLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRUZW1wZXJhdHVyZSA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJJbnNlcnRpb24gTW9kZVwiKVxuICAgICAgLmFkZERyb3Bkb3duKChkcm9wZG93bikgPT4ge1xuICAgICAgICBkcm9wZG93bi5hZGRPcHRpb24oXCJjdXJzb3JcIiwgXCJBdCBjdXJzb3JcIik7XG4gICAgICAgIGRyb3Bkb3duLmFkZE9wdGlvbihcImVuZC1vZi1ub3RlXCIsIFwiRW5kIG9mIG5vdGVcIik7XG4gICAgICAgIGRyb3Bkb3duLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmluc2VydGlvbk1vZGUpO1xuICAgICAgICBkcm9wZG93bi5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbnNlcnRpb25Nb2RlID0gdmFsdWUgYXMgXCJjdXJzb3JcIiB8IFwiZW5kLW9mLW5vdGVcIjtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiU2hvdyBUb2tlbiBDb3VudFwiKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PiB7XG4gICAgICAgIHRvZ2dsZS5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG93VG9rZW5Db3VudCk7XG4gICAgICAgIHRvZ2dsZS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG93VG9rZW5Db3VudCA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgLy8gTG9uZWxvZyBzZWN0aW9uXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkxvbmVsb2cgTW9kZVwiKVxuICAgICAgLnNldERlc2MoXCJFbmFibGUgTG9uZWxvZyBub3RhdGlvbiwgY29udGV4dCBwYXJzaW5nLCBhbmQgTG9uZWxvZy1zcGVjaWZpYyBjb21tYW5kcy5cIilcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4ge1xuICAgICAgICB0b2dnbGUuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MubG9uZWxvZ01vZGUpO1xuICAgICAgICB0b2dnbGUub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MubG9uZWxvZ01vZGUgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICBpZiAodGhpcy5wbHVnaW4uc2V0dGluZ3MubG9uZWxvZ01vZGUpIHtcbiAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAuc2V0TmFtZShcIkF1dG8taW5jcmVtZW50IHNjZW5lIGNvdW50ZXJcIilcbiAgICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PiB7XG4gICAgICAgICAgdG9nZ2xlLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmxvbmVsb2dBdXRvSW5jU2NlbmUpO1xuICAgICAgICAgIHRvZ2dsZS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmxvbmVsb2dBdXRvSW5jU2NlbmUgPSB2YWx1ZTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAuc2V0TmFtZShcIkNvbnRleHQgZXh0cmFjdGlvbiBkZXB0aFwiKVxuICAgICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICAgIHRleHQuc2V0VmFsdWUoU3RyaW5nKHRoaXMucGx1Z2luLnNldHRpbmdzLmxvbmVsb2dDb250ZXh0RGVwdGgpKTtcbiAgICAgICAgICB0ZXh0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgbmV4dCA9IE51bWJlcih2YWx1ZSk7XG4gICAgICAgICAgICBpZiAoIU51bWJlci5pc05hTihuZXh0KSAmJiBuZXh0ID4gMCkge1xuICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5sb25lbG9nQ29udGV4dERlcHRoID0gbmV4dDtcbiAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAgIC5zZXROYW1lKFwiV3JhcCBub3RhdGlvbiBpbiBjb2RlIGJsb2Nrc1wiKVxuICAgICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+IHtcbiAgICAgICAgICB0b2dnbGUuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MubG9uZWxvZ1dyYXBDb2RlQmxvY2spO1xuICAgICAgICAgIHRvZ2dsZS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmxvbmVsb2dXcmFwQ29kZUJsb2NrID0gdmFsdWU7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gUGFydHlsb2cgc2VjdGlvblxuICAgIGlmICh0aGlzLnBsdWdpbi5zZXR0aW5ncy5sb25lbG9nTW9kZSAmJiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5wYXJ0eWxvZ01vZGUpIHtcbiAgICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICAgIHRleHQ6IFwiXHUyNkEwIEJvdGggTG9uZWxvZyBhbmQgUGFydHlsb2cgZ2xvYmFsIHRvZ2dsZXMgYXJlIG9uLiBQZXItbm90ZSBmcm9udG1hdHRlciAobG9uZWxvZzogdHJ1ZSAvIHBhcnR5bG9nOiB0cnVlKSB0YWtlcyBwcmVjZWRlbmNlLiBJZiBuZWl0aGVyIGlzIHNldCwgUGFydHlsb2cgd2lucyBnbG9iYWxseS5cIixcbiAgICAgICAgY2xzOiBcIm1vZC13YXJuaW5nXCJcbiAgICAgIH0pO1xuICAgIH1cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiUGFydHlsb2cgTW9kZVwiKVxuICAgICAgLnNldERlc2MoXCJFbmFibGUgUGFydHlsb2cgbm90YXRpb24sIGNvbnRleHQgcGFyc2luZywgYW5kIGdyb3VwIHBsYXkgY29tbWFuZHMuXCIpXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+IHtcbiAgICAgICAgdG9nZ2xlLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnBhcnR5bG9nTW9kZSk7XG4gICAgICAgIHRvZ2dsZS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5wYXJ0eWxvZ01vZGUgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICBpZiAodGhpcy5wbHVnaW4uc2V0dGluZ3MucGFydHlsb2dNb2RlKSB7XG4gICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgLnNldE5hbWUoXCJBdXRvLWluY3JlbWVudCBzY2VuZSBjb3VudGVyXCIpXG4gICAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4ge1xuICAgICAgICAgIHRvZ2dsZS5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5wYXJ0eWxvZ0F1dG9JbmNTY2VuZSk7XG4gICAgICAgICAgdG9nZ2xlLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MucGFydHlsb2dBdXRvSW5jU2NlbmUgPSB2YWx1ZTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAuc2V0TmFtZShcIkNvbnRleHQgZXh0cmFjdGlvbiBkZXB0aFwiKVxuICAgICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICAgIHRleHQuc2V0VmFsdWUoU3RyaW5nKHRoaXMucGx1Z2luLnNldHRpbmdzLnBhcnR5bG9nQ29udGV4dERlcHRoKSk7XG4gICAgICAgICAgdGV4dC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG5leHQgPSBOdW1iZXIodmFsdWUpO1xuICAgICAgICAgICAgaWYgKCFOdW1iZXIuaXNOYU4obmV4dCkgJiYgbmV4dCA+IDApIHtcbiAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MucGFydHlsb2dDb250ZXh0RGVwdGggPSBuZXh0O1xuICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgLnNldE5hbWUoXCJXcmFwIG5vdGF0aW9uIGluIGNvZGUgYmxvY2tzXCIpXG4gICAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4ge1xuICAgICAgICAgIHRvZ2dsZS5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5wYXJ0eWxvZ1dyYXBDb2RlQmxvY2spO1xuICAgICAgICAgIHRvZ2dsZS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnBhcnR5bG9nV3JhcENvZGVCbG9jayA9IHZhbHVlO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgbW9kZWxPcHRpb25zRm9yKHByb3ZpZGVyOiBQcm92aWRlcklELCBjdXJyZW50TW9kZWw6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBjYWNoZWQgPSB0aGlzLm1vZGVsQ2FjaGVbcHJvdmlkZXJdO1xuICAgIGlmICghY2FjaGVkKSByZXR1cm4gW2N1cnJlbnRNb2RlbF07XG4gICAgcmV0dXJuIGNhY2hlZC5pbmNsdWRlcyhjdXJyZW50TW9kZWwpID8gY2FjaGVkIDogW2N1cnJlbnRNb2RlbCwgLi4uY2FjaGVkXTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyVmFsaWRhdGlvblN0YXRlKGNvbnRhaW5lckVsOiBIVE1MRWxlbWVudCwgcHJvdmlkZXI6IFByb3ZpZGVySUQpOiB2b2lkIHtcbiAgICBjb25zdCBzdGF0ZSA9IHRoaXMudmFsaWRhdGlvbltwcm92aWRlcl07XG4gICAgaWYgKCFzdGF0ZSB8fCBzdGF0ZS5zdGF0dXMgPT09IFwiaWRsZVwiKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OlxuICAgICAgICBzdGF0ZS5zdGF0dXMgPT09IFwiY2hlY2tpbmdcIlxuICAgICAgICAgID8gXCJWYWxpZGF0aW9uOiBjaGVja2luZy4uLlwiXG4gICAgICAgICAgOiBzdGF0ZS5zdGF0dXMgPT09IFwidmFsaWRcIlxuICAgICAgICAgICAgPyBcIlZhbGlkYXRpb246IFx1MjcxM1wiXG4gICAgICAgICAgICA6IGBWYWxpZGF0aW9uOiBcdTI3MTcke3N0YXRlLm1lc3NhZ2UgPyBgICgke3N0YXRlLm1lc3NhZ2V9KWAgOiBcIlwifWBcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgcHJvdmlkZXJMYWJlbChwcm92aWRlcjogUHJvdmlkZXJJRCk6IHN0cmluZyB7XG4gICAgc3dpdGNoIChwcm92aWRlcikge1xuICAgICAgY2FzZSBcImdlbWluaVwiOlxuICAgICAgICByZXR1cm4gXCJHZW1pbmlcIjtcbiAgICAgIGNhc2UgXCJvcGVuYWlcIjpcbiAgICAgICAgcmV0dXJuIFwiT3BlbkFJXCI7XG4gICAgICBjYXNlIFwiYW50aHJvcGljXCI6XG4gICAgICAgIHJldHVybiBcIkFudGhyb3BpY1wiO1xuICAgICAgY2FzZSBcIm9sbGFtYVwiOlxuICAgICAgICByZXR1cm4gXCJPbGxhbWFcIjtcbiAgICAgIGNhc2UgXCJvcGVucm91dGVyXCI6XG4gICAgICAgIHJldHVybiBcIk9wZW5Sb3V0ZXJcIjtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHZhbGlkYXRlUHJvdmlkZXIocHJvdmlkZXI6IFByb3ZpZGVySUQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLnZhbGlkYXRpb25bcHJvdmlkZXJdID0geyBzdGF0dXM6IFwiY2hlY2tpbmdcIiB9O1xuICAgIHRoaXMuZGlzcGxheSgpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB2YWxpZCA9IGF3YWl0IGdldFByb3ZpZGVyKHRoaXMucGx1Z2luLnNldHRpbmdzLCBwcm92aWRlcikudmFsaWRhdGUoKTtcbiAgICAgIHRoaXMudmFsaWRhdGlvbltwcm92aWRlcl0gPSB7IHN0YXR1czogdmFsaWQgPyBcInZhbGlkXCIgOiBcImludmFsaWRcIiB9O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICB0aGlzLnZhbGlkYXRpb25bcHJvdmlkZXJdID0ge1xuICAgICAgICBzdGF0dXM6IFwiaW52YWxpZFwiLFxuICAgICAgICBtZXNzYWdlOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcilcbiAgICAgIH07XG4gICAgfVxuICAgIHRoaXMuZGlzcGxheSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyB2YWxpZGF0ZU9sbGFtYSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLnZhbGlkYXRpb24ub2xsYW1hID0geyBzdGF0dXM6IFwiY2hlY2tpbmdcIiB9O1xuICAgIHRoaXMuZGlzcGxheSgpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBwcm92aWRlciA9IG5ldyBPbGxhbWFQcm92aWRlcih0aGlzLnBsdWdpbi5zZXR0aW5ncy5wcm92aWRlcnMub2xsYW1hKTtcbiAgICAgIGNvbnN0IHZhbGlkID0gYXdhaXQgcHJvdmlkZXIudmFsaWRhdGUoKTtcbiAgICAgIHRoaXMudmFsaWRhdGlvbi5vbGxhbWEgPSB7IHN0YXR1czogdmFsaWQgPyBcInZhbGlkXCIgOiBcImludmFsaWRcIiB9O1xuICAgICAgdGhpcy5tb2RlbENhY2hlLm9sbGFtYSA9IHZhbGlkID8gYXdhaXQgcHJvdmlkZXIubGlzdE1vZGVscygpIDogdW5kZWZpbmVkO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICB0aGlzLnZhbGlkYXRpb24ub2xsYW1hID0ge1xuICAgICAgICBzdGF0dXM6IFwiaW52YWxpZFwiLFxuICAgICAgICBtZXNzYWdlOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcilcbiAgICAgIH07XG4gICAgICB0aGlzLm1vZGVsQ2FjaGUub2xsYW1hID0gdW5kZWZpbmVkO1xuICAgICAgbmV3IE5vdGljZSh0aGlzLnZhbGlkYXRpb24ub2xsYW1hLm1lc3NhZ2UgPz8gXCJPbGxhbWEgdmFsaWRhdGlvbiBmYWlsZWQuXCIpO1xuICAgIH1cbiAgICB0aGlzLmRpc3BsYXkoKTtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBQUFBLG9CQUE2Qzs7O0FDRXRDLFNBQVMsZUFBZSxRQUFn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QUFDLEVBQUUsS0FBSyxHQUFHLEVBQUUsQ0FBQyxDQUFDO0FBQ3RGLGVBQVcsS0FBSyxLQUFLLFNBQVMsTUFBTTtBQUFHLGNBQVEsSUFBSSxFQUFFLENBQUMsRUFBRSxNQUFNLEdBQUcsRUFBRSxDQUFDLEVBQUUsS0FBSyxHQUFHLEVBQUUsQ0FBQyxDQUFDO0FBQ2xGLGVBQVcsS0FBSyxLQUFLLFNBQVMsT0FBTztBQUFHLGVBQVMsSUFBSSxFQUFFLENBQUMsRUFBRSxNQUFNLEdBQUcsRUFBRSxDQUFDLEVBQUUsS0FBSyxHQUFHLEVBQUUsQ0FBQyxDQUFDO0FBQ3BGLGVBQVcsS0FBSyxLQUFLLFNBQVMsTUFBTTtBQUFHLGNBQVEsSUFBSSxFQUFFLENBQUMsRUFBRSxNQUFNLEdBQUcsRUFBRSxDQUFDLEVBQUUsS0FBSyxHQUFHLEVBQUUsQ0FBQyxDQUFDO0FBQ2xGLGVBQVcsS0FBSyxLQUFLLFNBQVMsSUFBSTtBQUFHLFlBQU0sSUFBSSxFQUFFLENBQUMsRUFBRSxNQUFNLEdBQUcsRUFBRSxDQUFDLEVBQUUsS0FBSyxHQUFHLEVBQUUsQ0FBQyxDQUFDO0FBQzlFLGVBQVcsS0FBSyxLQUFLLFNBQVMsT0FBTztBQUFHLGVBQVMsSUFBSSxFQUFFLENBQUMsRUFBRSxNQUFNLEdBQUcsRUFBRSxDQUFDLEVBQUUsS0FBSyxHQUFHLEVBQUUsQ0FBQyxDQUFDO0FBQ3BGLGVBQVcsS0FBSyxLQUFLLFNBQVMsU0FBUztBQUFHLGlCQUFXLElBQUksRUFBRSxDQUFDLEVBQUUsTUFBTSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEtBQUssR0FBRyxFQUFFLENBQUMsQ0FBQztBQUN4RixlQUFXLEtBQUssS0FBSyxTQUFTLE9BQU87QUFBRyxlQUFTLElBQUksRUFBRSxDQUFDLEVBQUUsTUFBTSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEtBQUssR0FBRyxFQUFFLENBQUMsQ0FBQztBQUNwRixlQUFXLEtBQUssS0FBSyxTQUFTLE9BQU87QUFBRyxlQUFTLElBQUksRUFBRSxDQUFDLEVBQUUsTUFBTSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEtB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RUFDRjtBQUFBLEVBRUEsV0FBVyxNQUFvQixNQUFjLE1BQXVDO0FBQ2xGLFNBQUssc0JBQVEsS0FBSyxTQUFTLG1CQUFtQixVQUFVO0FBQ3RELHFCQUFlLEtBQUssUUFBUSxJQUFJO0FBQUEsSUFDbEMsT0FBTztBQUNMLG1CQUFhLEtBQUssUUFBUSxJQUFJO0FBQUEsSUFDaEM7QUFBQSxFQUNGO0FBQUEsRUFFQSx3QkFBd0IsTUFBb0IsVUFBb0M7QUFqR2xGO0FBa0dJLFFBQUksQ0FBQyxLQUFLLFNBQVMsZ0JBQWdCO0FBQ2pDO0FBQUEsSUFDRjtBQUNBLFVBQU0sU0FBUSxjQUFTLGdCQUFULFlBQXdCO0FBQ3RDLFVBQU0sVUFBUyxjQUFTLGlCQUFULFlBQXlCO0FBQ3hDLGlCQUFhLEtBQUssUUFBUSxnQkFBZ0IsY0FBYyxnQkFBZ0I7QUFBQSxFQUMxRTtBQUNGOyIsCiAgIm5hbWVzIjogWyJpbXBvcnRfb2JzaWRpYW4iLCAiX2EiLCAiaW1wb3J0X29ic2lkaWFuIiwgIl9hIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiX2EiLCAiaW1wb3J0X29ic2lkaWFuIiwgIl9hIiwgImltcG9ydF9vYnNpZGlhbiIsICJhc0Vycm9yTWVzc2FnZSIsICJfYSIsICJpbXBvcnRfb2JzaWRpYW4iLCAiZmVuY2UiLCAiY2xlYW5BaVRleHQiLCAiZm9ybWF0U3RhcnRTY2VuZSIsICJmb3JtYXREZWNsYXJlQWN0aW9uIiwgImZlbmNlIiwgImZvcm1hdEV4cGFuZFNjZW5lIiwgImNsZWFuQWlUZXh0IiwgImltcG9ydF9vYnNpZGlhbiIsICJyZWYiLCAiZm9ybWF0RXhwYW5kU2NlbmUiLCAiZm9ybWF0U3RhcnRTY2VuZSIsICJmb3JtYXREZWNsYXJlQWN0aW9uIiwgImltcG9ydF9vYnNpZGlhbiJdCn0K
