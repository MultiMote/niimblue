export type translationKeys =
  | "browser_warning.lines.first"
  | "browser_warning.lines.second"
  | "connector.bluetooth"
  | "connector.serial"
  | "editor.clone"
  | "editor.default_text"
  | "editor.delete"
  | "editor.export.json"
  | "editor.iconpicker.search"
  | "editor.iconpicker.title"
  | "editor.import.json"
  | "editor.import.zpl"
  | "editor.objectpicker.barcode"
  | "editor.objectpicker.circle"
  | "editor.objectpicker.image"
  | "editor.objectpicker.line"
  | "editor.objectpicker.qrcode"
  | "editor.objectpicker.rectangle"
  | "editor.objectpicker.text"
  | "editor.objectpicker.title"
  | "editor.preview"
  | "editor.print"
  | "main.built"
  | "main.code"
  | "params.barcode.content"
  | "params.barcode.encoding"
  | "params.generic.center.horizontal"
  | "params.generic.center.vertical"
  | "params.label.calc"
  | "params.label.direction.left"
  | "params.label.direction.top"
  | "params.label.direction"
  | "params.label.dpmm"
  | "params.label.mm"
  | "params.label.px"
  | "params.label.size"
  | "params.label.title"
  | "params.qrcode.ecl"
  | "params.text.align.center"
  | "params.text.align.left"
  | "params.text.align.right"
  | "params.text.bold"
  | "params.text.fetch_fonts"
  | "params.text.font_family"
  | "params.text.font_size.down"
  | "params.text.font_size.up"
  | "params.text.font_size"
  | "params.text.line_height"
  | "params.text.invert_colors"
  | "preview.close"
  | "preview.copies"
  | "preview.density"
  | "preview.label_type.Black"
  | "preview.label_type.BlackMarkGap"
  | "preview.label_type.Continuous"
  | "preview.label_type.HeatShrinkTube"
  | "preview.label_type.Invalid"
  | "preview.label_type.Perforated"
  | "preview.label_type.PvcTag"
  | "preview.label_type.Transparent"
  | "preview.label_type.WithGaps"
  | "preview.label_type"
  | "preview.not_connected"
  | "preview.not_implemented"
  | "preview.postprocess.atkinson"
  | "preview.postprocess.threshold"
  | "preview.postprocess"
  | "preview.print_task_version"
  | "preview.print"
  | "preview.threshold"
  | "preview.title"

export type supportedLanguages = "en" | "ru" | "zh_cn"

export const langPack: Record<supportedLanguages, Partial<Record<translationKeys, string>>> = {
  /** Do not add anything in "en" translation, fallback values used */
  en: {},

  /** Russian */
  ru: {
    /* Main page */
    "main.code": "Исходный код",
    "main.built": "собрано",
    /* BrowserWarning */
    "browser_warning.lines.first": "О нет, ваш браузер не поддерживает Bluetooth и последовательный порт",
    "browser_warning.lines.second": "В любом случае, вы можете рисовать этикетки.",
    /* PrinterConnector */
    "connector.bluetooth": "Bluetooth",
    "connector.serial": "Посл. порт (USB)",
    /* ImageEditor */
    "editor.default_text": "Текст",
    "editor.export.json": "Экспорт JSON",
    "editor.import.json": "Импорт JSON",
    "editor.import.zpl": "Импорт ZPL",
    "editor.preview": "Предпросмотр",
    "editor.print": "Печать",
    "editor.delete": "Удалить",
    "editor.clone": "Клонировать",
    /* PrintPreview */
    "preview.title": "Предпросмотр печати",
    "preview.postprocess": "Постобработка",
    "preview.postprocess.threshold": "Порог",
    "preview.postprocess.atkinson": "Дизеринг (Аткинсон)",
    "preview.threshold": "Порог",
    "preview.copies": "Копии",
    "preview.density": "Плотность",
    "preview.print_task_version": "Версия задачи печати",
    "preview.not_implemented": "НЕ РЕАЛИЗОВАНО",
    "preview.close": "Закрыть",
    "preview.print": "Печать",
    "preview.not_connected": "Принтер не подключен",
    "preview.label_type": "Тип этикетки",
    "preview.label_type.Invalid": "Некорректный",
    "preview.label_type.WithGaps": "С промежутками",
    "preview.label_type.Black": "Чёрный",
    "preview.label_type.Continuous": "Неразрывный",
    "preview.label_type.Perforated": "С отверстиями",
    "preview.label_type.Transparent": "Прозрачный",
    "preview.label_type.PvcTag": "ПВХ",
    "preview.label_type.BlackMarkGap": "С чёрными метками",
    "preview.label_type.HeatShrinkTube": "Термоусадочная трубка",
    /* ObjectPicker */
    "editor.objectpicker.title": "Добавить объект",
    "editor.objectpicker.text": "Текст",
    "editor.objectpicker.line": "Линия",
    "editor.objectpicker.rectangle": "Прямоугольник",
    "editor.objectpicker.circle": "Круг",
    "editor.objectpicker.image": "Картинка",
    "editor.objectpicker.qrcode": "QR Код",
    "editor.objectpicker.barcode": "Штрих-код",
    /* IconPicker */
    "editor.iconpicker.title": "Добавить иконку",
    "editor.iconpicker.search": "Поиск",
    /* LabelPropsEditor */
    "params.label.title": "Настройки этикетки",
    "params.label.size": "Размер",
    "params.label.mm": "мм",
    "params.label.dpmm": "пикс/мм",
    "params.label.calc": "Рассчёт",
    "params.label.px": "пикс.",
    "params.label.direction": "Печатать",
    "params.label.direction.left": "Слева",
    "params.label.direction.top": "Сверху",
    /* TextParamsControls */
    "params.text.fetch_fonts": "Получить список шрифтов",
    "params.text.align.left": "Выравнивание текста: Слева",
    "params.text.align.center": "Выравнивание текста: По центру",
    "params.text.align.right": "Выравнивание текста: Справа",
    "params.text.bold": "Полужирный",
    "params.text.font_size": "Размер шрифта",
    "params.text.font_size.up": "Увеличить размер шрифта",
    "params.text.font_size.down": "Уменьшить размер шрифта",
    "params.text.line_height": "Межстрочный интервал",
    "params.text.font_family": "Шрифт",
    /* GenericObjectParamsControls */
    "params.generic.center.vertical": "Выровнять вертикально",
    "params.generic.center.horizontal": "Выровнять горизонтально",
    /* QRCodeParamsControls */
    "params.qrcode.ecl": "Уровень коррекции ошибок",
    /** BarcodeParamsControls */
    "params.barcode.encoding": "Тип",
    "params.barcode.content": "Содержимое",
  },

  /** Simplified Chinese */
  zh_cn: {
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
    "editor.default_text": "打印",
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
    "params.label.title": "标签属性",
    "params.label.size": "尺寸",
    "params.label.mm": "毫米",
    "params.label.dpmm": "点/毫米",
    "params.label.calc": "计算",
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
    "params.text.font_size": "字体大小",
    "params.text.font_size.up": "加大",
    "params.text.font_size.down": "缩小",
    "params.text.line_height": "行距",
    "params.text.font_family": "字体",
    "params.text.invert_colors": "反转颜色",
    /* GenericObjectParamsControls */
    "params.generic.center.vertical": "竖向居中",
    "params.generic.center.horizontal": "横向居中",
    /* QRCodeParamsControls */
    "params.qrcode.ecl": "误差校正级别",
    /** BarcodeParamsControls */
    "params.barcode.encoding": "类型",
    "params.barcode.content": "内容",
  }
};

export const languagesMaps: Record<supportedLanguages, string> = {
  en: "English",
  ru: "Русский",
  zh_cn: "简体中文",
}