import type { translationKeys } from ".";

/** Simplified Chinese */
export const translation_zh_cn: Partial<Record<translationKeys, string>> = {
  /* Main page */
  "main.code": "查看源码",
  "main.built": "编译于",
  /* BrowserWarning */
  "browser_warning.lines.first": "哦豁，你的浏览器貌似不支持蓝牙和串口通讯",
  "browser_warning.lines.second": "但是你依然可以使用标签编辑功能",
  /* PrinterConnector */
  "connector.bluetooth": "蓝牙",
  "connector.serial": "串口（USB）",
  /* ImageEditor */
  "editor.default_text": "文本",
  "editor.export.json": "导出 JSON 文件",
  "editor.import.json": "导入 JSON 文件",
  "editor.import.zpl": "导入 ZPL 文件",
  "editor.preview": "预览",
  "editor.print": "打印",
  "editor.delete": "删除",
  "editor.clone": "复制",
  /* PrintPreview */
  "preview.title": "打印预览",
  "preview.postprocess": "前置处理器",
  "preview.postprocess.threshold": "阈值化",
  "preview.postprocess.atkinson": "抖动（Atkinson）",
  "preview.threshold": "阈值",
  "preview.copies": "份数",
  "preview.density": "浓度",
  "preview.print_task_version": "打印接口版本",
  "preview.not_implemented": "暂不支持",
  "preview.close": "关闭",
  "preview.not_connected": "打印机未连接",
  "preview.print": "打印",
  "preview.label_type": "标签类型",
  "preview.label_type.Invalid": "无效纸张",
  "preview.label_type.WithGaps": "间隙纸",
  "preview.label_type.Black": "黑标纸",
  "preview.label_type.Continuous": "连续纸",
  "preview.label_type.Perforated": "定孔纸",
  "preview.label_type.Transparent": "透明纸",
  "preview.label_type.PvcTag": "PVC",
  "preview.label_type.BlackMarkGap": "黑标间隙纸",
  "preview.label_type.HeatShrinkTube": "热缩管",
  /* ObjectPicker */
  "editor.objectpicker.title": "添加元素",
  "editor.objectpicker.text": "文字",
  "editor.objectpicker.line": "线条",
  "editor.objectpicker.rectangle": "矩形",
  "editor.objectpicker.circle": "圆形",
  "editor.objectpicker.image": "图片",
  "editor.objectpicker.qrcode": "二维码",
  "editor.objectpicker.barcode": "条码",
  /* IconPicker */
  "editor.iconpicker.title": "添加图标",
  "editor.iconpicker.search": "搜索",
  /* LabelPropsEditor */
  "params.label.dialog_title": "标签属性",
  "params.label.size": "尺寸",
  "params.label.mm": "毫米",
  "params.label.dpmm": "点/毫米",
  "params.label.px": "像素",
  "params.label.direction": "出纸方向",
  "params.label.direction.left": "向左",
  "params.label.direction.top": "向上",
  /* TextParamsControls */
  "params.text.fetch_fonts": "获取系统字体",
  "params.text.align.left": "左对齐",
  "params.text.align.center": "居中",
  "params.text.align.right": "右对齐",
  "params.text.bold": "加粗",
  "params.text.invert_colors": "反转颜色",
  "params.text.font_size": "字体大小",
  "params.text.font_size.up": "加大",
  "params.text.font_size.down": "缩小",
  "params.text.line_height": "行距",
  "params.text.font_family": "字体",
  /* GenericObjectParamsControls */
  "params.generic.center.vertical": "竖向居中",
  "params.generic.center.horizontal": "横向居中",
  /* QRCodeParamsControls */
  "params.qrcode.ecl": "误差校正级别",
  /** BarcodeParamsControls */
  "params.barcode.encoding": "类型",
  "params.barcode.content": "内容",
};
