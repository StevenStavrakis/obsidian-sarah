import type { PluginModule } from "@modules/types";
import { TFile, type Menu, type Plugin, type TAbstractFile, type WorkspaceLeaf } from "obsidian";
import { ChatView } from "./ChatView.ts";
import type MyPlugin from "src/main.ts";

export class ChatModule implements PluginModule {
    plugin: MyPlugin;
    identifier = "chat";

    constructor(plugin: MyPlugin) {
        this.plugin = plugin;
    }

    onload(): void {
        const p = this.plugin;
        p.registerView(this.getViewType(), (leaf) => new ChatView(leaf, this.identifier, this.plugin));

        p.registerEvent(
            p.app.workspace.on('file-menu', (menu: Menu, file: TAbstractFile) => {
                menu.addItem((item) => {
                    item.setTitle('Chat with file')
                        .setIcon('message-square')
                        .onClick(() => {
                            if (file instanceof TFile) {
                                this.activateLeaf(file);
                            }
                        });
                });
            })
        )
    }

    onunload(): void {
        console.log("ChatModule onunload");
    }

    getViewType(): string {
        return this.identifier;
    }

    async activateLeaf(file?: TFile): Promise<void> {
        const { workspace } = this.plugin.app;
        let leaf: WorkspaceLeaf | null = null;

        const leaves = workspace.getLeavesOfType(this.getViewType());

        if (leaves.length > 0) {
            leaf = leaves[0];
        } else {
            leaf = workspace.getRightLeaf(false);
            if (leaf === null) {
                throw new Error(`Unable to find leaf of type ${this.getViewType()}`);
            }
            await leaf.setViewState({
                type: this.getViewType(),
                active: true,
            });
        }
        workspace.revealLeaf(leaf);
    }
}
