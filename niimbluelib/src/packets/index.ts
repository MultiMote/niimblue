export enum RequestCommandId {
  Invalid = -1,
  Connect = 0xc1,
  CancelPrint = 0xda,
  Heartbeat = 0xdc,
  LabelPositioningCalibration = 0x8e, //-114,
  PageEnd = 0xe3,
  PrinterLog = 0x05,
  PageStart = 0x03,
  PrintBitmapRow = 0x85, // -123
  PrintBitmapRowIndexed = 0x83, // -125, indexed if black pixels < 6
  PrintClear = 0x20,
  PrintEmptyRow = 0x84, // -124
  PrintEnd = 0xf3,
  PrinterInfo = 0x40, // See PrinterInfoType
  PrinterConfig = 0xaf,
  PrinterStatusData = 0xa5,
  PrinterReset = 0x28,
  PrintQuantity = 0x15,
  PrintStart = 0x01,
  PrintStatus = 0xa3,
  RfidInfo = 0x1a,
  RfidInfo2 = 0x1c,
  RfidSuccessTimes = 0x54,
  SetAutoShutdownTime = 0x27, ///
  SetDensity = 0x21,
  SetLabelType = 0x23 /* D11 - 1,5, for D110 able to set 1,2,3,5; see LabelType */,
  SetPageSize = 0x13, // 2, 4 or 6 bytes
  SoundSettings = 0x58,
  AntiFake = 0x0b, // some info request (niimbot app), 01 long 02 short
  WriteRFID = 0x70, // same as GetVolumeLevel???
}

export enum ResponseCommandId {
  Invalid = -1,
  In_NotSupported = 0x00,
  In_Connect = 0xc2,
  In_AntiFake = 0x0c,
  In_HeartbeatAdvanced1 = 0xdd,
  In_HeartbeatBasic = 0xde,
  In_HeartbeatUnknown = 0xdf,
  In_HeartbeatAdvanced2 = 0xd9,
  In_PageStart = 0x04,
  In_PrintClear = 0x30,
  /** sent by printer after {@link RequestCommandId.PageEnd} with {@link ResponseCommandId.In_PageEnd} */
  In_PrinterCheckLine = 0xd3,
  In_PrintEnd = 0xf4,
  In_PrinterConfig = 0xbf,
  In_PrinterInfoAutoShutDownTime = 0x47,
  In_PrinterInfoBluetoothAddress = 0x4d,
  In_PrinterInfoSpeed = 0x42,
  In_PrinterInfoDensity = 0x41,
  In_PrinterInfoLanguage = 0x46,
  In_PrinterInfoChargeLevel = 0x4a,
  In_PrinterInfoHardWareVersion = 0x4c,
  In_PrinterInfoLabelType = 0x43,
  In_PrinterInfoPrinterCode = 0x48,
  In_PrinterInfoSerialNumber = 0x4b,
  In_PrinterInfoSoftWareVersion = 0x49,
  In_PrinterInfoArea = 0x4f,
  In_PrinterStatusData = 0xb5,
  In_PrinterReset = 0x38,
  In_PrintStatus = 0xb3,
  In_PrintError = 0xdb, // For example, sent on SetPageSize when page print is not started
  In_PrintQuantity = 0x16,
  In_PrintStart = 0x02,
  In_RfidInfo = 0x1b,
  In_RfidSuccessTimes = 0x64,
  In_SetAutoShutdownTime = 0x37,
  In_SetDensity = 0x31,
  In_SetLabelType = 0x33,
  In_SetPageSize = 0x14,
  In_SoundSettings = 0x68,
  In_PageEnd = 0xe4,
}

export enum PrinterInfoType {
  Density = 1,
  Speed = 2,
  LabelType = 3,
  Language = 6,
  AutoShutdownTime = 7,
  /** See {@link PrinterId} */
  PrinterModelId = 8,
  SoftWareVersion = 9,
  BatteryChargeLevel = 10,
  SerialNumber = 11,
  HardWareVersion = 12,
  BluetoothAddress = 13,
  PrintMode = 14,
  Area = 15,
}

export enum SoundSettingsType {
  SetSound = 0x01,
  GetSoundState = 0x02,
}

export enum SoundSettingsItemType {
  BluetoothConnectionSound = 0x01,
  PowerSound = 0x02,
}

export enum LabelType {
  Invalid = 0,
  /** Default for D11 and similar */
  WithGaps = 1,
  Black = 2,
  Continuous = 3,
  Perforated = 4,
  Transparent = 5,
  PvcTag = 6,
  BlackMarkGap = 10,
  HeatShrinkTube = 11,
}

export enum HeartbeatType {
  Advanced1 = 1,
  Basic = 2,
  Unknown = 3,
  Advanced2 = 4,
}

export enum AutoShutdownTime {
  Shutdown15min = 1,
  Shutdown30min = 2,
  Shutdown45min = 3,
  Shutdown60min = 4,
}

/** Battery charge level */
export enum BatteryChargeLevel {
  Charge0 = 0,
  Charge25 = 1,
  Charge50 = 2,
  Charge75 = 3,
  Charge100 = 4,
}

export enum ConnectResult {
  Disconnect = 0,
  Connected = 1,
  ConnectedNew = 2,
  ConnectedV3 = 3,
  FirmwareErrors = 90,
}

export enum PrintTaskVersion {
  /** Used in D11 */
  V1 = 1,
  /** Used in B21, D110new */
  V2,
  /** Used in B16 */
  V3,
  /** Used in B1 */
  V4,
  /** Not used */
  V5,
}

export * from "./packet";
export * from "./packet_generator";
export * from "./abstraction";
export * from "./data_reader";
export * from "./print_task_versions";
