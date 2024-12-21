<script lang="ts">
	import type { ChatModel } from "./ChatModel.svelte.ts";
    import ChatMessage from "./ChatMessage.svelte";

	let { chatModel }: { chatModel: ChatModel } = $props();

	const handleSubmit = (e: Event) => {
		e.preventDefault();

        chatModel.submitMessage();
	};
</script>

<div id="whetstone-chat-view" class="w-full h-full relative p-0 grid grid-cols-1 grid-rows-[85%_15%] select-text">
	<div class="overflow-y-auto overflow-x-visible">
		<div class="sticky top-0 bg-base-20 p-3 border-b border-(--background-modifier-border)">Chat title</div>
		<div class="flex flex-col gap-8 h-fit py-4 px-3">
			{#if chatModel.chat.length === 0}
				<div class="empty-state"></div>
			{/if}
			{#each chatModel.chat as message}
				<ChatMessage {message} />
			{/each}
		</div>
	</div>
	<form class="h-full w-full flex flex-col gap-2 p-3" onsubmit={handleSubmit}>
		<div class="flex flex-col flex-grow">
			<label for="chat-input" class="hidden">User input</label>
			<textarea
				bind:value={chatModel.userInput}
				name="chat-input"
				id="chat-input"
				class="w-full border-none outline-none p-2.5 text-base flex-grow resize-none"
				placeholder="Type something here..."
			></textarea>
		</div>
		<button type="submit" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Send</button>
	</form>
</div>

<style>
	:global(.view-content:has(#whetstone-chat-view)) {
		padding: 0 !important;
	}
</style>
