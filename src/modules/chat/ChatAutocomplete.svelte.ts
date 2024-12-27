import { TFile } from 'obsidian';
import { ObsidianFileManager } from './file/ObsidianFileManager';

interface BracketRange {
    start: number; // Index of first [
    end: number; // Index after last ]
}

export class ChatAutocomplete {
    private fileManager: ObsidianFileManager;
    suggestions: string[] = $state([]);
    showSuggestions = $state(false);
    selectedIndex = $state(0);
    currentWordStart = 0;

    constructor() {
        this.fileManager = new ObsidianFileManager();
    }

    /**
     * Gets file suggestions based on a partial search term
     */
    getFileSuggestions(partial: string): string[] {
        return this.fileManager.getFileSuggestions(partial);
    }

    /**
     * Creates a file reference string
     */
    createFileReference(file: TFile, currentInput: string): string {
        const fileReference = `[[${file.path}]]`;
        const trimmedInput = currentInput.trim();
        return trimmedInput
            ? `${trimmedInput} ${fileReference}`
            : fileReference;
    }

    /**
     * Checks if the cursor is currently between [[ and ]]
     */
    isTypingInBrackets(text: string, cursorPosition: number): boolean {
        const beforeCursor = text.slice(0, cursorPosition);
        const lastOpenBrackets = beforeCursor.lastIndexOf("[[");
        const afterCursor = text.slice(cursorPosition);
        const nextCloseBrackets = afterCursor.indexOf("]]");

        return (
            lastOpenBrackets !== -1 &&
            (nextCloseBrackets !== -1 || afterCursor.length === 0) &&
            lastOpenBrackets < cursorPosition
        );
    }

    /**
     * Gets the range of the current bracket pair
     */
    getCurrentBracketRange(text: string, cursorPosition: number): BracketRange | null {
        const beforeCursor = text.slice(0, cursorPosition);
        const afterCursor = text.slice(cursorPosition);

        const openBrackets = beforeCursor.lastIndexOf("[[");
        if (openBrackets === -1) return null;

        const fullTextAfterOpen = text.slice(openBrackets);
        const closeBrackets = fullTextAfterOpen.indexOf("]]");
        if (closeBrackets === -1) return null;

        const bracketEnd = openBrackets + closeBrackets + 2;
        if (cursorPosition > bracketEnd) return null;

        return {
            start: openBrackets,
            end: bracketEnd,
        };
    }

    /**
     * Handles input changes and updates suggestions
     * Returns { text, cursorPosition } if brackets were auto-completed
     */
    handleInput(text: string, cursorPosition: number, prevLength: number): { text: string; cursorPosition: number } | null {
        const isTyping = text.length > prevLength;

        // Auto-complete brackets
        if (
            isTyping &&
            text.slice(cursorPosition - 2, cursorPosition) === "[[" &&
            !text.slice(cursorPosition).includes("]]")
        ) {
            return {
                text: text.slice(0, cursorPosition) + "]]" + text.slice(cursorPosition),
                cursorPosition
            };
        }

        // Update suggestions
        if (this.isTypingInBrackets(text, cursorPosition)) {
            const beforeCursor = text.slice(0, cursorPosition);
            this.currentWordStart = beforeCursor.lastIndexOf("[[") + 2;
            const partial = text.slice(this.currentWordStart, cursorPosition);
            this.suggestions = this.getFileSuggestions(partial);
            this.showSuggestions = this.suggestions.length > 0;
            this.selectedIndex = 0;
        } else {
            this.showSuggestions = false;
        }

        return null;
    }

    /**
     * Handles keyboard navigation of suggestions
     */
    handleKeydown(key: string): { preventDefault: boolean } {
        if (!this.showSuggestions) {
            return { preventDefault: false };
        }

        switch (key) {
            case "ArrowDown":
                this.selectedIndex = (this.selectedIndex + 1) % this.suggestions.length;
                return { preventDefault: true };
            case "ArrowUp":
                this.selectedIndex = (this.selectedIndex - 1 + this.suggestions.length) % this.suggestions.length;
                return { preventDefault: true };
            case "Enter":
            case "Tab":
                return { preventDefault: true };
            case "Escape":
                this.showSuggestions = false;
                return { preventDefault: true };
            default:
                return { preventDefault: false };
        }
    }

    /**
     * Creates a new input string with the selected suggestion
     */
    insertSuggestion(text: string, suggestion: string, cursorPosition: number): { text: string; cursorPosition: number } | null {
        const bracketRange = this.getCurrentBracketRange(text, cursorPosition);
        if (!bracketRange) return null;

        const start = bracketRange.start;
        const end = bracketRange.end;

        const textBefore = text.slice(0, start).trimEnd();
        const textAfter = text.slice(end).trimStart();

        let newInput = textBefore;
        if (textBefore && !textBefore.endsWith(" ")) newInput += " ";
        newInput += "[[" + suggestion + "]]";
        if (textAfter && !textAfter.startsWith(" ")) newInput += " ";
        newInput += textAfter;

        this.showSuggestions = false;

        const closingBracketsPos = newInput.indexOf("]]", start) + 2;
        return { text: newInput, cursorPosition: closingBracketsPos };
    }
}
