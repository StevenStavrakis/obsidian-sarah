import type { Messages } from '@anthropic-ai/sdk/src/resources/messages/messages.js';

// Type guards for content blocks
export function isTextBlock(block: unknown): block is Messages.TextBlock | Messages.TextBlockParam {
  return typeof block === 'object' && block !== null && 'type' in block && block.type === 'text';
}

export function isImageBlock(block: unknown): block is Messages.ImageBlockParam {
  return typeof block === 'object' && block !== null && 'type' in block && block.type === 'image' && 'source' in block;
}

export function isDocumentBlock(block: unknown): block is Messages.DocumentBlockParam {
  return typeof block === 'object' && block !== null && 'type' in block && block.type === 'document' && 'source' in block;
}

export function isToolResultBlock(block: unknown): block is Messages.ToolResultBlockParam {
  return typeof block === 'object' && block !== null && 'type' in block && block.type === 'tool_result' && 'content' in block;
}

export function isToolUseBlock(block: unknown): block is Messages.ToolUseBlock | Messages.ToolUseBlockParam {
  return typeof block === 'object' && block !== null && 'type' in block && block.type === 'tool_use' && 'name' in block;
}

// Block creation
export function createMessage(
  role: 'user' | 'assistant',
  content: string | Messages.ContentBlockParam[]
): Messages.MessageParam {
  if (typeof content === 'string') {
    return {
      role,
      content: [{
        type: 'text',
        text: content
      }]
    };
  }
  return { role, content };
}

export function createTextBlock(text: string): Messages.TextBlockParam {
  return {
    type: 'text',
    text
  };
}

export function createImageBlock(
  data: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
): Messages.ImageBlockParam {
  return {
    type: 'image',
    source: {
      type: 'base64',
      media_type: mediaType,
      data
    }
  };
}

export function createDocumentBlock(data: string): Messages.DocumentBlockParam {
  return {
    type: 'document',
    source: {
      type: 'base64',
      media_type: 'application/pdf',
      data
    }
  };
}

export function createToolResultBlock(
  toolUseId: string,
  content: string | Array<Messages.TextBlockParam | Messages.ImageBlockParam>,
  isError = false
): Messages.ToolResultBlockParam {
  return {
    type: 'tool_result',
    tool_use_id: toolUseId,
    content,
    is_error: isError
  };
}

export function createToolUseBlock(
  id: string,
  name: string,
  input: unknown
): Messages.ToolUseBlock {
  return {
    type: 'tool_use',
    id,
    name,
    input
  };
}
