<script lang="ts">
    import { fade } from 'svelte/transition';
    import { chatState } from './store/ChatState.svelte.ts';

    let { chatId, chatTitle }: { chatId: number; chatTitle: string } = $props();

    let editingTitle = $state('');
    let isEditing = $state(false);
    let isMenuOpen = $state(false);

    function startEditing(e: Event) {
        e.stopPropagation();
        editingTitle = chatTitle;
        isEditing = true;
        isMenuOpen = false;
    }

    async function saveTitle() {
        if (editingTitle.trim()) {
            await chatState.updateChatTitle(chatId, editingTitle.trim());
        }
        isEditing = false;
    }

    function toggleMenu(e: Event) {
        e.stopPropagation();
        isMenuOpen = !isMenuOpen;
    }

    // Close menu when clicking outside
    function handleClickOutside(e: MouseEvent) {
        const target = e.target as HTMLElement;
        if (!target.closest('.chat-actions')) {
            isMenuOpen = false;
        }
    }
</script>

<svelte:window on:click={handleClickOutside} />

<div class="chat-actions">
    <button 
        class="action-btn"
        onclick={toggleMenu}
        aria-label="Chat actions"
        aria-expanded={isMenuOpen}
        aria-haspopup="true"
    >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="19" r="1" />
        </svg>
    </button>
    
    {#if isMenuOpen}
        <div 
            class="action-menu"
            role="menu"
            transition:fade={{ duration: 100 }}
        >
            <button 
                class="menu-item"
                onclick={startEditing}
                role="menuitem"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                <span>Rename</span>
            </button>
            <button 
                class="menu-item delete"
                onclick={(e) => {
                    e.stopPropagation();
                    chatState.deleteChat(chatId);
                }}
                role="menuitem"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                <span>Delete</span>
            </button>
        </div>
    {/if}
</div>

{#if isEditing}
    <input
        type="text"
        bind:value={editingTitle}
        onblur={saveTitle}
        onkeydown={(e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveTitle();
            } else if (e.key === 'Escape') {
                isEditing = false;
            }
        }}
        class="edit-title"
        aria-label="Edit chat title"
        onclick={(e) => e.stopPropagation()}
    />
{/if}

<style>
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

    .edit-title {
        width: 100%;
        background: var(--background-primary);
        border: 1px solid var(--background-modifier-border);
        border-radius: 4px;
        padding: 4px;
        margin-top: 4px;
    }
</style>
