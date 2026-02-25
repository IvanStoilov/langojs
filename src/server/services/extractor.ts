import { readFileSync } from "fs";
import { glob } from "glob";
import type { ExtractedTranslation, LangoJSConfig } from "../../types/index.js";
import { addTranslationKey, readTranslations } from "./db.js";

// Regex that handles multiline t() calls with whitespace/newlines
// Matches: t("key", "default value") or t('key', 'default value') or t(`key`, `default value`)
const T_PATTERN = /\bt\(\s*["'`]([^"'`]+)["'`]\s*,\s*["'`]([\s\S]*?)["'`]\s*\)/g;

function getLineNumber(content: string, index: number): number {
  return content.slice(0, index).split("\n").length;
}

export function extractFromFile(filePath: string): ExtractedTranslation[] {
  const content = readFileSync(filePath, "utf-8");
  const results: ExtractedTranslation[] = [];

  let match;
  const regex = new RegExp(T_PATTERN.source, "g");
  while ((match = regex.exec(content)) !== null) {
    // Normalize whitespace in the default value (collapse multiple spaces/newlines to single space)
    const defaultValue = match[2].replace(/\s+/g, " ").trim();

    results.push({
      key: match[1],
      defaultValue,
      file: filePath,
      line: getLineNumber(content, match.index),
    });
  }

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
