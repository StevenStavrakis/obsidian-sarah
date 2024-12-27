import './styles.css'
import { App, type PluginManifest, Plugin, PluginSettingTab, Setting } from "obsidian"
import type { PluginModule } from "@modules/types";
import { AppStore } from "@modules/types/AppStore";
import { ChatModule } from "@modules/chat/ChatModule";

interface PluginSettings {
  apiKey: string;
}

const DEFAULT_SETTINGS: PluginSettings = {
  apiKey: '',
}

export default class MyPlugin extends Plugin {
  private modules: PluginModule[];
  settings!: PluginSettings;

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);
    // Initialize the global App store
    AppStore.setApp(app);
    this.modules = [
      new ChatModule(this),
    ]
  }

  async onload() {
    // Load settings
    await this.loadSettings();
    this.addSettingTab(new SettingTab(this.app, this));

    // Add ribbon button
    this.addRibbonIcon('message-square', 'Show Chat List', () => {
      const chatModule = this.modules.find(m => m instanceof ChatModule) as ChatModule;
      if (chatModule) {
        chatModule.openChatList();
      }
    });

    // Load modules
    this.modules.forEach(module => module.onload());
  }

  onunload() {
    this.modules.forEach(module => module.onunload());
  }

  async loadSettings() {
    // loadData() reads from Obsidian's storage
    const savedData = await this.loadData();
    // Object.assign merges our defaults with any saved settings
    this.settings = Object.assign({}, DEFAULT_SETTINGS, savedData);
  }

  async saveSettings() {
    // saveData writes to Obsidian's storage
    await this.saveData(this.settings);
  }

}

class SettingTab extends PluginSettingTab {
  plugin: MyPlugin;

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display(): void {
    // Clear any existing settings
    const { containerEl } = this;
    containerEl.empty();

    // Add a section heading
    containerEl.createEl('h2', { text: 'My Plugin Settings' });

    // Create settings using Obsidian's Setting API
    new Setting(containerEl)
      .setName('API Key')
      .setDesc('Enter your API key for the service')
      .addText(text => text
        .setPlaceholder('Enter API key')
        .setValue(this.plugin.settings.apiKey)
        .onChange(async (value) => {
          this.plugin.settings.apiKey = value;
          await this.plugin.saveSettings();
        }));
  }
}
