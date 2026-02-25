import { readFileSync } from "fs";
import { glob } from "glob";
import type { ExtractedTranslation, LangoJSConfig } from "../../types/index.js";
import { addTranslationKey, readTranslations } from "./db.js";

const T_PATTERN = /\bt\(\s*["'`]([^"'`]+)["'`]\s*,\s*["'`]([^"'`]+)["'`]/g;

export function extractFromFile(filePath: string): ExtractedTranslation[] {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const results: ExtractedTranslation[] = [];

  lines.forEach((line, index) => {
    let match;
    const regex = new RegExp(T_PATTERN.source, "g");
    while ((match = regex.exec(line)) !== null) {
      results.push({
        key: match[1],
        defaultValue: match[2],
        file: filePath,
        line: index + 1,
      });
    }
  });

  return results;
}

export async function extractFromCodebase(
  config: LangoJSConfig,
  patterns: string[] = ["**/*.{ts,tsx,js,jsx}"],
): Promise<{
  extracted: ExtractedTranslation[];
  added: number;
  existing: number;
}> {
  const files = await glob(patterns, {
    cwd: config.sourceRoot,
    ignore: ["**/node_modules/**", "**/dist/**", "**/.git/**"],
    absolute: true,
  });

  const allExtracted: ExtractedTranslation[] = [];

  for (const file of files) {
    const extracted = extractFromFile(file);
    allExtracted.push(...extracted);
  }

  const existingData = readTranslations(config);
  let added = 0;
  let existing = 0;

  for (const item of allExtracted) {
    if (existingData.translations[item.key]) {
      existing++;
    } else {
      addTranslationKey(config, item.key, item.defaultValue);
      added++;
    }
  }

  return { extracted: allExtracted, added, existing };
}
