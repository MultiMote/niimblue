#!/usr/bin/env node

import { program, Option } from "commander";
import { NiimbotHeadlessSerialClient, NiimbotHeadlessBluetoothClient, ImageEncoder } from "./dist/index.js";
import { Utils, RequestCommandId, ResponseCommandId } from "@mmote/niimbluelib";
import { createCanvas, loadImage } from "canvas";

const initClient = (transport, address, debug) => {
  let client = null;
  if (transport === "serial") {
    client = new NiimbotHeadlessSerialClient(address);
  } else if (transport === "bluetooth") {
    client = new NiimbotHeadlessBluetoothClient(address);
  } else {
    throw new Error("Invalid transport");
  }

  client.addEventListener("printprogress", (e) => {
    console.log(`Page ${e.page}/${e.pagesTotal}, Page print ${e.pagePrintProgress}%, Page feed ${e.pageFeedProgress}%`);
  });

  if (debug) {
    client.addEventListener("packetsent", (e) => {
      console.log(`>> ${Utils.bufToHex(e.packet.toBytes())} (${RequestCommandId[e.packet.command]})`);
    });

    client.addEventListener("packetreceived", (e) => {
      console.log(`<< ${Utils.bufToHex(e.packet.toBytes())} (${ResponseCommandId[e.packet.command]})`);
    });

    client.addEventListener("connect", () => {
      console.log("Connected");
    });

    client.addEventListener("disconnect", () => {
      console.log("Disconnected");
    });
  }

  return client;
};

const printImage = async (path, options) => {
  const image = await loadImage(path);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "white";
  ctx.lineWidth = 3;

  // fill background
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  const encoded = ImageEncoder.encodeCanvas(canvas, options.direction);

  const client = initClient(options.transport, options.address, options.debug);
  await client.connect();
  await client.abstraction.print(client.getPrintTaskVersion(), encoded, {quantity: options.quantity});

  try {
    await client.abstraction.waitUntilPrintFinished(options.quantity);
  } catch (e) {
    console.error(e);
  }
  await client.abstraction.printEnd();
  await client.disconnect();
};

program
  .command("print")
  .description("Prints image")
  .argument("<path>", "Image path")
  .option("-d, --debug", "Debug information")
  .addOption(new Option("-t, --transport <number>", "Transport").makeOptionMandatory().choices(["bluetooth", "serial"]))
  .requiredOption("-a, --address <string>", "Device bluetooth address or serial port name/path")
  .addOption(new Option("-o, --direction <value>", "Print direction").choices(["left", "top"]).default("left"))
  .requiredOption("-q, --quantity <number>", "Quantity", 1)
  .action(printImage);

program.parse();
