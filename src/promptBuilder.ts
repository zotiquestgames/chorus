import { parseLonelogContext, serializeContext } from "./lonelog/parser";
import { parsePartylogContext, serializePartylogContext } from "./partylog/parser";
import { ChorusSettings, GenerationRequest, NoteFrontMatter } from "./types";

const LONELOG_SYSTEM_ADDENDUM = `
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

const PARTYLOG_SYSTEM_ADDENDUM = `
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

Generate only the symbol-prefixed content lines. The formatter handles wrapping.
`.trim();

function buildPartyBlock(fm: NoteFrontMatter): string {
  if (!fm.party?.length) return "";
  const members = fm.party.map((m) => `- ${m.name}: ${m.notes}`).join("\n");
  return `The party consists of:\n${members}`;
}

function buildBasePrompt(fm: NoteFrontMatter, partylogMode = false): string {
  const ruleset = fm.ruleset ?? "the game";
  const pcBlock = partylogMode
    ? buildPartyBlock(fm)
    : fm.pcs
      ? `Player character: ${fm.pcs}`
      : "";
  const genre = fm.genre ? `Genre: ${fm.genre}` : "";
  const tone = fm.tone ? `Tone: ${fm.tone}` : "";
  const language = fm.language
    ? `Respond in ${fm.language}.`
    : "Respond in the same language as the user's input.";

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

export function buildSystemPrompt(
  fm: NoteFrontMatter,
  lonelogMode: boolean,
  partylogMode: boolean
): string {
  const base = fm.system_prompt_override?.trim() || buildBasePrompt(fm, partylogMode);
  let prompt: string;
  if (partylogMode) {
    prompt = `${base}\n\n${PARTYLOG_SYSTEM_ADDENDUM}`;
  } else if (lonelogMode) {
    prompt = `${base}\n\n${LONELOG_SYSTEM_ADDENDUM}`;
  } else {
    prompt = base;
  }
  if (fm.game_context?.trim()) {
    prompt = `${prompt}\n\nGAME CONTEXT:\n${fm.game_context.trim()}`;
  }
  return prompt;
}

export function buildRequest(
  fm: NoteFrontMatter,
  userMessage: string,
  settings: ChorusSettings,
  maxOutputTokens = 512,
  noteBody?: string
): GenerationRequest {
  const lonelogActive = fm.lonelog ?? settings.lonelogMode;
  const partylogActive = fm.partylog ?? settings.partylogMode;

  let contextBlock = "";
  if (fm.scene_context?.trim()) {
    contextBlock = `SCENE CONTEXT:\n${fm.scene_context.trim()}`;
  } else if (partylogActive && noteBody) {
    const ctx = parsePartylogContext(noteBody, settings.partylogContextDepth ?? 60);
    contextBlock = serializePartylogContext(ctx);
  } else if (lonelogActive && noteBody) {
    const ctx = parseLonelogContext(noteBody, settings.lonelogContextDepth);
    contextBlock = serializeContext(ctx);
  }

  const contextMessage = contextBlock ? `${contextBlock}\n\n${userMessage}` : userMessage;

  return {
    systemPrompt: buildSystemPrompt(fm, lonelogActive, partylogActive),
    userMessage: contextMessage,
    temperature: fm.temperature ?? settings.defaultTemperature,
    maxOutputTokens,
    resolvedSources: []
  };
}
