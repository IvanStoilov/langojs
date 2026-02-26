import { readFileSync } from "fs";
import { glob } from "glob";
import type { ExtractedTranslation, LangoJSConfig } from "../../types/index.js";
import { addTranslationKey, readTranslations, writeTranslations } from "./db.js";

const DEFAULT_IGNORE_PATHS = ["**/node_modules/**", "**/dist/**", "**/.git/**"];

// Valid translation key pattern: letters, numbers, underscore, dash, and dot
const VALID_KEY_PATTERN = /^[a-zA-Z0-9_\-\.]+$/;

function isValidTranslationKey(key: string): boolean {
  return VALID_KEY_PATTERN.test(key);
}

// Patterns for each quote type - ensures we don't cross quote boundaries
// Using [^"\\]*(?:\\.[^"\\]*)* to handle escaped quotes within strings
const STRING_DOUBLE = `"([^"\\\\]*(?:\\\\.[^"\\\\]*)*)"`;
const STRING_SINGLE = `'([^'\\\\]*(?:\\\\.[^'\\\\]*)*)'`;
const STRING_BACKTICK = `\`([^\`\\\\]*(?:\\\\.[^\`\\\\]*)*)\``;
const STRING_PATTERN = `(?:${STRING_DOUBLE}|${STRING_SINGLE}|${STRING_BACKTICK})`;

// Pattern for t("key", "default") - two arguments
// Uses negative lookbehind (?<!\.) to exclude method calls like someObject.t()
const T_PATTERN_WITH_DEFAULT = new RegExp(
  `(?<!\\.)\\bt\\(\\s*${STRING_PATTERN}\\s*,\\s*${STRING_PATTERN}`,
  "g",
);

// Pattern for t("key") - single argument (key only, no default value)
// Matches t("key") but NOT t("key", ...) - uses negative lookahead
const T_PATTERN_KEY_ONLY = new RegExp(
  `(?<!\\.)\\bt\\(\\s*${STRING_PATTERN}\\s*(?:\\)|,\\s*(?!['"` + "`" + `]))`,
  "g",
);

function getLineNumber(content: string, index: number): number {
  return content.slice(0, index).split("\n").length;
}

function extractStringValue(
  match: RegExpExecArray,
  startIndex: number,
): string {
  // Check which capture group has the value (double, single, or backtick)
  return (
    match[startIndex] ?? match[startIndex + 1] ?? match[startIndex + 2] ?? ""
  );
}

export function extractFromFile(filePath: string): ExtractedTranslation[] {
  const content = readFileSync(filePath, "utf-8");
  const results: ExtractedTranslation[] = [];
  const seenKeys = new Set<string>();

  // First, extract t("key", "default") calls
  let match;
  while ((match = T_PATTERN_WITH_DEFAULT.exec(content)) !== null) {
    // Groups 1,2,3 are for the key (double, single, backtick)
    // Groups 4,5,6 are for the default value (double, single, backtick)
    const key = extractStringValue(match, 1);

    // Skip invalid keys (must only contain letters, numbers, underscore, dash, dot)
    if (!isValidTranslationKey(key)) {
      continue;
    }

    const rawDefaultValue = extractStringValue(match, 4);

    // Normalize whitespace in the default value (collapse multiple spaces/newlines to single space)
    const defaultValue = rawDefaultValue.replace(/\s+/g, " ").trim();

    const uniqueKey = `${key}:${match.index}`;
    if (!seenKeys.has(uniqueKey)) {
      seenKeys.add(uniqueKey);
      results.push({
        key,
        defaultValue: defaultValue || undefined,
        file: filePath,
        line: getLineNumber(content, match.index),
      });
    }
  }
  T_PATTERN_WITH_DEFAULT.lastIndex = 0;

  // Then, extract t("key") calls (without default value)
  while ((match = T_PATTERN_KEY_ONLY.exec(content)) !== null) {
    // Groups 1,2,3 are for the key (double, single, backtick)
    const key = extractStringValue(match, 1);

    // Skip invalid keys (must only contain letters, numbers, underscore, dash, dot)
    if (!isValidTranslationKey(key)) {
      continue;
    }

    const uniqueKey = `${key}:${match.index}`;
    if (!seenKeys.has(uniqueKey)) {
      seenKeys.add(uniqueKey);
      results.push({
        key,
        file: filePath,
        line: getLineNumber(content, match.index),
      });
    }
  }
  T_PATTERN_KEY_ONLY.lastIndex = 0;

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
  const ignorePaths = config.ignorePaths ?? DEFAULT_IGNORE_PATHS;
  const files = await glob(patterns, {
    cwd: config.sourceRoot,
    ignore: ignorePaths,
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

export async function checkUnusedKeys(
  config: LangoJSConfig,
  patterns: string[] = ["**/*.{ts,tsx,js,jsx}"],
): Promise<{
  unusedKeys: string[];
  usedKeys: string[];
  totalKeys: number;
}> {
  const ignorePaths = config.ignorePaths ?? DEFAULT_IGNORE_PATHS;
  const files = await glob(patterns, {
    cwd: config.sourceRoot,
    ignore: ignorePaths,
    absolute: true,
  });

  // Collect all used keys from the codebase
  const usedKeysSet = new Set<string>();

  for (const file of files) {
    const extracted = extractFromFile(file);
    for (const item of extracted) {
      usedKeysSet.add(item.key);
    }
  }

  const data = readTranslations(config);
  const allKeys = Object.keys(data.translations);

  const usedKeys = allKeys.filter((key) => usedKeysSet.has(key));
  const unusedKeys = allKeys.filter((key) => !usedKeysSet.has(key));

  // Update the database with unused keys
  data.unusedKeys = unusedKeys;
  writeTranslations(config, data);

  return {
    unusedKeys,
    usedKeys,
    totalKeys: allKeys.length,
  };
}
