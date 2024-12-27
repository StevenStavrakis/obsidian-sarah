<script lang="ts">
  import type { AnthropicChatModel } from "./ChatModel.svelte.ts";
  import MessageRenderer from "./MessageRenderer.svelte";
  import ChatList from "./ChatList.svelte";
  import ChatActions from "./ChatActions.svelte";
  import { AppStore } from "@modules/types/AppStore";
  import { TFile } from "obsidian";
  import { ChatAutocomplete } from "./ChatAutocomplete.svelte.ts";
  import type { ChatManager } from "./store/ChatManager.svelte";

  let { chatManager }: { chatManager: ChatManager } = $props();
  let chatModel = $state(chatManager.getCurrentChatModel());
  let userInput = $state("");
  let textareaElement: HTMLTextAreaElement | null = $state(null);
  let autocomplete = new ChatAutocomplete();
  let lastInputLength = $state(0);

  $effect(() => {
    chatModel = chatManager.getCurrentChatModel();
  });

  $effect(() => {
    if (chatModel) {
      userInput = chatModel.userInput;
    }
  });

  $effect(() => {
    if (chatModel) {
      chatModel.userInput = userInput;
    }
  });

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    chatModel?.getCompletion();
  };

  const handleInput = (e: Event) => {
    const textarea = e.target as HTMLTextAreaElement;
    const cursorPosition = textarea.selectionStart;
    const text = textarea.value;

    userInput = text;
    const result = autocomplete.handleInput(
      text,
      cursorPosition,
      lastInputLength,
    );
    lastInputLength = text.length;

    if (result) {
      userInput = result.text;
      setTimeout(() => {
        textarea.setSelectionRange(
          result.cursorPosition,
          result.cursorPosition,
        );
      }, 0);
    }
  };

  const handleKeydown = (e: KeyboardEvent) => {
    const result = autocomplete.handleKeydown(e.key);
    if (result.preventDefault) {
      e.preventDefault();
      if (e.key === "Enter" || e.key === "Tab") {
        insertSuggestion(autocomplete.suggestions[autocomplete.selectedIndex]);
      }
    }
  };

  const insertSuggestion = (suggestion: string) => {
    if (!textareaElement) return;

    const result = autocomplete.insertSuggestion(
      userInput,
      suggestion,
      textareaElement.selectionStart,
    );
    if (result) {
      userInput = result.text;
      setTimeout(() => {
        if (!textareaElement) return;
        textareaElement.setSelectionRange(
          result.cursorPosition,
          result.cursorPosition,
        );
        textareaElement.focus();
      }, 0);
    }
  };

  // Handle file preloading
  const handlePreloadFile = async (file: TFile) => {
    userInput = autocomplete.createFileReference(
      file,
      userInput,
    );
  };
</script>

<div id="whetstone-chat-view" class="w-full h-full relative p-0 select-text">
  {#if chatManager.isListView}
    <ChatList {chatManager} />
  {:else}
    <div class="h-full flex flex-col">
      <div
        class="flex items-center gap-3 bg-base-20 p-3 border-b border-background-modifier-border"
      >
        <button
          class="p-2 hover:bg-base-25 rounded-md"
          onclick={() => chatManager.showChatList()}
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
            >{chatManager.getCurrentChat()?.title ?? "New Chat"}</span
          >
          {#if chatManager.currentChatId}
            <ChatActions
              {chatManager}
              chatId={chatManager.currentChatId}
              chatTitle={chatManager.getCurrentChat()?.title ?? "New Chat"}
            />
          {/if}
        </div>
      </div>
      <div class="flex-1 overflow-y-auto">
        <div class="flex flex-col gap-8 py-4 px-3">
          {#if !chatModel?.history.length}
            <div class="flex items-center justify-center h-full text-gray-500">
              Start a conversation by typing a message below
            </div>
          {/if}
          {#if chatModel}
            {#each chatModel.history as message (message)}
              <MessageRenderer {message} app={AppStore.getApp()} />
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
              bind:value={userInput}
              bind:this={textareaElement}
              oninput={handleInput}
              onkeydown={handleKeydown}
              name="chat-input"
              id="chat-input"
              class="w-full border-none outline-none p-2.5 text-base flex-grow resize-none"
              placeholder="Type your message here... Use @ or [[ to reference files"
              disabled={!chatModel || chatModel.isLoading}
            ></textarea>
          </div>
          {#if autocomplete.showSuggestions}
            <div
              class="absolute bottom-full left-0 w-full bg-base-25 border border-background-modifier-border rounded-md shadow-lg max-h-48 overflow-y-auto"
              role="listbox"
              aria-label="File suggestions"
            >
              {#each autocomplete.suggestions as suggestion, i}
                <div
                  class="px-3 py-1.5 cursor-pointer hover:bg-base-30 flex items-center gap-2 {i ===
                  autocomplete.selectedIndex
                    ? 'bg-base-30'
                    : ''}"
                  onclick={() => insertSuggestion(suggestion)}
                  id={`suggestion-${i}`}
                  role="option"
                  aria-selected={i === autocomplete.selectedIndex}
                  tabindex="0"
                  onkeydown={(e) =>
                    e.key === "Enter" && insertSuggestion(suggestion)}
                >
                  <span class="flex-grow">{suggestion}</span>
                  {#if i === autocomplete.selectedIndex}
                    <span class="text-xs text-gray-500">↵ to select</span>
                  {/if}
                </div>
              {/each}
            </div>

            {@const selectedElement = document.getElementById(
              `suggestion-${autocomplete.selectedIndex}`,
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
          disabled={!chatModel || chatModel.isLoading || !userInput.trim()}
        >
          {chatModel?.isLoading ? "Sending..." : "Send"}
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
