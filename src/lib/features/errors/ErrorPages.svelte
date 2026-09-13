<script lang="ts">
import { onMount } from "svelte";
import * as THREE from "three";
import PageHeading from "../../components/layout/page-heading.svelte";

let {
  path,
  onNavigate,
  standalone = false,
}: {
  path: string;
  onNavigate: (href: string) => void;
  standalone?: boolean;
} = $props();
const page = $derived(
  path === "/errors"
    ? null
    : ({
        "/403": {
          code: "403",
          title: "Access Forbidden",
          detail: "You don't have necessary permission to view this resource.",
        },
        "/errors/forbidden": {
          code: "403",
          title: "Access Forbidden",
          detail: "You don't have necessary permission to view this resource.",
        },
        "/404": {
          code: "404",
          title: "Oops! Page Not Found!",
          detail:
            "It seems like the page you're looking for does not exist or might have been removed.",
        },
        "/errors/not-found": {
          code: "404",
          title: "Oops! Page Not Found!",
          detail:
            "It seems like the page you're looking for does not exist or might have been removed.",
        },
        "/500": {
          code: "500",
          title: "Oops! Something went wrong :')",
          detail: "We apologize for the inconvenience. Please try again later.",
        },
        "/errors/internal-server-error": {
          code: "500",
          title: "Oops! Something went wrong :')",
          detail: "We apologize for the inconvenience. Please try again later.",
        },
        "/503": {
          code: "503",
          title: "Website is under maintenance!",
          detail:
            "The site is not available at the moment. We'll be back online shortly.",
        },
        "/errors/maintenance-error": {
          code: "503",
          title: "Website is under maintenance!",
          detail:
            "The site is not available at the moment. We'll be back online shortly.",
        },
      }[path] ??
        (path.startsWith("/errors/")
          ? {
              code: "404",
              title: "Oops! Page Not Found!",
              detail:
                "It seems like the page you're looking for does not exist or might have been removed.",
            }
          : null)),
);
const errors = [
  { code: "403", title: "Forbidden", href: "/errors/forbidden" },
  { code: "404", title: "Not found", href: "/errors/not-found" },
  { code: "500", title: "Server error", href: "/errors/internal-server-error" },
  { code: "503", title: "Maintenance", href: "/errors/maintenance-error" },
];

let canvas = $state<HTMLCanvasElement>();
let stage = $state<HTMLDivElement>();
let webglFailed = $state(false);
const imageFor = (code: string) =>
  `/errors/${code === "401" ? "403" : code}.png`;

onMount(() => {
  if (!page || !canvas || !stage) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
  } catch {
    // No WebGL — fall back to the static illustration.
    webglFailed = true;
    return;
  }
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.z = 2;
  const geometry = new THREE.PlaneGeometry(2.15, 1.22);
  const texture = new THREE.TextureLoader().load(imageFor(page.code));
  texture.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({ map: texture, transparent: true }),
  );
  scene.add(mesh);
  const resize = () => {
    const { width, height } = stage!.getBoundingClientRect();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height, false);
    const ratio = width / Math.max(height, 1);
    camera.left = -ratio;
    camera.right = ratio;
    camera.top = 1;
    camera.bottom = -1;
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(stage);
  resize();
  let frame = 0;
  const start = performance.now();
  const animate = (now: number) => {
    const elapsed = (now - start) / 1000;
    mesh.rotation.z = reduced ? 0 : Math.sin(elapsed * 1.2) * 0.045;
    mesh.position.y = reduced
      ? 0
      : Math.abs(Math.sin(elapsed * 1.8)) * 0.045 - 0.02;
    renderer.render(scene, camera);
    frame = requestAnimationFrame(animate);
  };
  frame = requestAnimationFrame(animate);
  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    texture.dispose();
    geometry.dispose();
    renderer.dispose();
  };
});
</script>

{#if !page}
  <PageHeading
    title="Error pages"
    description="Preview common error states and recovery paths."
  />
  <div class="grid gap-4 md:grid-cols-3">
    {#each errors as item (item.code)}
      <button
        type="button"
        class="rounded-xl border bg-card p-6 text-center shadow-sm hover:bg-muted/40"
        onclick={() => onNavigate(item.href)}
      >
        <p class="text-4xl font-bold text-primary">{item.code}</p>
        <h2 class="mt-3 font-semibold">{item.title}</h2>
        <p class="mt-1 text-sm text-muted-foreground">
          Preview this error state.
        </p>
      </button>
    {/each}
  </div>
{:else}
  <div
    class={`error-stage box-border grid min-h-0 place-items-center overflow-hidden p-6 ${standalone ? "standalone" : ""}`}
  >
    <div class="w-full max-w-2xl text-center">
      <div
        bind:this={stage}
        class="mx-auto flex h-72 w-full max-w-4xl items-center justify-center sm:h-96"
      >
        {#if webglFailed}
          <img
            src={imageFor(page.code)}
            alt={`Illustration for error ${page.code}`}
            class="max-h-full max-w-full object-contain"
          >
        {:else}
          <canvas
            bind:this={canvas}
            aria-label={`Illustration for error ${page.code}`}
            class="h-full w-full"
          ></canvas>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
.error-stage {
  min-height: calc(100dvh - 7rem);
}
.error-stage.standalone {
  min-height: 100dvh;
}
.error-stage canvas {
  transform: translateY(-2rem);
}
</style>
