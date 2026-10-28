# 2026.10.0

* Fix Arabic RTL text cursor and selection
* Parse nested variables (example: `{dt+{var}d}`).
* Auto use `D110M_V4` print task for `protocolVersion 4+` printers.
* Standardize template and saved label JSON import/export.
* Add character spacing field.
* Add preset print offset and replace support.
* Move label delete and export buttons to popup on mobile.
* Most of the dropdowns are modal dialogs now.
* Custom input dialog when editing text.
* Custom confirm dialog.
* Larger label/template/preview dialogs.
* Warn on tab close with unsaved changes.
* Do not show warning when loading label if no unsaved changes.
* Fix size inputs resetting on every keystroke.
* Fix circle size: typing a size only grew the selection, and dragging a corner did not update the size inputs.
* Apply position and size inputs live.
* Fix position inputs not updating after centering, arrow key moves and dragging until the object was reselected.
* Fix rectangle, QR code and ArUco disappearing and shapes looking pixelated while resizing with handles.
* Fix page shifting sideways when the vertical scrollbar appears.
* Fix centered objects landing on half pixels, which looked blurry in preview and print.
* Add screentone effect.
* Move objects by 1 pixel with the mouse (5 pixel grid snapping only when the grid is enabled).
* Do not auto apply parameters when selecting label preset.
* Add auto shutdown option to the printer menu.
* Fix invalid CODE128 encoding.
* Add saved templates sorting type/direction.

# 2026.9.0

* Add changelog (starts from commit 48ce74).
* Add dual color printing support:
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
* Add datetime duration parsing (example: `{dt+3d}`, `{dt-3h}`, `{dt+1w|YYYY-MM-DD}`).
