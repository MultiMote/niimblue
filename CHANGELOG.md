# 2026.9.0

* Add changelog (starts from commit 48ce74).
* Add dual color printing support:.
  - Add red color to vector objects.
  - Add red/black threshold post-processing.
* Use single PrintStart/PrintEnd session for multi-page printing.
* Fix print progress calculation.
* Display more characteristics at the printer info menu.
* Fix status poll not stopped sometimes.
* Fix version detection for non-very-old printer models.
* Fail on connecting to a non-printer port.
* Add send progress (on printing).
* Printer menu rework:
  - Strings are i18n now.
  - Menu now display most important things.
  - Details moved to separate menu.
  - RFID usage progress bars.
  - RFID paper type and dimensions (for modern printers).
  - Sound settings sliders.
