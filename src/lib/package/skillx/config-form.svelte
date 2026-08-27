<script lang="ts">
import { Plus, X } from "@lucide/svelte";
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

function add() {
  value = [...value, emptySkillDraft()];
}

function remove(index: number) {
  value = value.filter((_, i) => i !== index);
}
</script>

<div class="space-y-3">
  {#each value as skill, i (i)}
    <section class="space-y-3 border bg-inset p-3">
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
    </section>
  {/each}
  <div>
    <Button variant="outline" size="sm" onclick={add} disabled={readonly}>
      <Plus size={16} />
      Add skill
    </Button>
  </div>
</div>
