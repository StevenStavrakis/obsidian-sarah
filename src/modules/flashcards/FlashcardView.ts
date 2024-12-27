import { ItemView, WorkspaceLeaf } from "obsidian";
import Flashcards from "./Flashcards.svelte";
import { mount } from "svelte";

export class FlashView extends ItemView {
    identifier: string;
    component!: ReturnType<typeof Flashcards>;

    constructor(leaf: WorkspaceLeaf, identifier: string) {
        super(leaf);
        this.identifier = identifier;
    }

    getViewType(): string {
        return this.identifier;
    }

    getDisplayText(): string {
        return "Example View";
    }

    async onOpen(): Promise<void> {
        this.component = mount(Flashcards, {
            target: this.contentEl,
            props: {
                someProp: 'world',
            },
        });
    }

    async onClose(): Promise<void> {
    }
}
