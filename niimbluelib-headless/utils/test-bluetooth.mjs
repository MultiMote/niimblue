import { NiimbotHeadlessBluetoothClient, ImageEncoder } from "../dist/index.js";
import { Utils, RequestCommandId, ResponseCommandId } from "@mmote/niimbluelib";
import { createCanvas } from "canvas";

// found device: B1-G327071185 with address 07:27:03:17:6E:82
// found device: D110-G326030306 with address 03:26:03:C3:F9:11

const client = new NiimbotHeadlessBluetoothClient("03:26:03:C3:F9:11"); // D110

client.addEventListener("packetsent", (e) => {
  console.log(`>> ${Utils.bufToHex(e.packet.toBytes())} (${RequestCommandId[e.packet.command]})`);
});

client.addEventListener("packetreceived", (e) => {
  console.log(`<< ${Utils.bufToHex(e.packet.toBytes())} (${ResponseCommandId[e.packet.command]})`);
});

client.addEventListener("connect", () => {
  console.log("connected");
});

client.addEventListener("disconnect", () => {
  console.log("disconnected");
});

client.addEventListener("printprogress", (e) => {
  console.log(`Page ${e.page}/${e.pagesTotal}, Page print ${e.pagePrintProgress}%, Page feed ${e.pageFeedProgress}%`);
});

await client.connect();

// label props
const props = {
  width: 240,
  height: 96,
  printDirection: "left",
};
const quantity = 1;

const canvas = createCanvas(props.width, props.height);
const ctx = canvas.getContext("2d");

ctx.fillStyle = "white";
ctx.lineWidth = 3;

// fill background
ctx.fillRect(0, 0, canvas.width, canvas.height);
// draw diagonal line
ctx.beginPath();
ctx.moveTo(0, 0);
ctx.lineTo(canvas.width, canvas.height);
ctx.stroke();
// draw border
ctx.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);

const image = ImageEncoder.encodeCanvas(canvas, props.printDirection);

await client.abstraction.print(client.getPrintTaskVersion(), image, { quantity });

try {
  await client.abstraction.waitUntilPrintFinished(quantity);
} catch (e) {
  console.error(e);
}

await client.abstraction.printEnd();
await client.disconnect();
