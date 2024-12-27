import { ItemView, TFile, WorkspaceLeaf } from "obsidian";
import { mount, unmount } from "svelte";
import Chat from "./Chat.svelte";
import { initializeChatStore } from "./store/ChatStore.svelte";
import type MyPlugin from "src/main";

export class ChatView extends ItemView {
    identifier: string;
    component: any | undefined; // Svelte component instance
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
            props: { chatManager },
        });
    }

    async onClose() {
        if (this.component) {
            unmount(this.component);
            this.component = undefined;
        }
    }

    async preloadFile(file: TFile) {
        const chatModel = this.component?.$$.ctx[0]?.chatModel;
        if (chatModel) {
            await chatModel.preloadFile(file);
        }
    }
}
