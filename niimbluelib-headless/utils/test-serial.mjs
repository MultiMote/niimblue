import { NiimbotHeadlessSerialClient, ImageEncoder } from "../dist/index.js";
import { Utils, RequestCommandId, ResponseCommandId } from "@mmote/niimbluelib";
import { createCanvas } from "canvas";

const client = new NiimbotHeadlessSerialClient("COM8");

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

await client.connect();

// label props
const props = {
  width: 240,
  height: 96,
  printDirection: "top",
};

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

await client.abstraction.print(client.getPrintTaskVersion(), image);

await client.disconnect();
