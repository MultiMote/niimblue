<script lang="ts">
  import { toasts, dismiss } from "$lib/toast";

  const kindClass: Record<string, string> = {
    info: "border-border bg-surface-2",
    success: "border-success/40 bg-success/10",
    error: "border-danger/40 bg-danger/10",
    warning: "border-warning/40 bg-warning/10",
  };
</script>

<div class="pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
  {#each $toasts as t (t.id)}
    <div class="pointer-events-auto flex items-start gap-2 rounded-lg border px-3 py-2 text-sm shadow-lg {kindClass[t.kind]}">
      <span class="flex-1">{t.message}</span>
      <button class="text-muted hover:text-white" onclick={() => dismiss(t.id)}>close</button>
    </div>
  {/each}
</div>
