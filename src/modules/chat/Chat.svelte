<script lang="ts">
  import type { ChatModel } from "./ChatModel.svelte.ts";
  import MessageRenderer from "./MessageRenderer.svelte";
  import ChatList from "./ChatList.svelte";
  import { chatState } from "./store/ChatState.svelte.ts";
  import ChatActions from "./ChatActions.svelte";

  let { chatModel }: { chatModel: ChatModel } = $props();
  let suggestions: string[] = $state([]);
  let showSuggestions = $state(false);
  let textareaElement: HTMLTextAreaElement | null = $state(null);
  let currentWordStart = 0;
  let selectedIndex = $state(0);
  let lastInputLength = $state(0); // Track previous input length to detect typing vs deletion

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    chatModel.getCompletion();
    showSuggestions = false;
  };

  const isTypingInBrackets = (
    text: string,
    cursorPosition: number,
  ): boolean => {
    const beforeCursor = text.slice(0, cursorPosition);
    const lastOpenBrackets = beforeCursor.lastIndexOf("[[");
    const afterCursor = text.slice(cursorPosition);
    const nextCloseBrackets = afterCursor.indexOf("]]");

    return (
      lastOpenBrackets !== -1 &&
      (nextCloseBrackets !== -1 || afterCursor.length === 0) &&
      lastOpenBrackets < cursorPosition
    );
  };

  interface BracketRange {
    start: number; // Index of first [
    end: number; // Index after last ]
  }

  const getCurrentBracketRange = (
    text: string,
    cursorPosition: number,
  ): BracketRange | null => {
    const beforeCursor = text.slice(0, cursorPosition);
    const afterCursor = text.slice(cursorPosition);

    // Find the last [[ before cursor
    const openBrackets = beforeCursor.lastIndexOf("[[");
    if (openBrackets === -1) return null;

    // Find the next ]] after the last [[ (not just after cursor)
    const fullTextAfterOpen = text.slice(openBrackets);
    const closeBrackets = fullTextAfterOpen.indexOf("]]");
    if (closeBrackets === -1) return null;

    // Check if cursor is between these brackets
    const bracketEnd = openBrackets + closeBrackets + 2; // +2 to include ]]
    if (cursorPosition > bracketEnd) return null;

    return {
      start: openBrackets,
      end: bracketEnd,
    };
  };

  const handleInput = (e: Event) => {
    const textarea = e.target as HTMLTextAreaElement;
    const cursorPosition = textarea.selectionStart;
    const text = textarea.value;

    // Auto-complete brackets only when typing [[ (not when deleting)
    const isTyping = text.length > lastInputLength;
    lastInputLength = text.length;

    if (
      isTyping &&
      text.slice(cursorPosition - 2, cursorPosition) === "[[" &&
      !text.slice(cursorPosition).includes("]]")
    ) {
      // Don't add if closing brackets exist
      chatModel.userInput =
        text.slice(0, cursorPosition) + "]]" + text.slice(cursorPosition);
      setTimeout(() => {
        textarea.setSelectionRange(cursorPosition, cursorPosition);
      }, 0);
    }

    // Check for file suggestions
    if (isTypingInBrackets(text, cursorPosition)) {
      // We're typing between [[ and ]]
      const beforeCursor = text.slice(0, cursorPosition);
      currentWordStart = beforeCursor.lastIndexOf("[[") + 2;
      const partial = text.slice(currentWordStart, cursorPosition);
      suggestions = chatModel.getFileSuggestions(partial);
      showSuggestions = suggestions.length > 0;
      selectedIndex = 0;
    } else {
      // Check for @ mentions
      currentWordStart = text.lastIndexOf("@", cursorPosition);
      if (currentWordStart !== -1 && currentWordStart < cursorPosition) {
        const nextSpace = text.indexOf(" ", currentWordStart);
        if (nextSpace === -1 || nextSpace > cursorPosition) {
          const partial = text.slice(currentWordStart + 1, cursorPosition);
          suggestions = chatModel.getFileSuggestions(partial);
          showSuggestions = suggestions.length > 0;
          selectedIndex = 0;
          return;
        }
      }
      showSuggestions = false;
    }
  };

  const handleKeydown = (e: KeyboardEvent) => {
    if (showSuggestions) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault(); // Prevent cursor movement in textarea
        if (e.key === "ArrowDown") {
          selectedIndex = (selectedIndex + 1) % suggestions.length;
        } else {
          selectedIndex =
            (selectedIndex - 1 + suggestions.length) % suggestions.length;
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        insertSuggestion(suggestions[selectedIndex]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        showSuggestions = false;
      } else if (e.key === "Tab") {
        e.preventDefault();
        insertSuggestion(suggestions[selectedIndex]);
      }
    }
  };

  const insertSuggestion = (suggestion: string) => {
    if (!textareaElement) return;

    const bracketRange = getCurrentBracketRange(
      chatModel.userInput,
      textareaElement.selectionStart,
    );
    if (!bracketRange) return;

    const start = bracketRange.start;
    const end = bracketRange.end;

    // Get text before and after the brackets
    const textBefore = chatModel.userInput.slice(0, start).trimEnd();
    const textAfter = chatModel.userInput.slice(end).trimStart();

    // Build the new input with normalized spacing
    let newInput = textBefore;
    if (textBefore && !textBefore.endsWith(' ')) newInput += ' ';
    newInput += "[[" + suggestion + "]]";
    if (textAfter && !textAfter.startsWith(' ')) newInput += ' ';
    newInput += textAfter;

    chatModel.userInput = newInput;
    showSuggestions = false;

    // Set cursor position after the closing brackets
    setTimeout(() => {
      if (!textareaElement) return;
      const closingBracketsPos = newInput.indexOf("]]", start) + 2; // +2 to move after ]]
      textareaElement.setSelectionRange(closingBracketsPos, closingBracketsPos);
      textareaElement.focus();
    }, 0);
  };
</script>

<div id="whetstone-chat-view" class="w-full h-full relative p-0 select-text">
  {#if chatState.isListView}
    <ChatList />
  {:else}
    <div class="h-full flex flex-col">
      <div
        class="flex items-center gap-3 bg-base-20 p-3 border-b border-background-modifier-border"
      >
        <button
          class="p-2 hover:bg-base-25 rounded-md"
          onclick={() => chatState.showChatList()}
          aria-label="Back to chat list"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div class="flex items-center gap-2 flex-1">
          <span class="flex-1"
            >{chatState.getCurrentChat()?.title ?? "New Chat"}</span
          >
          {#if chatState.currentChatId}
            <ChatActions
              chatId={chatState.currentChatId}
              chatTitle={chatState.getCurrentChat()?.title ?? "New Chat"}
            />
          {/if}
        </div>
      </div>
      <div class="flex-1 overflow-y-auto">
        <div class="flex flex-col gap-8 py-4 px-3">
          {#if chatState.getCurrentMessages().length === 0}
            <div class="flex items-center justify-center h-full text-gray-500">
              Start a conversation by typing a message below
            </div>
          {/if}
          {#each chatState.getCurrentMessages() as message (message)}
            <MessageRenderer {message} app={chatModel.getApp()} />
          {/each}
          {#if chatModel.isLoading}
            <div class="flex items-center gap-2 text-gray-500 px-4">
              <div class="animate-pulse">Thinking...</div>
            </div>
          {/if}
          {#if chatModel.error}
            <div class="text-red-500 px-4 py-2 bg-red-100 rounded">
              Error: {chatModel.error}
            </div>
          {/if}
        </div>
      </div>
      <form
        class="w-full flex flex-col gap-2 p-3 bg-base-20 border-t border-background-modifier-border"
        onsubmit={handleSubmit}
      >
        <div class="flex flex-col flex-grow relative">
          <div class="flex items-start gap-2">
            <textarea
              bind:value={chatModel.userInput}
              bind:this={textareaElement}
              oninput={handleInput}
              onkeydown={handleKeydown}
              name="chat-input"
              id="chat-input"
              class="w-full border-none outline-none p-2.5 text-base flex-grow resize-none"
              placeholder="Type your message here... Use @ or [[ to reference files"
              disabled={chatModel.isLoading}
            ></textarea>
          </div>
          {#if showSuggestions}
            <div
              class="absolute bottom-full left-0 w-full bg-base-25 border border-background-modifier-border rounded-md shadow-lg max-h-48 overflow-y-auto"
              role="listbox"
              aria-label="File suggestions"
            >
              {#each suggestions as suggestion, i}
                <div
                  class="px-3 py-1.5 cursor-pointer hover:bg-base-30 flex items-center gap-2 {i ===
                  selectedIndex
                    ? 'bg-base-30'
                    : ''}"
                  onclick={() => insertSuggestion(suggestion)}
                  id={`suggestion-${i}`}
                  role="option"
                  aria-selected={i === selectedIndex}
                  tabindex="0"
                  onkeydown={(e) =>
                    e.key === "Enter" && insertSuggestion(suggestion)}
                >
                  <span class="flex-grow">{suggestion}</span>
                  {#if i === selectedIndex}
                    <span class="text-xs text-gray-500">↵ to select</span>
                  {/if}
                </div>
              {/each}
            </div>

            {@const selectedElement = document.getElementById(
              `suggestion-${selectedIndex}`,
            )}
            {#if selectedElement}
              {@const scrollIntoView = () =>
                selectedElement.scrollIntoView({ block: "nearest" })}
              {scrollIntoView()}
            {/if}
          {/if}
        </div>
        <button
          type="submit"
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={chatModel.isLoading ||
            (!chatModel.userInput.trim() &&
              chatModel.pendingDocuments.length === 0)}
        >
          {chatModel.isLoading ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  {/if}
</div>

<style>
  :global(.view-content:has(#whetstone-chat-view)) {
    padding: 0 !important;
  }

  :global(#whetstone-chat-view) {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
</style>
