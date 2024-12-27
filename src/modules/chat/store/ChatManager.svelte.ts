import type { Messages } from '@anthropic-ai/sdk/src/resources/messages/messages.js';
import { chatDb, type StoredChat } from './ChatDatabase';
import { AnthropicChatModel } from '../ChatModel.svelte';

export class ChatManager {
    chats: StoredChat[] = $state([]);
    currentChatId: number | null = $state(null);
    editingChatId: number | null = $state(null);
    isListView: boolean = $state(true);
    isLoading: boolean = $state(false);
    private chatModels: Map<number, AnthropicChatModel> = new Map();
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
        this.loadChats();

        // Set up a periodic refresh of the chat list
        $effect.root(() => {
            $effect(() => {
                const interval = setInterval(() => {
                    if (!this.isLoading && !this.editingChatId) {
                        this.loadChats();
                    }
                }, 5000); // Refresh every 5 seconds if not loading or editing

                return () => clearInterval(interval);
            });
        })
    }

    private async loadChats() {
        if (this.isLoading) return;

        this.isLoading = true;
        try {
            const chats = await chatDb.getAllChats();
            this.chats = chats.sort((a, b) =>
                (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0)
            );
        } catch (error) {
            console.error('Error loading chats:', error);
        } finally {
            this.isLoading = false;
        }
    }

    async createNewChat(title: string = 'New Chat'): Promise<number> {
        const id = await chatDb.createChat(title);
        const newChat = await chatDb.getChat(id);
        if (newChat) {
            await this.loadChats();
            // Create a new chat model instance
            this.chatModels.set(id, new AnthropicChatModel(this.apiKey, id));
        }
        return id;
    }

    async deleteChat(id: number) {
        await chatDb.deleteChat(id);
        if (this.currentChatId === id) {
            this.currentChatId = null;
        }
        await this.loadChats();
        this.chatModels.delete(id);
    }

    startEditing(id: number) {
        this.editingChatId = id;
    }

    async updateChatTitle(id: number, title: string) {
        if (title.trim()) {
            await chatDb.updateChat(id, { title: title.trim() });
            await this.loadChats();
        }
        this.editingChatId = null;
    }

    cancelEditing() {
        this.editingChatId = null;
    }

    async selectChat(id: number) {
        this.currentChatId = id;
        this.isListView = false;

        // Create chat model if it doesn't exist
        if (!this.chatModels.has(id)) {
            this.chatModels.set(id, new AnthropicChatModel(this.apiKey, id));
        }

        return this.getCurrentChat();
    }

    showChatList() {
        this.isListView = true;
    }

    getCurrentChat(): StoredChat | undefined {
        return this.chats.find(chat => chat.id === this.currentChatId);
    }

    getCurrentChatModel(): AnthropicChatModel | undefined {
        return this.currentChatId ? this.chatModels.get(this.currentChatId) : undefined;
    }
}

// Export a function to create the singleton instance with the API key
export const createChatManager = (apiKey: string) => new ChatManager(apiKey);
