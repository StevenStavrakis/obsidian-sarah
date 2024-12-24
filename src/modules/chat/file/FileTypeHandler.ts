import type { TFile } from 'obsidian';
import type { Messages } from '@anthropic-ai/sdk/resources';
import { createDocumentBlock, createFileEmbedBlock, createImageBlock } from '../utils';

export type SupportedMimeType = 
    | 'text/markdown'
    | 'application/pdf'
    | 'image/png'
    | 'image/jpeg'
    | 'image/gif'
    | 'image/webp'
    | 'application/octet-stream';

export class FileTypeHandler {
    private static readonly MIME_TYPES: Record<string, SupportedMimeType> = {
        'md': 'text/markdown',
        'pdf': 'application/pdf',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'webp': 'image/webp'
    };

    private static readonly BINARY_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp'];

    static getMimeType(extension: string): SupportedMimeType {
        return this.MIME_TYPES[extension.toLowerCase()] || 'application/octet-stream';
    }

    static isBinaryFile(extension: string): boolean {
        return this.BINARY_EXTENSIONS.includes(extension.toLowerCase());
    }

    static isImageFile(extension: string): boolean {
        const mimeType = this.getMimeType(extension);
        return mimeType.startsWith('image/');
    }

    static async createContentBlock(file: TFile, content: string | ArrayBuffer): Promise<Messages.ContentBlockParam> {
        const extension = file.extension.toLowerCase();

        if (this.isImageFile(extension)) {
            const base64Data = this.arrayBufferToBase64(content as ArrayBuffer);
            return createImageBlock(base64Data, this.getMimeType(extension) as Extract<SupportedMimeType, `image/${string}`>);
        }

        if (extension === 'pdf') {
            const base64Data = this.arrayBufferToBase64(content as ArrayBuffer);
            return createDocumentBlock(base64Data);
        }

        return createFileEmbedBlock(content as string, file.name, file.path);
    }

    private static arrayBufferToBase64(buffer: ArrayBuffer): string {
        const uint8Array = new Uint8Array(buffer);
        const binaryString = uint8Array.reduce((str, byte) => str + String.fromCharCode(byte), '');
        return btoa(binaryString);
    }
}
