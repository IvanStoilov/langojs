import { mkdirSync, writeFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import type { LangoJSConfig } from "../../types/index.js";
import { readTranslations } from "./db.js";

interface GeneratedFile {
  path: string;
  language: string;
  keyCount: number;
}

export function generateTranslationSets(
  config: LangoJSConfig,
): GeneratedFile[] {
  const data = readTranslations(config);
  const generatedFiles: GeneratedFile[] = [];

  for (const set of config.sets) {
    const groupedTranslations: {
      [language: string]: { [key: string]: string };
    } = {};

    for (const lang of config.availableLanguages) {
      groupedTranslations[lang] = {};
    }

    for (const [key, translations] of Object.entries(data.translations)) {
      const group = config.getGroup(key);

      if (set.groups.includes(group)) {
        const masterValue = translations[config.masterLanguage];
        if (masterValue === null || masterValue === undefined) {
          continue;
        }

        for (const lang of config.availableLanguages) {
          const value = translations[lang];
          // Use translation if available, otherwise fallback to master language
          groupedTranslations[lang][key] =
            value !== null && value !== undefined ? value : masterValue;
        }
      }
    }

    if (!existsSync(set.destination)) {
      mkdirSync(set.destination, { recursive: true });
    }

    for (const lang of config.availableLanguages) {
      const filePath = join(set.destination, `${lang}.json`);
      const dir = dirname(filePath);

      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      const sorted = sortKeys(groupedTranslations[lang]);

      writeFileSync(filePath, JSON.stringify(sorted, null, 2), "utf-8");

      generatedFiles.push({
        path: filePath,
        language: lang,
        keyCount: Object.keys(sorted).length,
      });
    }
  }

  return generatedFiles;
}

function sortKeys(obj: { [key: string]: string }): { [key: string]: string } {
  return Object.fromEntries(
    Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)),
  );
}
