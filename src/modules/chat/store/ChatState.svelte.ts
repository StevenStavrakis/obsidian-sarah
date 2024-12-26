import type { Messages } from '@anthropic-ai/sdk/src/resources/messages/messages.js';
import { chatDb, type StoredChat } from './ChatDatabase';

export class ChatState {
    chats: StoredChat[] = $state([]);
    currentChatId: number | null = $state(null);
    editingChatId: number | null = $state(null);
    isListView: boolean = $state(true);
    isLoading: boolean = $state(false);

    constructor() {
        this.loadChats();
    }

    private async loadChats() {
        this.isLoading = true;
        try {
            this.chats = await chatDb.getAllChats();
        } finally {
            this.isLoading = false;
        }
    }

    async createNewChat(title: string = 'New Chat'): Promise<number> {
        const id = await chatDb.createChat(title);
        const newChat = await chatDb.getChat(id);
        if (newChat) {
            this.chats = [...this.chats, newChat];
        }
        return id;
    }

    async deleteChat(id: number) {
        await chatDb.deleteChat(id);
        if (this.currentChatId === id) {
            this.currentChatId = null;
        }
        this.chats = this.chats.filter(chat => chat.id !== id);
    }

    async updateChatMessages(id: number, messages: Messages.MessageParam[]) {
        await chatDb.updateChat(id, { messages });
        this.chats = this.chats.map(chat => 
            chat.id === id 
                ? { ...chat, messages } 
                : chat
        );
    }

    startEditing(id: number) {
        this.editingChatId = id;
    }

    async updateChatTitle(id: number, title: string) {
        if (title.trim()) {
            await chatDb.updateChat(id, { title: title.trim() });
            this.chats = this.chats.map(chat => 
                chat.id === id 
                    ? { ...chat, title: title.trim() } 
                    : chat
            );
        }
        this.editingChatId = null;
    }

    cancelEditing() {
        this.editingChatId = null;
    }

    async selectChat(id: number) {
        this.currentChatId = id;
        this.isListView = false;
        return this.getCurrentChat();
    }

    showChatList() {
        this.isListView = true;
    }

    getCurrentChat(): StoredChat | undefined {
        return this.chats.find(chat => chat.id === this.currentChatId);
    }

    getCurrentMessages(): Messages.MessageParam[] {
        return this.getCurrentChat()?.messages || [];
    }
}

// Export a singleton instance
export const chatState = new ChatState();
