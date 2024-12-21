<script lang="ts">
	let { message }: { message: { role: string; content: string } } = $props();
</script>

{#if message.role === "assistant"}
	<p class="message-text">
		{message.content}
	</p>
{:else}
	<div class="chat-message-user-container">
		<div class="chat-message-user">
			<p class="message-text">
				{message.content}
			</p>
		</div>
	</div>
{/if}

<style>
	.chat-message-user-container {
		padding-left: 20%;
	}
	.chat-message-user {
		background-color: rgb(255 255 255 / 0.04);
		padding: 8px;
		border-radius: 8px;
	}

    .message-text {
        line-height: 1.6;
        padding: 0 !important;
        margin: 0 !important;
        font-size: 15px;
        white-space: pre-wrap;
    }
</style>