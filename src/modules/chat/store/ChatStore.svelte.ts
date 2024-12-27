import { createChatManager } from './ChatManager.svelte';
import type { Messages } from '@anthropic-ai/sdk/src/resources/messages/messages.js';
import { writable, type Writable } from 'svelte/store';

let chatManager: ReturnType<typeof createChatManager> | null = null;

export const initializeChatStore = (apiKey: string) => {
    // Return existing instance if already initialized
    if (chatManager) {
        return chatManager;
    }
    
    // Create new instance if not initialized
    chatManager = createChatManager(apiKey);
    return chatManager;
};

export const getChatManager = () => {
    if (!chatManager) {
        throw new Error('ChatStore not initialized. Call initializeChatStore first.');
    }
    return chatManager;
};

// For debugging
(window as any).getChatManager = getChatManager;
