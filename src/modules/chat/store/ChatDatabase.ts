import Dexie, { type Table } from 'dexie';
import type { Messages } from '@anthropic-ai/sdk/src/resources/messages/messages.js';

export interface StoredChat {
    id?: number;
    title: string;
    messages: Messages.MessageParam[];
    createdAt: Date;
    updatedAt: Date;
}

export class ChatDatabase extends Dexie {
    chats!: Table<StoredChat>;

    constructor() {
        super('ChatDatabase');
        this.version(1).stores({
            chats: '++id, title, createdAt, updatedAt'
        });
    }

    async createChat(title: string, messages: Messages.MessageParam[] = []): Promise<number> {
        const now = new Date();
        return await this.chats.add({
            title,
            messages,
            createdAt: now,
            updatedAt: now
        });
    }

    async updateChat(id: number, updates: Partial<StoredChat>): Promise<void> {
        await this.chats.update(id, {
            ...updates,
            updatedAt: new Date()
        });
    }

    async deleteChat(id: number): Promise<void> {
        await this.chats.delete(id);
    }

    async getAllChats(): Promise<StoredChat[]> {
        return await this.chats.orderBy('updatedAt').reverse().toArray();
    }

    async getChat(id: number): Promise<StoredChat | undefined> {
        return await this.chats.get(id);
    }
}

export const chatDb = new ChatDatabase();
