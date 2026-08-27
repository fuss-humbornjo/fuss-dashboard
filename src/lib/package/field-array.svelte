<script lang="ts">
import { Plus, X } from "@lucide/svelte";
import { tick } from "svelte";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

// General dynamic string-list editor: one row per entry, add/remove rows.
let {
  value = $bindable([]),
  readonly = false,
  placeholder = "",
  addLabel = "Add",
  pattern = undefined,
}: {
  value?: string[];
  readonly?: boolean;
  placeholder?: string;
  addLabel?: string;
  pattern?: string;
} = $props();

let list: HTMLDivElement | undefined = $state();

function update(index: number, entry: string) {
  value = value.map((item, i) => (i === index ? entry : item));
}

function remove(index: number) {
  value = value.filter((_, i) => i !== index);
}

async function add() {
  value = [...value, ""];
  await tick();
  list?.lastElementChild?.querySelector("input")?.focus();
}

function onKeydown(event: KeyboardEvent) {
  // Enter adds a row instead of submitting the surrounding form.
  if (event.key === "Enter") {
    event.preventDefault();
    void add();
  }
}
</script>

<div class="space-y-2">
  {#if value.length}
    <div bind:this={list} class="space-y-2">
      {#each value as entry, i (i)}
        <div class="flex items-center gap-2">
          <Input
            value={entry}
            oninput={(event) => update(i, event.currentTarget.value)}
            onkeydown={onKeydown}
            {placeholder}
            {pattern}
            disabled={readonly}
            class="font-mono text-sm"
            spellcheck={false}
            aria-label={`Entry ${i + 1}`}
          />
          <Button
            variant="ghost"
            size="icon"
            onclick={() => remove(i)}
            disabled={readonly}
            title="Remove entry"
            aria-label={`Remove entry ${i + 1}`}
          >
            <X size={16} />
          </Button>
        </div>
      {/each}
    </div>
  {/if}
  <div>
    <Button variant="outline" size="sm" onclick={add} disabled={readonly}>
      <Plus size={16} />
      {addLabel}
    </Button>
  </div>
</div>
