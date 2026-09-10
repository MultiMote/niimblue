<script lang="ts">
  import { labelProps, setLabelSize } from "$lib/label";
  import { PAPER_TEMPLATES } from "$lib/paper";

  let canvasEl = $state<HTMLCanvasElement>();
  let ctx = $state<CanvasRenderingContext2D | null>(null);

  const draw = () => {
    if (!canvasEl || !ctx) return;
    const { width, height } = $labelProps.size;
    canvasEl.width = width;
    canvasEl.height = height;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, width - 1, height - 1);
  };

  $effect(() => {
    if (canvasEl) ctx = canvasEl.getContext("2d");
    draw();
  });

  $effect(() => {
    $labelProps.size;
    draw();
  });
</script>

<div class="flex h-full flex-col">
  <div class="flex shrink-0 items-center gap-3 border-b border-border bg-surface-1 px-4 py-2 text-sm text-muted">
    <span>{$labelProps.size.width} x {$labelProps.size.height} px</span>
    <span class="text-border">|</span>
    <span>{$labelProps.printDirection === "left" ? "feeds left-first" : "feeds top-first"}</span>
    <div class="ml-auto">
      <select
        class="rounded-md border border-border bg-surface-2 px-2 py-1 text-xs"
        onchange={(e) => {
          const idx = Number((e.target as HTMLSelectElement).value);
          const t = PAPER_TEMPLATES[idx];
          if (t) setLabelSize(t);
        }}
      >
        <option value={-1} selected>Choose paper...</option>
        {#each PAPER_TEMPLATES as t, i (t.title)}
          <option value={i}>{t.title} ({t.widthMm}x{t.continuous ? "var" : `${t.heightMm}`}mm)</option>
        {/each}
      </select>
    </div>
  </div>

  <div class="flex min-h-0 flex-1 items-center justify-center overflow-auto p-8">
    <canvas bind:this={canvasEl} class="shadow-2xl" style="image-rendering: pixelated; max-width: 90%; max-height: 90%;"></canvas>
  </div>
</div>
