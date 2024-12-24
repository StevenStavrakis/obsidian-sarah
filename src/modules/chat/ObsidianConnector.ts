import { App, TFile } from 'obsidian';
import { createDocumentBlock, createImageBlock, createTextBlock } from './utils';
import type { Messages } from '@anthropic-ai/sdk/resources';

export class ObsidianConnector {
    private app: App;

    constructor(app: App) {
        this.app = app;
    }

    /**
     * Gets a TFile object from a file path
     * @param path The file path in the vault
     * @returns The corresponding TFile object if found
     * @throws Error if file not found or is not a file
     */
    getTFile(path: string): TFile {
        const Tfile = this.app.vault.getAbstractFileByPath(path);
        if (!Tfile) {
            throw new Error(`No file found at path: ${path}`);
        }
        if (!(Tfile instanceof TFile)) {
            throw new Error(`Path does not point to a file: ${path}`);
        }
        return Tfile;
    }

    /**
     * Checks if a file exists at the given path
     * @param path The file path to check
     * @returns boolean indicating if a file exists at the path
     */
    hasFile(path: string): boolean {
        try {
            this.getTFile(path);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Converts an Obsidian TFile to a standard web File object.
     * Supports markdown, PDF, and common image formats (PNG, JPEG, GIF, WEBP).
     * For PDFs and images, preserves binary data integrity and proper MIME types.
     * 
     * @param tfile - The Obsidian TFile to convert
     * @returns Promise<File> - A standard web File object with appropriate MIME type
     * @throws Error if file extension is unsupported
     */
    /**
     * Gets the content of a file as a string
     * @param path The file path in the vault
     * @returns The file content as a string
     * @throws Error if file not found or reading fails
     */
    async getFileContent(path: string): Promise<string> {
        const file = this.getTFile(path);
        const extension = file.extension.toLowerCase();

        // Determine if file is binary based on extension
        const binaryExtensions = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp'];
        const isBinary = binaryExtensions.includes(extension);

        if (isBinary) {
            // For binary files (PDF, images), return base64 encoded content
            const arrayBuffer = await this.app.vault.readBinary(file);
            const uint8Array = new Uint8Array(arrayBuffer);
            const binaryString = uint8Array.reduce((str, byte) => str + String.fromCharCode(byte), '');
            return btoa(binaryString);
        } else {
            // For text files (markdown, etc), return the raw content
            return await this.app.vault.read(file);
        }
    }

    /**
     * Get the MIME type for a file extension
     * @param extension The file extension
     * @returns The corresponding MIME type
     */
    private getMimeType(extension: string): "text/markdown" | "application/pdf" | "image/png" | "image/jpeg" | "image/gif" | "image/webp" | "application/octet-stream" {
        switch (extension) {
            case 'md':
                return 'text/markdown';
            case 'pdf':
                return 'application/pdf';
            case 'png':
                return 'image/png';
            case 'jpg':
            case 'jpeg':
                return 'image/jpeg';
            case 'gif':
                return 'image/gif';
            case 'webp':
                return 'image/webp';
            default:
                return 'application/octet-stream';
        }
    }

    private getImageMimeType(extension: string): "image/png" | "image/jpeg" | "image/gif" | "image/webp" {
        switch (extension) {
            case 'png':
                return 'image/png';
            case 'jpg':
            case 'jpeg':
                return 'image/jpeg';
            case 'gif':
                return 'image/gif';
            case 'webp':
                return 'image/webp';
            default:
                throw new Error(`Unsupported image extension: ${extension}`);
        }
    }

    async convertTFileToFile(tfile: TFile): Promise<File> {
        const extension = tfile.extension.toLowerCase();

        // For markdown files, return as text file
        if (extension === 'md') {
            const content = await this.app.vault.read(tfile);
            return new File([content], tfile.name, {
                type: 'text/markdown',
                lastModified: tfile.stat.mtime
            });
        }

        // For binary files (PDFs and images)
        const binaryExtensions = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp'];
        if (binaryExtensions.includes(extension)) {
            const arrayBuffer = await this.app.vault.readBinary(tfile);
            const blob = new Blob([arrayBuffer], { type: this.getMimeType(extension) });

            // Add base64 data for images only
            if (extension !== 'pdf') {
                const uint8Array = new Uint8Array(arrayBuffer);
                const binaryString = uint8Array.reduce((str, byte) => str + String.fromCharCode(byte), '');
                Object.defineProperty(blob, 'base64Data', {
                    value: btoa(binaryString),
                    writable: false
                });
            }

            return new File([blob], tfile.name, {
                type: this.getMimeType(extension),
                lastModified: tfile.stat.mtime
            });
        }

        throw new Error(`Unsupported file extension: ${extension}`);
    }
    async createAttachmentBlock(path: string): Promise<Messages.ContentBlockParam> {
        const file = this.getTFile(path);
        // Determine if file is binary based on extension
        const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
        const isImage = imageExtensions.includes(file.extension.toLowerCase());

        if (isImage) {
            // For image files, return as image block
            const arrayBuffer = await this.app.vault.readBinary(file);
            const uint8Array = new Uint8Array(arrayBuffer);
            const binaryString = uint8Array.reduce((str, byte) => str + String.fromCharCode(byte), '');
            const mimeType = this.getImageMimeType(file.extension);
            return createImageBlock(btoa(binaryString), mimeType);
        } else if (file.extension.toLowerCase() === 'pdf') {
            // For binary files (PDF, images), return base64 encoded content
            const arrayBuffer = await this.app.vault.readBinary(file);
            const uint8Array = new Uint8Array(arrayBuffer);
            const binaryString = uint8Array.reduce((str, byte) => str + String.fromCharCode(byte), '');
            return createDocumentBlock(btoa(binaryString));
        } else {
            // For text files (markdown, etc), return the raw content
            const content = await this.app.vault.read(file);
            return createTextBlock(content);
        }
    }
}

