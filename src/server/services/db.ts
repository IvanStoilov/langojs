import { readFileSync, writeFileSync, existsSync } from "fs";
import type { TranslationsData, LangoJSConfig } from "../../types/index.js";

export function getDbPath(config: LangoJSConfig): string {
  return config.dbPath || "./translations.json";
}

export function readTranslations(config: LangoJSConfig): TranslationsData {
  const dbPath = getDbPath(config);

  if (!existsSync(dbPath)) {
    const initial: TranslationsData = {
      translations: {},
      pendingApproval: [],
      unusedKeys: [],
      metadata: {
        lastUpdated: new Date().toISOString(),
        version: 1,
      },
    };
    writeTranslations(config, initial);
    return initial;
  }

  const content = readFileSync(dbPath, "utf-8");
  const data = JSON.parse(content) as TranslationsData;

  // Migration: add pendingApproval if not present
  if (!data.pendingApproval) {
    data.pendingApproval = [];
  }

  // Migration: add unusedKeys if not present
  if (!data.unusedKeys) {
    data.unusedKeys = [];
  }

  return data;
}

export function writeTranslations(
  config: LangoJSConfig,
  data: TranslationsData,
): void {
  const dbPath = getDbPath(config);
  data.metadata.lastUpdated = new Date().toISOString();
  writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf-8");
}

export function updateTranslation(
  config: LangoJSConfig,
  key: string,
  language: string,
  value: string | null,
): TranslationsData {
  const data = readTranslations(config);

  if (!data.translations[key]) {
    data.translations[key] = {};
    for (const lang of config.availableLanguages) {
      data.translations[key][lang] = null;
    }
  }

  data.translations[key][language] = value;
  writeTranslations(config, data);
  return data;
}

export function addTranslationKey(
  config: LangoJSConfig,
  key: string,
  defaultValue?: string,
): TranslationsData {
  const data = readTranslations(config);

  if (!data.translations[key]) {
    data.translations[key] = {};
    for (const lang of config.availableLanguages) {
      data.translations[key][lang] = null;
    }
    // Only set the master language value if a default was provided
    if (defaultValue !== undefined) {
      data.translations[key][config.masterLanguage] = defaultValue;
    }
    writeTranslations(config, data);
  }

  return data;
}

// Pending approval helpers
export function getPendingApprovalKey(language: string, key: string): string {
  return `${language}:${key}`;
}

export function parsePendingApprovalKey(
  pendingKey: string,
): { language: string; key: string } | null {
  const colonIndex = pendingKey.indexOf(":");
  if (colonIndex === -1) return null;
  return {
    language: pendingKey.slice(0, colonIndex),
    key: pendingKey.slice(colonIndex + 1),
  };
}

export function addPendingApproval(
  config: LangoJSConfig,
  language: string,
  key: string,
): void {
  const data = readTranslations(config);
  const pendingKey = getPendingApprovalKey(language, key);

  if (!data.pendingApproval.includes(pendingKey)) {
    data.pendingApproval.push(pendingKey);
    writeTranslations(config, data);
  }
}

export function removePendingApproval(
  config: LangoJSConfig,
  language: string,
  key: string,
): void {
  const data = readTranslations(config);
  const pendingKey = getPendingApprovalKey(language, key);

  data.pendingApproval = data.pendingApproval.filter((k) => k !== pendingKey);
  writeTranslations(config, data);
}

export function isPendingApproval(
  data: TranslationsData,
  language: string,
  key: string,
): boolean {
  const pendingKey = getPendingApprovalKey(language, key);
  return data.pendingApproval.includes(pendingKey);
}
