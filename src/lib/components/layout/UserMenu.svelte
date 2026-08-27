<script lang="ts">
import { CreditCard, LogOut, Settings2, User, Users } from "@lucide/svelte";
import type { Snippet } from "svelte";

let {
  trigger,
  side = "bottom",
  align = "end",
  onNavigate,
}: {
  trigger: Snippet<[open: boolean, toggle: () => void]>;
  side?: "top" | "bottom";
  align?: "start" | "end";
  onNavigate: (href: string) => void;
} = $props();

let open = $state(false);
let wrapper: HTMLDivElement;
let menuEl = $state.raw<HTMLDivElement | null>(null);
let position = $state("");

const toggle = () => {
  open = !open;
};
const close = () => {
  open = false;
};

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") close();
};

// Click-outside dismissal: the trigger lives in `wrapper` and the menu is
// portaled to <body>, so both must be checked before treating it as outside.
const handleClick = (event: MouseEvent) => {
  if (!open || !(event.target instanceof Node)) return;
  if (wrapper.contains(event.target) || menuEl?.contains(event.target)) return;
  close();
};

const go = (href: string) => {
  onNavigate(href);
  close();
};

// The menu is portaled to <body> so it escapes the sidebar's overflow clip
// (collapsed icon mode); position is fixed, derived from the trigger's rect.
const place = () => {
  const rect = wrapper.getBoundingClientRect();
  const horizontal =
    align === "end"
      ? `right: ${window.innerWidth - rect.right}px`
      : `left: ${rect.left}px`;
  const vertical =
    side === "top"
      ? `bottom: ${window.innerHeight - rect.top + 12}px`
      : `top: ${rect.bottom + 12}px`;
  position = `${horizontal}; ${vertical}`;
};

$effect(() => {
  if (open) place();
});

function portal(node: HTMLElement) {
  document.body.appendChild(node);
  return { destroy: () => node.remove() };
}
</script>

<svelte:window
  onkeydown={handleKeydown}
  onclick={handleClick}
  onresize={() => {
    if (open) place();
  }}
/>

<div class="relative" bind:this={wrapper}>
  {@render trigger(open, toggle)}
</div>
{#if open}
  <div
    use:portal
    bind:this={menuEl}
    class="fixed z-50 w-56 rounded-md border bg-popover p-1 shadow-lg"
    style={position}
  >
    <div class="border-b px-2 py-2">
      <p class="text-sm font-medium">satnaing</p>
      <p class="font-mono text-[11px] text-muted-foreground">
        satnaingdev@gmail.com
      </p>
    </div>
    <button
      type="button"
      class="mt-1 flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-muted"
    >
      <User size={15} />Profile
    </button>
    <button
      type="button"
      class="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-muted"
    >
      <CreditCard size={15} />Billing
    </button>
    <button
      type="button"
      class="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-muted"
      onclick={() => go("/settings")}
    >
      <Settings2 size={15} />Settings
    </button>
    <button
      type="button"
      class="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-muted"
    >
      <Users size={15} />New team
    </button>
    <div class="my-1 border-t"></div>
    <button
      type="button"
      class="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-muted"
    >
      <LogOut size={15} />Log out
    </button>
  </div>
{/if}
