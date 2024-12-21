<script lang="ts">
	import type { ChatModel } from "./ChatModel.svelte.ts";
    import ChatMessage from "./ChatMessage.svelte";

	let { chatModel }: { chatModel: ChatModel } = $props();

	const handleSubmit = (e: Event) => {
		e.preventDefault();

        chatModel.submitMessage();
	};
</script>

<div id="whetstone-chat-view" class="container">
	<div class="conversation-container">
		<div class="header">Chat title</div>
		<div class="conversation-messages">
			{#if chatModel.chat.length === 0}
				<div class="empty-state"></div>
			{/if}
			{#each chatModel.chat as message}
				<ChatMessage {message} />
			{/each}
		</div>
	</div>
	<form class="input-form" onsubmit={handleSubmit}>
		<div class="input-container">
			<label for="chat-input" class="invisible">User input</label>
			<textarea
				bind:value={chatModel.userInput}
				name="chat-input"
				id="chat-input"
				class="chat-input"
				placeholder="Type something here..."
			></textarea>
		</div>
		<button type="submit">Send</button>
	</form>
</div>

<style>
	:global(.view-content:has(#whetstone-chat-view)) {
		padding: 0 !important;
		user-select: text;
		-webkit-user-select: text;
	}

	.header {
		position: sticky;
		top: 0;
		background-color: var(--color-base-20);
		padding: 12px;
		border-bottom: var(--border-width) solid
			var(--background-modifier-border);
	}
	.conversation-container {
		overflow-y: auto;
		overflow-x: visible;
	}

	.conversation-messages {
		display: flex;
		flex-direction: column;
		gap: 32px;
		height: fit-content;
		padding: 16px 12px 32px 12px;
	}

	.invisible {
		display: none;
	}
	.container {
		width: 100%;
		height: 100%;
		position: relative;
		padding: 0;
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: 85% 15%;
	}

	.input-form {
		height: 100%;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 12px;
	}

	.chat-input {
		width: 100%;
		border: none;
		outline: none;
		padding: 10px;
		font-size: 16px;
		flex-grow: 1;
		resize: none;
	}
	.input-container {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
	}

	.message-container {
	}

	.message-container:has(.chat-message-assistant) {
		padding-right: 32px;
	}

	.message-container:has(.chat-message-user) {
		padding-left: 32px;
	}

	.chat-message {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 12px;
		border-radius: 8px;
		margin-bottom: 8px;
		border: 1px solid #ccc;
	}
	.chat-message-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.chat-message-role {
		font-weight: bold;
	}
	.chat-message-content {
		font-size: 16px;
		white-space: pre-wrap;
	}

	.chat-message-user {
		align-self: flex-end;
		padding-left: 32px;
	}
</style>