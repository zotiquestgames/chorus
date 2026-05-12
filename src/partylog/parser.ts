export interface PartylogContext {
  lastSceneId: string;
  lastSceneDesc: string;
  activeNPCs: string[];
  activeLocations: string[];
  activeThreads: string[];
  activeGoals: string[];
  activeQuests: string[];
  activeClocks: string[];
  activeTracks: string[];
  factions: string[];
  partyState: string[];
  loot: string[];
  recentBeats: string[];
  combatActive: boolean;
}

export function parsePartylogContext(noteBody: string, depthLines = 60): PartylogContext {
  const bodyWithoutFM = noteBody.replace(/^---[\s\S]*?---\r?\n/, "");
  const lines = bodyWithoutFM.split(/\r?\n/);
  const scanWindow = lines.slice(-depthLines);

  const ctx: PartylogContext = {
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

  // Scene ID: S#, S#a (flashback), T#-S# (thread), S#.# (montage)
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

  const npcMap = new Map<string, string>();
  const locMap = new Map<string, string>();
  const threadMap = new Map<string, string>();
  const goalMap = new Map<string, string>();
  const questMap = new Map<string, string>();
  const lootMap = new Map<string, string>();
  const pcMap = new Map<string, string>();
  const partyMap = new Map<string, string>();
  const factionMap = new Map<string, string>();
  const clockMap = new Map<string, string>();
  const trackMap = new Map<string, string>();
  let combatOpen = false;

  for (const rawLine of scanWindow) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line === "[COMBAT]") { combatOpen = true; continue; }
    if (line === "[/COMBAT]") { combatOpen = false; continue; }

    const sceneMatch = line.match(sceneRe);
    if (sceneMatch) {
      ctx.lastSceneId = `${sceneMatch[1] ?? ""}S${sceneMatch[2]}`;
      ctx.lastSceneDesc = sceneMatch[3].trim();
    }

    for (const m of line.matchAll(npcRe)) npcMap.set(m[1].split("|")[0].trim(), m[1]);
    for (const m of line.matchAll(npcRefRe)) {
      const name = m[1].trim();
      if (!npcMap.has(name)) npcMap.set(name, name);
    }
    for (const m of line.matchAll(locRe)) locMap.set(m[1].split("|")[0].trim(), m[1]);
    for (const m of line.matchAll(threadRe)) threadMap.set(m[1].split("|")[0].trim(), m[1]);
    for (const m of line.matchAll(goalRe)) goalMap.set(m[1].split("|")[0].trim(), m[1]);
    for (const m of line.matchAll(questRe)) questMap.set(m[1].split("|")[0].trim(), m[1]);
    for (const m of line.matchAll(lootRe)) lootMap.set(m[1].split("|")[0].trim(), m[1]);
    for (const m of line.matchAll(pcRe)) pcMap.set(m[1].split("|")[0].trim(), m[1]);
    for (const m of line.matchAll(partyRe)) partyMap.set(m[1].split("|")[0].trim(), m[1]);
    for (const m of line.matchAll(factionRe)) factionMap.set(m[1].split("|")[0].trim(), m[1]);
    for (const m of line.matchAll(clockRe)) clockMap.set(m[1].split(" ")[0].trim(), m[1]);
    for (const m of line.matchAll(trackRe)) trackMap.set(m[1].split(" ")[0].trim(), m[1]);

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

export function serializePartylogContext(ctx: PartylogContext): string {
  const lines: string[] = [];
  if (ctx.lastSceneId) lines.push(`Current scene: ${ctx.lastSceneId} *${ctx.lastSceneDesc}*`);
  if (ctx.partyState.length) lines.push(`Party: ${ctx.partyState.join(" ")}`);
  if (ctx.activeNPCs.length) lines.push(`NPCs: ${ctx.activeNPCs.map((s) => `[N:${s}]`).join(" ")}`);
  if (ctx.activeLocations.length) lines.push(`Locations: ${ctx.activeLocations.map((s) => `[L:${s}]`).join(" ")}`);
  if (ctx.activeThreads.length) lines.push(`Threads: ${ctx.activeThreads.map((s) => `[Thread:${s}]`).join(" ")}`);
  if (ctx.activeGoals.length) lines.push(`Goals: ${ctx.activeGoals.map((s) => `[Goal:${s}]`).join(" ")}`);
  if (ctx.activeQuests.length) lines.push(`Quests: ${ctx.activeQuests.map((s) => `[Quest:${s}]`).join(" ")}`);
  if (ctx.activeClocks.length) lines.push(`Clocks: ${ctx.activeClocks.map((s) => `[Clock:${s}]`).join(" ")}`);
  if (ctx.activeTracks.length) lines.push(`Tracks: ${ctx.activeTracks.map((s) => `[Track:${s}]`).join(" ")}`);
  if (ctx.factions.length) lines.push(`Factions: ${ctx.factions.map((s) => `[Faction:${s}]`).join(" ")}`);
  if (ctx.loot.length) lines.push(`Loot: ${ctx.loot.join(" ")}`);
  if (ctx.combatActive) lines.push("COMBAT ACTIVE");
  if (ctx.recentBeats.length) {
    lines.push("Recent beats:");
    ctx.recentBeats.forEach((beat) => lines.push(`  ${beat}`));
  }
  return lines.join("\n");
}
