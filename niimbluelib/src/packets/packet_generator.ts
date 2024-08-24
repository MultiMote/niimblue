import {
  AutoShutdownTime,
  HeartbeatType,
  LabelType,
  NiimbotPacket,
  PrinterInfoType,
  RequestCommandId,
  ResponseCommandId,
  SoundSettingsItemType,
  SoundSettingsType,
  ProtocolVersion,
} from ".";
import { EncodedImage, ImageEncoder, ImageRow as ImagePart } from "../image_encoder";
import { Utils } from "../utils";

export type PrintOptions = {
  labelType?: LabelType;
  density?: number;
  quantity?: number;
};

export class PacketGenerator {
  public static generic(
    requestId: RequestCommandId,
    data: Uint8Array | number[],
    responseIds: ResponseCommandId[] = []
  ): NiimbotPacket {
    return new NiimbotPacket(requestId, data, responseIds);
  }

  public static connect(): NiimbotPacket {
    return new NiimbotPacket(RequestCommandId.Connect, [1], [ResponseCommandId.In_Connect]);
  }

  public static getPrinterStatusData(): NiimbotPacket {
    return new NiimbotPacket(RequestCommandId.PrinterStatusData, [1], [ResponseCommandId.In_PrinterStatusData]);
  }

  public static rfidInfo(): NiimbotPacket {
    return new NiimbotPacket(RequestCommandId.RfidInfo, [1], [ResponseCommandId.In_RfidInfo]);
  }

  public static setAutoShutDownTime(time: AutoShutdownTime): NiimbotPacket {
    return new NiimbotPacket(RequestCommandId.SetAutoShutdownTime, [time], [ResponseCommandId.In_SetAutoShutdownTime]);
  }

  public static getPrinterInfo(type: PrinterInfoType): NiimbotPacket {
    return new NiimbotPacket(
      RequestCommandId.PrinterInfo,
      [type],
      [
        ResponseCommandId.In_PrinterInfoArea,
        ResponseCommandId.In_PrinterInfoAutoShutDownTime,
        ResponseCommandId.In_PrinterInfoBluetoothAddress,
        ResponseCommandId.In_PrinterInfoChargeLevel,
        ResponseCommandId.In_PrinterInfoDensity,
        ResponseCommandId.In_PrinterInfoHardWareVersion,
        ResponseCommandId.In_PrinterInfoLabelType,
        ResponseCommandId.In_PrinterInfoLanguage,
        ResponseCommandId.In_PrinterInfoPrinterCode,
        ResponseCommandId.In_PrinterInfoSerialNumber,
        ResponseCommandId.In_PrinterInfoSoftWareVersion,
        ResponseCommandId.In_PrinterInfoSpeed,
      ]
    );
  }

  public static setSoundSettings(soundType: SoundSettingsItemType, on: boolean): NiimbotPacket {
    return new NiimbotPacket(
      RequestCommandId.SoundSettings,
      [SoundSettingsType.SetSound, soundType, on ? 1 : 0],
      [ResponseCommandId.In_SoundSettings]
    );
  }

  public static getSoundSettings(soundType: SoundSettingsItemType): NiimbotPacket {
    return new NiimbotPacket(
      RequestCommandId.SoundSettings,
      [SoundSettingsType.GetSoundState, soundType, 1],
      [ResponseCommandId.In_SoundSettings]
    );
  }

  public static heartbeat(type: HeartbeatType): NiimbotPacket {
    return new NiimbotPacket(
      RequestCommandId.Heartbeat,
      [type],
      [
        ResponseCommandId.In_HeartbeatBasic,
        ResponseCommandId.In_HeartbeatUnknown,
        ResponseCommandId.In_HeartbeatAdvanced1,
        ResponseCommandId.In_HeartbeatAdvanced2,
      ]
    );
  }

  public static setDensity(value: number): NiimbotPacket {
    return new NiimbotPacket(RequestCommandId.SetDensity, [value], [ResponseCommandId.In_SetDensity]);
  }

  public static setLabelType(value: number): NiimbotPacket {
    return new NiimbotPacket(RequestCommandId.SetLabelType, [value], [ResponseCommandId.In_SetLabelType]);
  }

  public static setPageSizeV1(rows: number): NiimbotPacket {
    return new NiimbotPacket(
      RequestCommandId.SetPageSize,
      [...Utils.u16ToBytes(rows)],
      [ResponseCommandId.In_SetPageSize]
    );
  }

  /**
   * B1 behavior: strange, first print is blank or printer prints many copies (use {@link setPageSizeV2} instead)
   *
   * D110 behavior: ordinary.
   *
   * @param rows Height in pixels
   * @param cols Width in pixels
   */
  public static setPageSizeV2(rows: number, cols: number): NiimbotPacket {
    return new NiimbotPacket(
      RequestCommandId.SetPageSize,
      [...Utils.u16ToBytes(rows), ...Utils.u16ToBytes(cols)],
      [ResponseCommandId.In_SetPageSize]
    );
  }

  /**
   * @param rows Height in pixels
   * @param cols Width in pixels
   * @param copiesCount Page instances
   */
  public static setPageSizeV3(rows: number, cols: number, copiesCount: number): NiimbotPacket {
    return new NiimbotPacket(
      RequestCommandId.SetPageSize,
      [...Utils.u16ToBytes(rows), ...Utils.u16ToBytes(cols), ...Utils.u16ToBytes(copiesCount)],
      [ResponseCommandId.In_SetPageSize]
    );
  }

  public static setPageSizeV5(rows: number, cols: number, copiesCount: number, someSize: number): NiimbotPacket {
    return new NiimbotPacket(
      RequestCommandId.SetPageSize,
      [
        ...Utils.u16ToBytes(rows),
        ...Utils.u16ToBytes(cols),
        ...Utils.u16ToBytes(copiesCount),
        ...Utils.u16ToBytes(someSize),
      ],
      [ResponseCommandId.In_SetPageSize]
    );
  }

  public static setPrintQuantity(quantity: number): NiimbotPacket {
    const [h, l] = Utils.u16ToBytes(quantity);
    return new NiimbotPacket(RequestCommandId.PrintQuantity, [h, l]);
  }

  public static printStatus(): NiimbotPacket {
    return new NiimbotPacket(
      RequestCommandId.PrintStatus,
      [1],
      [ResponseCommandId.In_PrintStatus, ResponseCommandId.In_PrintError]
    );
  }
  public static printerReset(): NiimbotPacket {
    return new NiimbotPacket(RequestCommandId.PrinterReset, [1], [ResponseCommandId.In_PrinterReset]);
  }

  /**
   * B1 behavior: after {@link pageEnd} paper stops at printhead position, on {@link printEnd} paper moved further.
   *
   * D110 behavior: ordinary.
   * */
  public static printStart(): NiimbotPacket {
    return new NiimbotPacket(RequestCommandId.PrintStart, [1], [ResponseCommandId.In_PrintStart]);
  }

  public static printStartV3(totalPages: number): NiimbotPacket {
    return new NiimbotPacket(
      RequestCommandId.PrintStart,
      [...Utils.u16ToBytes(totalPages)],
      [ResponseCommandId.In_PrintStart]
    );
  }

  // 5555 01 07 -- 00 01 00 00 00 00 00 -- 07aaaa
  /**
   * B1 behavior: when {@link totalPages} > 1 after {@link pageEnd} paper stops at printhead position and waits for next page.
   * When last page ({@link totalPages}) printed paper moved further.
   *
   * D110 behavior: ordinary.
   *
   * @param totalPages Declare how many pages will be printed
   */
  public static printStartV4(totalPages: number, pageColor: number = 0): NiimbotPacket {
    return new NiimbotPacket(
      RequestCommandId.PrintStart,
      [...Utils.u16ToBytes(totalPages), 0x00, 0x00, 0x00, 0x00, pageColor],
      [ResponseCommandId.In_PrintStart]
    );
  }

  public static printStartV5(totalPages: number, pageColor: number = 0, quality: number = 0): NiimbotPacket {
    return new NiimbotPacket(
      RequestCommandId.PrintStart,
      [...Utils.u16ToBytes(totalPages), 0x00, 0x00, 0x00, 0x00, pageColor, quality],
      [ResponseCommandId.In_PrintStart]
    );
  }

  public static printEnd(): NiimbotPacket {
    return new NiimbotPacket(RequestCommandId.PrintEnd, [1], [ResponseCommandId.In_PrintEnd]);
  }
  public static pageStart(): NiimbotPacket {
    return new NiimbotPacket(RequestCommandId.PageStart, [1], [ResponseCommandId.In_PageStart]);
  }
  public static pageEnd(): NiimbotPacket {
    return new NiimbotPacket(RequestCommandId.PageEnd, [1], [ResponseCommandId.In_PageEnd]);
  }

  public static printEmptySpace(pos: number, repeats: number): NiimbotPacket {
    const packet = new NiimbotPacket(RequestCommandId.PrintEmptyRow, [...Utils.u16ToBytes(pos), repeats]);
    packet.oneWay = true;
    return packet;
  }

  public static printBitmapRow(pos: number, repeats: number, data: Uint8Array): NiimbotPacket {
    const blackPixelCount: number = Utils.countSetBits(data);

    const packet = new NiimbotPacket(RequestCommandId.PrintBitmapRow, [
      ...Utils.u16ToBytes(pos),
      // Black pixel count. Not sure what role it plays in printing.
      // There is two formats of this part
      // 1. <count> <count> <count> (sum must equals number of pixels, every number calculated by algorithm based on printhead resolution)
      // 2. <0> <countH> <countL> (big endian)
      0,
      ...Utils.u16ToBytes(blackPixelCount),
      repeats,
      ...data,
    ]);
    packet.oneWay = true;
    return packet;
  }

  /** Printer powers off if black pixel count > 6 */
  public static printBitmapRowIndexed(pos: number, repeats: number, data: Uint8Array): NiimbotPacket {
    const blackPixelCount: number = Utils.countSetBits(data);
    const indexes: Uint8Array = ImageEncoder.indexPixels(data);

    if (blackPixelCount > 6) {
      throw new Error(`Black pixel count > 6 (${blackPixelCount})`);
    }

    const packet = new NiimbotPacket(RequestCommandId.PrintBitmapRowIndexed, [
      ...Utils.u16ToBytes(pos),
      0,
      ...Utils.u16ToBytes(blackPixelCount),
      repeats,
      ...indexes,
    ]);

    packet.oneWay = true;
    return packet;
  }

  public static printClear(): NiimbotPacket {
    return new NiimbotPacket(RequestCommandId.PrintClear, [1]);
  }

  public static writeRfid(data: Uint8Array): NiimbotPacket {
    return new NiimbotPacket(RequestCommandId.WriteRFID, data);
  }

  public static writeImageData(image: EncodedImage): NiimbotPacket[] {
    return image.rowsData.map((p: ImagePart) => {
      if (p.dataType === "pixels") {
        if (p.blackPixelsCount > 6) {
          return PacketGenerator.printBitmapRow(p.rowNumber, p.repeat, p.rowData!);
        } else {
          return PacketGenerator.printBitmapRowIndexed(p.rowNumber, p.repeat, p.rowData!);
        }
      } else {
        return PacketGenerator.printEmptySpace(p.rowNumber, p.repeat);
      }
    });
  }

  /*
    D110 print process example (square, 240x96)

    SetLabelType              55 55 23 01 01 23 aa aa
    SetDensity                55 55 21 01 03 23 aa aa
    PrintStart                55 55 01 01 01 01 aa aa
    PrintClear                55 55 20 01 01 20 aa aa
    PageStart                 55 55 03 01 01 03 aa aa
    SetPageSize               55 55 13 04 00 f0 00 60 87 aa aa
    PrintQuantity             55 55 15 02 00 01 16 aa aa
    PrintEmptySpace           55 55 84 03 00 00 52 d5 aa aa
    PrintBitmapRows           55 55 85 12  00 52  18 20 18  04  00 ff ff ff ff ff ff ff ff ff ff 00 e1 aa aa
    PrintBitmapRows           55 55 85 12  00 56  04 00 04  48  00 f0 00 00 00 00 00 00 00 00 0f 00 76 aa aa
    PrintBitmapRows           55 55 85 12  00 9e  18 20 18  04  00 ff ff ff ff ff ff ff ff ff ff 00 2d aa aa
    PrintEmptySpace           55 55 84 03 00 a2 26 03 aa aa
    PrintEmptySpace           55 55 84 03 00 c8 28 67 aa aa
    PageEnd                   55 55 e3 01 01 e3 aa aa
    PrintStatus               55 55 a3 01 01 a3 aa aa       (alot)
    PrintEnd                  55 55 f3 01 01 f3 aa aa


    You should send PrintEnd manually after this sequence (after print finished)
  */
  public static generatePrintSequenceV3(image: EncodedImage, options?: PrintOptions): NiimbotPacket[] {
    return [
      PacketGenerator.setLabelType(options?.labelType ?? LabelType.WithGaps),
      PacketGenerator.setDensity(options?.density ?? 2),
      PacketGenerator.printStart(),
      PacketGenerator.printClear(),
      PacketGenerator.pageStart(),
      PacketGenerator.setPageSizeV2(image.rows, image.cols),
      PacketGenerator.setPrintQuantity(options?.quantity ?? 1),
      ...PacketGenerator.writeImageData(image),
      PacketGenerator.pageEnd(),
    ];
  }

  /*
    B1 print process example (square in square, 160x240)

    SetDensity        5555 21 01 02 22aaaa
    SetLabelType      5555 23 01 01 23aaaa
    PrintStart        5555 01 07 00010000000000 07aaaa
    PageStart         5555 03 01 01 03aaaa
    SetPageSize       5555 13 06 00a000f00001 44aaaa
    PrintEmptyRows    5555 84 03 00001d 9aaaaa
    PrintBitmapRows   5555 85 24 001d 3e3000 04 000000000000003ffffffffffffffffffffffffffffffff0000000000000 86aaaa
    PrintBitmapRows   5555 85 24 0021 b83000 21 000000000000003c000000000000000000000000000000f0000000000000 e5aaaa
    PrintBitmapRows   5555 85 24 0042 9e3000 04 000000000000003c000000000007fffffe000000000000f0000000000000 7caaaa
    PrintBitmapRows   5555 85 24 0046 b03000 14 000000000000003c00000000000780001e000000000000f0000000000000 26aaaa
    PrintBitmapRows   5555 85 24 005a 9e3000 04 000000000000003c000000000007fffffe000000000000f0000000000000 64aaaa
    PrintBitmapRows   5555 85 24 005e b83000 23 000000000000003c000000000000000000000000000000f0000000000000 98aaaa
    PrintBitmapRows   5555 85 24 0081 3e3000 04 000000000000003ffffffffffffffffffffffffffffffff0000000000000 1aaaaa
    PrintEmptyRows    5555 84 03 00851b19aaaa
    PageEnd           5555 e3 01 01 e3aaaa
    PrintStatus       5555 a3 01 01 a3aaaa (alot)
    PrintEnd          5555 f3 01 01 f3aaaa


    You should send PrintEnd manually after this sequence (after print finished)
  */
  public static generatePrintSequenceV4(image: EncodedImage, options?: PrintOptions): NiimbotPacket[] {
    return [
      PacketGenerator.setDensity(options?.density ?? 2),
      PacketGenerator.setLabelType(options?.labelType ?? LabelType.WithGaps),
      PacketGenerator.printStartV4(options?.quantity ?? 1),
      PacketGenerator.pageStart(),
      PacketGenerator.setPageSizeV3(image.rows, image.cols, options?.quantity ?? 1),
      ...PacketGenerator.writeImageData(image),
      PacketGenerator.pageEnd(),
    ];
  }

  public static generatePrintSequence(
    protoVersion: ProtocolVersion,
    image: EncodedImage,
    options?: PrintOptions
  ): NiimbotPacket[] {
    switch (protoVersion) {
      case ProtocolVersion.V3:
        return PacketGenerator.generatePrintSequenceV3(image, options);
      case ProtocolVersion.V4:
        return PacketGenerator.generatePrintSequenceV4(image, options);
      default:
        throw new Error(`PrintTaskVersion ${protoVersion} Not implemented`);
    }
  }
}
