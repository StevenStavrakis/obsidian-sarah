import Dexie, { type Table } from 'dexie';
import type { Messages } from '@anthropic-ai/sdk/src/resources/messages/messages.js';

// Database types
interface DbChat {
    id?: number;
    title: string;
    messages: string; // JSON string of Messages.MessageParam[]
    createdAt: Date;
    updatedAt: Date;
}

// API types
export interface StoredChat {
    id?: number;
    title: string;
    messages: Messages.MessageParam[];
    createdAt: Date;
    updatedAt: Date;
}

export class ChatDatabase extends Dexie {
    chats!: Table<DbChat>;

    constructor() {
        super('ChatDatabase');
        this.version(1).stores({
            chats: '++id, title, createdAt, updatedAt'
        });
        
        // Increment version to force migration
        this.version(3)
            .stores({
                chats: '++id, title, createdAt, updatedAt'
            })
            .upgrade(async tx => {
                // Clear database and start fresh
                await tx.table('chats').clear();
                console.log('Database cleared for clean migration');
                
                await tx.table('chats').toCollection().modify(chat => {
                    try {
                        // Handle null/undefined messages
                        if (!chat.messages) {
                            chat.messages = JSON.stringify([]);
                            return;
                        }

                        // If already a string, try to parse and re-stringify to validate
                        if (typeof chat.messages === 'string') {
                            const parsed = JSON.parse(chat.messages);
                            chat.messages = JSON.stringify(parsed);
                            return;
                        }

                        // Convert array to string
                        if (Array.isArray(chat.messages)) {
                            chat.messages = JSON.stringify(chat.messages.map((msg: any) => ({
                                role: msg.role || 'user',
                                content: Array.isArray(msg.content) ? msg.content.map((block: any) => {
                                    if (typeof block === 'string') {
                                        return { type: 'text', text: block };
                                    }
                                    if (block.type === 'text') {
                                        return { type: 'text', text: block.text || '' };
                                    }
                                    if (block.source && typeof block.source === 'object') {
                                        return {
                                            type: block.type || 'text',
                                            source: {
                                                type: block.source.type || 'base64',
                                                media_type: block.source.media_type || 'text/plain',
                                                data: block.source.data || ''
                                            }
                                        };
                                    }
                                    return { type: 'text', text: JSON.stringify(block) };
                                }) : [{ type: 'text', text: String(msg.content || '') }]
                            })));
                            return;
                        }

                        // Fallback for unknown formats
                        chat.messages = JSON.stringify([]);
                    } catch (error) {
                        console.error('Error upgrading chat messages:', error);
                        chat.messages = JSON.stringify([]);
                    }
                });
            });
    }

    async createChat(title: string, messages: Messages.MessageParam[] = []): Promise<number> {
        const now = new Date();
        const serializedMessages = JSON.stringify(messages, (key, value) => {
            if (key === 'source' && typeof value === 'object') {
                return {
                    type: value.type,
                    media_type: value.media_type,
                    data: value.data
                };
            }
            return value;
        });

        return await this.chats.add({
            title,
            messages: serializedMessages,
            createdAt: now,
            updatedAt: now
        });
    }

    async updateChat(id: number, updates: Partial<StoredChat>): Promise<void> {
        const { messages, ...otherUpdates } = updates;
        
        const updatesToStore: Partial<DbChat> = {
            ...otherUpdates,
            updatedAt: new Date()
        };

        if (messages) {
            updatesToStore.messages = JSON.stringify(messages, (key, value) => {
                if (key === 'source' && typeof value === 'object') {
                    return {
                        type: value.type,
                        media_type: value.media_type,
                        data: value.data
                    };
                }
                return value;
            });
        }
        
        await this.chats.update(id, updatesToStore);
    }

    async deleteChat(id: number): Promise<void> {
        await this.chats.delete(id);
    }

    async getAllChats(): Promise<StoredChat[]> {
        const chats = await this.chats.orderBy('updatedAt').reverse().toArray();
        return chats.map(chat => {
            try {
                // Handle case where messages might be an object instead of a string
                const messagesStr = typeof chat.messages === 'object' ? 
                    JSON.stringify(chat.messages) : 
                    chat.messages;

                return {
                    ...chat,
                    messages: JSON.parse(messagesStr, (key, value) => {
                        if (key === 'source' && typeof value === 'object') {
                            return {
                                type: value.type,
                                media_type: value.media_type,
                                data: value.data
                            };
                        }
                        return value;
                    })
                };
            } catch (error) {
                console.error('Error parsing chat messages:', error);
                return {
                    ...chat,
                    messages: [] // Return empty messages array on error
                };
            }
        });
    }

    async getChat(id: number): Promise<StoredChat | undefined> {
        const chat = await this.chats.get(id);
        if (!chat) return undefined;
        return {
            ...chat,
            messages: JSON.parse(chat.messages, (key, value) => {
                if (key === 'source' && typeof value === 'object') {
                    return {
                        type: value.type,
                        media_type: value.media_type,
                        data: value.data
                    };
                }
                return value;
            })
        };
    }
}

export const chatDb = new ChatDatabase();
