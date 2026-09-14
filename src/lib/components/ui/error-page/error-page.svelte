<script lang="ts">
import { onMount } from "svelte";
import * as THREE from "three";

// Presentational error state. Illustrations exist only for 403/404/500/503:
// 401 aliases 403, and any code that cannot be mapped renders as 500.
let {
  errcode,
  message,
  standalone = false,
  compact = false,
  onRetry,
}: {
  errcode: number | string;
  message?: string;
  standalone?: boolean;
  /** In-content placement (under a page's toolbar): shorter stage. */
  compact?: boolean;
  onRetry?: () => void;
} = $props();

const code = $derived.by(() => {
  const n = Number(errcode);
  if (n === 401 || n === 403) return "403";
  if (n === 404 || n === 503) return String(n);
  return "500";
});

// Imported through Vite so the single-file build inlines the illustrations
// as data URIs instead of referencing publicDir paths. Vite normalizes glob
// keys to resolved paths (the $lib alias becomes /src/lib/...), so match by
// file name rather than by the alias spelling.
const illustrations = import.meta.glob<string>("$lib/assets/errors/*.png", {
  eager: true,
  import: "default",
});
const illustration = $derived(
  Object.entries(illustrations).find(([key]) =>
    key.endsWith(`/${code}.png`),
  )?.[1],
);

let canvas = $state<HTMLCanvasElement>();
let stage = $state<HTMLDivElement>();
let webglFailed = $state(false);

// The illustration is a plain textured plane with a gentle float; it binds
// once at mount, so callers that switch codes should key the component.
onMount(() => {
  if (!canvas || !stage || !illustration) return;
  const stageEl = stage;
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
  const texture = new THREE.TextureLoader().load(illustration);
  texture.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({ map: texture, transparent: true }),
  );
  scene.add(mesh);
  const resize = () => {
    const { width, height } = stageEl.getBoundingClientRect();
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
  observer.observe(stageEl);
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

<div
  class={`error-stage box-border grid min-h-0 place-items-center overflow-hidden p-6 ${standalone ? "standalone" : ""} ${compact ? "compact" : ""}`}
>
  <div class="w-full max-w-2xl text-center">
    <div
      bind:this={stage}
      class="mx-auto flex h-72 w-full max-w-4xl items-center justify-center sm:h-96"
    >
      {#if !illustration}
      <!-- no illustration for this code -->
      {:else if webglFailed}
        <img
          src={illustration}
          alt={`Illustration for error ${code}`}
          class="max-h-full max-w-full object-contain"
        >
      {:else}
        <canvas
          bind:this={canvas}
          aria-label={`Illustration for error ${code}`}
          class="h-full w-full"
        ></canvas>
      {/if}
    </div>
    {#if message}
      <p class="mt-2 font-mono text-[11px] text-muted-foreground">{message}</p>
    {/if}
    {#if onRetry}
      <button
        type="button"
        class="mt-4 rounded-md border px-3 py-1.5 font-mono text-[11px] text-muted-foreground transition hover:bg-accent hover:text-foreground"
        onclick={onRetry}
      >
        retry
      </button>
    {/if}
  </div>
</div>

<style>
.error-stage {
  min-height: calc(100dvh - 7rem);
}
.error-stage.standalone {
  min-height: 100dvh;
}
.error-stage.compact {
  min-height: 50dvh;
}
.error-stage canvas {
  transform: translateY(-2rem);
}
</style>
