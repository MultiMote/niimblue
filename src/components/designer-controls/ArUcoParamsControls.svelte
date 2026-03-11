<script lang="ts">
  import { ArUcoMarker, type ArUcoDictionary } from "$/fabric-object/aruco";
  import MdIcon from "$/components/basic/MdIcon.svelte";

  interface Props {
    selectedArUco: ArUcoMarker;
    editRevision: number;
    valueUpdated: () => void;
  }

  let { selectedArUco, editRevision, valueUpdated }: Props = $props();

  const dictOptions: { value: ArUcoDictionary; label: string; max: number }[] = [
    { value: "4x4", label: "4x4 (50)", max: 49 },
    { value: "5x5", label: "5x5 (50)", max: 49 },
    { value: "6x6", label: "6x6 (50)", max: 49 },
  ];

  let maxId = $derived(dictOptions.find((d) => d.value === selectedArUco.dictionary)?.max ?? 49);
</script>

<input type="hidden" value={editRevision}>

<div class="input-group input-group-sm flex-nowrap">
  <span class="input-group-text" title="Dictionary">
    <MdIcon icon="grid_on" />
  </span>
  <select
    class="form-select"
    value={selectedArUco.dictionary}
    onchange={(e) => {
      selectedArUco?.set("dictionary", e.currentTarget.value);
      const newMax = dictOptions.find((d) => d.value === e.currentTarget.value)?.max ?? 49;
      if (selectedArUco.markerId > newMax) {
        selectedArUco?.set("markerId", 0);
      }
      valueUpdated();
    }}>
    {#each dictOptions as opt}
      <option value={opt.value}>{opt.label}</option>
    {/each}
  </select>
</div>

<div class="input-group input-group-sm flex-nowrap">
  <span class="input-group-text" title="Marker ID">
    <MdIcon icon="tag" />
  </span>
  <input
    type="number"
    class="form-control"
    min="0"
    max={maxId}
    value={selectedArUco.markerId}
    oninput={(e) => {
      const val = parseInt(e.currentTarget.value);
      if (!isNaN(val) && val >= 0 && val <= maxId) {
        selectedArUco?.set("markerId", val);
        valueUpdated();
      }
    }} />
</div>

<style>
  .input-group {
    width: fit-content;
  }
</style>
