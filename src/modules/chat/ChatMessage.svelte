<script lang="ts">
  import type { ChatMessage } from "./ChatModel.svelte.ts";

  let { message }: { message: ChatMessage } = $props();
</script>

{#if message.role === "assistant"}
  <p class="leading-relaxed p-0 m-0 text-[15px] whitespace-pre-wrap">
    {message.content}
  </p>
{:else}
  <div class="pl-[20%]">
    <div class="bg-white/[0.04] p-2 rounded-lg">
      <p class="leading-relaxed p-0 m-0 text-[15px] whitespace-pre-wrap">
        {message.content}
      </p>
    </div>
  </div>
{/if}
