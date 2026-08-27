<script lang="ts">
import { createEditor, Edra } from "../../edra/shadcn/index.js";

let {
  value = $bindable(""),
  readonly = false,
  contentClass = "min-h-36",
}: {
  value?: string;
  readonly?: boolean;
  contentClass?: string;
} = $props();

// Prompts are stored as plain markdown; the editor round-trips through it.
const editor = createEditor({
  onUpdate: () => {
    value = editor?.getMarkdown() ?? value;
  },
});

if (editor) {
  // emitUpdate: false keeps the pristine snapshot from looking edited.
  if (value) {
    editor.commands.setContent(value, {
      contentType: "markdown",
      emitUpdate: false,
    });
  }
  editor.setEditable(!readonly);
}

// Show the content scrollbar only while scrolling; hide it shortly after.
let scrolling = $state(false);
let scrollTimer: ReturnType<typeof setTimeout> | undefined;
function fadeScrollbar() {
  scrolling = true;
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => (scrolling = false), 700);
}
</script>

<div class="min-w-0 rounded-md border bg-inset">
  <Edra {editor}>
    {#if !readonly}
      <div class="toolbar-scroll overflow-x-auto border-b px-2 py-1.5">
        <Edra.Toolbar />
      </div>
      <Edra.BubbleMenu />
    {/if}
    <div
      class="content-scroll max-h-80 overflow-y-auto"
      class:scrolling
      onscroll={fadeScrollbar}
    >
      <Edra.Content class={`px-3 py-2 text-sm ${contentClass}`} />
    </div>
  </Edra>
</div>

<style>
/* Scroll horizontally without showing a scrollbar. */
.toolbar-scroll {
  scrollbar-width: none;
}
.toolbar-scroll::-webkit-scrollbar {
  display: none;
}

/* Thin transparent scrollbar that only appears while scrolling. */
.content-scroll {
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}
.content-scroll.scrolling {
  scrollbar-color: color-mix(in oklab, var(--foreground) 25%, transparent)
    transparent;
}
.content-scroll::-webkit-scrollbar {
  width: 6px;
  background: transparent;
}
.content-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.content-scroll::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background: transparent;
}
.content-scroll.scrolling::-webkit-scrollbar-thumb {
  background: color-mix(in oklab, var(--foreground) 25%, transparent);
}
</style>
