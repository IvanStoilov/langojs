import { signal, computed } from "@preact/signals";
import type { TranslationEntry, TranslationStatus } from "../../types/index.js";

interface TranslationsState {
  translations: { [key: string]: TranslationEntry };
  masterLanguage: string;
  availableLanguages: string[];
  loading: boolean;
  error: string | null;
}

const state = signal<TranslationsState>({
  translations: {},
  masterLanguage: "en",
  availableLanguages: [],
  loading: true,
  error: null,
});

const searchQuery = signal("");

export const translationStatuses = computed<TranslationStatus[]>(() => {
  const { translations, masterLanguage, availableLanguages } = state.value;
  const query = searchQuery.value.toLowerCase();

  const statuses: TranslationStatus[] = Object.entries(translations).map(
    ([key, entry]) => {
      const missingCount = availableLanguages.filter(
        (lang) => entry[lang] === null || entry[lang] === undefined,
      ).length;

      let status: "complete" | "partial" | "missing";
      if (missingCount === availableLanguages.length - 1) {
        status = "missing";
      } else if (missingCount > 1) {
        status = "partial";
      } else {
        status = "complete";
      }

      const group = key.split("_")[0];

      return { key, translations: entry, status, group };
    },
  );

  const filtered = query
    ? statuses.filter(
        (s) =>
          s.key.toLowerCase().includes(query) ||
          Object.values(s.translations).some(
            (v) => v && v.toLowerCase().includes(query),
          ),
      )
    : statuses;

  return filtered.sort((a, b) => {
    const statusOrder = { missing: 0, partial: 1, complete: 2 };
    return statusOrder[a.status] - statusOrder[b.status];
  });
});

export function useTranslations() {
  const fetchTranslations = async () => {
    state.value = { ...state.value, loading: true, error: null };

    try {
      const response = await fetch("/api/translations");
      const result = await response.json();

      if (result.success) {
        state.value = {
          ...state.value,
          translations: result.data.translations,
          masterLanguage: result.data.config.masterLanguage,
          availableLanguages: result.data.config.availableLanguages,
          loading: false,
        };
      } else {
        state.value = {
          ...state.value,
          error: result.error,
          loading: false,
        };
      }
    } catch (error) {
      state.value = {
        ...state.value,
        error: error instanceof Error ? error.message : "Failed to fetch",
        loading: false,
      };
    }
  };

  const updateTranslation = async (
    key: string,
    language: string,
    value: string | null,
  ) => {
    try {
      const response = await fetch(
        `/api/translations/${encodeURIComponent(key)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language, value }),
        },
      );

      const result = await response.json();

      if (result.success) {
        state.value = {
          ...state.value,
          translations: {
            ...state.value.translations,
            [key]: {
              ...state.value.translations[key],
              [language]: value,
            },
          },
        };
      }
    } catch (error) {
      console.error("Failed to update translation:", error);
    }
  };

  const extractTranslations = async () => {
    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const result = await response.json();
      if (result.success) {
        await fetchTranslations();
        return result.data;
      }
      throw new Error(result.error);
    } catch (error) {
      console.error("Failed to extract:", error);
      throw error;
    }
  };

  const generateSets = async () => {
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();
      if (result.success) {
        return result.data;
      }
      throw new Error(result.error);
    } catch (error) {
      console.error("Failed to generate:", error);
      throw error;
    }
  };

  const translateAll = async () => {
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const result = await response.json();
      if (result.success) {
        await fetchTranslations();
        return result.data;
      }
      throw new Error(result.error);
    } catch (error) {
      console.error("Failed to translate:", error);
      throw error;
    }
  };

  const translateSingle = async (key: string, language: string) => {
    try {
      const response = await fetch("/api/translate/single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, language }),
      });

      const result = await response.json();
      if (result.success) {
        state.value = {
          ...state.value,
          translations: {
            ...state.value.translations,
            [key]: {
              ...state.value.translations[key],
              [language]: result.data.translation,
            },
          },
        };
        return result.data;
      }
      throw new Error(result.error);
    } catch (error) {
      console.error("Failed to translate:", error);
      throw error;
    }
  };

  const setSearch = (query: string) => {
    searchQuery.value = query;
  };

  return {
    state,
    searchQuery,
    translationStatuses,
    fetchTranslations,
    updateTranslation,
    extractTranslations,
    generateSets,
    translateAll,
    translateSingle,
    setSearch,
  };
}
