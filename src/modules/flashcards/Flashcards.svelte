<script lang="ts">
    import { FlashModel } from "@modules/flashcards/FlashcardModel.svelte";
    let { someProp } = $props();

    let count = $state(0);
    let model = new FlashModel();
</script>

<div>
    <h1 class="text-small pb-10">Hello {someProp}!</h1>
    <h2>Local State</h2>
    {count}
    <button onclick={() => count++}>+</button>
    <h2>Model State</h2>
    {model.count}
    <button onclick={() => model.increment()}>+</button>
</div>
