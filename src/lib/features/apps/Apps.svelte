<script lang="ts">
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Boxes,
  Check,
  Code2,
  CreditCard,
  LayoutGrid,
  Mail,
  MessageCircle,
  PanelsTopLeft,
  Send,
  Video,
} from "@lucide/svelte";
import PageHeading from "../../components/PageHeading.svelte";
import { SelectSimple as Select } from "../../components/ui/select/index.js";

type AppType = "all" | "connected" | "notConnected";
type SortOrder = "asc" | "desc";

const appFixtures = [
  {
    name: "Telegram",
    desc: "Connect with Telegram for real-time communication.",
    connected: false,
    icon: Send,
  },
  {
    name: "Notion",
    desc: "Effortlessly sync Notion pages for seamless collaboration.",
    connected: true,
    icon: Boxes,
  },
  {
    name: "Figma",
    desc: "View and collaborate on Figma designs in one place.",
    connected: true,
    icon: LayoutGrid,
  },
  {
    name: "Trello",
    desc: "Sync Trello cards for streamlined project management.",
    connected: false,
    icon: PanelsTopLeft,
  },
  {
    name: "Slack",
    desc: "Integrate Slack for efficient team communication.",
    connected: false,
    icon: MessageCircle,
  },
  {
    name: "Zoom",
    desc: "Host Zoom meetings directly from the dashboard.",
    connected: true,
    icon: Video,
  },
  {
    name: "Stripe",
    desc: "Easily manage Stripe transactions and payments.",
    connected: false,
    icon: CreditCard,
  },
  {
    name: "Gmail",
    desc: "Access and manage Gmail messages effortlessly.",
    connected: true,
    icon: Mail,
  },
  {
    name: "Medium",
    desc: "Explore and share Medium stories on your dashboard.",
    connected: false,
    icon: Code2,
  },
  {
    name: "Skype",
    desc: "Connect with Skype contacts seamlessly.",
    connected: false,
    icon: Video,
  },
  {
    name: "Docker",
    desc: "Effortlessly manage Docker containers on your dashboard.",
    connected: false,
    icon: Boxes,
  },
  {
    name: "GitHub",
    desc: "Streamline code management with GitHub integration.",
    connected: false,
    icon: Code2,
  },
  {
    name: "GitLab",
    desc: "Efficiently manage code projects with GitLab integration.",
    connected: false,
    icon: Code2,
  },
  {
    name: "Discord",
    desc: "Connect with Discord for seamless team communication.",
    connected: false,
    icon: MessageCircle,
  },
  {
    name: "WhatsApp",
    desc: "Easily integrate WhatsApp for direct messaging.",
    connected: false,
    icon: MessageCircle,
  },
];

let search = $state("");
let type = $state<AppType>("all");
let sort = $state<SortOrder>("asc");
let connectionOverrides = $state<Record<string, boolean>>({});

const apps = $derived(
  appFixtures.map((app) => ({
    ...app,
    connected: connectionOverrides[app.name] ?? app.connected,
  })),
);
const filteredApps = $derived.by(() =>
  apps
    .filter((app) =>
      type === "connected"
        ? app.connected
        : type === "notConnected"
          ? !app.connected
          : true,
    )
    .filter((app) =>
      app.name.toLowerCase().includes(search.trim().toLowerCase()),
    )
    .toSorted((a, b) =>
      sort === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name),
    ),
);

const toggleConnection = (name: string, connected: boolean) => {
  connectionOverrides[name] = !connected;
};
</script>

<PageHeading
  title="App Integrations"
  description="Here's a list of your apps for the integration!"
/>

<div
  class="my-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
>
  <div class="flex flex-col gap-3 sm:flex-row">
    <input
      class="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring sm:w-64"
      placeholder="Filter apps..."
      bind:value={search}
    >
    <Select
      id="app-type"
      ariaLabel="Connection status"
      value={type}
      options={[
        { label: "All Apps", value: "all" },
        { label: "Connected", value: "connected" },
        { label: "Not Connected", value: "notConnected" },
      ]}
      class="w-full sm:w-40"
      onChange={(value) => (type = value as AppType)}
    />
  </div>
  <button
    type="button"
    class="inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm hover:bg-muted"
    aria-label={sort === "asc" ? "Sort descending" : "Sort ascending"}
    onclick={() => (sort = sort === "asc" ? "desc" : "asc")}
  >
    {#if sort === "asc"}
      <ArrowUpAZ size={17} />
      Ascending
    {:else}
      <ArrowDownAZ size={17} />
      Descending
    {/if}
  </button>
</div>

<div class="border-t"></div>
<ul class="grid gap-4 pt-4 pb-16 md:grid-cols-2 xl:grid-cols-3">
  {#each filteredApps as app (app.name)}
    {@const Icon = app.icon}
    <li class="rounded-lg border bg-card p-4 transition-shadow hover:shadow-md">
      <div class="mb-8 flex items-center justify-between">
        <div class="grid size-10 place-items-center rounded-lg bg-muted">
          <Icon size={21} />
        </div>
        <button
          type="button"
          class={`inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition ${app.connected ? "border-foreground/20 bg-muted text-foreground hover:bg-accent" : "hover:bg-muted"}`}
          onclick={() => toggleConnection(app.name, app.connected)}
        >
          {#if app.connected}
            <Check size={14} />
          {/if}
          {app.connected ? "Connected" : "Connect"}
        </button>
      </div>
      <h2 class="mb-1 font-semibold">{app.name}</h2>
      <p class="line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
        {app.desc}
      </p>
    </li>
  {:else}
    <li
      class="col-span-full rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground"
    >
      No apps match your filters.
    </li>
  {/each}
</ul>
