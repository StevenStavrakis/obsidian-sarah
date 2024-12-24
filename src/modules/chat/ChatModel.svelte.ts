import type MyPlugin from 'src/main';
import type { Messages } from '@anthropic-ai/sdk/src/resources/messages/messages.js';
import Anthropic from '@anthropic-ai/sdk';
import { TFile } from 'obsidian';
import { createMessage, createDocumentBlock, createTextBlock } from './utils';
import { ObsidianConnector } from './ObsidianConnector';
import { chatStore } from './store/ChatStore';


export interface DocumentContent {
    type: 'document';
    filename: string;
    mediaType: 'application/pdf';
    data: string;
}

export class ChatModel {
    private client: Anthropic;
    chat: Messages.MessageParam[] = $state([]);
    userInput: string = $state("");
    pendingDocuments: DocumentContent[] = $state([]);
    isLoading: boolean = $state(false);
    error: string | null = $state(null);
    plugin: MyPlugin;
    obsidianConnector: ObsidianConnector;

    constructor(plugin: MyPlugin) {
        this.plugin = plugin;
        this.obsidianConnector = new ObsidianConnector(plugin.app);
        this.client = new Anthropic({
            apiKey: plugin.settings.apiKey,
            dangerouslyAllowBrowser: true
        });

        // Subscribe to chat store changes
        chatStore.subscribe(state => {
            const currentChat = state.chats.find(chat => chat.id === state.currentChatId);
            if (currentChat) {
                this.chat = currentChat.messages;
            } else {
                this.chat = [];
            }
        });
    }

    async preloadFile(file: TFile): Promise<void> {
        // Append the file reference to existing input
        const currentInput = this.userInput.trim();
        const fileReference = `@${file.path}`;
        
        if (currentInput) {
            // If there's existing input, add a space before appending
            this.userInput = `${currentInput} ${fileReference}`;
        } else {
            // If input is empty, just set the file reference
            this.userInput = fileReference;
        }
    }

    async parseInputIntoMessage(): Promise<Messages.MessageParam> {
        const messageText = this.userInput.trim();
        const blocks: Messages.ContentBlockParam[] = [];

        // Extract file references starting with @ including optional file extensions
        const fileRefs = messageText.match(/@[^@\n\r\t]+/g) || [];

        // If we have any file references, split the message around them
        if (fileRefs.length > 0) {
            let lastIndex = 0;
            for (const ref of fileRefs) {
                const refIndex = messageText.indexOf(ref, lastIndex);
                if (refIndex > lastIndex) {
                    blocks.push(createTextBlock(messageText.slice(lastIndex, refIndex).trim()));
                }
                const filePath = ref.slice(1); // Remove @ symbol
                try {
                    const contentBlock = await this.obsidianConnector.createAttachmentBlock(filePath);
                    blocks.push(contentBlock);
                } catch (error) {
                    console.warn(`Failed to load file content for ${filePath}:`, error);
                }

                lastIndex = refIndex + ref.length;
            }
            if (lastIndex < messageText.length) {
                blocks.push(createTextBlock(messageText.slice(lastIndex).trim()));
            }
        } else {
            blocks.push(createTextBlock(messageText));
        }

        return createMessage('user', blocks);
    }

    async getCompletion() {
        const message = await this.parseInputIntoMessage();
        this.userInput = "";
        
        const currentState = await new Promise<{ currentChatId: number | null }>(resolve => {
            chatStore.subscribe(state => resolve({ currentChatId: state.currentChatId }))();
        });

        // Create a new chat if none is selected
        if (!currentState.currentChatId) {
            const id = await chatStore.createNewChat();
            await chatStore.selectChat(id);
        }

        // Add user message
        const updatedChat = [...this.chat, message];
        await chatStore.updateChatMessages(currentState.currentChatId!, updatedChat);

        // Get AI response
        const response = await this.client.messages.create({
            messages: updatedChat,
            max_tokens: 1024,
            model: "claude-3-5-sonnet-20241022"
        });

        // Add AI response
        const parsedResponse = createMessage('assistant', response.content);
        const finalChat = [...updatedChat, parsedResponse];
        await chatStore.updateChatMessages(currentState.currentChatId!, finalChat);
    }
}
