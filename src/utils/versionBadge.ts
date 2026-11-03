import { LyricVersion } from '../types';

export interface VersionBadgeInfo {
  badgeLabel: string; // e.g. "v1", "v2"
  customTitle: string | null; // e.g. "Ganti Hook" or null if default
  displayTitle: string; // e.g. "v1" or "v1 • Ganti Hook"
}

export function getVersionBadgeInfo(version?: LyricVersion | null, index: number = 0): VersionBadgeInfo {
  const badgeLabel = `v${index + 1}`;
  if (!version) {
    return {
      badgeLabel,
      customTitle: null,
      displayTitle: badgeLabel,
    };
  }

  const rawName = (version.name || '').trim();

  // Check if rawName is empty or default like "Versi 1", "Versi 2", "Draft 1", "v1", "v2"
  const isDefaultName =
    !rawName ||
    /^versi\s*\d+$/i.test(rawName) ||
    /^version\s*\d+$/i.test(rawName) ||
    /^draft\s*\d+$/i.test(rawName) ||
    /^v\d+$/i.test(rawName);

  return {
    badgeLabel,
    customTitle: isDefaultName ? null : rawName,
    displayTitle: isDefaultName ? badgeLabel : `${badgeLabel} • ${rawName}`,
  };
}
