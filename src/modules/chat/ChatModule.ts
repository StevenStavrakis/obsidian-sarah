import type { PluginModule } from "@modules/types";
import { TFile, type Menu, type Plugin, type TAbstractFile, type WorkspaceLeaf } from "obsidian";
import { ChatView } from "./ChatView.ts";
import type MyPlugin from "src/main.ts";
import { chatStore } from "./store/ChatStore";

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
                if (!(file instanceof TFile)) return;

                menu.addItem((item) => {
                    item.setTitle('Add to current chat')
                        .setIcon('plus-circle')
                        .onClick(() => this.addToCurrentChat(file));
                });

                menu.addItem((item) => {
                    item.setTitle('Add to new chat')
                        .setIcon('message-square')
                        .onClick(() => this.createNewChatWithFile(file));
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

    private async addToCurrentChat(file: TFile): Promise<void> {
        const { workspace } = this.plugin.app;
        const leaves = workspace.getLeavesOfType(this.getViewType());
        
        if (leaves.length === 0) {
            // If no chat is open, create a new one
            await this.createNewChatWithFile(file);
            return;
        }

        const leaf = leaves[0];
        const view = leaf.view as ChatView;
        await view.preloadFile(file);
        workspace.revealLeaf(leaf);
    }

    async createNewChatWithFile(file: TFile): Promise<void> {
        const { workspace } = this.plugin.app;
        let leaf: WorkspaceLeaf | null = null;

        const leaves = workspace.getLeavesOfType(this.getViewType());

        if (leaves.length > 0) {
            // Reuse existing leaf
            leaf = leaves[0];
        } else {
            // Create new leaf
            leaf = workspace.getRightLeaf(false);
            if (leaf === null) {
                throw new Error(`Unable to find leaf of type ${this.getViewType()}`);
            }
            await leaf.setViewState({
                type: this.getViewType(),
                active: true,
            });
        }

        // Create a new chat and pre-load the file if provided
        if (file) {
            const chatId = await chatStore.createNewChat();
            const view = leaf.view as ChatView;
            await view.preloadFile(file);
            await chatStore.selectChat(chatId);
        }

        workspace.revealLeaf(leaf);
    }
}
