<script lang="ts">
    import { chatState } from './store/ChatState.svelte.ts';
    import { fade } from 'svelte/transition';
    import ChatActions from './ChatActions.svelte';

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
                <button 
                    class="chat-item-button"
                    onclick={() => chatState.selectChat(chat.id!)}
                    aria-current={chat.id === chatState.currentChatId}
                >
                    <span class="chat-title">{chat.title}</span>
                </button>
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
        padding: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid var(--background-modifier-border);
    }

    .chat-list-header h3 {
        margin: 0;
    }

    .new-chat-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        color: var(--text-muted);
        border-radius: 4px;
    }

    .new-chat-btn:hover {
        color: var(--text-normal);
        background-color: var(--background-modifier-hover);
    }

    .chat-items {
        flex: 1;
        overflow-y: auto;
        padding: 8px;
    }

    .chat-item {
        display: flex;
        align-items: center;
        margin-bottom: 4px;
        border-bottom: 1px solid var(--background-modifier-border);
    }

    .chat-item-button {
        flex: 1;
        display: flex;
        align-items: center;
        padding: 12px;
        background: none;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        text-align: left;
        min-width: 0;
    }

    .chat-item-button:hover {
        background-color: var(--background-modifier-hover);
    }

    .chat-item.active .chat-item-button {
        background-color: var(--background-modifier-active);
    }

    .chat-item-actions {
        padding-right: 12px;
    }

    .chat-title {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .edit-title {
        width: 100%;
        background: var(--background-primary);
        border: 1px solid var(--background-modifier-border);
        border-radius: 4px;
        padding: 4px;
    }

    .chat-actions {
        position: relative;
    }

    .action-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        color: var(--text-muted);
        border-radius: 4px;
        display: flex;
        align-items: center;
    }

    .action-btn:hover {
        color: var(--text-normal);
        background-color: var(--background-modifier-hover);
    }

    .action-menu {
        position: absolute;
        right: 0;
        top: 100%;
        background: var(--background-primary);
        border: 1px solid var(--background-modifier-border);
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        min-width: 140px;
        z-index: 100;
    }

    .menu-item {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 8px 12px;
        background: none;
        border: none;
        cursor: pointer;
        color: var(--text-normal);
        text-align: left;
    }

    .menu-item:hover {
        background-color: var(--background-modifier-hover);
    }

    .menu-item.delete {
        color: var(--text-error);
    }

    .menu-item.delete:hover {
        background-color: var(--background-modifier-error);
    }
</style>
