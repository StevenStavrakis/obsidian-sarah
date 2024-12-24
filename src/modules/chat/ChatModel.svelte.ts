import type MyPlugin from 'src/main';
import type { Messages } from '@anthropic-ai/sdk/src/resources/messages/messages.js';
import Anthropic from '@anthropic-ai/sdk';
import { createMessage, createDocumentBlock, createTextBlock } from './utils';
import { ObsidianConnector } from './ObsidianConnector';


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
    }

    async parseInputIntoMessage(): Promise<Messages.MessageParam> {
        const messageText = this.userInput.trim();
        const blocks: Messages.ContentBlockParam[] = [];

        // Extract file references starting with @ including optional file extensions
        const fileRefs = messageText.match(/@[\w-/]+(?:\.[a-zA-Z0-9]+)?/g) || [];

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
        this.chat = [...this.chat, message];
        console.log("Chat: ", $state.snapshot(this.chat));
        const response = await this.client.messages.create({
            messages: this.chat,
            max_tokens: 1024,
            model: "claude-3-5-sonnet-20241022"
        });
        const parsedResponse = createMessage('assistant', response.content);
        this.chat = [...this.chat, parsedResponse];
    }
}
