import type { Messages } from '@anthropic-ai/sdk/src/resources/messages/messages.js';
import Anthropic from '@anthropic-ai/sdk';
import { TFile } from 'obsidian';
import { createMessage, createTextBlock } from './utils';
import { ObsidianFileManager } from './file/ObsidianFileManager';
import { chatDb } from './store/ChatDatabase';

export interface DocumentContent {
    type: 'document';
    filename: string;
    mediaType: 'application/pdf';
    data: string;
}

export class AnthropicChatModel {
    private client: Anthropic;
    private fileManager: ObsidianFileManager;
    private chatId: number;
    userInput = $state("");
    history: Messages.MessageParam[] = $state([]);
    isLoading: boolean = $state(false);
    error: string | null = $state(null);
    chunks: string[] = [];

    constructor(apiKey: string, chatId: number) {
        this.chatId = chatId;
        this.fileManager = new ObsidianFileManager();
        this.client = new Anthropic({
            apiKey,
            dangerouslyAllowBrowser: true
        });

        this.loadMessages();

        $effect.root(() => {
            $effect(() => {
                this.userInput;
                this.parseInputIntoChunks();
            });
        });
    }

    parseInputIntoChunks() {
        console.log("parsing input")
        const messageText = this.userInput.trim();

        const strChunks: string[] = [];

        const openBracketsIndices = Array.from(messageText.matchAll(/\[\[/g)).map(match => (match.index !== undefined ? match.index : 0));
        const closeBracketsIndices = Array.from(messageText.matchAll(/\]\]/g)).map(match => (match.index !== undefined ? match.index : 0));
        let lastIndex = 0;

        for (let i = 0; i < openBracketsIndices.length; i++) {
            const openIndex = openBracketsIndices[i];
            const closeIndex = closeBracketsIndices.find(idx => idx > openIndex);

            // If there is no matching close bracket, we can break or handle the remainder.
            if (closeIndex === undefined) {
                break;
            }

            // If there's text before this bracketed section, push it into the chunks.
            if (openIndex > lastIndex) {
                const textChunk = messageText.substring(lastIndex, openIndex);
                if (textChunk) {
                    strChunks.push(textChunk);
                }
            }

            // Push the bracketed text as its own chunk.
            const bracketChunk = messageText.substring(openIndex, closeIndex + 2);
            strChunks.push(bracketChunk);

            lastIndex = closeIndex + 2;
        }

        // If there's leftover text after the last bracket, add it as a final chunk.
        if (lastIndex < messageText.length) {
            const remainingText = messageText.substring(lastIndex);
            if (remainingText) {
                strChunks.push(remainingText);
            }
        }
        console.log(strChunks)
        this.chunks = strChunks;
    }

    async chunksToMessage(): Promise<Messages.MessageParam> {
        const { chunks } = this;
        const blocks: Messages.ContentBlockParam[] = [];

        for (const chunk of chunks) {
            if (chunk === " ") continue;
            if (chunk.startsWith('[[') && chunk.endsWith(']]')) {
                // remove the brackets from the chunk
                const filePath = chunk.slice(2, -2);
                try {
                    const contentBlock = await this.fileManager.createAttachmentBlock(filePath);
                    blocks.push(contentBlock);
                } catch (error) {
                    console.warn(`Failed to load file content for ${filePath}:`, error);
                }
            } else {
                blocks.push(createTextBlock(chunk));
            }
        }
        return createMessage('user', blocks);
    }

    async getCompletion() {
        const oldUserInput = $state.snapshot(this.userInput);
        const parsedUserInput = await this.chunksToMessage();
        try {
            this.userInput = "";
            this.isLoading = true;
            this.error = null;
            const newHistory = [...this.history, parsedUserInput];
            await this.updateMessages(newHistory);

            const response = await this.client.messages.create({
                messages: this.history,
                max_tokens: 1024,
                model: "claude-3-5-sonnet-20241022"
            });

            console.log("Response: ", response.content[0]);
            const parsedResponse = createMessage('assistant', response.content);
            const finalHistory = [...this.history, parsedResponse];
            await this.updateMessages(finalHistory);
        } catch (error) {
            console.error('Error in getCompletion:', error);
            console.error("Error caused by: ", [...$state.snapshot(this.history), parsedUserInput]);
            this.error = error instanceof Error ? error.message : 'An unknown error occurred';
            this.userInput = oldUserInput;
            this.history.pop();
        } finally {
            this.isLoading = false;
        }
    }

    private async loadMessages() {
        const chat = await chatDb.getChat(this.chatId);
        if (chat) {
            this.history = chat.messages;
        }
    }

    private async updateMessages(messages: Messages.MessageParam[]) {
        await chatDb.updateChat(this.chatId, { messages });
        this.history = messages;
    }

    async preloadFile(file: TFile): Promise<void> {
        const currentInput = this.userInput.trim();
        const fileReference = `[[${file.path}]]`;

        this.userInput = currentInput
            ? `${currentInput} ${fileReference}`
            : fileReference;
    }
}
