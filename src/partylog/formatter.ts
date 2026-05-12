export interface PartylogFormatOptions {
  wrapInCodeBlock: boolean;
  sceneId?: string;
  postMarker?: boolean;
}

function fence(content: string): string {
  return `\`\`\`\n${content}\n\`\`\``;
}

function cleanAiText(text: string): string {
  return text.replace(/^>\s*/gm, "").trim();
}

function ensureConsequenceLines(text: string): string {
  return cleanAiText(text)
    .split("\n")
    .filter(Boolean)
    .map((line) => (line.startsWith("=>") ? line : `=> ${line}`))
    .join("\n");
}

export function formatStartScene(
  aiText: string,
  sceneId: string,
  sceneDesc: string,
  _opts: PartylogFormatOptions
): string {
  const header = `### ${sceneId} *${sceneDesc}*`;
  const body = cleanAiText(aiText);
  return `${header}\n\n${body}`;
}

export function formatDeclareAction(
  character: string,
  action: string,
  roll: string,
  aiConsequence: string,
  opts: PartylogFormatOptions
): string {
  const consequence = ensureConsequenceLines(aiConsequence);
  const notation = `@(${character}) ${action}\nd: ${roll}\n${consequence}`;
  return opts.wrapInCodeBlock ? fence(notation) : notation;
}

export function formatCollaborativeAction(
  lead: string,
  assist: string,
  action: string,
  roll: string,
  aiConsequence: string,
  opts: PartylogFormatOptions
): string {
  const consequence = ensureConsequenceLines(aiConsequence);
  const notation = `@(${lead} > ${assist}) ${action}\nd: ${roll}\n${consequence}`;
  return opts.wrapInCodeBlock ? fence(notation) : notation;
}

export function formatGMEvent(
  event: string,
  aiConsequence: string,
  opts: PartylogFormatOptions
): string {
  const consequence = ensureConsequenceLines(aiConsequence);
  const notation = `! ${event}\n${consequence}`;
  return opts.wrapInCodeBlock ? fence(notation) : notation;
}

export function formatAskOracle(
  character: string,
  question: string,
  aiResult: string,
  opts: PartylogFormatOptions
): string {
  const lines = cleanAiText(aiResult).split("\n").filter(Boolean);
  const formatted = lines
    .map((line, i) => {
      if (i === 0) return line.startsWith("->") ? line : `-> ${line}`;
      return line.startsWith("=>") ? line : `=> ${line}`;
    })
    .join("\n");
  const notation = `?(${character}) ${question}\n${formatted}`;
  return opts.wrapInCodeBlock ? fence(notation) : notation;
}

export function formatWhatNow(aiOptions: string, opts: PartylogFormatOptions): string {
  const options = ensureConsequenceLines(aiOptions);
  return opts.wrapInCodeBlock ? fence(options) : options;
}

export function formatExpandScene(aiProse: string, _opts: PartylogFormatOptions): string {
  return `\\---\n${cleanAiText(aiProse)}\n---\\`;
}

export function formatLogThis(aiText: string, opts: PartylogFormatOptions): string {
  const body = cleanAiText(aiText);
  const marked = `(post: formatted from raw notes)\n${body}`;
  return opts.wrapInCodeBlock ? fence(marked) : marked;
}
