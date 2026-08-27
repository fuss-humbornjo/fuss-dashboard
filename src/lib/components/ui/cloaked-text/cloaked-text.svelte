<script lang="ts">
import { toast } from "svelte-sonner";
import { type CloakPosition, cloak } from "./cloak";

let {
  text,
  count = 6,
  from = "end",
  ellipsis = true,
  uppercase = false,
  marker = "...",
  copyable = false,
  class: className,
}: {
  text: string;
  count?: number;
  from?: CloakPosition;
  ellipsis?: boolean;
  uppercase?: boolean;
  marker?: string;
  copyable?: boolean;
  class?: string;
} = $props();

const cloaked = $derived(text.length > count);
const masked = $derived(
  cloak(text, count, from, { ellipsis, uppercase, marker }),
);

// Copies the uncloaked text and confirms with a toast.
async function copy() {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    toast.error("Unable to copy");
    return;
  }
  toast.success("Copied");
}
</script>

{#if copyable}
  <button
    type="button"
    class={`cursor-pointer ${className ?? ""}`}
    title={`Copy ${text}`}
    onclick={copy}
  >
    {masked}
  </button>
{:else}
  <span class={className} title={cloaked ? text : undefined}>{masked}</span>
{/if}
