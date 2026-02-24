import { readFileSync, writeFileSync, existsSync } from "fs";
import type { TranslationsData, TranslateJSConfig } from "../../types/index.js";

export function getDbPath(config: TranslateJSConfig): string {
  return config.dbPath || "./translations.json";
}

export function readTranslations(config: TranslateJSConfig): TranslationsData {
  const dbPath = getDbPath(config);

  if (!existsSync(dbPath)) {
    const initial: TranslationsData = {
      translations: {},
      metadata: {
        lastUpdated: new Date().toISOString(),
        version: 1,
      },
    };
    writeTranslations(config, initial);
    return initial;
  }

  const content = readFileSync(dbPath, "utf-8");
  return JSON.parse(content) as TranslationsData;
}

export function writeTranslations(
  config: TranslateJSConfig,
  data: TranslationsData
): void {
  const dbPath = getDbPath(config);
  data.metadata.lastUpdated = new Date().toISOString();
  writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf-8");
}

export function updateTranslation(
  config: TranslateJSConfig,
  key: string,
  language: string,
  value: string | null
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
  config: TranslateJSConfig,
  key: string,
  defaultValue: string
): TranslationsData {
  const data = readTranslations(config);

  if (!data.translations[key]) {
    data.translations[key] = {};
    for (const lang of config.availableLanguages) {
      data.translations[key][lang] = null;
    }
    data.translations[key][config.masterLanguage] = defaultValue;
    writeTranslations(config, data);
  }

  return data;
}
