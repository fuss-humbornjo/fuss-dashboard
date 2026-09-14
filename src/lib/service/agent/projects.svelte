<script lang="ts">
import {
  Activity,
  Calendar,
  CalendarClock,
  Database,
  Folder,
  Hash,
  Lightbulb,
  LoaderCircle,
  MessagesSquare,
  Plug,
  Plus,
  RefreshCw,
  ScrollText,
  Sparkles,
  SquarePen,
  Variable,
} from "@lucide/svelte";
import {
  createInfiniteQuery,
  createMutation,
  createQuery,
  useQueryClient,
} from "@tanstack/svelte-query";
import { withBase } from "../../base";
import {
  type Breadcrumb,
  featureCrumbs,
} from "../../components/layout/breadcrumbs.svelte";
import { Button } from "../../components/ui/button";
import { CloakedText, cloak } from "../../components/ui/cloaked-text";
import { ErrorPage } from "../../components/ui/error-page";
import { Input } from "../../components/ui/input";
import ConfigForm from "../../package/agent/config-form.svelte";
import { errorStatus } from "../rpc";
import {
  type AgentConfig,
  configChanges,
  createProject,
  createSession,
  findProject,
  getSession,
  listProjects,
  listSessions,
  type Project,
  type Session,
  updateProject,
  updateSession,
} from "./api";

let { path, onNavigate }: { path: string; onNavigate: (path: string) => void } =
  $props();
// App keys this route by pathname, so the parsed ids stay constant per mount.
const parts = path.split("/").filter(Boolean);
const projectId = parts[1] ?? "";
const sessionId = parts[2] === "sessions" ? (parts[3] ?? "") : "";
const settings = parts.at(-1) === "config";
const creating = projectId === "new";
const projectPath = `/projects/${encodeURIComponent(projectId)}`;

// Unnamed projects and sessions cloak loud — uppercase, no ellipsis.
const cloakName = (id: string) =>
  cloak(id, 6, "end", { ellipsis: false, uppercase: true });

const queryClient = useQueryClient();

const projectsQuery = createInfiniteQuery(() => ({
  queryKey: ["agent", "projects"],
  queryFn: ({ pageParam }) => listProjects({ page_token: pageParam }),
  initialPageParam: "",
  getNextPageParam: (last) => last.next_page_token || undefined,
  enabled: !projectId,
}));

// Stays enabled on session routes too: the breadcrumb shows the project name.
const projectQuery = createQuery(() => ({
  queryKey: ["agent", "projects", projectId],
  queryFn: () => findProject({ id: projectId }),
  enabled: !!projectId && !creating,
}));

const sessionsQuery = createInfiniteQuery(() => ({
  queryKey: ["agent", "sessions", projectId],
  queryFn: ({ pageParam }) =>
    listSessions({ project_id: projectId, page_token: pageParam }),
  initialPageParam: "",
  getNextPageParam: (last) => last.next_page_token || undefined,
  enabled: !!projectId && !creating && !sessionId && !settings,
}));

const sessionQuery = createQuery(() => ({
  queryKey: ["agent", "session", sessionId],
  queryFn: async () => {
    const result = await getSession({ session_id: sessionId });
    if (result.project_id !== projectId)
      throw new Error("This session does not belong to this project.");
    return result;
  },
  enabled: !!sessionId,
}));

const projects = $derived(
  projectsQuery.data?.pages.flatMap((page) => page.projects) ?? [],
);
const project = $derived(projectQuery.data ?? null);
const sessions = $derived(
  sessionsQuery.data?.pages.flatMap((page) => page.sessions) ?? [],
);
const session = $derived(sessionQuery.data ?? null);

// Publish route crumbs so the header breadcrumb replaces the old back button.
const projectCrumbs = $derived.by((): Breadcrumb[] | null => {
  if (!projectId) return null;
  const root: Breadcrumb = { label: "Projects", href: "/projects" };
  if (creating) return [root, { label: "New project" }];
  const self: Breadcrumb = {
    label: project?.name || cloakName(projectId),
    href: projectPath,
  };
  if (!sessionId) {
    return settings
      ? [root, self, { label: "Configuration" }]
      : [root, { label: self.label }];
  }
  const sessionPath = `${projectPath}/sessions/${encodeURIComponent(sessionId)}`;
  const sess: Breadcrumb = {
    label: session?.name || cloakName(sessionId),
    href: sessionPath,
  };
  return settings
    ? [root, self, sess, { label: "Configuration" }]
    : [root, self, { label: sess.label }];
});

$effect(() => {
  featureCrumbs.current = projectCrumbs;
  return () => {
    featureCrumbs.current = null;
  };
});

let notice = $state("");
let query = $state("");
let newName = $state("");
let source = $state("dashboard");
let externalId = $state("");
let showCreateSession = $state(false);

const filteredProjects = $derived(
  projects.filter((item) =>
    `${item.name} ${item.source} ${item.id}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  ),
);
const filteredSessions = $derived(
  sessions.filter((item) =>
    `${item.name ?? ""} ${item.id}`.toLowerCase().includes(query.toLowerCase()),
  ),
);
const shownItems = $derived(projectId ? filteredSessions : filteredProjects);
const title = $derived(
  creating
    ? "New project"
    : sessionId
      ? session?.name || cloakName(sessionId)
      : projectId
        ? project?.name || cloakName(projectId)
        : "PROJECTS",
);
const pending = $derived(
  creating
    ? false
    : sessionId
      ? sessionQuery.isPending
      : settings
        ? projectQuery.isPending
        : projectId
          ? sessionsQuery.isPending
          : projectsQuery.isPending,
);
const refreshing = $derived(
  projectsQuery.isFetching ||
    projectQuery.isFetching ||
    sessionsQuery.isFetching ||
    sessionQuery.isFetching,
);
const queryError = $derived(
  sessionId
    ? sessionQuery.error
    : settings
      ? projectQuery.error
      : projectId
        ? (sessionsQuery.error ?? projectQuery.error)
        : projectsQuery.error,
);

const date = (value: string) =>
  value ? new Date(value).toLocaleString() : "—";
const day = (value: string) =>
  value ? new Date(value).toLocaleDateString() : "—";
const clock = (value: string) =>
  value ? new Date(value).toLocaleTimeString() : "—";
const relative = (value: string) => {
  if (!value) return "—";
  const seconds = (Date.now() - new Date(value).getTime()) / 1000;
  if (seconds < 60) return "just now";
  const minutes = seconds / 60;
  if (minutes < 60) return `${Math.floor(minutes)}m ago`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  const days = hours / 24;
  if (days < 30) return `${Math.floor(days)}d ago`;
  return day(value);
};
const preview = (text?: string) =>
  (text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean) || "Not set";
const chars = (text?: string) => (text?.trim() ? `${text.length} chars` : "—");
const count = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"}`;
const message = (cause: unknown) =>
  cause instanceof Error ? cause.message : "Unable to reach Fuss.";

function refresh() {
  queryClient.invalidateQueries({ queryKey: ["agent"] });
}

function retry() {
  if (sessionId) sessionQuery.refetch();
  else if (settings) projectQuery.refetch();
  else if (projectId) {
    projectQuery.refetch();
    sessionsQuery.refetch();
  } else projectsQuery.refetch();
}

const createProjectMutation = createMutation(() => ({
  mutationFn: createProject,
  onSuccess: (created) => {
    queryClient.invalidateQueries({ queryKey: ["agent", "projects"] });
    onNavigate(`/projects/${encodeURIComponent(created.id)}`);
  },
}));

function submitProject(event: SubmitEvent) {
  event.preventDefault();
  createProjectMutation.mutate({
    name: newName.trim(),
    source: source.trim(),
    ...(externalId.trim() ? { external_id: externalId.trim() } : {}),
  });
}

const createSessionMutation = createMutation(() => ({
  mutationFn: (name?: string) =>
    createSession({ project_id: projectId, ...(name ? { name } : {}) }),
  onSuccess: (created) => {
    queryClient.invalidateQueries({
      queryKey: ["agent", "sessions", projectId],
    });
    onNavigate(`${projectPath}/sessions/${encodeURIComponent(created.id)}`);
  },
}));

function submitSession(event: SubmitEvent) {
  event.preventDefault();
  const name = newName.trim();
  createSessionMutation.mutate(name ? name : undefined);
}

const saveSessionMutation = createMutation(() => ({
  mutationFn: ({ snapshot, masks }: { snapshot: Session; masks: string[] }) =>
    updateSession({ session: snapshot, update_masks: masks }),
  onSuccess: async (updated) => {
    // Read the durable snapshot back before confirming the save.
    await queryClient.invalidateQueries({
      queryKey: ["agent", "session", updated.id],
    });
    notice = "Configuration saved.";
  },
}));

async function saveSession(name: string, config: AgentConfig): Promise<void> {
  if (!session) return;
  notice = "";
  const masks = configChanges(session.config, config);
  if (name !== (session.name ?? "")) masks.push("name");
  if (!masks.length) {
    notice = "No changes to save.";
    return;
  }
  await saveSessionMutation.mutateAsync({
    snapshot: { ...session, name, config },
    masks,
  });
}

const saveProjectMutation = createMutation(() => ({
  mutationFn: ({ snapshot, masks }: { snapshot: Project; masks: string[] }) =>
    updateProject({ project: snapshot, update_masks: masks }),
  onSuccess: async () => {
    // Read the durable snapshot back before confirming the save; the
    // projects key covers both the list and the detail queries.
    await queryClient.invalidateQueries({ queryKey: ["agent", "projects"] });
    notice = "Configuration saved.";
  },
}));

async function saveProject(name: string, config: AgentConfig): Promise<void> {
  if (!project) return;
  notice = "";
  const masks = configChanges(project.config, config);
  if (name !== project.name) masks.push("name");
  if (!masks.length) {
    notice = "No changes to save.";
    return;
  }
  await saveProjectMutation.mutateAsync({
    snapshot: { ...project, name, config },
    masks,
  });
}
</script>

<div class="space-y-6">
  <div class="flex min-h-9 flex-wrap items-end justify-between gap-3">
    <div class="flex min-w-0 flex-1 flex-wrap items-end gap-x-3 gap-y-1">
      <h1 class="break-words text-3xl leading-none font-bold">{title}</h1>
      {#if projectId && !creating}
        <p class="font-mono text-xs text-muted-foreground">
          <CloakedText text={sessionId || projectId} marker="**" copyable />
        </p>
      {/if}
    </div>
    <div class="flex items-center gap-2">
      {#if projectId && !creating && !sessionId && !settings}
        <Button
          variant="outline"
          size="icon"
          title="Project configuration"
          aria-label="Project configuration"
          onclick={() => onNavigate(`${projectPath}/config`)}
          ><SquarePen size={18} /></Button
        >
      {/if}
      {#if !creating && (sessionId || settings)}
        <Button
          variant="outline"
          size="icon"
          title="Refresh"
          aria-label="Refresh"
          disabled={refreshing}
          onclick={refresh}
          ><RefreshCw
            size={16}
            class={refreshing ? "animate-spin" : ""}
          /></Button
        >
      {/if}
    </div>
  </div>

  {#if createProjectMutation.error || createSessionMutation.error}
    <div
      role="alert"
      class="flex flex-wrap items-center gap-3 border-l-2 border-destructive pl-4 text-sm text-destructive"
    >
      <p>
        {message(createProjectMutation.error ?? createSessionMutation.error)}
      </p>
    </div>
  {/if}
  {#if notice}
    <p role="status" class="text-sm text-muted-foreground">{notice}</p>
  {/if}

  {#if creating}
    <form class="max-w-xl space-y-5" onsubmit={submitProject}>
      <div class="grid gap-2">
        <label for="project-name" class="text-sm font-medium"
          >Project name</label
        ><Input
          id="project-name"
          bind:value={newName}
          required
          pattern=".*\S.*"
        />
      </div>
      <div class="grid gap-2">
        <label for="project-source" class="text-sm font-medium">Source</label>
        <Input
          id="project-source"
          bind:value={source}
          required
          pattern=".*\S.*"
        />
      </div>
      <div class="grid gap-2">
        <label for="external-id" class="text-sm font-medium"
          >External ID (optional)</label
        ><Input id="external-id" bind:value={externalId} />
      </div>
      <Button type="submit" disabled={createProjectMutation.isPending}
        ><Plus size={16} />
        {createProjectMutation.isPending
          ? "Creating…"
          : "Create project"}</Button
      >
    </form>
  {:else if queryError && (sessionId || settings)}
    <ErrorPage
      compact
      errcode={errorStatus(queryError)}
      message={message(queryError)}
      onRetry={retry}
    />
  {:else if pending && !projects.length && !sessions.length && !session && !project}
    <div
      role="status"
      class="flex min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground"
    >
      <LoaderCircle class="animate-spin" size={18} />Loading…
    </div>
  {:else if settings}
    {#if session}
      {#key session}
        <ConfigForm
          name={session.name ?? ""}
          config={session.config}
          onSave={saveSession}
        />
      {/key}
    {:else if !sessionId}
      {#if project}
        {#key project}
          <ConfigForm
            name={project.name}
            config={project.config}
            onSave={saveProject}
          />
        {/key}
      {:else}
        <p class="text-sm text-muted-foreground">
          Project configuration is unavailable.
        </p>
      {/if}
    {/if}
  {:else if session}
    {@const stats = [
      { icon: Activity, label: "Last activity", value: relative(session.last_activity_at), note: date(session.last_activity_at) },
      { icon: Calendar, label: "Created", value: day(session.created_at), note: clock(session.created_at) },
      { icon: CalendarClock, label: "Updated", value: day(session.updated_at), note: clock(session.updated_at) },
      { icon: Hash, label: "Revision", value: `#${session.revision}`, note: `next sequence ${session.next_sequence}` },
    ]}
    {@const envs = session.config.envs ?? []}
    {@const mcps = session.config.mcps ?? []}
    {@const skills = session.config.skills ?? []}
    {@const configRows = [
      { icon: ScrollText, label: "System prompt", detail: preview(session.config.system_prompt), meta: chars(session.config.system_prompt) },
      { icon: Lightbulb, label: "Hint prompt", detail: preview(session.config.hint_prompt), meta: chars(session.config.hint_prompt) },
      { icon: Database, label: "Storage key", detail: session.config.storage_key || "Not set", meta: "" },
      { icon: Variable, label: "Environment variables", detail: envs.map((line) => line.split("=")[0]).join(", ") || "None configured", meta: count(envs.length, "key") },
      { icon: Plug, label: "MCP servers", detail: mcps.map((server) => server.name).join(", ") || "None configured", meta: count(mcps.length, "server") },
      { icon: Sparkles, label: "Skills", detail: skills.map((skill) => skill.name).join(", ") || "None configured", meta: count(skills.length, "skill") },
    ]}
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
          <p class="mt-3 font-mono text-2xl tracking-tight">{stat.value}</p>
          <p class="mt-1 font-mono text-[11px] text-muted-foreground">
            {stat.note}
          </p>
        </div>
      {/each}
    </div>

    <div class="mt-4 rounded-xl border bg-card">
      <div class="flex items-center justify-between border-b p-5">
        <div>
          <h2 class="font-semibold">Configuration</h2>
          <p class="mt-0.5 font-mono text-[11px] text-muted-foreground">
            current snapshot · revision {session.revision}
          </p>
        </div>
        <button
          type="button"
          class="rounded-md border px-3 py-1.5 font-mono text-[11px] text-muted-foreground transition hover:bg-accent hover:text-foreground"
          onclick={() => onNavigate(`${projectPath}/sessions/${encodeURIComponent(sessionId)}/config`)}
        >
          edit
        </button>
      </div>
      <div class="divide-y">
        {#each configRows as row (row.label)}
          {@const Icon = row.icon}
          <div class="flex items-center gap-4 p-4">
            <span
              class="grid size-9 shrink-0 place-items-center rounded-md border border-dashed border-foreground/20 text-muted-foreground"
            >
              <Icon size={15} />
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium">{row.label}</p>
              <p class="truncate text-xs text-muted-foreground">{row.detail}</p>
            </div>
            {#if row.meta}
              <span
                class="shrink-0 font-mono text-[11px] text-muted-foreground"
              >
                {row.meta}
              </span>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {:else if !sessionId}
    {#if showCreateSession}
      <form
        class="flex max-w-xl flex-wrap items-end gap-3 border-b pb-6"
        onsubmit={submitSession}
      >
        <div class="grid min-w-0 flex-1 gap-2">
          <label for="session-name" class="text-sm font-medium"
            >Session name (optional)</label
          ><Input id="session-name" bind:value={newName} />
        </div>
        <Button type="submit" disabled={createSessionMutation.isPending}
          ><Plus size={16} />
          {createSessionMutation.isPending
            ? "Creating…"
            : "Create session"}</Button
        >
      </form>
    {/if}
    <div class="space-y-3">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div class="w-full sm:max-w-xs">
          <Input
            aria-label={projectId ? "Search sessions" : "Search projects"}
            placeholder={projectId ? "Search sessions…" : "Search projects…"}
            bind:value={query}
          />
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            title="Refresh"
            aria-label="Refresh"
            disabled={refreshing}
            onclick={refresh}
            ><RefreshCw
              size={16}
              class={refreshing ? "animate-spin" : ""}
            /></Button
          >
          {#if projectId}
            <Button
              variant="outline"
              size="icon"
              title="New session"
              aria-label="New session"
              onclick={() => (showCreateSession = !showCreateSession)}
              ><Plus size={16} /></Button
            >
          {:else}
            <Button
              variant="outline"
              size="icon"
              title="New project"
              aria-label="New project"
              onclick={() => onNavigate("/projects/new")}
              ><Plus size={16} /></Button
            >
          {/if}
        </div>
      </div>
      {#if queryError}
        <ErrorPage
          compact
          errcode={errorStatus(queryError)}
          message={message(queryError)}
          onRetry={retry}
        />
      {:else}
        <div class="border bg-card">
          <div class="divide-y">
            {#each shownItems as item (item.id)}
              {@const href = projectId ? `${projectPath}/sessions/${encodeURIComponent(item.id)}` : `/projects/${encodeURIComponent(item.id)}`}
              {@const RowIcon = projectId ? MessagesSquare : Folder}
              {@const label = item.name || cloakName(item.id)}
              <div
                class="flex items-center gap-4 p-4 transition hover:bg-muted/40"
              >
                <span
                  class="grid size-9 shrink-0 place-items-center rounded-md border border-dashed border-foreground/20 text-muted-foreground"
                >
                  <RowIcon size={15} />
                </span>
                <a
                  class="group min-w-0 flex-1"
                  href={withBase(href)}
                  onclick={(event) => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && event.button === 0) { event.preventDefault(); onNavigate(href); } }}
                >
                  <p class="truncate text-sm font-medium group-hover:underline">
                    {#if item.name}
                      {item.name}
                    {:else}
                      <CloakedText text={item.id} ellipsis={false} uppercase />
                    {/if}
                  </p>
                  <p
                    class="truncate font-mono text-[11px] text-muted-foreground"
                  >
                    {item.id}
                  </p>
                </a>
                {#if "source" in item}
                  <span
                    class="hidden shrink-0 rounded-md border border-foreground/15 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:block"
                  >
                    {item.source}
                  </span>
                {:else}
                  <span
                    class="hidden w-20 shrink-0 text-right font-mono text-[11px] text-muted-foreground sm:block"
                    title={date(item.last_activity_at)}
                  >
                    {relative(item.last_activity_at)}
                  </span>
                {/if}
                <span
                  class="hidden w-20 shrink-0 text-right font-mono text-[11px] text-muted-foreground md:block"
                  title={date(item.updated_at)}
                >
                  {day(item.updated_at)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  title={`Configure ${label}`}
                  aria-label={`Configure ${label}`}
                  onclick={() => onNavigate(`${href}/config`)}
                  ><SquarePen size={16} /></Button
                >
              </div>
            {/each}
            {#if !shownItems.length}
              <p class="py-12 text-center text-sm text-muted-foreground">
                {query ? "No matching results." : projectId ? "No sessions yet." : "No projects yet."}
              </p>
            {/if}
          </div>
        </div>
      {/if}
    </div>
    {@const listQuery = projectId ? sessionsQuery : projectsQuery}
    {#if listQuery.hasNextPage}
      <Button
        variant="outline"
        disabled={listQuery.isFetchingNextPage}
        onclick={() => listQuery.fetchNextPage()}
        >{listQuery.isFetchingNextPage ? "Loading…" : "Load more"}</Button
      >
    {/if}
  {/if}
</div>
