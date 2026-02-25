import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import type { LangoJSConfig } from "../../types/index.js";
import {
  readTranslations,
  writeTranslations,
  getPendingApprovalKey,
} from "./db.js";

interface TranslationResult {
  key: string;
  language: string;
  translation: string;
}

interface PendingTranslation {
  key: string;
  language: string;
  masterValue: string;
}

const BATCH_SIZE = 50;

export async function translateMissingStrings(
  config: LangoJSConfig,
  keys?: string[],
): Promise<TranslationResult[]> {
  const data = readTranslations(config);
  const results: TranslationResult[] = [];

  const keysToTranslate = keys || Object.keys(data.translations);

  // Collect all pending translations grouped by language
  const pendingByLanguage: Map<string, PendingTranslation[]> = new Map();

  for (const key of keysToTranslate) {
    const translations = data.translations[key];
    if (!translations) continue;

    const masterValue = translations[config.masterLanguage];
    if (!masterValue) continue;

    for (const lang of config.availableLanguages) {
      if (lang === config.masterLanguage) continue;
      if (translations[lang] !== null) continue;

      if (!pendingByLanguage.has(lang)) {
        pendingByLanguage.set(lang, []);
      }
      pendingByLanguage.get(lang)!.push({
        key,
        language: lang,
        masterValue,
      });
    }
  }

  // Process each language
  for (const [language, pending] of pendingByLanguage) {
    // Process in batches
    for (let i = 0; i < pending.length; i += BATCH_SIZE) {
      const batch = pending.slice(i, i + BATCH_SIZE);

      try {
        const batchResults = await translateBatch(config, batch, language);

        for (const result of batchResults) {
          data.translations[result.key][result.language] = result.translation;
          // Mark as pending approval
          const pendingKey = getPendingApprovalKey(result.language, result.key);
          if (!data.pendingApproval.includes(pendingKey)) {
            data.pendingApproval.push(pendingKey);
          }
          results.push(result);
        }

        // Save after each batch to preserve progress
        writeTranslations(config, data);
      } catch (error) {
        console.error(`Failed to translate batch to ${language}:`, error);
      }
    }
  }

  return results;
}

async function translateBatch(
  config: LangoJSConfig,
  batch: PendingTranslation[],
  targetLanguage: string,
): Promise<TranslationResult[]> {
  const results: TranslationResult[] = [];

  // Build the input object for the prompt
  const inputStrings: Record<string, string> = {};
  for (const item of batch) {
    inputStrings[item.key] = item.masterValue;
  }

  const { text } = await generateText({
    model: openai(config.aiModel),
    prompt: `Translate the following strings from ${config.masterLanguage} to ${targetLanguage}.

Important rules:
1. Preserve any placeholders like {{name}}, {{count}}, etc. exactly as they appear
2. Preserve any special formatting (e.g. markdown, HTML tags) exactly as they appear
3. Return ONLY a valid JSON object with the same keys, where values are the translations
4. Maintain the same tone and style for each string

Input JSON:
${JSON.stringify(inputStrings, null, 2)}

Output JSON:`,
  });

  try {
    // Extract JSON from the response (handle potential markdown code blocks)
    let jsonStr = text.trim();
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith("```")) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    const translations = JSON.parse(jsonStr) as Record<string, string>;

    for (const item of batch) {
      const translation = translations[item.key];
      if (translation && typeof translation === "string") {
        results.push({
          key: item.key,
          language: targetLanguage,
          translation: translation.trim(),
        });
      }
    }
  } catch (parseError) {
    console.error("Failed to parse batch translation response:", parseError);
    console.error("Response was:", text);
  }

  return results;
}

export async function translateSingleString(
  config: LangoJSConfig,
  key: string,
  targetLanguage: string,
): Promise<TranslationResult | null> {
  const data = readTranslations(config);
  const translations = data.translations[key];

  if (!translations) {
    throw new Error(`Translation key "${key}" not found`);
  }

  const masterValue = translations[config.masterLanguage];
  if (!masterValue) {
    throw new Error(`Master language value not found for key "${key}"`);
  }

  try {
    const { text } = await generateText({
      model: openai(config.aiModel),
      prompt: `Translate the following text from ${config.masterLanguage} to ${targetLanguage}.

Important rules:
1. Preserve any placeholders like {{name}}, {{count}}, etc. exactly as they appear
2. Preserve any special formatting (e.g. markdown, HTML tags) exactly as they appear
3. Only return the translated text, nothing else
4. Maintain the same tone and style

Text to translate: "${masterValue}"`,
    });

    const translatedText = text.trim();
    data.translations[key][targetLanguage] = translatedText;

    // Mark as pending approval
    const pendingKey = getPendingApprovalKey(targetLanguage, key);
    if (!data.pendingApproval.includes(pendingKey)) {
      data.pendingApproval.push(pendingKey);
    }

    writeTranslations(config, data);

    return {
      key,
      language: targetLanguage,
      translation: translatedText,
    };
  } catch (error) {
    console.error(`Failed to translate ${key} to ${targetLanguage}:`, error);
    return null;
  }
}
