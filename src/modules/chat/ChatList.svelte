<script lang="ts">
    import { chatState } from './store/ChatState.svelte.ts';
    import { fade } from 'svelte/transition';
    import ChatActions from './ChatActions.svelte';

    function focusOnMount(node: HTMLElement) {
        node.focus();
    }

    async function createNewChat() {
        const id = await chatState.createNewChat();
        await chatState.selectChat(id);
    }
</script>

<div class="chat-list">
    <div class="chat-list-header">
        <h3>Sarah AI Assistant</h3>
        <button 
            class="new-chat-btn" 
            onclick={createNewChat}
            aria-label="Create new chat"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
        </button>
    </div>
    
    <ul class="chat-items">
        {#each chatState.chats as chat (chat.id)}
            <li 
                class="chat-item"
                class:active={chat.id === chatState.currentChatId}
                transition:fade
                role="listitem"
            >
                {#if chat.id === chatState.editingChatId}
                    <div class="chat-item-content editing">
                        <input
                            type="text"
                            value={chat.title}
                            onclick={(e: MouseEvent) => e.stopPropagation()}
                            onblur={(e: FocusEvent) => chatState.updateChatTitle(chat.id!, (e.target as HTMLInputElement).value)}
                            onkeydown={(e: KeyboardEvent) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    chatState.updateChatTitle(chat.id!, (e.target as HTMLInputElement).value);
                                } else if (e.key === 'Escape') {
                                    chatState.cancelEditing();
                                }
                            }}
                            class="chat-title-input"
                            aria-label="Edit chat title"
                            use:focusOnMount
                        />
                    </div>
                {:else}
                    <div 
                        class="chat-item-content"
                        onclick={() => chatState.selectChat(chat.id!)}
                        onkeydown={(e) => e.key === 'Enter' && chatState.selectChat(chat.id!)}
                        role="button"
                        tabindex="0"
                        aria-current={chat.id === chatState.currentChatId}
                    >
                        <span class="chat-title">{chat.title}</span>
                    </div>
                {/if}
                <div class="chat-item-actions">
                    <ChatActions chatId={chat.id!} chatTitle={chat.title} />
                </div>
            </li>
        {/each}
    </ul>
</div>

<style>
    .chat-list {
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    .chat-list-header {
        padding: 16px 16px 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid var(--background-modifier-border);
        margin-bottom: 4px;
    }

    .chat-list-header h3 {
        margin: 0;
        font-size: 1.1em;
        color: var(--text-normal);
        font-weight: 600;
    }

    .new-chat-btn {
        background: none;
        border: 1px solid var(--background-modifier-border);
        cursor: pointer;
        padding: 6px;
        color: var(--text-muted);
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
    }

    .new-chat-btn:hover {
        color: var(--text-normal);
        background-color: var(--background-modifier-hover);
        transform: translateY(-1px);
        border-color: var(--text-muted);
    }

    .chat-items {
        flex: 1;
        overflow-y: auto;
        padding: 8px;
    }

    .chat-item {
        display: flex;
        align-items: center;
        padding: 2px 4px;
        margin-bottom: 1px;
        border-radius: 4px;
    }

    .chat-item-content {
        flex: 1;
        display: flex;
        align-items: center;
        padding: 6px 8px;
        cursor: pointer;
        text-align: left;
        min-width: 0;
        color: var(--text-muted);
        border-radius: 4px;
    }

    .chat-item:hover {
        background-color: var(--background-modifier-hover);
    }

    .chat-item.active {
        background-color: var(--background-secondary-alt);
    }

    .chat-item.active .chat-item-content {
        color: var(--text-normal);
    }

    .chat-item-actions {
        padding: 0 6px;
        display: flex;
        align-items: center;
    }

    .chat-title {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .chat-title-input {
        width: 100%;
        background: var(--background-primary);
        border: 1px solid var(--background-modifier-border);
        border-radius: 4px;
        padding: 4px 8px;
        margin: 0;
        font-size: inherit;
        color: var(--text-normal);
    }

    .chat-item-content.editing {
        padding: 4px;
    }
</style>
