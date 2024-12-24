<script lang="ts">
  import type {
    ChatModel,
  } from "./ChatModel.svelte.ts";
  import MessageRenderer from "./MessageRenderer.svelte";

  let { chatModel }: { chatModel: ChatModel } = $props();

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    chatModel.getCompletion();
  };
</script>

<div
  id="whetstone-chat-view"
  class="w-full h-full relative p-0 grid grid-cols-1 grid-rows-[85%_15%] select-text"
>
  <div class="overflow-y-auto overflow-x-visible">
    <div
      class="sticky top-0 bg-base-20 p-3 border-b border-background-modifier-border"
    >
      Sarah AI Assistant
    </div>
    <div class="flex flex-col gap-8 h-fit py-4 px-3">
      {#if chatModel.chat.length === 0}
        <div class="flex items-center justify-center h-full text-gray-500">
          Start a conversation by typing a message below
        </div>
      {/if}
      {#each chatModel.chat as message (message)}
        <MessageRenderer {message} />
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
  <form class="h-full w-full flex flex-col gap-2 p-3" onsubmit={handleSubmit}>
    <div class="flex flex-col flex-grow">
      <div class="flex items-start gap-2">
        <textarea
          bind:value={chatModel.userInput}
          name="chat-input"
          id="chat-input"
          class="w-full border-none outline-none p-2.5 text-base flex-grow resize-none"
          placeholder="Type your message here..."
          disabled={chatModel.isLoading}
        ></textarea>
      </div>
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

<style>
  :global(.view-content:has(#whetstone-chat-view)) {
    padding: 0 !important;
  }
</style>
