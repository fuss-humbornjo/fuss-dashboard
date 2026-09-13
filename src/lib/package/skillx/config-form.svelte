<script lang="ts">
import { ChevronRight, Plus, X } from "@lucide/svelte";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import { Input } from "../../components/ui/input";
import FieldArray from "../field-array.svelte";
import { emptySkillDraft, type SkillDraft } from "./config";

// Edits a list of skill drafts (skillx.#Config); see ./config.ts.
let {
  value = $bindable([]),
  readonly = false,
}: {
  value?: SkillDraft[];
  readonly?: boolean;
} = $props();

// Entries collapse to their header by default; newly added skills open
// so they are immediately editable. Index-keyed like the each block.
let open = $state<boolean[]>(value.map(() => false));

function add() {
  value = [...value, emptySkillDraft()];
  open = [...open, true];
}

function remove(index: number) {
  value = value.filter((_, i) => i !== index);
  open = open.filter((_, i) => i !== index);
}
</script>

<div class="space-y-3">
  {#each value as skill, i (i)}
    <section class="border bg-inset">
      <div class="flex items-center gap-2 p-3">
        <button
          type="button"
          class="flex min-w-0 flex-1 items-center gap-2 text-left"
          aria-expanded={open[i]}
          aria-label={`Toggle skill ${skill.name || i + 1}`}
          onclick={() => (open[i] = !open[i])}
        >
          <ChevronRight
            size={14}
            class={`shrink-0 text-muted-foreground transition-transform ${open[i] ? "rotate-90" : ""}`}
          />
          <span class="min-w-0 truncate font-mono text-sm">
            {skill.name.trim() || "unnamed skill"}
          </span>
        </button>
        {#if skill.scope.trim()}
          <span
            class="shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
          >
            {skill.scope}
          </span>
        {/if}
        {#if skill.version.trim()}
          <span
            class="shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
          >
            {skill.version}
          </span>
        {/if}
        {#if !skill.enabled}
          <span
            class="shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
          >
            disabled
          </span>
        {/if}
        <Button
          variant="ghost"
          size="icon"
          onclick={() => remove(i)}
          disabled={readonly}
          title="Remove skill"
          aria-label={`Remove skill ${i + 1}`}
        >
          <X size={16} />
        </Button>
      </div>

      {#if open[i]}
        <div class="space-y-3 border-t p-3">
          <div class="flex flex-wrap items-center gap-2">
            <Input
              bind:value={skill.name}
              placeholder="skill-name"
              aria-label="Skill name"
              class="min-w-40 flex-1 font-mono text-sm"
              disabled={readonly}
              spellcheck={false}
            />
            <Input
              bind:value={skill.scope}
              placeholder="scope"
              aria-label="Registry scope"
              class="w-36 font-mono text-sm"
              disabled={readonly}
              spellcheck={false}
            />
            <Input
              bind:value={skill.version}
              placeholder="version"
              aria-label="Registry version"
              class="w-28 font-mono text-sm"
              disabled={readonly}
              spellcheck={false}
            />
            <label
              class="flex items-center gap-1.5 text-xs text-muted-foreground"
              for="skill-enabled-{i}"
            >
              <Checkbox
                id="skill-enabled-{i}"
                bind:checked={skill.enabled}
                disabled={readonly}
              />
              Enabled
            </label>
          </div>
          <div class="grid gap-1.5">
            <span class="text-xs text-muted-foreground">Required env vars</span>
            <FieldArray
              bind:value={skill.envs}
              {readonly}
              placeholder="API_TOKEN"
              addLabel="Add variable"
              pattern="[A-Za-z_][A-Za-z0-9_]*"
            />
          </div>
        </div>
      {/if}
    </section>
  {/each}
  <div>
    <Button variant="outline" size="sm" onclick={add} disabled={readonly}>
      <Plus size={16} />
      Add skill
    </Button>
  </div>
</div>
