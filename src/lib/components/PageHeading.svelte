<script lang="ts">
import { Plus } from "@lucide/svelte";

let {
  title,
  description,
  action = "",
  onAction = () => {},
}: {
  title: string;
  description: string;
  action?: string;
  onAction?: () => void;
} = $props();
</script>

<div class="mb-6 flex flex-wrap items-end justify-between gap-4">
  <div>
    <h1 class="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
    <p class="mt-1.5 font-mono text-xs text-muted-foreground">{description}</p>
  </div>
  {#if action}
    <button
      type="button"
      class="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
      onclick={onAction}
    >
      <Plus size={16} />{action}
    </button>
  {/if}
</div>
