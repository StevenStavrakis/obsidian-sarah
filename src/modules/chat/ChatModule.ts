import type { PluginModule } from "@modules/types";
import { TFile, type Menu, type Plugin, type TAbstractFile, type WorkspaceLeaf } from "obsidian";
import { ChatView } from "./ChatView.ts";

export class ChatModule implements PluginModule {
    plugin: Plugin;
    identifier = "chat";

    constructor(plugin: Plugin) {
        this.plugin = plugin;
    }

    onload(): void {
        const p = this.plugin;
        p.registerView(this.getViewType(), (leaf) => new ChatView(leaf, this.identifier));

        p.registerEvent(
            p.app.workspace.on('file-menu', (menu: Menu, file: TAbstractFile) => {
                if (file instanceof TFile) {
                    menu.addItem((item) => {
                        item.setTitle('Whetstone')
                            .setIcon('dice')
                            .onClick(() => {
                                console.log('clicking whetstone');
                                console.log(file.name)
                                this.activateLeaf();
                            });
                    });
                }
            })
        )

    }

    onunload(): void {
        console.log("ChatModule onunload");
    }

    getViewType(): string {
        return this.identifier;
    }

    async activateLeaf(): Promise<void> {
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
                active: true
            });
        }

        workspace.revealLeaf(leaf);
    }
}