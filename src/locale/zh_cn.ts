import type { translationKeys } from ".";

/** Simplified Chinese */
export const translation_zh_cn: Partial<Record<translationKeys, string>> = {
  /* BrowserWarning */
  "browser_warning.lines.first": "哦豁，你的浏览器貌似不支持蓝牙和串口通讯",
  "browser_warning.lines.second": "但是你依然可以使用标签编辑功能",
  /* PrinterConnector */
  "connector.bluetooth": "蓝牙",
  "connector.serial": "串口（USB）",
  /* ImageEditor */
  "editor.clone": "复制",
  "editor.default_text": "文本",
  "editor.delete": "删除",
  /* ImageEditor Export */
  "editor.export.json": "导出 JSON 文件",
  /* IconPicker */
  "editor.iconpicker.search": "搜索",
  "editor.iconpicker.title": "添加图标",
  /* ImageEditor Import */
  "editor.import.json": "导入 JSON 文件",
  "editor.import.zpl": "导入 ZPL 文件",
  /* ObjectPicker */
  "editor.objectpicker.barcode": "条码",
  "editor.objectpicker.circle": "圆形",
  "editor.objectpicker.image": "图片",
  "editor.objectpicker.line": "线条",
  "editor.objectpicker.qrcode": "二维码",
  "editor.objectpicker.rectangle": "矩形",
  "editor.objectpicker.text": "文字",
  "editor.objectpicker.title": "添加元素",
  /* ImageEditor */
  "editor.preview": "预览",
  "editor.print": "打印",
  "editor.warning.load": "画布将被替换为保存的数据，需要继续吗？",
  "editor.warning.save": "保存的数据将会被覆盖，需要继续吗？",
  /* Main page */
  "main.built": "编译于",
  "main.code": "查看源码",
  /** BarcodeParamsControls */
  "params.barcode.content": "内容",
  "params.barcode.enable_caption": "打印文字",
  "params.barcode.encoding": "类型",
  "params.barcode.font_size": "字体大小",
  "params.barcode.scale": "缩放比例",
  /* CsvControl */
  "params.csv.enabled": "启用",
  "params.csv.placeholders": "变量：",
  "params.csv.rowsfound": "数据行数：",
  "params.csv.tip": "第一行是表头，用作变量名。英文逗号用作分隔符。",
  "params.csv.title": "动态标签数据（CSV）",
  /* GenericObjectParamsControls */
  "params.generic.center.horizontal": "横向居中",
  "params.generic.center.vertical": "竖向居中",
  /* LabelPropsEditor */
  "params.label.calc": "计算",
  "params.label.direction.left": "向左",
  "params.label.direction.top": "向上",
  "params.label.direction": "出纸方向",
  "params.label.dpmm": "点/毫米",
  "params.label.mm": "毫米",
  "params.label.px": "像素",
  "params.label.size": "尺寸",
  "params.label.title": "标签属性",
  /* QRCodeParamsControls */
  "params.qrcode.ecl": "误差校正级别",
  /* TextParamsControls */
  "params.text.align.center": "居中",
  "params.text.align.left": "左对齐",
  "params.text.align.right": "右对齐",
  "params.text.bold": "加粗",
  "params.text.fetch_fonts": "获取系统字体",
  "params.text.font_family": "字体",
  "params.text.font_size.down": "缩小",
  "params.text.font_size.up": "加大",
  "params.text.font_size": "字体大小",
  "params.text.invert_colors": "反转颜色",
  "params.text.line_height": "行距",
  "params.text.vorigin.bottom": "底部对齐",
  "params.text.vorigin.center": "居中",
  "params.text.vorigin.top": "顶部对齐",
  "params.text.vorigin": "垂直对齐",
  /* VariableInsertControl */
  "params.variables.insert.date": "日期",
  "params.variables.insert.datetime": "日期时间",
  "params.variables.insert.time": "时间",
  "params.variables.insert": "插入变量",
  /* PrintPreview */
  "preview.close": "关闭",
  "preview.copies": "份数",
  "preview.density": "浓度",
  "preview.label_type.Black": "黑标纸",
  "preview.label_type.BlackMarkGap": "黑标间隙纸",
  "preview.label_type.Continuous": "连续纸",
  "preview.label_type.HeatShrinkTube": "热缩管",
  "preview.label_type.Invalid": "无效纸张",
  "preview.label_type.Perforated": "定孔纸",
  "preview.label_type.PvcTag": "PVC",
  "preview.label_type.Transparent": "透明纸",
  "preview.label_type.WithGaps": "间隙纸",
  "preview.label_type": "标签类型",
  "preview.not_connected": "打印机未连接",
  "preview.not_implemented": "暂不支持",
  "preview.postprocess.atkinson": "抖动（Atkinson）",
  "preview.postprocess.threshold": "阈值化",
  "preview.postprocess": "前置处理器",
  "preview.print_task_version": "打印接口版本",
  "preview.print": "打印",
  "preview.threshold": "阈值",
  "preview.title": "打印预览",
};
