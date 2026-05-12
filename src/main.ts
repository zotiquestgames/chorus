import { MarkdownView, Notice, Plugin } from "obsidian";
import { appendToNote, insertAtCursor } from "./editor";
import { buildRequest, buildSystemPrompt } from "./promptBuilder";
import { readFrontMatter } from "./frontmatter";
import { getProvider } from "./providers";
import { registerAllCommands } from "./commands";
import { QuickMenuModal } from "./modals";
import { DEFAULT_SETTINGS, ChorusSettingTab, normalizeSettings } from "./settings";
import { ChorusSettings, GenerationRequest, GenerationResponse, NoteFrontMatter, ResolvedSource } from "./types";

export interface ActiveNoteContext {
  view: MarkdownView;
  fm: NoteFrontMatter;
  noteBody: string;
}

export default class ChorusPlugin extends Plugin {
  settings: ChorusSettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.addSettingTab(new ChorusSettingTab(this.app, this));
    registerAllCommands(this);
    this.addRibbonIcon("dice", "Chorus", () => {
      new QuickMenuModal(this.app, this).open();
    });
  }

  async loadSettings(): Promise<void> {
    this.settings = normalizeSettings(await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  async getActiveNoteContext(): Promise<ActiveNoteContext | null> {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view?.file) {
      new Notice("No active markdown note.");
      return null;
    }
    return {
      view,
      fm: await readFrontMatter(this.app, view.file),
      noteBody: await this.app.vault.cachedRead(view.file)
    };
  }

  async requestGeneration(
    fm: NoteFrontMatter,
    noteBody: string,
    userMessage: string,
    maxOutputTokens = 512
  ): Promise<GenerationResponse> {
    const provider = getProvider(this.settings);
    const request = buildRequest(fm, userMessage, this.settings, maxOutputTokens, noteBody);
    const progress = new Notice("Chorus: Generating...", 0);
    try {
      return await provider.generate(request);
    } finally {
      progress.hide();
    }
  }

  async requestRawGeneration(
    fm: NoteFrontMatter,
    userMessage: string,
    maxOutputTokens: number,
    resolvedSources: ResolvedSource[] = []
  ): Promise<GenerationResponse> {
    const provider = getProvider(this.settings);
    const lonelogActive = fm.lonelog ?? this.settings.lonelogMode;
    const partylogActive = fm.partylog ?? this.settings.partylogMode;
    const request: GenerationRequest = {
      systemPrompt: buildSystemPrompt(fm, lonelogActive, partylogActive),
      userMessage,
      resolvedSources,
      temperature: fm.temperature ?? this.settings.defaultTemperature,
      maxOutputTokens
    };
    const progress = new Notice("Chorus: Generating...", 0);
    try {
      return await provider.generate(request);
    } finally {
      progress.hide();
    }
  }

  insertText(view: MarkdownView, text: string, mode?: "cursor" | "end-of-note"): void {
    if ((mode ?? this.settings.insertionMode) === "cursor") {
      insertAtCursor(view.editor, text);
    } else {
      appendToNote(view.editor, text);
    }
  }

  maybeInsertTokenComment(view: MarkdownView, response: GenerationResponse): void {
    if (!this.settings.showTokenCount) {
      return;
    }
    const input = response.inputTokens ?? "N/A";
    const output = response.outputTokens ?? "N/A";
    appendToNote(view.editor, `<!-- tokens: ${input} in / ${output} out -->`);
  }
}
