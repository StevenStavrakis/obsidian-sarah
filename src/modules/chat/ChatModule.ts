import type { PluginModule } from "@modules/types";
import { TFile, TFolder, type Menu, type Plugin, type TAbstractFile, type WorkspaceLeaf } from "obsidian";
import { ChatView } from "./ChatView.ts";
import type MyPlugin from "src/main.ts";
import { chatStore } from "./store/ChatStore.svelte.js";

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
                if (file instanceof TFile) {
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
                } else if (file instanceof TFolder) {
                    menu.addItem((item) => {
                        item.setTitle('Add all files to current chat')
                            .setIcon('plus-circle')
                            .onClick(() => this.addFolderToCurrentChat(file));
                    });

                    menu.addItem((item) => {
                        item.setTitle('Add all files to new chat')
                            .setIcon('message-square')
                            .onClick(() => this.createNewChatWithFolder(file));
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

    async openChatList(): Promise<void> {
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

        workspace.revealLeaf(leaf);
    }

    private async addFolderToCurrentChat(folder: TFolder): Promise<void> {
        const { workspace } = this.plugin.app;
        const leaves = workspace.getLeavesOfType(this.getViewType());
        
        if (leaves.length === 0) {
            // If no chat is open, create a new one
            await this.createNewChatWithFolder(folder);
            return;
        }

        const leaf = leaves[0];
        const view = leaf.view as ChatView;
        
        // Get all files in the folder recursively
        const files = this.getAllFilesInFolder(folder);
        for (const file of files) {
            await view.preloadFile(file);
        }
        
        workspace.revealLeaf(leaf);
    }

    private getAllFilesInFolder(folder: TFolder): TFile[] {
        const files: TFile[] = [];
        folder.children.forEach(child => {
            if (child instanceof TFile) {
                files.push(child);
            } else if (child instanceof TFolder) {
                files.push(...this.getAllFilesInFolder(child));
            }
        });
        return files;
    }

    async createNewChatWithFolder(folder: TFolder): Promise<void> {
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

        // Create a new chat and pre-load all files in the folder
        const chatId = await chatStore.createNewChat();
        const view = leaf.view as ChatView;
        const files = this.getAllFilesInFolder(folder);
        for (const file of files) {
            await view.preloadFile(file);
        }
        await chatStore.selectChat(chatId);

        workspace.revealLeaf(leaf);
    }

    async createNewChatWithFile(file?: TFile): Promise<void> {
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
        const chatId = await chatStore.createNewChat();
        const view = leaf.view as ChatView;
        if (file) {
            await view.preloadFile(file);
        }
        await chatStore.selectChat(chatId);

        workspace.revealLeaf(leaf);
    }
}
