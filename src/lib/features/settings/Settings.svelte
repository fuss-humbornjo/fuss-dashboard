<script lang="ts">
import {
  AppWindow,
  Bell,
  Palette,
  Settings as SettingsIcon,
  UserCog,
} from "@lucide/svelte";
import LanguageCombobox from "../../components/LanguageCombobox.svelte";
import PageHeading from "../../components/PageHeading.svelte";
import { Checkbox } from "../../components/ui/checkbox/index.js";
import {
  RadioGroup,
  RadioGroupItem,
} from "../../components/ui/radio-group/index.js";
import { SelectSimple as Select } from "../../components/ui/select/index.js";
import { Switch } from "../../components/ui/switch/index.js";

let {
  path,
  onNavigate,
  onSetDark,
}: {
  path: string;
  onNavigate: (href: string) => void;
  onSetDark: (value: boolean) => void;
} = $props();

const items = [
  { label: "Profile", href: "/settings", icon: UserCog },
  { label: "Account", href: "/settings/account", icon: SettingsIcon },
  { label: "Appearance", href: "/settings/appearance", icon: Palette },
  { label: "Notifications", href: "/settings/notifications", icon: Bell },
  { label: "Display", href: "/settings/display", icon: AppWindow },
];
const sectionCopy: Record<string, { title: string; description: string }> = {
  "/settings": {
    title: "Profile",
    description: "This is how others will see you on the site.",
  },
  "/settings/account": {
    title: "Account",
    description:
      "Update your account settings. Set your preferred language and timezone.",
  },
  "/settings/appearance": {
    title: "Appearance",
    description: "Customize the look and feel of the dashboard.",
  },
  "/settings/notifications": {
    title: "Notifications",
    description: "Configure how you receive notifications.",
  },
  "/settings/display": {
    title: "Display",
    description: "Turn items on or off to control what's displayed in the app.",
  },
};

let username = $state("shadcn");
let email = $state("m@example.com");
let bio = $state("I own a computer.");
let urls = $state(["https://shadcn.com", "http://twitter.com/shadcn"]);
let accountName = $state("");
let language = $state("");
let font = $state("inter");
let selectedTheme = $state<"light" | "dark">("light");
let notificationType = $state("mentions");
let communicationEmails = $state(false);
let marketingEmails = $state(false);
let socialEmails = $state(true);
let mobileNotifications = $state(false);
let displayItems = $state(["recents", "home"]);
let saved = $state("");

const current = $derived(sectionCopy[path] ?? sectionCopy["/settings"]);
const fieldClass =
  "h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring";

const toggleDisplayItem = (value: string, checked: boolean) => {
  displayItems = checked
    ? [...displayItems, value]
    : displayItems.filter((item) => item !== value);
};

const save = (label: string) => {
  if (path === "/settings/appearance") onSetDark(selectedTheme === "dark");
  saved = `${label} updated.`;
};
</script>

<PageHeading
  title="Settings"
  description="Manage your account settings and set e-mail preferences."
/>
<div class="grid gap-10 lg:grid-cols-[200px_minmax(0,1fr)]">
  <div class="grid gap-2 lg:hidden">
    <span class="sr-only">Settings section</span>
    <Select
      ariaLabel="Settings section"
      value={path}
      options={items.map((item) => ({ label: item.label, value: item.href }))}
      class="w-full"
      triggerClass={fieldClass}
      onChange={onNavigate}
    />
  </div>
  <nav class="hidden gap-1 overflow-x-auto lg:flex lg:flex-col">
    {#each items as item (item.href)}
      {@const Icon = item.icon}
      <button
        type="button"
        class={`flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm ${path === item.href ? "bg-muted font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
        onclick={() => { saved = ""; onNavigate(item.href); }}
      >
        <Icon size={16} />{item.label}
      </button>
    {/each}
  </nav>

  <section class="max-w-2xl">
    <div>
      <h2 class="text-lg font-medium">{current.title}</h2>
      <p class="mt-1 text-sm text-muted-foreground">{current.description}</p>
    </div>
    <div class="my-6 border-t"></div>

    {#if path === "/settings/account"}
      <form
        class="space-y-8"
        onsubmit={(event) => { event.preventDefault(); save("Account"); }}
      >
        <div class="grid gap-2">
          <label for="account-name" class="text-sm font-medium">Name</label>
          <input
            id="account-name"
            class={fieldClass}
            placeholder="Your name"
            bind:value={accountName}
          >
          <p class="text-sm text-muted-foreground">
            This is the name that will be displayed on your profile and in
            emails.
          </p>
        </div>
        <div class="grid gap-2">
          <label for="language" class="text-sm font-medium">Language</label>
          <LanguageCombobox
            id="language"
            value={language}
            options={[{ label: "English", value: "en" }, { label: "French", value: "fr" }, { label: "German", value: "de" }, { label: "Spanish", value: "es" }, { label: "Portuguese", value: "pt" }, { label: "Russian", value: "ru" }, { label: "Japanese", value: "ja" }, { label: "Korean", value: "ko" }, { label: "Chinese", value: "zh" }]}
            onChange={(value) => (language = value)}
          />
          <p class="text-sm text-muted-foreground">
            This is the language that will be used in the dashboard.
          </p>
        </div>
        <button
          class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          type="submit"
        >
          Update account
        </button>
      </form>
    {:else if path === "/settings/appearance"}
      <form
        class="space-y-8"
        onsubmit={(event) => { event.preventDefault(); save("Preferences"); }}
      >
        <div class="grid gap-2">
          <label for="font" class="text-sm font-medium">Font</label>
          <Select
            id="font"
            ariaLabel="Font"
            value={font}
            options={["inter", "manrope", "system"].map((item) => ({ label: item, value: item }))}
            class="w-50"
            triggerClass="capitalize"
            onChange={(value) => (font = value)}
          />
          <p class="text-sm text-muted-foreground">
            Set the font you want to use in the dashboard.
          </p>
        </div>
        <div class="grid gap-2">
          <label
            class="flex items-center gap-2 text-sm leading-none font-medium select-none"
            for="theme-light"
            >Theme</label
          >
          <p class="text-sm text-muted-foreground">
            Select the theme for the dashboard.
          </p>
          <RadioGroup
            name="theme"
            value={selectedTheme}
            onValueChange={(value) => {
              if (value === "light" || value === "dark") selectedTheme = value;
            }}
            class="grid max-w-md grid-cols-2 gap-8 pt-2"
          >
            {#each [{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }] as theme (theme.value)}
              <div class="grid gap-2">
                <label
                  class="flex items-center gap-2 text-sm leading-none font-medium select-none [&:has([data-state=checked])>div]:border-primary"
                  for={`theme-${theme.value}`}
                >
                  <RadioGroupItem
                    id={`theme-${theme.value}`}
                    value={theme.value}
                    class="sr-only !absolute"
                  />
                  <div
                    class={`items-center rounded-md border-2 p-1 ${theme.value === "dark" ? "bg-popover hover:bg-accent hover:text-accent-foreground" : "hover:border-accent"} ${selectedTheme === theme.value ? "border-primary" : "border-muted"}`}
                  >
                    <div
                      class={`space-y-2 rounded-sm p-2 ${theme.value === "light" ? "bg-[#ecedef]" : "bg-slate-950"}`}
                    >
                      <div
                        class={`space-y-2 rounded-md p-2 shadow-xs ${theme.value === "light" ? "bg-white" : "bg-slate-800"}`}
                      >
                        <div
                          class={`h-2 w-20 rounded-lg ${theme.value === "light" ? "bg-[#ecedef]" : "bg-slate-400"}`}
                        ></div>
                        <div
                          class={`h-2 w-25 rounded-lg ${theme.value === "light" ? "bg-[#ecedef]" : "bg-slate-400"}`}
                        ></div>
                      </div>
                      {#each [1, 2] as row (row)}
                        <div
                          class={`flex items-center space-x-2 rounded-md p-2 shadow-xs ${theme.value === "light" ? "bg-white" : "bg-slate-800"}`}
                        >
                          <div
                            class={`h-4 w-4 rounded-full ${theme.value === "light" ? "bg-[#ecedef]" : "bg-slate-400"}`}
                          ></div>
                          <div
                            class={`h-2 w-25 rounded-lg ${theme.value === "light" ? "bg-[#ecedef]" : "bg-slate-400"}`}
                          ></div>
                        </div>
                      {/each}
                    </div>
                  </div>
                  <span class="block w-full p-2 text-center font-normal"
                    >{theme.label}</span
                  >
                </label>
              </div>
            {/each}
          </RadioGroup>
        </div>
        <button
          class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          type="submit"
        >
          Update preferences
        </button>
      </form>
    {:else if path === "/settings/notifications"}
      <form
        class="space-y-8"
        onsubmit={(event) => { event.preventDefault(); save("Notifications"); }}
      >
        <div class="grid gap-2 relative space-y-3">
          <label
            class="flex items-center gap-2 text-sm leading-none font-medium select-none"
            for="notification-type"
          >
            Notify me about...
          </label>
          <RadioGroup
            id="notification-type"
            value={notificationType}
            onValueChange={(value) => (notificationType = value)}
          >
            {#each [{value:"all",label:"All new messages"},{value:"mentions",label:"Direct messages and mentions"},{value:"none",label:"Nothing"}] as item (item.value)}
              <div data-slot="form-item" class="flex items-center gap-2">
                <RadioGroupItem
                  id={`notification-type-${item.value}`}
                  value={item.value}
                />
                <label
                  for={`notification-type-${item.value}`}
                  class="flex items-center gap-2 text-sm leading-none select-none font-normal"
                >
                  {item.label}
                </label>
              </div>
            {/each}
          </RadioGroup>
        </div>
        <div>
          <h3 class="mb-4 text-lg font-medium">Email Notifications</h3>
          <div class="space-y-4">
            {#each [
              {key:"communication",label:"Communication emails",description:"Receive emails about your account activity."},
              {key:"marketing",label:"Marketing emails",description:"Receive emails about new products, features, and more."},
              {key:"social",label:"Social emails",description:"Receive emails for friend requests, follows, and more."},
              {key:"security",label:"Security emails",description:"Receive emails about your account activity and security."}
            ] as item (item.key)}
              {@const checked = item.key === "communication" ? communicationEmails : item.key === "marketing" ? marketingEmails : item.key === "social" ? socialEmails : true}
              <div
                class="flex flex-row items-center justify-between gap-2 rounded-lg border p-4"
              >
                <div class="space-y-0.5">
                  <label
                    class="flex items-center gap-2 text-base font-medium select-none"
                    for={`notification-${item.key}`}
                  >
                    {item.label}
                  </label>
                  <p class="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <Switch
                  id={`notification-${item.key}`}
                  aria-label={item.label}
                  {checked}
                  disabled={item.key === "security"}
                  onCheckedChange={(next) => {
                    if (item.key === "communication") communicationEmails = next;
                    else if (item.key === "marketing") marketingEmails = next;
                    else if (item.key === "social") socialEmails = next;
                  }}
                />
              </div>
            {/each}
          </div>
        </div>
        <label class="flex items-start gap-2 text-sm"
          ><input
            class="mt-1"
            type="checkbox"
            bind:checked={mobileNotifications}
          ><span
            ><span class="font-medium"
              >Use different settings for my mobile devices</span
            ><span class="mt-1 block text-muted-foreground"
              >You can manage your mobile notifications in the mobile settings
              page.</span
            ></span
          ></label
        >
        <button
          class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          type="submit"
        >
          Update notifications
        </button>
      </form>
    {:else if path === "/settings/display"}
      <form
        class="space-y-8"
        onsubmit={(event) => { event.preventDefault(); save("Display"); }}
      >
        <div class="grid gap-2">
          <div class="mb-4">
            <span class="flex items-center gap-2 text-base font-medium">
              Sidebar
            </span>
            <p class="text-sm text-muted-foreground">
              Select the items you want to display in the sidebar.
            </p>
          </div>
          {#each [{value:"recents",label:"Recents"},{value:"home",label:"Home"},{value:"applications",label:"Applications"},{value:"desktop",label:"Desktop"},{value:"downloads",label:"Downloads"},{value:"documents",label:"Documents"}] as item (item.value)}
            {@const checked = displayItems.includes(item.value)}
            <div class="flex flex-row items-start gap-2">
              <Checkbox
                id={`display-${item.value}`}
                {checked}
                onCheckedChange={(next) =>
                  toggleDisplayItem(item.value, next)}
              />
              <label
                for={`display-${item.value}`}
                class="flex items-center gap-2 text-sm leading-none font-normal"
              >
                {item.label}
              </label>
            </div>
          {/each}
        </div>
        <button
          class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          type="submit"
        >
          Update display
        </button>
      </form>
    {:else}
      <form
        class="space-y-8"
        onsubmit={(event) => { event.preventDefault(); save("Profile"); }}
      >
        <div class="grid gap-2">
          <label for="username" class="text-sm font-medium">Username</label>
          <input
            id="username"
            class={fieldClass}
            placeholder="shadcn"
            bind:value={username}
          >
          <p class="text-sm text-muted-foreground">
            This is your public display name. You can only change this once
            every 30 days.
          </p>
        </div>
        <div class="grid gap-2">
          <label for="profile-email" class="text-sm font-medium">Email</label>
          <Select
            id="profile-email"
            ariaLabel="Profile email"
            value={email}
            options={["m@example.com", "m@google.com", "m@support.com"].map((item) => ({ label: item, value: item }))}
            triggerClass={fieldClass}
            onChange={(value) => (email = value)}
          />
          <p class="text-sm text-muted-foreground">
            Select a verified email address to display.
          </p>
        </div>
        <div class="grid gap-2">
          <label for="bio" class="text-sm font-medium">Bio</label>
          <textarea
            id="bio"
            class="min-h-24 rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            bind:value={bio}
          ></textarea>
          <p class="text-sm text-muted-foreground">
            You can @mention other users and organizations to link to them.
          </p>
        </div>
        <div class="grid gap-2">
          <p class="text-sm font-medium">URLs</p>
          <p class="text-sm text-muted-foreground">
            Add links to your website, blog, or social media profiles.
          </p>
          {#each urls as url, index (index)}
            <input
              class={fieldClass}
              aria-label={`URL ${index + 1}`}
              bind:value={urls[index]}
            >
          {/each}
          <button
            type="button"
            class="w-fit rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
            onclick={() => (urls = [...urls, ""])}
          >
            Add URL
          </button>
        </div>
        <button
          class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          type="submit"
        >
          Update profile
        </button>
      </form>
    {/if}

    {#if saved}
      <p class="mt-5 text-sm font-medium text-muted-foreground" role="status">
        {saved}
      </p>
    {/if}
  </section>
</div>
