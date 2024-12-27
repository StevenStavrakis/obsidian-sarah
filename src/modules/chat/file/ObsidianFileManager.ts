import { TFile } from 'obsidian';
import { FileTypeHandler } from './FileTypeHandler';
import type { Messages } from '@anthropic-ai/sdk/resources';
import { AppStore } from '@modules/types/AppStore';

export class ObsidianFileManager {
    constructor() {}

    private get app() {
        return AppStore.getApp();
    }

    /**
     * Gets file suggestions based on a partial search term
     */
    getFileSuggestions(partial: string): string[] {
        console.log("Getting file suggestions")
        const files = this.app.vault.getFiles();
        const searchTerm = partial.toLowerCase();
        
        return files
            .filter(file => {
                const path = file.path.toLowerCase();
                const name = file.name.toLowerCase();
                return path.includes(searchTerm) || name.includes(searchTerm);
            })
            .map(file => file.path)
            .sort((a, b) => {
                const aName = a.split('/').pop()?.toLowerCase() || '';
                const bName = b.split('/').pop()?.toLowerCase() || '';
                const aStartsWith = aName.startsWith(searchTerm);
                const bStartsWith = bName.startsWith(searchTerm);
                if (aStartsWith && !bStartsWith) return -1;
                if (!aStartsWith && bStartsWith) return 1;
                return a.length - b.length;
            });
    }

    /**
     * Gets a TFile object from a file path
     */
    getTFile(path: string): TFile {
        const abstractFile = this.app.vault.getAbstractFileByPath(path);
        if (!abstractFile) {
            throw new Error(`No file found at path: ${path}`);
        }
        if (!(abstractFile instanceof TFile)) {
            throw new Error(`Path does not point to a file: ${path}`);
        }
        return abstractFile;
    }

    /**
     * Checks if a file exists at the given path
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
     * Gets the content of a file
     */
    async getFileContent(path: string): Promise<string | ArrayBuffer> {
        const file = this.getTFile(path);
        
        if (FileTypeHandler.isBinaryFile(file.extension)) {
            return await this.app.vault.readBinary(file);
        }
        
        return await this.app.vault.read(file);
    }

    /**
     * Creates a File object from a TFile
     */
    async convertTFileToFile(tfile: TFile): Promise<File> {
        const content = await this.getFileContent(tfile.path);
        const mimeType = FileTypeHandler.getMimeType(tfile.extension);
        
        if (content instanceof ArrayBuffer) {
            const blob = new Blob([content], { type: mimeType });
            return new File([blob], tfile.name, {
                type: mimeType,
                lastModified: tfile.stat.mtime
            });
        }
        
        return new File([content], tfile.name, {
            type: mimeType,
            lastModified: tfile.stat.mtime
        });
    }

    /**
     * Creates a content block for the chat from a file
     */
    async createAttachmentBlock(path: string): Promise<Messages.ContentBlockParam> {
        const file = this.getTFile(path);
        const content = await this.getFileContent(path);
        return FileTypeHandler.createContentBlock(file, content);
    }
}
