<script lang="ts" module>
export type SelectOption = {
  label: string;
  value: string;
  disabled?: boolean;
};
</script>

<script lang="ts">
import { cn } from "$lib/utils.js";
import Root from "./select.svelte";
import Content from "./select-content.svelte";
import Item from "./select-item.svelte";
import Trigger from "./select-trigger.svelte";
import Value from "./select-value.svelte";

// Options-array convenience select composed from this library's styled
// primitives — styling lives in the sibling components, not here.
let {
  value = "",
  options = [],
  placeholder = "Select an option",
  ariaLabel,
  id,
  disabled = false,
  class: className = "",
  triggerClass = "",
  onChange,
}: {
  value?: string;
  options?: SelectOption[];
  placeholder?: string;
  ariaLabel?: string;
  id?: string;
  disabled?: boolean;
  class?: string;
  triggerClass?: string;
  onChange: (value: string) => void;
} = $props();

const handleValueChange = (next: string | undefined) => {
  if (next !== undefined) onChange(next);
};
</script>

<div class={cn("relative inline-block max-w-full", className)}>
  <Root
    type="single"
    value={value || undefined}
    items={options}
    {disabled}
    onValueChange={handleValueChange}
  >
    <Trigger {id} aria-label={ariaLabel} class={cn("w-full", triggerClass)}>
      <Value {placeholder} />
    </Trigger>
    <Content class="max-h-64">
      {#if options.length > 0}
        {#each options as option (option.value)}
          <Item
            value={option.value}
            label={option.label}
            disabled={option.disabled}
          />
        {/each}
      {:else}
        <p class="px-2.5 py-2 text-sm text-muted-foreground">No options</p>
      {/if}
    </Content>
  </Root>
</div>
