<script lang="ts">
    import { chatState } from './store/ChatState.svelte.ts';
    import { fade } from 'svelte/transition';

    let editingId: number | null = $state(null);
    let editTitle = $state('');

    function startEditing(id: number, currentTitle: string) {
        editingId = id;
        editTitle = currentTitle;
    }

    async function saveTitle(id: number) {
        if (editTitle.trim()) {
            await chatState.updateChatTitle(id, editTitle.trim());
        }
        editingId = null;
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
    
    <div class="chat-items" role="list">
        {#each chatState.chats as chat (chat.id)}
            <div 
                class="chat-item"
                class:active={chat.id === chatState.currentChatId}
                transition:fade
                role="listitem"
            >
                <div 
                    class="chat-item-content" 
                    onclick={() => chatState.selectChat(chat.id!)}
                    role="button"
                    tabindex="0"
                    onkeydown={(e) => e.key === 'Enter' && chatState.selectChat(chat.id!)}
                >
                    {#if editingId === chat.id}
                        <input
                            type="text"
                            bind:value={editTitle}
                            onblur={() => saveTitle(chat.id!)}
                            onkeydown={(e) => e.key === 'Enter' && saveTitle(chat.id!)}
                            class="edit-title"
                            aria-label="Edit chat title"
                        />
                    {:else}
                        <span class="chat-title">{chat.title}</span>
                    {/if}
                </div>
                
                <div class="chat-actions">
                    <button 
                        class="edit-btn"
                        onclick={(e) => {
                            e.stopPropagation();
                            startEditing(chat.id!, chat.title);
                        }}
                        aria-label="Edit chat title"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button 
                        class="delete-btn"
                        onclick={(e) => {
                            e.stopPropagation();
                            chatState.deleteChat(chat.id!);
                        }}
                        aria-label="Delete chat"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        {/each}
    </div>
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
        padding: 12px;
        margin-bottom: 4px;
        border-radius: 4px;
        cursor: pointer;
        justify-content: space-between;
        border-bottom: 1px solid var(--background-modifier-border);
    }

    .chat-item:hover {
        background-color: var(--background-modifier-hover);
    }

    .chat-item.active {
        background-color: var(--background-modifier-active);
    }

    .chat-item-content {
        flex: 1;
        min-width: 0;
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
        display: flex;
        gap: 4px;
    }

    .edit-btn, .delete-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        color: var(--text-muted);
        border-radius: 4px;
    }

    .edit-btn:hover, .delete-btn:hover {
        color: var(--text-normal);
        background-color: var(--background-modifier-hover);
    }

    .delete-btn:hover {
        color: var(--text-error);
    }
</style>
