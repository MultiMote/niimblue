<script lang="ts">
  import * as fabric from "fabric";
  import { tr } from "../../utils/i18n";
  import QRCode from "../../fabric-object/qrcode";
  import Barcode from "../../fabric-object/barcode";
  import MdIcon from "../basic/MdIcon.svelte";

  export let selectedObject: fabric.FabricObject;
  export let valueUpdated: () => void;

  const insertDateTime = (format?: string) => {
    let value = "{dt}";
    if (format) {
      value = `{dt|${format}}`;
    }

    if (selectedObject instanceof fabric.IText) {
      selectedObject.exitEditing();
      selectedObject.set({ text: `${selectedObject.text}${value}` });
    } else if (selectedObject instanceof QRCode) {
      selectedObject.set({ text: `${selectedObject.text}${value}` });
    } else if (selectedObject instanceof Barcode) {
      selectedObject.set({ text: `${selectedObject.text}${value}` });
    }

    valueUpdated();
  };
</script>

<div class="btn-group btn-group-sm" role="group" title={$tr("params.variables.insert")}>
  <button class="btn btn-sm btn-secondary dropdown-toggle" data-bs-toggle="dropdown" data-bs-auto-close="outside">
    <MdIcon icon="data_object" />
  </button>

  <div class="dropdown-menu px-2">
    <div class="d-flex gap-1 flex-wrap">
      <button class="btn btn-secondary btn-sm" on:click={() => insertDateTime()}>
        <MdIcon icon="calendar_today" />
        {$tr("params.variables.insert.datetime")}
      </button>
      <button class="btn btn-secondary btn-sm" on:click={() => insertDateTime("YYYY-MM-DD")}>
        <MdIcon icon="calendar_today" />
        {$tr("params.variables.insert.date")}
      </button>
      <button class="btn btn-secondary btn-sm" on:click={() => insertDateTime("HH:mm:ss")}>
        <MdIcon icon="schedule" />
        {$tr("params.variables.insert.time")}
      </button>
    </div>
  </div>
</div>
