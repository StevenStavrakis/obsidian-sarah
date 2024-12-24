import Anthropic from '@anthropic-ai/sdk';
import type { ContentBlock } from '@anthropic-ai/sdk/resources';

export class AnthropicClient {
    private client: Anthropic;
    private model = 'claude-3-5-sonnet-20241022';

    constructor(apiKey: string) {
        this.client = new Anthropic({
            apiKey: apiKey,
            dangerouslyAllowBrowser: true
        });
    }
}
