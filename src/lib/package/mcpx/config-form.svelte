<script lang="ts">
import { ChevronRight, Plus, X } from "@lucide/svelte";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import { Input } from "../../components/ui/input";
import * as Select from "../../components/ui/select";
import FieldArray from "../field-array.svelte";
import {
  emptyMcpDraft,
  MCP_TRANSPORT_TYPES,
  type McpDraft,
  type McpTransportType,
} from "./config";

// Edits a list of MCP server drafts (mcpx.#Config); see ./config.ts.
let {
  value = $bindable([]),
  readonly = false,
}: {
  value?: McpDraft[];
  readonly?: boolean;
} = $props();

// Entries collapse to their header by default; newly added servers open
// so they are immediately editable. Index-keyed like the each block.
let open = $state<boolean[]>(value.map(() => false));

function add() {
  value = [...value, emptyMcpDraft()];
  open = [...open, true];
}

function remove(index: number) {
  value = value.filter((_, i) => i !== index);
  open = open.filter((_, i) => i !== index);
}
</script>

<div class="space-y-3">
  {#each value as server, i (i)}
    <section class="border bg-inset">
      <div class="flex items-center gap-2 p-3">
        <button
          type="button"
          class="flex min-w-0 flex-1 items-center gap-2 text-left"
          aria-expanded={open[i]}
          aria-label={`Toggle server ${server.name || i + 1}`}
          onclick={() => (open[i] = !open[i])}
        >
          <ChevronRight
            size={14}
            class={`shrink-0 text-muted-foreground transition-transform ${open[i] ? "rotate-90" : ""}`}
          />
          <span class="min-w-0 truncate font-mono text-sm">
            {server.name.trim() || "unnamed server"}
          </span>
        </button>
        <span
          class="shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
        >
          {server.type}
        </span>
        {#if server.required}
          <span
            class="shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
          >
            required
          </span>
        {/if}
        {#if !server.enabled}
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
          title="Remove server"
          aria-label={`Remove server ${i + 1}`}
        >
          <X size={16} />
        </Button>
      </div>

      {#if open[i]}
        <div class="space-y-3 border-t p-3">
          <div class="flex flex-wrap items-center gap-2">
            <Input
              bind:value={server.name}
              placeholder="server-name"
              pattern="[A-Za-z0-9][A-Za-z0-9._\-]*"
              aria-label="Server name"
              class="min-w-40 flex-1 font-mono text-sm"
              disabled={readonly}
              spellcheck={false}
            />
            <Select.Root
              type="single"
              value={server.type}
              onValueChange={(type) => (server.type = type as McpTransportType)}
              disabled={readonly}
            >
              <Select.Trigger aria-label="Transport type" class="w-44">
                {server.type}
              </Select.Trigger>
              <Select.Content>
                {#each MCP_TRANSPORT_TYPES as type (type)}
                  <Select.Item value={type}>{type}</Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
            <label
              class="flex items-center gap-1.5 text-xs text-muted-foreground"
              for="mcp-enabled-{i}"
            >
              <Checkbox
                id="mcp-enabled-{i}"
                bind:checked={server.enabled}
                disabled={readonly}
              />
              Enabled
            </label>
            <label
              class="flex items-center gap-1.5 text-xs text-muted-foreground"
              for="mcp-required-{i}"
            >
              <Checkbox
                id="mcp-required-{i}"
                bind:checked={server.required}
                disabled={readonly}
              />
              Required
            </label>
          </div>

          {#if server.type === "stdio"}
            <div class="grid gap-1.5">
              <span class="text-xs text-muted-foreground">Command</span>
              <Input
                bind:value={server.command}
                placeholder="npx"
                aria-label="Command"
                class="font-mono text-sm"
                disabled={readonly}
                spellcheck={false}
              />
            </div>
            <div class="grid gap-1.5">
              <span class="text-xs text-muted-foreground">Arguments</span>
              <FieldArray
                bind:value={server.args}
                {readonly}
                placeholder="--flag"
                addLabel="Add argument"
              />
            </div>
            <div class="grid gap-1.5">
              <span class="text-xs text-muted-foreground"
                >Forwarded env vars</span
              >
              <FieldArray
                bind:value={server.envVars}
                {readonly}
                placeholder="API_TOKEN"
                addLabel="Add variable"
              />
            </div>
            <div class="grid gap-1.5">
              <span class="text-xs text-muted-foreground"
                >Working directory (optional)</span
              >
              <Input
                bind:value={server.cwd}
                aria-label="Working directory"
                class="font-mono text-sm"
                disabled={readonly}
                spellcheck={false}
              />
            </div>
          {:else}
            <div class="grid gap-1.5">
              <span class="text-xs text-muted-foreground">Endpoint</span>
              <Input
                bind:value={server.endpoint}
                type="url"
                placeholder="https://…"
                aria-label="Endpoint"
                class="font-mono text-sm"
                disabled={readonly}
                spellcheck={false}
              />
            </div>
          {/if}

          <div class="grid gap-1.5">
            <span class="text-xs text-muted-foreground"
              >Enabled tools (empty allows all)</span
            >
            <FieldArray
              bind:value={server.enabledTools}
              {readonly}
              placeholder="tool_name"
              addLabel="Add tool"
            />
          </div>
          <div class="grid gap-1.5">
            <span class="text-xs text-muted-foreground">Disabled tools</span>
            <FieldArray
              bind:value={server.disabledTools}
              {readonly}
              placeholder="tool_name"
              addLabel="Add tool"
            />
          </div>
        </div>
      {/if}
    </section>
  {/each}
  <div>
    <Button variant="outline" size="sm" onclick={add} disabled={readonly}>
      <Plus size={16} />
      Add server
    </Button>
  </div>
</div>
