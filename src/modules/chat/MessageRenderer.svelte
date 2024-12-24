<script lang="ts">
  import type { Messages } from "@anthropic-ai/sdk/resources/index";
  import type { App, WorkspaceLeaf } from "obsidian";
  import { TFile, FileView } from "obsidian";
  import {
    isTextBlock,
    isImageBlock,
    isDocumentBlock,
    isToolResultBlock,
    isToolUseBlock,
    isFileEmbed,
    parseFileEmbed,
  } from "./utils";
  
  let { message, app }: { message: Messages.MessageParam; app: App } = $props();

  function openFile(path: string) {
    const abstractFile = app.vault.getAbstractFileByPath(path);
    if (!abstractFile || !(abstractFile instanceof TFile)) return;

    // Find if file is already open in a tab
    const leaves: WorkspaceLeaf[] = app.workspace.getLeavesOfType('markdown');
    const existingLeaf = leaves.find((leaf: WorkspaceLeaf) => {
      const view = leaf.view;
      if (!(view instanceof FileView)) return false;
      return view.file?.path === path;
    });

    if (existingLeaf) {
      // If file is already open, set that leaf as active
      app.workspace.setActiveLeaf(existingLeaf, { focus: true });
    } else {
      // If file isn't open, create new leaf and open file there
      app.workspace.getLeaf('tab').openFile(abstractFile);
    }
  }
</script>

{#snippet messageRenderer(message: Messages.MessageParam)}
  {#each Array.isArray(message.content) ? message.content : [] as block}
    {#if typeof block === "string"}
      <p class="leading-relaxed p-0 m-0 text-[15px] whitespace-pre-wrap">
        {block}
      </p>
    {:else if isTextBlock(block)}
      {#if isFileEmbed(block.text)}
        {@const fileInfo = parseFileEmbed(block.text)}
        {#if fileInfo}
          <div 
            class="bg-white/[0.02] hover:bg-white/[0.04] rounded-lg p-2 my-2 cursor-pointer transition-colors"
            on:click={() => openFile(fileInfo.path)}
            role="button"
            tabindex="0"
            on:keydown={(e) => e.key === 'Enter' && openFile(fileInfo.path)}
          >
            <div class="text-[13px] text-white/60 mb-1">{fileInfo.filename}</div>
            <p class="leading-relaxed p-0 m-0 text-[15px] whitespace-pre-wrap font-mono line-clamp-2 overflow-hidden">
              {fileInfo.content}
            </p>
          </div>
        {/if}
      {:else}
        <p class="leading-relaxed p-0 m-0 text-[15px] whitespace-pre-wrap">
          {block.text}
        </p>
      {/if}
    {:else if isImageBlock(block)}
      <div>{block.type}</div>
    {:else if isDocumentBlock(block)}
      {@const file = new File([block.source.data], block.source.media_type)}
      <div>
        {file.name}
      </div>
    {:else if isToolResultBlock(block)}
      {#if block.is_error}
        <p
          class="leading-relaxed p-0 m-0 text-[15px] whitespace-pre-wrap text-red-500"
        >
          {typeof block.content === "string"
            ? block.content
            : JSON.stringify(block.content)}
        </p>
      {:else}
        <div class="pl-[20%]">
          <div class="bg-white/[0.04] p-2 rounded-lg">
            <p class="leading-relaxed p-0 m-0 text-[15px] whitespace-pre-wrap">
              {typeof block.content === "string"
                ? block.content
                : JSON.stringify(block.content)}
            </p>
          </div>
        </div>
      {/if}
    {:else if isToolUseBlock(block)}
      {console.log("tool use")}
      <p class="leading-relaxed p-0 m-0 text-[15px] whitespace-pre-wrap">
        {block.name}
      </p>
    {/if}
  {/each}
{/snippet}

{#if message.role === "assistant"}
  <p class="leading-relaxed p-0 m-0 text-[15px] whitespace-pre-wrap">
    {@render messageRenderer(message)}
  </p>
{:else}
  <div class="pl-[20%]">
    <div class="bg-white/[0.04] p-2 rounded-lg">
      <p class="leading-relaxed p-0 m-0 text-[15px] whitespace-pre-wrap">
        {@render messageRenderer(message)}
      </p>
    </div>
  </div>
{/if}
