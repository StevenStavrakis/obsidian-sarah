import { ItemView, TFile, WorkspaceLeaf } from "obsidian";
import { mount, unmount } from "svelte";
import Chat from "./Chat.svelte";
import { initializeChatStore } from "./store/ChatStore.svelte";
import type MyPlugin from "src/main";

export class ChatView extends ItemView {
    identifier: string;
    component: any | undefined; // Svelte component instance
    chatModel: any | undefined; // Reference to the current chat model
    private plugin: MyPlugin;

    constructor(leaf: WorkspaceLeaf, identifier: string, plugin: MyPlugin) {
        super(leaf);
        this.identifier = identifier;
        this.plugin = plugin;
    }

    getViewType() {
        return this.identifier;
    }

    getDisplayText() {
        return "Chat";
    }

    async onOpen() {
        const chatManager = initializeChatStore(this.plugin.settings.apiKey);

        this.component = mount(Chat, {
            target: this.contentEl,
            props: { 
                chatManager,
                onChatModelChange: (model: any) => {
                    this.chatModel = model;
                }
            },
        });
    }

    async onClose() {
        if (this.component) {
            unmount(this.component);
            this.component = undefined;
        }
    }

    async preloadFile(file: TFile) {
        // Wait for chat model to be available
        let attempts = 0;
        while (!this.chatModel && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (this.chatModel) {
            await this.chatModel.preloadFile(file);
        } else {
            console.error('Chat model not initialized after timeout');
        }
    }
}
