import { chatDb, type StoredChat } from './ChatDatabase';
import type { Messages } from '@anthropic-ai/sdk/src/resources/messages/messages.js';
import { writable, type Writable } from 'svelte/store';

interface ChatState {
    chats: StoredChat[];
    currentChatId: number | null;
    isListView: boolean;
}

class ChatStore {
    private state: Writable<ChatState>;

    constructor() {
        this.state = writable({
            chats: [],
            currentChatId: null,
            isListView: true
        });
        this.loadChats();
    }

    subscribe(run: (value: ChatState) => void) {
        return this.state.subscribe(run);
    }

    private async loadChats() {
        const chats = await chatDb.getAllChats();
        this.state.update(state => ({ ...state, chats }));
    }

    async createNewChat(title: string = 'New Chat'): Promise<number> {
        const id = await chatDb.createChat(title);
        await this.loadChats();
        return id;
    }

    async deleteChat(id: number) {
        await chatDb.deleteChat(id);
        this.state.update(state => ({
            ...state,
            currentChatId: state.currentChatId === id ? null : state.currentChatId
        }));
        await this.loadChats();
    }

    async updateChatMessages(id: number, messages: Messages.MessageParam[]) {
        await chatDb.updateChat(id, { messages });
        await this.loadChats();
    }

    async updateChatTitle(id: number, title: string) {
        await chatDb.updateChat(id, { title });
        await this.loadChats();
    }

    async selectChat(id: number) {
        this.state.update(state => ({ 
            ...state, 
            currentChatId: id,
            isListView: false 
        }));
        return await chatDb.getChat(id);
    }

    showChatList() {
        this.state.update(state => ({ ...state, isListView: true }));
    }

    getCurrentChat(): StoredChat | undefined {
        let currentState: ChatState;
        this.state.subscribe(state => { currentState = state; })();
        return currentState!.chats.find(chat => chat.id === currentState!.currentChatId);
    }
}

export const chatStore = new ChatStore();
