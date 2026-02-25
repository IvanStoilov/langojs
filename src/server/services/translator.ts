import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import type { LangoJSConfig } from "../../types/index.js";
import { readTranslations, writeTranslations } from "./db.js";

interface TranslationResult {
  key: string;
  language: string;
  translation: string;
}

export async function translateMissingStrings(
  config: LangoJSConfig,
  keys?: string[],
): Promise<TranslationResult[]> {
  const data = readTranslations(config);
  const results: TranslationResult[] = [];

  const keysToTranslate = keys || Object.keys(data.translations);

  for (const key of keysToTranslate) {
    const translations = data.translations[key];
    if (!translations) continue;

    const masterValue = translations[config.masterLanguage];
    if (!masterValue) continue;

    for (const lang of config.availableLanguages) {
      if (lang === config.masterLanguage) continue;
      if (translations[lang] !== null) continue;

      try {
        const { text } = await generateText({
          model: openai(config.aiModel),
          prompt: `Translate the following text from ${config.masterLanguage} to ${lang}.

Important rules:
1. Preserve any placeholders like {{name}}, {{count}}, etc. exactly as they appear
2. Only return the translated text, nothing else
3. Maintain the same tone and style

Text to translate: "${masterValue}"`,
        });

        const translatedText = text.trim();
        data.translations[key][lang] = translatedText;

        results.push({
          key,
          language: lang,
          translation: translatedText,
        });
      } catch (error) {
        console.error(`Failed to translate ${key} to ${lang}:`, error);
      }
    }
  }

  if (results.length > 0) {
    writeTranslations(config, data);
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
2. Only return the translated text, nothing else
3. Maintain the same tone and style

Text to translate: "${masterValue}"`,
    });

    const translatedText = text.trim();
    data.translations[key][targetLanguage] = translatedText;
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
