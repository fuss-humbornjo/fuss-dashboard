<script lang="ts">
import {
  Activity,
  CreditCard,
  Gauge,
  ListTodo,
  Package,
  Users,
} from "@lucide/svelte";
import PageHeading from "../../components/PageHeading.svelte";

let tab = $state<"overview" | "analytics">("overview");
let range = $state("6m");

const SEGMENTS = 24;

const stats = [
  {
    label: "Total Revenue",
    value: "$45,231",
    suffix: ".89",
    delta: "+20.1%",
    note: "vs last month",
    icon: CreditCard,
    pct: 0.72,
  },
  {
    label: "Subscriptions",
    value: "+2,350",
    suffix: "",
    delta: "+180.1%",
    note: "vs last month",
    icon: Users,
    pct: 0.86,
  },
  {
    label: "Sales",
    value: "+12,234",
    suffix: "",
    delta: "+19%",
    note: "vs last month",
    icon: Activity,
    pct: 0.58,
  },
  {
    label: "Active Now",
    value: "+573",
    suffix: "",
    delta: "+201",
    note: "since last hour",
    icon: Gauge,
    pct: 0.41,
  },
];

const months = [
  { label: "Jan", total: 35, fees: 5 },
  { label: "Feb", total: 52, fees: 8 },
  { label: "Mar", total: 44, fees: 7 },
  { label: "Apr", total: 68, fees: 10 },
  { label: "May", total: 61, fees: 9 },
  { label: "Jun", total: 82, fees: 12 },
  { label: "Jul", total: 74, fees: 11 },
  { label: "Aug", total: 92, fees: 14 },
  { label: "Sep", total: 80, fees: 12 },
  { label: "Oct", total: 96, fees: 14 },
  { label: "Nov", total: 86, fees: 13 },
  { label: "Dec", total: 100, fees: 16 },
];
const visibleMonths = $derived(range === "6m" ? months.slice(-6) : months);

const sales = [
  {
    name: "Olivia Martin",
    email: "olivia@example.com",
    main: "+$1,999",
    cents: ".00",
  },
  {
    name: "Jackson Lee",
    email: "jackson@example.com",
    main: "+$39",
    cents: ".00",
  },
  {
    name: "Isabella Nguyen",
    email: "isabella@example.com",
    main: "+$299",
    cents: ".00",
  },
  {
    name: "William Kim",
    email: "william@example.com",
    main: "+$99",
    cents: ".00",
  },
];
const activity = [
  {
    title: "New task assigned",
    detail: "Sofia assigned a task to Jackson Lee",
    time: "2m ago",
    icon: ListTodo,
  },
  {
    title: "App connected",
    detail: "GitHub was connected to your workspace",
    time: "1h ago",
    icon: Package,
  },
  {
    title: "New member joined",
    detail: "Isabella Nguyen joined the team",
    time: "3h ago",
    icon: Users,
  },
];

const metrics = [
  {
    label: "Total Clicks",
    value: "1,248",
    delta: "+12.4%",
    note: "vs last week",
    good: true,
    pct: 0.64,
  },
  {
    label: "Unique Visitors",
    value: "832",
    delta: "+5.8%",
    note: "vs last week",
    good: true,
    pct: 0.48,
  },
  {
    label: "Bounce Rate",
    value: "42",
    suffix: "%",
    delta: "-3.2%",
    note: "vs last week",
    good: true,
    pct: 0.42,
  },
  {
    label: "Avg. Session",
    value: "3m 24s",
    delta: "-8s",
    note: "vs last week",
    good: false,
    pct: 0.37,
  },
];
const traffic = [
  { label: "Mon", clicks: 72, uniques: 50 },
  { label: "Tue", clicks: 88, uniques: 64 },
  { label: "Wed", clicks: 60, uniques: 46 },
  { label: "Thu", clicks: 94, uniques: 71 },
  { label: "Fri", clicks: 76, uniques: 58 },
  { label: "Sat", clicks: 51, uniques: 38 },
  { label: "Sun", clicks: 83, uniques: 67 },
];
const referrers = [
  { name: "direct", value: 512 },
  { name: "product_hunt", value: 238 },
  { name: "twitter", value: 174 },
  { name: "blog", value: 104 },
];
const devices = [
  { name: "desktop", value: 74 },
  { name: "mobile", value: 22 },
  { name: "tablet", value: 4 },
];

const tabs = [
  { id: "overview", label: "Overview", enabled: true },
  { id: "analytics", label: "Analytics", enabled: true },
  { id: "reports", label: "Reports", enabled: false },
  { id: "notifications", label: "Notifications", enabled: false },
] as const;
</script>

{#snippet dim(text?: string)}
  <span class="text-muted-foreground">{text}</span>
{/snippet}

<PageHeading
  title="Dashboard"
  description="Overview of your workspace and recent activity."
/>

<div class="no-scrollbar mb-6 flex gap-1 overflow-x-auto border-b">
  {#each tabs as item (item.id)}
    <button
      type="button"
      disabled={!item.enabled}
      class={`-mb-px border-b-2 px-3 py-2 font-mono text-[11px] uppercase tracking-wider transition ${tab === item.id ? "border-success text-foreground" : "border-transparent text-muted-foreground"} ${item.enabled ? "hover:text-foreground" : "cursor-not-allowed opacity-60"}`}
      onclick={() => {
        if (item.enabled) tab = item.id as "overview" | "analytics";
      }}
    >
      {item.label}
    </button>
  {/each}
</div>

{#if tab === "analytics"}
  <div class="grid gap-4">
    <div class="rounded-xl border bg-card p-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="font-semibold">Traffic</h2>
          <p class="mt-0.5 font-mono text-[11px] text-muted-foreground">
            weekly clicks · unique visitors
          </p>
        </div>
        <div
          class="flex items-center gap-3 font-mono text-[11px] text-muted-foreground"
        >
          <span class="inline-flex items-center gap-1.5">
            <span class="size-2.5 rounded-[2px] bg-foreground/35"></span>clicks
          </span>
          <span class="inline-flex items-center gap-1.5">
            <span
              class="size-2.5 rounded-[2px] bg-hatch text-foreground/45"
            ></span
            >uniques
          </span>
        </div>
      </div>
      <div class="mt-5 rounded-lg bg-inset p-4">
        <div class="bg-dots flex h-56 items-stretch gap-2 px-1 sm:gap-4">
          {#each traffic as day (day.label)}
            <div class="flex flex-1 flex-col">
              <div class="group flex flex-1 items-end justify-center gap-1">
                <span
                  class="w-1/3 rounded-t-[2px] bg-foreground/25 transition group-hover:bg-foreground/40"
                  style={`height:${day.clicks}%`}
                ></span>
                <span
                  class="w-1/3 rounded-t-[2px] bg-hatch text-foreground/45"
                  style={`height:${day.uniques}%`}
                ></span>
              </div>
              <span
                class="pt-2 text-center font-mono text-[10px] text-muted-foreground"
              >
                {day.label}
              </span>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {#each metrics as metric (metric.label)}
        <div class="rounded-xl border bg-card p-5">
          <p class="text-label text-muted-foreground">{metric.label}</p>
          <div class="mt-3 flex items-baseline gap-2">
            <p class="font-mono text-2xl tracking-tight">
              {metric.value}{@render dim(metric.suffix)}
            </p>
            <span
              class={`rounded-md border px-1.5 py-0.5 font-mono text-[10px] ${metric.good ? "border-success/25 bg-success/10 text-success" : "border-destructive/25 bg-destructive/10 text-destructive"}`}
            >
              {metric.delta}
            </span>
          </div>
          <p class="mt-1 font-mono text-[11px] text-muted-foreground">
            {metric.note}
          </p>
          <div class="mt-4 flex gap-[3px]" aria-hidden="true">
            {#each Array(SEGMENTS) as _, i (i)}
              <span
                class={`h-1.5 flex-1 rounded-[1px] ${i < Math.round(metric.pct * SEGMENTS) ? metric.good ? "bg-success" : "bg-destructive" : "bg-muted"}`}
              ></span>
            {/each}
          </div>
        </div>
      {/each}
    </div>

    <div class="grid gap-4 lg:grid-cols-7">
      <div class="rounded-xl border bg-card p-5 lg:col-span-4">
        <h2 class="font-semibold">Referrers</h2>
        <p class="mt-0.5 font-mono text-[11px] text-muted-foreground">
          top sources · all time
        </p>
        <div class="mt-5 space-y-4">
          {#each referrers as source, i (source.name)}
            <div class="flex items-center gap-3">
              <span class="w-28 font-mono text-[11px] text-muted-foreground">
                {source.name}
              </span>
              <span class="h-1.5 flex-1 overflow-hidden bg-muted">
                <span
                  class={`block h-full bg-hatch ${i === 0 ? "text-success" : "text-muted-foreground"}`}
                  style={`width:${Math.round((source.value / 512) * 100)}%`}
                ></span>
              </span>
              <span class="w-10 text-right font-mono text-[11px]">
                {source.value}
              </span>
            </div>
          {/each}
        </div>
      </div>
      <div class="rounded-xl border bg-card p-5 lg:col-span-3">
        <h2 class="font-semibold">Devices</h2>
        <p class="mt-0.5 font-mono text-[11px] text-muted-foreground">
          sessions · last 30 days
        </p>
        <div class="mt-5 space-y-4">
          {#each devices as device, i (device.name)}
            <div class="flex items-center gap-3">
              <span class="w-20 font-mono text-[11px] text-muted-foreground">
                {device.name}
              </span>
              <span class="h-1.5 flex-1 overflow-hidden bg-muted">
                <span
                  class={`block h-full bg-hatch ${i === 0 ? "text-success" : "text-muted-foreground"}`}
                  style={`width:${device.value}%`}
                ></span>
              </span>
              <span class="w-10 text-right font-mono text-[11px]">
                {device.value}<span class="text-muted-foreground">%</span>
              </span>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
{:else}
  <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    {#each stats as stat (stat.label)}
      {@const Icon = stat.icon}
      <div class="rounded-xl border bg-card p-5">
        <div class="flex items-center justify-between">
          <p class="text-label text-muted-foreground">{stat.label}</p>
          <span
            class="grid size-8 place-items-center rounded-md border border-dashed border-foreground/20 text-muted-foreground"
          >
            <Icon size={14} />
          </span>
        </div>
        <div class="mt-3 flex items-baseline gap-2">
          <p class="font-mono text-2xl tracking-tight">
            {stat.value}{@render dim(stat.suffix)}
          </p>
          <span
            class="rounded-md border border-success/25 bg-success/10 px-1.5 py-0.5 font-mono text-[10px] text-success"
          >
            {stat.delta}
          </span>
        </div>
        <p class="mt-1 font-mono text-[11px] text-muted-foreground">
          {stat.note}
        </p>
        <div class="mt-4 flex gap-[3px]" aria-hidden="true">
          {#each Array(SEGMENTS) as _, i (i)}
            <span
              class={`h-1.5 flex-1 rounded-[1px] ${i < Math.round(stat.pct * SEGMENTS) ? "bg-success" : "bg-muted"}`}
            ></span>
          {/each}
        </div>
      </div>
    {/each}
  </div>

  <div class="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
    <div class="rounded-xl border bg-card p-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="font-semibold">Overview</h2>
          <p class="mt-0.5 font-mono text-[11px] text-muted-foreground">
            monthly revenue ·
            {range === "6m" ? "last 6 months" : "last 12 months"}
          </p>
        </div>
        <div class="flex items-center gap-0.5 rounded-lg border bg-inset p-1">
          {#each ["6m", "12m"] as option (option)}
            <button
              type="button"
              class={`rounded-md px-2.5 py-1 font-mono text-[11px] transition ${range === option ? "bg-accent text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              onclick={() => (range = option)}
            >
              {option}
            </button>
          {/each}
        </div>
      </div>
      <div class="mt-5 rounded-lg bg-inset p-4">
        <div class="bg-dots flex h-52 items-stretch gap-2 px-1 sm:gap-3">
          {#each visibleMonths as month, i (month.label)}
            {@const current = i === visibleMonths.length - 1}
            <div class="flex flex-1 flex-col">
              <div class="group flex flex-1 flex-col justify-end">
                <span
                  class={`w-full rounded-t-[2px] bg-hatch ${current ? "text-success/70" : "text-foreground/40"}`}
                  style={`height:${month.fees}%`}
                ></span>
                <span
                  class={`w-full transition ${current ? "bg-success" : "bg-foreground/25 group-hover:bg-foreground/40"}`}
                  style={`height:${month.total - month.fees}%`}
                ></span>
              </div>
              <span
                class="pt-2 text-center font-mono text-[10px] text-muted-foreground"
              >
                {month.label}
              </span>
            </div>
          {/each}
        </div>
        <div class="mt-4 space-y-1.5 border-t pt-3">
          <div class="flex items-center gap-2 font-mono text-[11px]">
            <span class="size-2.5 rounded-[2px] bg-foreground/35"></span>
            <span class="text-muted-foreground">revenue</span>
            <span class="ml-auto">$45.2k</span>
          </div>
          <div class="flex items-center gap-2 font-mono text-[11px]">
            <span
              class="size-2.5 rounded-[2px] bg-hatch text-foreground/45"
            ></span>
            <span class="text-muted-foreground">fees</span>
            <span class="ml-auto">$6.1k</span>
          </div>
        </div>
      </div>
    </div>

    <div class="rounded-xl border bg-card p-5">
      <h2 class="font-semibold">Recent sales</h2>
      <p class="mt-0.5 font-mono text-[11px] text-muted-foreground">
        265 sales · this month
      </p>
      <div class="mt-4 divide-y">
        {#each sales as sale (sale.email)}
          <div class="flex items-center gap-3 py-3.5 first:pt-1 last:pb-0">
            <div
              class="grid size-9 shrink-0 place-items-center rounded-md border border-dashed border-foreground/20 font-mono text-[11px] text-muted-foreground"
            >
              {sale.name.split(" ").map((part) => part[0]).join("")}
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium">{sale.name}</p>
              <p class="truncate font-mono text-[11px] text-muted-foreground">
                {sale.email}
              </p>
            </div>
            <span class="font-mono text-sm">
              {sale.main}{@render dim(sale.cents)}
            </span>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <div class="mt-4 rounded-xl border bg-card">
    <div class="flex items-center justify-between border-b p-5">
      <div>
        <h2 class="font-semibold">Recent activity</h2>
        <p class="mt-0.5 font-mono text-[11px] text-muted-foreground">
          latest events · workspace
        </p>
      </div>
    </div>
    <div class="divide-y">
      {#each activity as item (item.title)}
        {@const Icon = item.icon}
        <div class="flex items-center gap-4 p-4">
          <span
            class="grid size-9 shrink-0 place-items-center rounded-md border border-dashed border-foreground/20 text-muted-foreground"
          >
            <Icon size={15} />
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium">{item.title}</p>
            <p class="text-xs text-muted-foreground">{item.detail}</p>
          </div>
          <span class="font-mono text-[11px] text-muted-foreground">
            {item.time}
          </span>
        </div>
      {/each}
    </div>
  </div>
{/if}
