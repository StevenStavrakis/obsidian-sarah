import { ItemView, WorkspaceLeaf } from "obsidian";
import { mount, unmount, type Component } from "svelte";
import Chat from "./Chat.svelte";
import { ChatModel } from "./ChatModel.svelte";


export class ChatView extends ItemView {
    identifier: string;
    component: ReturnType<typeof Chat> | undefined;
    constructor(leaf: WorkspaceLeaf, identifier: string) {
        super(leaf);
        this.identifier = identifier;
    }

    getViewType() {
        return this.identifier;
    }

    getDisplayText() {
        return "Chat";
    }

    async onOpen() {
        const chatModel = new ChatModel();
        this.component = mount(Chat, {
            target: this.contentEl,
            props: { chatModel },
        });
    }

    async onClose() {
        if (this.component) {
            unmount(this.component);
            this.component = undefined;
        }
    }
}