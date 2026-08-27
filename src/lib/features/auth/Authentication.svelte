<script lang="ts">
import {
  Code2,
  LoaderCircle,
  LogIn,
  ShieldCheck,
  UserPlus,
  Users,
} from "@lucide/svelte";

let {
  path,
  dark = false,
  onNavigate,
}: {
  path: string;
  dark?: boolean;
  onNavigate: (href: string) => void;
} = $props();

let email = $state("");
let password = $state("");
let confirmation = $state("");
let otp = $state("");
let loading = $state(false);
let submitted = $state(false);
let error = $state("");

const isGallery = $derived(path === "/auth");
const isClerk = $derived(path.startsWith("/clerk/"));
const isTwoColumn = $derived(path === "/sign-in-2");
const isSignUp = $derived(path.endsWith("sign-up"));
const isForgot = $derived(path === "/forgot-password");
const isOtp = $derived(path === "/otp");
const isSignIn = $derived(!isSignUp && !isForgot && !isOtp);
const title = $derived(
  isSignUp
    ? "Create an account"
    : isForgot
      ? "Forgot Password"
      : isOtp
        ? "Two-factor Authentication"
        : "Sign in",
);
const description = $derived(
  isSignUp
    ? "Enter your email and password to create an account."
    : isForgot
      ? "Enter your registered email and we will send you a link to reset your password."
      : isOtp
        ? "Please enter the authentication code. We have sent it to your email."
        : "Enter your email and password below to log into your account.",
);

const finishSubmit = () => {
  loading = false;
  if (isForgot) {
    submitted = false;
    onNavigate("/otp");
  } else if (isOtp) {
    onNavigate("/");
  } else if (isSignIn) {
    onNavigate(isClerk ? "/clerk/user-management" : "/");
  } else {
    submitted = true;
  }
};

const submit = () => {
  error = "";
  if (!isOtp && !email.includes("@")) error = "Please enter your email.";
  else if ((isSignIn || isSignUp) && password.length < 7)
    error = "Password must be at least 7 characters long.";
  else if (isSignUp && password !== confirmation)
    error = "Passwords don't match.";
  else if (isOtp && otp.length !== 6) error = "Please enter the 6-digit code.";
  else {
    loading = true;
    window.setTimeout(finishSubmit, 650);
  }
};
</script>

{#snippet brand()}
  <div class="mb-6 flex items-center justify-center gap-2">
    <div
      class="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground"
    >
      <ShieldCheck size={17} />
    </div>
    <span class="text-lg font-medium"
      >Shadcn Admin{isClerk ? " · Clerk" : ""}</span
    >
  </div>
{/snippet}

{#snippet authForm()}
  {#if submitted}
    <div
      class="rounded-md bg-muted p-4 text-center text-sm text-foreground"
      role="status"
    >
      Account created for {email}.
    </div>
  {:else}
    <form
      class="grid gap-3"
      onsubmit={(event) => { event.preventDefault(); submit(); }}
    >
      {#if !isOtp}
        <label class="grid gap-2 text-sm font-medium">
          Email
          <input
            type="email"
            bind:value={email}
            placeholder="name@example.com"
            class="h-10 rounded-md border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring"
          >
        </label>
      {/if}

      {#if isOtp}
        <label class="grid gap-2 text-sm font-medium">
          One-Time Password
          <input
            inputmode="numeric"
            maxlength="6"
            bind:value={otp}
            placeholder="123456"
            class="h-11 rounded-md border bg-background px-3 text-center font-mono text-lg tracking-[0.45em] outline-none focus:ring-2 focus:ring-ring"
          >
        </label>
      {:else if !isForgot}
        <label class="relative grid gap-2 text-sm font-medium">
          Password
          <input
            type="password"
            bind:value={password}
            placeholder="********"
            class="h-10 rounded-md border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring"
          >
          {#if isSignIn}
            <button
              type="button"
              class="absolute right-0 top-0 text-xs text-muted-foreground hover:text-foreground"
              onclick={() => onNavigate("/forgot-password")}
            >
              Forgot password?
            </button>
          {/if}
        </label>
      {/if}

      {#if isSignUp}
        <label class="grid gap-2 text-sm font-medium">
          Confirm Password
          <input
            type="password"
            bind:value={confirmation}
            placeholder="********"
            class="h-10 rounded-md border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring"
          >
        </label>
      {/if}

      {#if error}
        <p class="text-sm text-destructive" role="alert">{error}</p>
      {/if}

      <button
        type="submit"
        disabled={loading}
        class="mt-2 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        {#if loading}
          <LoaderCircle class="animate-spin" size={17} />
        {:else if isSignUp}
          <UserPlus size={17} />
        {:else}
          <LogIn size={17} />
        {/if}
        {isSignUp ? "Create Account" : isForgot ? "Continue" : isOtp ? "Verify" : "Sign in"}
      </button>

      {#if isSignIn || isSignUp}
        <div class="relative my-2">
          <div class="absolute inset-0 flex items-center">
            <span class="w-full border-t"></span>
          </div>
          <div class="relative flex justify-center text-xs uppercase">
            <span class="bg-card px-2 text-muted-foreground"
              >Or continue with</span
            >
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={loading}
            class="inline-flex h-9 items-center justify-center gap-2 rounded-md border text-sm hover:bg-muted disabled:opacity-60"
          >
            <Code2 size={15} />
            GitHub
          </button>
          <button
            type="button"
            disabled={loading}
            class="inline-flex h-9 items-center justify-center gap-2 rounded-md border text-sm hover:bg-muted disabled:opacity-60"
          >
            <Users size={15} />
            Facebook
          </button>
        </div>
      {/if}
    </form>
  {/if}
{/snippet}

{#snippet footer()}
  <p class="mt-6 text-center text-sm text-muted-foreground">
    {#if isSignIn}
      Don't have an account?
      <button
        type="button"
        class="underline underline-offset-4 hover:text-primary"
        onclick={() => onNavigate(isClerk ? "/clerk/sign-up" : "/sign-up")}
      >
        Sign Up
      </button>
    {:else if isSignUp}
      Already have an account?
      <button
        type="button"
        class="underline underline-offset-4 hover:text-primary"
        onclick={() => onNavigate(isClerk ? "/clerk/sign-in" : "/sign-in")}
      >
        Sign In
      </button>
    {:else if isForgot}
      Don't have an account?
      <button
        type="button"
        class="underline underline-offset-4 hover:text-primary"
        onclick={() => onNavigate("/sign-up")}
      >
        Sign up
      </button
      >.
    {:else}
      Haven't received it?
      <button
        type="button"
        class="underline underline-offset-4 hover:text-primary"
        onclick={() => (otp = "")}
      >
        Resend a new code.
      </button>
    {/if}
  </p>
  {#if isSignIn || isSignUp}
    <p class="mt-5 text-center text-xs leading-5 text-muted-foreground">
      By {isSignUp ? "creating an account" : "clicking sign in"}, you agree to
      our
      <button type="button" class="underline underline-offset-4">
        Terms of Service
      </button>
      and
      <button type="button" class="underline underline-offset-4">
        Privacy Policy
      </button
      >.
    </p>
  {/if}
{/snippet}

{#if isGallery}
  <div class="mx-auto max-w-5xl px-4 py-12">
    <div class="mb-8 text-center">
      {@render brand()}
      <h1 class="text-2xl font-bold tracking-tight">Authentication</h1>
      <p class="mt-2 text-sm text-muted-foreground">
        Preview the authentication flows included in the admin dashboard.
      </p>
    </div>
    <div class="grid gap-4 md:grid-cols-3">
      {#each [{title:"Sign in",detail:"Welcome back to your account.",href:"/sign-in"},{title:"Sign up",detail:"Create a new workspace account.",href:"/sign-up"},{title:"Forgot password",detail:"Recover access securely.",href:"/forgot-password"}] as item (item.title)}
        <div class="rounded-xl border bg-card p-6 shadow-sm">
          <ShieldCheck size={22} class="text-primary" />
          <h2 class="mt-4 font-semibold">{item.title}</h2>
          <p class="mt-1 text-sm text-muted-foreground">{item.detail}</p>
          <button
            type="button"
            class="mt-5 h-9 rounded-md border px-3 text-sm hover:bg-muted"
            onclick={() => onNavigate(item.href)}
          >
            Open flow
          </button>
        </div>
      {/each}
    </div>
  </div>
{:else if isTwoColumn}
  <div class="grid min-h-screen lg:grid-cols-2">
    <div class="grid place-items-center p-6 sm:p-10">
      <div class="w-full max-w-sm">
        {@render brand()}
        <div class="mb-5">
          <h1 class="text-lg font-semibold">{title}</h1>
          <p class="mt-2 text-sm leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
        {@render authForm()}
        {@render footer()}
      </div>
    </div>
    <div class="relative hidden overflow-hidden bg-muted lg:block">
      <img
        class="absolute left-20 top-[15%] h-full w-full select-none object-cover object-left-top"
        src={dark ? "/dashboard-dark.png" : "/dashboard-light.png"}
        alt="Shadcn Admin dashboard preview"
      >
    </div>
  </div>
{:else}
  <div class="grid min-h-screen place-items-center p-4">
    <div class="w-full max-w-sm">
      {@render brand()}
      <div class="rounded-xl border bg-card shadow-sm">
        <div class="p-6 pb-4">
          <h1 class="text-lg font-semibold tracking-tight">{title}</h1>
          <p class="mt-2 text-sm leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
        <div class="px-6 pb-6">{@render authForm()}</div>
        <div class="border-t px-6 py-5">{@render footer()}</div>
      </div>
    </div>
  </div>
{/if}
