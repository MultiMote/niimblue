<script lang="ts">
  import { DataMatrix } from "$/fabric-object/datamatrix";

  interface Props {
    selectedDataMatrix: DataMatrix;
    editRevision: number;
    valueUpdated: () => void;
  }

  let { selectedDataMatrix, editRevision, valueUpdated }: Props = $props();
</script>

<input type="hidden" value={editRevision}>

<textarea
  class="datamatrix-content form-control"
  value={selectedDataMatrix.text}
  oninput={(e) => {
    selectedDataMatrix?.set("text", e.currentTarget.value);
    valueUpdated();
  }}></textarea>

<style>
  .input-group {
    width: fit-content;
  }

  .datamatrix-content {
    height: 100px;
  }
</style>
