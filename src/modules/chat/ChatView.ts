import { ItemView, Plugin, TFile, WorkspaceLeaf } from "obsidian";
import { mount, unmount } from "svelte";
import Chat from "./Chat.svelte";
import { ChatModel } from "./ChatModel.svelte";
import type MyPlugin from "src/main";

export class ChatView extends ItemView {
    identifier: string;
    component: any | undefined; // Svelte component instance
    private chatModel: ChatModel | undefined;
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
        this.chatModel = new ChatModel(this.plugin);
        
        this.component = mount(Chat, {
            target: this.contentEl,
            props: { chatModel: this.chatModel },
        });
    }

    async onClose() {
        if (this.component) {
            unmount(this.component);
            this.component = undefined;
        }
        this.chatModel = undefined;
    }

    async preloadFile(file: TFile) {
        if (this.chatModel) {
            await this.chatModel.preloadFile(file);
        }
    }
}
