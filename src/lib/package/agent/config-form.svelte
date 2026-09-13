<script lang="ts">
import { LoaderCircle, Save } from "@lucide/svelte";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import FieldArray from "../field-array.svelte";
import { toMcpDraft, toMcpWire } from "../mcpx/config";
import McpConfigForm from "../mcpx/config-form.svelte";
import { toSkillDraft, toSkillWire } from "../skillx/config";
import SkillConfigForm from "../skillx/config-form.svelte";
import type { AgentConfig } from "./config";
import PromptEditor from "./prompt-editor.svelte";

let {
  name,
  config,
  readonly = false,
  onSave,
}: {
  name: string;
  config: AgentConfig;
  readonly?: boolean;
  onSave?: (name: string, config: AgentConfig) => Promise<void>;
} = $props();

// The parent keys the form by resource/revision so new snapshots reset the draft.
let draftName = $state(name);
let hint = $state(config.hint_prompt);
let system = $state(config.system_prompt);
let storage = $state(config.storage_key ?? "");
let envs = $state([...(config.envs ?? [])]);
let mcps = $state((config.mcps ?? []).map(toMcpDraft));
let skills = $state((config.skills ?? []).map(toSkillDraft));
let saving = $state(false);
let error = $state("");

async function save(event: SubmitEvent) {
  event.preventDefault();
  error = "";
  try {
    const next = {
      ...config,
      hint_prompt: hint,
      system_prompt: system,
      storage_key: storage,
      envs: envs.map((line) => line.trim()).filter(Boolean),
      mcps: mcps.filter((server) => server.name.trim()).map(toMcpWire),
      skills: skills.filter((skill) => skill.name.trim()).map(toSkillWire),
    };
    saving = true;
    await onSave?.(draftName.trim(), next);
  } catch (cause) {
    error =
      cause instanceof Error ? cause.message : "Unable to save configuration.";
  } finally {
    saving = false;
  }
}
</script>

<form class={`max-w-3xl space-y-6 ${readonly ? "" : "pb-20"}`} onsubmit={save}>
  <fieldset
    disabled={readonly || saving}
    class="min-w-0 space-y-6 disabled:opacity-75"
  >
    <div class="grid gap-2">
      <label class="text-sm font-medium" for="resource-name">Name</label>
      <Input
        id="resource-name"
        bind:value={draftName}
        required
        maxlength={200}
      />
    </div>
    <div class="grid gap-2">
      <span class="text-sm font-medium">System prompt</span>
      <PromptEditor bind:value={system} {readonly} />
    </div>
    <div class="grid gap-2">
      <span class="text-sm font-medium">Hint prompt</span>
      <PromptEditor bind:value={hint} {readonly} contentClass="min-h-24" />
    </div>
    <div class="grid gap-2">
      <label class="text-sm font-medium" for="storage-key">Storage key</label>
      <Input id="storage-key" bind:value={storage} />
    </div>
    <div class="grid gap-2">
      <span class="text-sm font-medium">Environment variables</span>
      <FieldArray
        bind:value={envs}
        {readonly}
        placeholder="KEY=value"
        addLabel="Add variable"
      />
    </div>
    <div class="grid gap-2">
      <span class="text-sm font-medium">MCP servers</span>
      <McpConfigForm bind:value={mcps} {readonly} />
    </div>
    <div class="grid gap-2">
      <span class="text-sm font-medium">Skills</span>
      <SkillConfigForm bind:value={skills} {readonly} />
    </div>
  </fieldset>
  {#if !readonly}
    <div class="fixed right-6 bottom-6 z-30 flex items-center gap-3">
      {#if error}
        <p
          role="alert"
          class="border bg-card px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      {/if}
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        class="border-border bg-background"
        disabled={saving}
        title="Save changes"
        aria-label="Save changes"
      >
        {#if saving}
          <LoaderCircle size={16} class="animate-spin" />
        {:else}
          <Save size={16} />
        {/if}
      </Button>
    </div>
  {/if}
</form>
