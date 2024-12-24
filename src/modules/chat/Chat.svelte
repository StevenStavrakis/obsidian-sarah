<script lang="ts">
  import type {
    ChatModel,
  } from "./ChatModel.svelte.ts";
  import MessageRenderer from "./MessageRenderer.svelte";
  import ChatList from "./ChatList.svelte";
  import { chatStore } from "./store/ChatStore";

  let { chatModel }: { chatModel: ChatModel } = $props();
  let suggestions: string[] = $state([]);
  let showSuggestions = $state(false);
  let textareaElement: HTMLTextAreaElement;
  let currentWordStart = 0;
  let selectedIndex = $state(0);

  $inspect(chatModel);

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    chatModel.getCompletion();
    showSuggestions = false;
  };

  const handleInput = (e: Event) => {
    const textarea = e.target as HTMLTextAreaElement;
    const cursorPosition = textarea.selectionStart;
    const text = textarea.value;
    
    // Find the start of the current word
    currentWordStart = text.lastIndexOf('@', cursorPosition);
    if (currentWordStart === -1 || currentWordStart > cursorPosition) {
      showSuggestions = false;
      return;
    }

    // Check if we're in the middle of a word
    const nextSpace = text.indexOf(' ', currentWordStart);
    if (nextSpace !== -1 && nextSpace < cursorPosition) {
      showSuggestions = false;
      return;
    }

    // Get the partial search term
    const partial = text.slice(currentWordStart + 1, cursorPosition);
    suggestions = chatModel.obsidianConnector.getFileSuggestions(partial);
    showSuggestions = suggestions.length > 0;
    selectedIndex = 0;
  };

  const handleKeydown = (e: KeyboardEvent) => {
    if (showSuggestions) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault(); // Prevent cursor movement in textarea
        if (e.key === 'ArrowDown') {
          selectedIndex = (selectedIndex + 1) % suggestions.length;
        } else {
          selectedIndex = (selectedIndex - 1 + suggestions.length) % suggestions.length;
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        insertSuggestion(suggestions[selectedIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        showSuggestions = false;
      } else if (e.key === 'Tab') {
        e.preventDefault();
        insertSuggestion(suggestions[selectedIndex]);
      }
    }
  };

  const insertSuggestion = (suggestion: string) => {
    const text = chatModel.userInput;
    const beforeCursor = text.slice(0, currentWordStart);
    const afterCursor = text.slice(textareaElement.selectionStart);
    chatModel.userInput = `${beforeCursor}@${suggestion}${afterCursor}`;
    showSuggestions = false;
    
    // Set cursor position after the inserted suggestion
    setTimeout(() => {
      const newPosition = currentWordStart + suggestion.length + 1;
      textareaElement.setSelectionRange(newPosition, newPosition);
      textareaElement.focus();
    }, 0);
  };
</script>

<div
  id="whetstone-chat-view"
  class="w-full h-full relative p-0 select-text"
>
  {#if $chatStore.isListView}
    <ChatList />
  {:else}
    <div class="h-full flex flex-col">
      <div
        class="flex items-center gap-3 bg-base-20 p-3 border-b border-background-modifier-border"
    >
      <button 
        class="p-2 hover:bg-base-25 rounded-md"
        onclick={() => chatStore.showChatList()}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <span>Sarah AI Assistant</span>
    </div>
    <div class="flex-1 overflow-y-auto">
      <div class="flex flex-col gap-8 py-4 px-3">
      {#if chatModel.chat.length === 0}
        <div class="flex items-center justify-center h-full text-gray-500">
          Start a conversation by typing a message below
        </div>
      {/if}
      {#each chatModel.chat as message (message)}
        <MessageRenderer {message} app={chatModel.plugin.app} />
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
    <form class="w-full flex flex-col gap-2 p-3 bg-base-20 border-t border-background-modifier-border" onsubmit={handleSubmit}>
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
          placeholder="Type your message here... Use @ to reference files"
          disabled={chatModel.isLoading}
        ></textarea>
      </div>
    {#if showSuggestions}
      <div class="absolute bottom-full left-0 w-full bg-base-25 border border-background-modifier-border rounded-md shadow-lg max-h-48 overflow-y-auto">
        {#each suggestions as suggestion, i}
          <div
            class="px-3 py-1.5 cursor-pointer hover:bg-base-30 flex items-center gap-2 {i === selectedIndex ? 'bg-base-30' : ''}"
            onclick={() => insertSuggestion(suggestion)}
            id={`suggestion-${i}`}
          >
            <span class="flex-grow">{suggestion}</span>
            {#if i === selectedIndex}
              <span class="text-xs text-gray-500">↵ to select</span>
            {/if}
          </div>
        {/each}
      </div>

      {@const selectedElement = document.getElementById(`suggestion-${selectedIndex}`)}
      {#if selectedElement}
        {@const scrollIntoView = () => selectedElement.scrollIntoView({ block: 'nearest' })}
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
