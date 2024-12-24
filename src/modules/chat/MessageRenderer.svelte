<script lang="ts">
  import type { ChatMessage } from "./ChatModel.svelte.ts";
  import {
    isTextBlock,
    isImageBlock,
    isDocumentBlock,
    isToolResultBlock,
    isToolUseBlock,
  } from "./utils";
  let { message }: { message: ChatMessage } = $props();
</script>

{#snippet messageRenderer(message: ChatMessage)}
  {#each Array.isArray(message.content) ? message.content : [] as block}
    {#if typeof block === "string"}
      <p class="leading-relaxed p-0 m-0 text-[15px] whitespace-pre-wrap">
        {block}
      </p>
    {:else if isTextBlock(block)}
      <p class="leading-relaxed p-0 m-0 text-[15px] whitespace-pre-wrap">
        {block.text}
      </p>
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
