import Dropdown from "bootstrap/js/dist/dropdown";

const SHEET_MQ = "(max-width: 960px), (max-height: 800px)";

type SheetState = {
  menu: HTMLElement;
  home: Node;
  nextSibling: ChildNode | null;
  backdrop?: HTMLElement;
  closeBtn?: HTMLButtonElement;
  display?: "dynamic" | "static";
};

const sheets = new WeakMap<HTMLElement, SheetState>();

const isSheetViewport = () => window.matchMedia(SHEET_MQ).matches;

const findMenu = (toggle: HTMLElement): HTMLElement | null => {
  const wrap = toggle.closest(".dropdown, .dropup, .dropend, .dropstart, .btn-group, .input-group");
  if (!(wrap instanceof HTMLElement)) return null;
  return wrap.querySelector(":scope > .dropdown-menu");
};

const clearPopperPlacement = (menu: HTMLElement) => {
  menu.style.removeProperty("position");
  menu.style.removeProperty("inset");
  menu.style.removeProperty("top");
  menu.style.removeProperty("left");
  menu.style.removeProperty("right");
  menu.style.removeProperty("bottom");
  menu.style.removeProperty("transform");
  menu.style.removeProperty("margin");
  menu.style.removeProperty("z-index");
  menu.style.removeProperty("max-height");
  menu.style.removeProperty("min-height");
  menu.style.removeProperty("height");
  menu.style.removeProperty("width");
  menu.removeAttribute("data-popper-placement");
};

type DropdownInternals = {
  _config?: { display?: string };
};

const setDropdownDisplay = (toggle: HTMLElement, display: "static" | "dynamic") => {
  const instance = Dropdown.getOrCreateInstance(toggle);
  const internals = instance as unknown as DropdownInternals;
  if (internals._config) internals._config.display = display;
};

const lockSheet = (menu: HTMLElement, backdrop: HTMLElement) => {
  menu.classList.add("dropdown-menu-sheet");
  clearPopperPlacement(menu);
  if (menu.parentElement !== document.body) {
    document.body.append(backdrop, menu);
  }
};

const onShow = (e: Event) => {
  const toggle = e.target;
  if (!(toggle instanceof HTMLElement)) return;
  if (toggle.closest(".dropdown-menu-sheet") || toggle.closest(".dropdown-menu-rail-portal") || toggle.closest(".modal")) {
    return;
  }

  const menu = findMenu(toggle);
  const home = menu?.parentNode;
  if (!menu || !home) return;

  const inRail = Boolean(toggle.closest(".tools-rail"));

  if (isSheetViewport()) {
    setDropdownDisplay(toggle, "static");
    const instance = Dropdown.getInstance(toggle);

    const backdrop = document.createElement("div");
    backdrop.className = "dropdown-sheet-backdrop";
    backdrop.addEventListener("click", () => instance?.hide());

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "btn-close dropdown-sheet-close";
    closeBtn.setAttribute("aria-label", "Close");
    closeBtn.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      instance?.hide();
    });

    sheets.set(toggle, {
      menu,
      home,
      nextSibling: menu.nextSibling,
      backdrop,
      closeBtn,
      display: "static",
    });

    document.body.classList.add("nb-dropdown-sheet-open");
    document.body.append(backdrop, menu);
    menu.prepend(closeBtn);
    lockSheet(menu, backdrop);
    requestAnimationFrame(() => lockSheet(menu, backdrop));
    return;
  }

  if (!inRail) return;

  // Keep rail menus above the canvas: overflow/stacking on the rail clips them
  // after Fabric creates a stacking context on the workspace.
  sheets.set(toggle, {
    menu,
    home,
    nextSibling: menu.nextSibling,
  });
  document.body.append(menu);
  menu.classList.add("dropdown-menu-rail-portal");
};

const onShown = (e: Event) => {
  const toggle = e.target;
  if (!(toggle instanceof HTMLElement)) return;
  const state = sheets.get(toggle);
  if (!state?.backdrop) return;
  lockSheet(state.menu, state.backdrop);
};

const onHidden = (e: Event) => {
  const toggle = e.target;
  if (!(toggle instanceof HTMLElement)) return;

  const state = sheets.get(toggle);
  if (!state) return;
  sheets.delete(toggle);

  if (state.display) setDropdownDisplay(toggle, "dynamic");
  state.closeBtn?.remove();
  state.menu.classList.remove("dropdown-menu-sheet", "dropdown-menu-rail-portal");
  clearPopperPlacement(state.menu);
  state.home.insertBefore(state.menu, state.nextSibling);
  state.backdrop?.remove();
  document.body.classList.remove("nb-dropdown-sheet-open");
};

const initRailDropdowns = () => {
  document.querySelectorAll(".tools-rail [data-bs-toggle='dropdown']").forEach((el) => {
    if (!(el instanceof HTMLElement)) return;
    Dropdown.getOrCreateInstance(el, {
      autoClose: "outside",
      popperConfig: (defaultConfig) => ({
        ...defaultConfig,
        strategy: "fixed",
        modifiers: [
          ...(Array.isArray(defaultConfig.modifiers) ? defaultConfig.modifiers : []),
          {
            name: "preventOverflow",
            options: {
              padding: { top: 12, right: 12, bottom: 56, left: 12 },
            },
          },
        ],
      }),
    });
  });
};

export const initMobileDropdownSheets = () => {
  initRailDropdowns();
  document.addEventListener("show.bs.dropdown", onShow, true);
  document.addEventListener("shown.bs.dropdown", onShown, true);
  document.addEventListener("hidden.bs.dropdown", onHidden, true);

  return () => {
    document.removeEventListener("show.bs.dropdown", onShow, true);
    document.removeEventListener("shown.bs.dropdown", onShown, true);
    document.removeEventListener("hidden.bs.dropdown", onHidden, true);
  };
};
