<script lang="ts" generics="T extends Record<string, string>">
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Search,
} from "@lucide/svelte";
import { FlexRender, type SvelteTable } from "@tanstack/svelte-table";
import PageHeading from "../../components/PageHeading.svelte";
import { SelectSimple as Select } from "../../components/ui/select/index.js";

type Filter = {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
};

let {
  title,
  description,
  filter,
  onFilter,
  table,
  action,
  onAction,
  filters = [],
  sortKey = "",
  sortDirection = "asc",
  onSort = () => {},
  page = 1,
  pageCount = 1,
  totalCount = 0,
  onPageChange = () => {},
}: {
  title: string;
  description: string;
  filter: string;
  onFilter: (value: string) => void;
  table: SvelteTable<Record<string, never>, T>;
  action: string;
  onAction?: () => void;
  filters?: Filter[];
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (key: string) => void;
  page?: number;
  pageCount?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
} = $props();

let selectedRows = $state<string[]>([]);
let hiddenColumns = $state<string[]>([]);
let viewOpen = $state(false);
let actionRow = $state<string | null>(null);

const rows = $derived(table.getRowModel().rows);
const headers = $derived(table.getHeaderGroups()[0]?.headers ?? []);
const visibleHeaders = $derived(
  headers.filter((header) => !hiddenColumns.includes(header.column.id)),
);
const visibleRowsSelected = $derived(
  rows.length > 0 && rows.every((row) => selectedRows.includes(row.id)),
);

const toggleAll = (checked: boolean) => {
  const visibleIds = rows.map((row) => row.id);
  selectedRows = checked
    ? [...new Set([...selectedRows, ...visibleIds])]
    : selectedRows.filter((id) => !visibleIds.includes(id));
};

const toggleColumn = (id: string, visible: boolean) => {
  hiddenColumns = visible
    ? hiddenColumns.filter((column) => column !== id)
    : [...hiddenColumns, id];
};
</script>

<PageHeading {title} {description} {action} {onAction} />
<div class="rounded-xl border bg-card shadow-sm">
  <div class="flex flex-wrap items-center justify-between gap-3 border-b p-4">
    <div class="flex flex-wrap gap-2">
      <label class="relative">
        <span class="sr-only">Filter {title.toLowerCase()}</span>
        <Search
          class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={16}
        />
        <input
          class="h-9 w-56 rounded-md border bg-background pl-9 pr-3 font-mono text-xs outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          placeholder="Filter..."
          value={filter}
          oninput={(event) => onFilter(event.currentTarget.value)}
        >
      </label>
      {#each filters as item (item.label)}
        <Select
          ariaLabel={item.label}
          value={item.value}
          placeholder={item.label}
          options={item.options}
          onChange={item.onChange}
        />
      {/each}
    </div>
    <div class="relative">
      <button
        type="button"
        class="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm hover:bg-muted"
        aria-expanded={viewOpen}
        onclick={() => (viewOpen = !viewOpen)}
      >
        View <ChevronDown size={14} />
      </button>
      {#if viewOpen}
        <div
          class="absolute right-0 top-11 z-20 min-w-44 rounded-md border bg-popover p-1 shadow-lg"
        >
          <p class="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Toggle columns
          </p>
          {#each headers as header (header.id)}
            <label
              class="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
            >
              <input
                type="checkbox"
                checked={!hiddenColumns.includes(header.column.id)}
                onchange={(event) => toggleColumn(header.column.id, event.currentTarget.checked)}
              >
              <span class="capitalize">{header.column.id}</span>
            </label>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <div class="overflow-x-auto">
    <table class="w-full text-left text-sm">
      <thead class="border-b bg-muted/50 text-label text-muted-foreground">
        <tr>
          <th class="w-10 px-4 py-3">
            <input
              type="checkbox"
              aria-label="Select all visible rows"
              checked={visibleRowsSelected}
              onchange={(event) => toggleAll(event.currentTarget.checked)}
            >
          </th>
          {#each visibleHeaders as header (header.id)}
            <th class="whitespace-nowrap px-4 py-3 font-normal">
              {#if !header.isPlaceholder}
                <button
                  type="button"
                  class="inline-flex items-center gap-1 hover:text-foreground"
                  onclick={() => onSort(header.column.id)}
                >
                  <FlexRender {header} />
                  {#if sortKey === header.column.id}
                    {#if sortDirection === "asc"}
                      <ArrowUp size={13} />
                    {:else}
                      <ArrowDown size={13} />
                    {/if}
                  {/if}
                </button>
              {/if}
            </th>
          {/each}
          <th class="w-10 px-4 py-3"></th>
        </tr>
      </thead>
      <tbody class="divide-y">
        {#each rows as row (row.id)}
          <tr
            class={`hover:bg-muted/40 ${selectedRows.includes(row.id) ? "bg-muted/30" : ""}`}
          >
            <td class="px-4 py-3">
              <input
                type="checkbox"
                aria-label={`Select row ${row.id}`}
                checked={selectedRows.includes(row.id)}
                onchange={(event) => { selectedRows = event.currentTarget.checked ? [...selectedRows, row.id] : selectedRows.filter((id) => id !== row.id); }}
              >
            </td>
            {#each row.getAllCells().filter((cell) => !hiddenColumns.includes(cell.column.id)) as cell (cell.id)}
              <td class="max-w-[28rem] px-4 py-3.5 align-middle">
                {#if cell.column.id === "id"}
                  <span class="font-mono text-xs text-muted-foreground"
                    ><FlexRender {cell} /></span
                  >
                {:else if cell.column.id === "title"}
                  <div class="flex min-w-0 items-center gap-2">
                    {#if row.original.label}
                      <span
                        class="shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                        >{row.original.label}</span
                      >
                    {/if}
                    <span class="line-clamp-2"><FlexRender {cell} /></span>
                  </div>
                {:else if cell.column.id === "status"}
                  {@const statusKey = String(cell.getValue()).toLowerCase()}
                  <span
                    class={`inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[11px] ${statusKey === "active" || statusKey === "done" ? "border-success/25 bg-success/10 text-success" : statusKey === "in progress" ? "border-info/25 bg-info/10 text-info" : statusKey === "suspended" || statusKey === "canceled" ? "border-destructive/25 bg-destructive/10 text-destructive" : "border-border bg-muted/50 text-muted-foreground"}`}
                  >
                    <FlexRender {cell} /></span
                  >
                {:else if cell.column.id === "priority"}
                  <span class="font-mono text-xs text-muted-foreground">
                    <FlexRender {cell} /></span
                  >
                {:else if cell.column.id === "role"}
                  <span class="text-sm capitalize"> <FlexRender {cell} /></span>
                {:else}
                  <FlexRender {cell} />
                {/if}
              </td>
            {/each}
            <td class="relative px-4 py-3">
              <button
                type="button"
                class="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="More actions"
                aria-expanded={actionRow === row.id}
                onclick={() => (actionRow = actionRow === row.id ? null : row.id)}
              >
                <MoreHorizontal size={17} />
              </button>
              {#if actionRow === row.id}
                <div
                  class="absolute right-3 top-11 z-20 w-32 rounded-md border bg-popover p-1 text-sm shadow-lg"
                >
                  <button
                    type="button"
                    class="w-full rounded px-2 py-1.5 text-left hover:bg-muted"
                    onclick={() => (actionRow = null)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    class="w-full rounded px-2 py-1.5 text-left hover:bg-muted"
                    onclick={() => (actionRow = null)}
                  >
                    Duplicate
                  </button>
                  <button
                    type="button"
                    class="w-full rounded px-2 py-1.5 text-left text-destructive hover:bg-muted"
                    onclick={() => (actionRow = null)}
                  >
                    Delete
                  </button>
                </div>
              {/if}
            </td>
          </tr>
        {:else}
          <tr>
            <td
              class="p-8 text-center text-muted-foreground"
              colspan={visibleHeaders.length + 2}
            >
              No results.
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div
    class="flex flex-wrap items-center justify-between gap-3 border-t p-4 font-mono text-[11px] text-muted-foreground"
  >
    <span
      >{selectedRows.length ? `${selectedRows.length} selected · ` : ""}
      {totalCount || rows.length}
      result{(totalCount || rows.length) === 1 ? "" : "s"}</span
    >
    <div class="flex items-center gap-2">
      <span>Page {page} of {pageCount}</span>
      <button
        type="button"
        disabled={page <= 1}
        class="rounded-md border p-1.5 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Previous page"
        onclick={() => onPageChange(page - 1)}
      >
        <ChevronLeft size={15} />
      </button>
      <button
        type="button"
        disabled={page >= pageCount}
        class="rounded-md border p-1.5 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Next page"
        onclick={() => onPageChange(page + 1)}
      >
        <ChevronRight size={15} />
      </button>
    </div>
  </div>

  {#if selectedRows.length}
    <div
      class="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-lg border bg-background px-4 py-3 shadow-xl"
    >
      <span class="inline-flex items-center gap-2 text-sm font-medium"
        ><Check size={16} />{selectedRows.length}
        selected</span
      >
      <button
        type="button"
        class="text-xs text-muted-foreground hover:text-foreground"
        onclick={() => (selectedRows = [])}
      >
        Clear
      </button>
    </div>
  {/if}
</div>
