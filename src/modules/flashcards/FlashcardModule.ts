import { Notice, Plugin, WorkspaceLeaf, TFile, Menu, addIcon } from "obsidian";
import type { PluginModule } from "@modules/types";
import { FlashView } from "./FlashcardView";

export class FlashModule implements PluginModule {
    identifier: string = 'flash';
    plugin: Plugin;

    constructor(plugin: Plugin) {
        this.plugin = plugin;
    }

    onload(): void {
        this.plugin.addRibbonIcon('dice', 'Flash', (evt: MouseEvent) => {
            // Called when the user clicks the icon.
            this.activateLeaf();
        });

        this.plugin.registerView(
            this.identifier,
            (leaf: WorkspaceLeaf) => new FlashView(leaf, this.identifier),
        );

        // Add context menu items
        this.plugin.app.workspace.on('file-menu', (menu, file) => {
            if (file instanceof TFile && file.extension === 'md') {
                // For regular markdown files
                if (!file.path.endsWith('-cards.md')) {
                    menu.addItem((item) => {
                        item
                            .setTitle('Create Flashcards')
                            .setIcon('cards')
                            .onClick(async () => {
                                await this.createFlashcards(file);
                            });
                    });
                }
                // For cards files
                if (file.path.endsWith('-cards.md')) {
                    menu.addItem((item) => {
                        item
                            .setTitle('Export to Anki')
                            .setIcon('download')
                            .onClick(async () => {
                                await this.exportToAnki(file);
                            });
                    });
                }
            }
        });
    }

    async activateLeaf(): Promise<void> {
        const { workspace } = this.plugin.app;
        let leaf: WorkspaceLeaf | null = null;

        const leaves = workspace.getLeavesOfType(this.identifier);
        if (leaves.length > 0) {
            leaf = leaves[0];
        } else {
            leaf = workspace.getRightLeaf(false);
            if (leaf === null) {
                throw new Error('No leaf found');
            }
            await leaf.setViewState({
                type: this.identifier,
            });
        }
        workspace.revealLeaf(leaf);
    }

    async createFlashcards(file: TFile): Promise<void> {
        try {
            // Read the file content
            const content = await this.plugin.app.vault.read(file);
            
            // Split content into cards by empty newlines
            const cards = content.split(/\n\s*\n/).filter(card => card.trim());
            
            // Generate flashcard XML content
            let flashcardContent = '';
            cards.forEach((card, index) => {
                const lines = card.trim().split('\n');
                const type = lines.length === 1 ? 'cloze' : 'back-front';
                
                let cardContent;
                if (type === 'cloze') {
                    // For cloze cards, wrap the first word in [[]] brackets
                    const text = card.trim();
                    const firstWord = text.match(/^\w+/);
                    if (firstWord) {
                        cardContent = text.replace(firstWord[0], `[[${firstWord[0]}]]`);
                    } else {
                        cardContent = text;
                    }
                } else {
                    // For back-front cards, wrap front and back content in appropriate tags
                    const [front, ...backLines] = lines;
                    cardContent = `<Front>${front.trim()}</Front>\n<Back>${backLines.join('\n').trim()}</Back>`;
                }
                
                flashcardContent += `<Card id="${index + 1}" type="${type}">\n${cardContent}\n</Card>\n\n`;
            });

            // Create new file name by appending -cards.md to original name
            const newFileName = file.path.replace('.md', '-cards.md');
            
            // Create the new file
            await this.plugin.app.vault.create(newFileName, flashcardContent);
            
            new Notice('Flashcards created successfully!');
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            new Notice('Error creating flashcards: ' + errorMessage);
        }
    }

    onunload(): void {
        // Clean up when the plugin is disabled
    }

    async exportToAnki(file: TFile): Promise<void> {
        try {
            // Read the cards file content
            const content = await this.plugin.app.vault.read(file);
            
            // Generate Anki import content
            let ankiContent = '';
            
            // Add metadata header
            ankiContent += '#separator:;\n';
            ankiContent += '#html:true\n';
            ankiContent += '#notetype column:3\n\n';
            
            // Parse XML content using regex
            const cardMatches = content.match(/<Card[^>]*>[\s\S]*?<\/Card>/g);
            
            if (!cardMatches) {
                throw new Error('No cards found in file');
            }
            
            // Process each card
            cardMatches.forEach(cardXml => {
                // Extract card type
                const typeMatch = cardXml.match(/type="([^"]+)"/);
                const type = typeMatch ? typeMatch[1] : null;
                
                if (type === 'cloze') {
                    // For cloze cards, ensure there's at least one cloze deletion
                    const contentMatch = cardXml.match(/>([^<]*)</);
                    if (contentMatch) {
                        const text = contentMatch[1].trim();
                        // Only include if there's at least one [[]] cloze marker
                        if (text.includes('[[')) {
                            ankiContent += `${text.replace(/\[\[(.*?)\]\]/g, '{{c1::$1}}')};;\Cloze\n`;
                        }
                    }
                } else if (type === 'back-front') {
                    // For basic cards, extract front and back content
                    const frontMatch = cardXml.match(/<Front>([\s\S]*?)<\/Front>/);
                    const backMatch = cardXml.match(/<Back>([\s\S]*?)<\/Back>/);
                    
                    if (frontMatch && backMatch) {
                        const front = frontMatch[1].trim().replace(/\n/g, '<br>');
                        const back = backMatch[1].trim().replace(/\n/g, '<br>');
                        ankiContent += `${front};${back};Basic\n`;
                    }
                }
            });
            
            // Create new file name by replacing -cards.md with -anki.txt
            const newFileName = file.path.replace('-cards.md', '-anki.txt');
            
            // Create the new file
            await this.plugin.app.vault.create(newFileName, ankiContent);
            
            new Notice('Anki export created successfully!');
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            new Notice('Error exporting to Anki: ' + errorMessage);
        }
    }
}
