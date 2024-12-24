import type MyPlugin from 'src/main';
import type { Messages } from '@anthropic-ai/sdk/src/resources/messages/messages.js';
import Anthropic from '@anthropic-ai/sdk';
import { TFile } from 'obsidian';
import { createMessage, createTextBlock } from './utils';
import { ObsidianFileManager } from './file/ObsidianFileManager';
import { chatState } from './store/ChatState.svelte';

export interface DocumentContent {
    type: 'document';
    filename: string;
    mediaType: 'application/pdf';
    data: string;
}

export class ChatModel {
    private client: Anthropic;
    private fileManager: ObsidianFileManager;
    private plugin: MyPlugin;
    userInput: string = $state("");
    pendingDocuments: DocumentContent[] = $state([]);
    isLoading: boolean = $state(false);
    error: string | null = $state(null);

    constructor(plugin: MyPlugin) {
        this.plugin = plugin;
        this.fileManager = new ObsidianFileManager(plugin.app);
        this.client = new Anthropic({
            apiKey: plugin.settings.apiKey,
            dangerouslyAllowBrowser: true
        });
    }

    // Public methods for file operations
    getFileSuggestions(partial: string): string[] {
        return this.fileManager.getFileSuggestions(partial);
    }

    getApp() {
        return this.plugin.app;
    }

    async preloadFile(file: TFile): Promise<void> {
        const currentInput = this.userInput.trim();
        const fileReference = `[[${file.path}]]`;
        
        this.userInput = currentInput
            ? `${currentInput} ${fileReference}`
            : fileReference;
    }

    async parseInputIntoMessage(): Promise<Messages.MessageParam> {
        const messageText = this.userInput.trim();
        const blocks: Messages.ContentBlockParam[] = [];

        // Extract file references in [[]] syntax
        const fileRefs = messageText.match(/\[\[[^\[\]]+\]\]/g) || [];

        if (fileRefs.length > 0) {
            let lastIndex = 0;
            for (const ref of fileRefs) {
                const refIndex = messageText.indexOf(ref, lastIndex);
                const textBetween = messageText.slice(lastIndex, refIndex).trim();
                
                if (textBetween) {
                    blocks.push(createTextBlock(textBetween));
                }
                
                const filePath = ref.slice(2, -2); // Remove [[ and ]]
                try {
                    const contentBlock = await this.fileManager.createAttachmentBlock(filePath);
                    blocks.push(contentBlock);
                } catch (error) {
                    console.warn(`Failed to load file content for ${filePath}:`, error);
                }

                lastIndex = refIndex + ref.length;
            }
            
            const remainingText = messageText.slice(lastIndex).trim();
            if (remainingText) {
                blocks.push(createTextBlock(remainingText));
            }
        } else {
            blocks.push(createTextBlock(messageText));
        }

        return createMessage('user', blocks);
    }

    async getCompletion() {
        try {
            this.isLoading = true;
            this.error = null;

            const message = await this.parseInputIntoMessage();
            this.userInput = "";
            
            // Create a new chat if none is selected
            if (!chatState.currentChatId) {
                const id = await chatState.createNewChat();
                await chatState.selectChat(id);
            }

            // Get current messages and add user message
            const currentMessages = chatState.getCurrentMessages();
            const updatedMessages = [...currentMessages, message];
            await chatState.updateChatMessages(chatState.currentChatId!, updatedMessages);

            // Get AI response
            const response = await this.client.messages.create({
                messages: updatedMessages,
                max_tokens: 1024,
                model: "claude-3-5-sonnet-20241022"
            });

            // Add AI response to chat
            const parsedResponse = createMessage('assistant', response.content);
            const finalMessages = [...updatedMessages, parsedResponse];
            await chatState.updateChatMessages(chatState.currentChatId!, finalMessages);
            
        } catch (error) {
            console.error('Error in getCompletion:', error);
            this.error = error instanceof Error ? error.message : 'An unknown error occurred';
        } finally {
            this.isLoading = false;
        }
    }
}
