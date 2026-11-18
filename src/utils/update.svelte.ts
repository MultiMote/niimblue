const GITHUB_REPO = "MultiMote/niimblue";
const LATEST_RELEASE_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
const CHANGELOG_URL = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/CHANGELOG.md`;

export interface ChangelogSection {
  version: string;
  items: string[];
}

export const updateInfo = $state({
  updateAvailable: false,
});

const normalizeVersion = (version: string): string => version.trim().replace(/^v/, "");

const compareVersions = (a: string, b: string): number => {
  const pa = a.split(".").map((part) => Number.parseInt(part, 10) || 0);
  const pb = b.split(".").map((part) => Number.parseInt(part, 10) || 0);
  const len = Math.max(pa.length, pb.length);

  for (let i = 0; i < len; i += 1) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) {
      return diff;
    }
  }

  return 0;
};

let updateChecked = false;

export const checkForUpdates = async (currentVersion: string): Promise<void> => {
  if (!currentVersion || updateChecked) {
    return;
  }
  updateChecked = true;

  try {
    const response = await fetch(LATEST_RELEASE_URL);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const release = (await response.json()) as { tag_name?: string };
    const latestVersion = normalizeVersion(release.tag_name ?? "");

    if (!latestVersion) {
      return;
    }

    updateInfo.updateAvailable = compareVersions(latestVersion, normalizeVersion(currentVersion)) > 0;
  } catch (e) {
    console.warn("Unable to check for updates:", e);
  }
};

export const fetchChangelog = async (currentVersion: string): Promise<ChangelogSection[]> => {
  const response = await fetch(CHANGELOG_URL);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const sections: ChangelogSection[] = [];

  for (const line of (await response.text()).split(/\r?\n/)) {
    if (line.startsWith("# ")) {
      sections.push({ version: line.slice(2).trim(), items: [] });
    } else if (sections.length > 0) {
      const item = line.trim();
      if (item.startsWith("* ") || item.startsWith("- ")) {
        sections[sections.length - 1].items.push(item.slice(2));
      }
    }
  }

  const current = normalizeVersion(currentVersion);

  return sections.filter((section) => compareVersions(section.version, current) > 0);
};

export const openLatestReleasePage = async (): Promise<void> => {
  const url = `https://github.com/${GITHUB_REPO}/releases/latest`;
  const tauri = (window as Window & { __TAURI__?: { opener?: { openUrl?: (url: string) => Promise<void> } } })
    .__TAURI__;

  try {
    if (tauri?.opener?.openUrl) {
      await tauri.opener.openUrl(url);
      return;
    }
  } catch (e) {
    console.warn("Unable to open release page in system browser:", e);
  }

  window.open(url, "_blank");
};
