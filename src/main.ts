import './styles.css'
import { App, type PluginManifest, Plugin } from "obsidian"
import type { PluginModule } from "@modules/types";
import { ExampleModule } from "@modules/example/ExampleModule";
import { ChatModule } from "@modules/chat/ChatModule";


export default class MyPlugin extends Plugin {
  private modules: PluginModule[];

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);
    // Add modules here
    this.modules = [
      new ExampleModule(this),
      new ChatModule(this)
    ]
  }

  async onload() {
    this.modules.forEach(module => module.onload());
  }

  onunload() {
    this.modules.forEach(module => module.onunload());
  }

}