<script lang="ts">
import { Check, ChevronsUpDown } from "@lucide/svelte";
import * as Command from "./ui/command/index.js";
import * as Popover from "./ui/popover/index.js";

export type LanguageOption = {
  label: string;
  value: string;
};

let {
  value = "",
  options = [],
  id,
  onChange,
}: {
  value?: string;
  options?: LanguageOption[];
  id?: string;
  onChange: (value: string) => void;
} = $props();

let open = $state(false);
const selected = $derived(options.find((option) => option.value === value));

const choose = (next: string) => {
  onChange(next);
  open = false;
};
</script>

<Popover.Root bind:open>
  <Popover.Trigger
    {id}
    role="combobox"
    aria-label="Language"
    aria-expanded={open}
    class={`inline-flex h-9 w-50 items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-sm font-normal shadow-xs outline-none transition-all hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 ${selected ? "" : "text-muted-foreground"}`}
  >
    {selected?.label ?? "Select language"}
    <ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" />
  </Popover.Trigger>

  <Popover.Content
    align="start"
    sideOffset={4}
    class="max-h-[calc(100dvh-1rem)] w-50 overflow-y-auto p-0 overscroll-contain"
  >
    <Command.Root label="Languages" value={selected?.label ?? ""}>
      <Command.Input placeholder="Search language..." />
      <Command.Empty>No language found.</Command.Empty>
      <Command.Group>
        <Command.List>
          {#each options as option (option.value)}
            <Command.Item
              value={option.label}
              class="[&>.cn-command-item-indicator]:hidden"
              onSelect={() => choose(option.value)}
            >
              <Check
                class={`size-4 ${option.value === value ? "opacity-100" : "opacity-0"}`}
              />
              {option.label}
            </Command.Item>
          {/each}
        </Command.List>
      </Command.Group>
    </Command.Root>
  </Popover.Content>
</Popover.Root>
