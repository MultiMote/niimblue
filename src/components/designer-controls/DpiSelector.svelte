<script lang="ts">
  import { tr } from "$/utils/i18n";
  import { DPI_DPMM } from "$/defaults";

  interface Props {
    value: number;
  }

  let { value = $bindable() }: Props = $props();
</script>

<div class="input-group flex-nowrap input-group-sm mb-2">
  <span class="input-group-text">{$tr("params.label.head_density")}</span>

  <select class="form-select" bind:value>
    <option value={DPI_DPMM[203]}>203dpi</option>
    <option value={DPI_DPMM[300]}>300dpi</option>
  </select>

  <input class="form-control" type="number" min="1" bind:value />

  <span class="input-group-text cursor-help" title={$tr("params.label.head_density.help")}>
    {$tr("params.label.dpmm")}
  </span>
</div>
