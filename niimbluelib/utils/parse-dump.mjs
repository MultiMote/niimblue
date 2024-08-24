import { Utils, NiimbotPacket, RequestCommandId, ResponseCommandId } from "../dist/index.js";
import { spawn } from "child_process";

const TSHARK_PATH = "C:\\Program Files\\Wireshark\\tshark.exe";

if (process.argv.length < 4 || !["usb", "ble"].includes(process.argv[2])) {
  console.error("usage: yarn parse-dump <ble|usb> <filename> [min|min-out]");
}

const capType = process.argv[2];
const capPath = process.argv[3];
const args = ["-2", "-r", capPath, "-P", "-T", "fields", "-e", /*"frame.time_relative"*/ "frame.time_delta"];
const display = process.argv.length > 4 ? process.argv[4] : "";

if (capType === "ble") {
  args.push("-R", "btspp.data", "-e", "hci_h4.direction", "-e", "btspp.data");
} else {
  args.push("-R", "usb.capdata", "-e", "usb.dst", "-e", "usb.capdata");
}

const spawned = spawn(TSHARK_PATH, args);

let output = "";

spawned.stdout.on("data", (data) => {
  output += data.toString();
});

spawned.stderr.on("data", (data) => {
  console.error(data);
});

spawned.on("close", (code) => {
  console.log(`child process exited with code ${code}`);

  if (code !== 0) {
    console.error(output);
    return;
  }

  const lines = output.split(/\r?\n/);
  let printStarted = false;

  for (const line of lines) {
    const splitted = line.split("\t");

    if (splitted.length !== 3) {
      continue;
    }

    let [time, direction, hexData] = splitted;
    direction = ["host", "0x01"].includes(direction) ? "<<" : ">>";

    let comment = "";

    try {
      const data = Utils.hexToBuf(hexData);
      const packets = NiimbotPacket.fromBytesMultiPacket(data);

      if (packets.length === 0) {
        comment = "Parse error (no packets found)";
      } else if (packets.length > 1) {
        comment = `Multi-packet (x${packets.length}); `;
      }

      for (const packet of packets) {
        if (direction === ">>") {
          comment += RequestCommandId[packet.command] ?? "???";
          if (packet.command === RequestCommandId.PrintStart) {
            printStarted = true;
            const versions = { 1: "v1", 2: "v3", 7: "v4", 8: "v5" };
            comment += "_" + versions[packet.dataLength];
          } else if (packet.command === RequestCommandId.SetPageSize) {
            const versions = { 2: "v1", 4: "v2", 6: "v3", 8: "v5" };
            comment += "_" + versions[packet.dataLength];
          }else if (packet.command === RequestCommandId.PrintEnd) {
            printStarted = false;
          }
        } else {
          comment += ResponseCommandId[packet.command] ?? "???";
        }
        comment += `(${packet.dataLength}); `;
      }
    } catch (e) {
      comment = "Invalid packet";
    }

    if (display === "min") {
        console.log(`${direction} ${comment}`);
    } else if (display === "min-out") {
      if (direction === ">>") {
        console.log(`${direction} ${comment}`);
      }
    } else if (display === "print-task") {
      if (direction === ">>" && printStarted) {
        console.log(`${direction} ${comment}`);
      }
    } else {
      console.log(`[${time}] ${direction} ${hexData}\t// ${comment}`);
    }
  }
});
