import { signal, computed } from "@preact/signals";
import type { TranslationEntry, TranslationStatus } from "../../types/index.js";

interface TranslationsState {
  translations: { [key: string]: TranslationEntry };
  groups: { [key: string]: string };
  pendingApproval: string[]; // Format: "language:key"
  unusedKeys: string[];
  masterLanguage: string;
  availableLanguages: string[];
  loading: boolean;
  error: string | null;
}

const state = signal<TranslationsState>({
  translations: {},
  groups: {},
  pendingApproval: [],
  unusedKeys: [],
  masterLanguage: "en",
  availableLanguages: [],
  loading: true,
  error: null,
});

const searchQuery = signal("");
const selectedKey = signal<string | null>(null);
const statusFilter = signal<
  "all" | "missing" | "partial" | "pending" | "complete" | "unused"
>("all");

export const translationStatuses = computed<TranslationStatus[]>(() => {
  const { translations, groups, masterLanguage, availableLanguages } =
    state.value;
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

      // Use group from backend, fallback to key prefix if not available
      const group = groups[key] || key.split("_")[0];

      return { key, translations: entry, status, group };
    },
  );

  const { pendingApproval, unusedKeys } = state.value;
  const filter = statusFilter.value;

  // Apply text search filter
  let filtered = query
    ? statuses.filter(
        (s) =>
          s.key.toLowerCase().includes(query) ||
          Object.values(s.translations).some(
            (v) => v && v.toLowerCase().includes(query),
          ),
      )
    : statuses;

  // Apply status filter
  if (filter !== "all") {
    filtered = filtered.filter((s) => {
      const hasPending = pendingApproval.some((p) => p.endsWith(`:${s.key}`));
      const isUnused = unusedKeys.includes(s.key);
      if (filter === "unused") return isUnused;
      if (filter === "pending") return hasPending;
      if (filter === "missing") return s.status === "missing";
      if (filter === "partial") return s.status === "partial";
      if (filter === "complete") return s.status === "complete" && !hasPending;
      return true;
    });
  }

  // Sort order: missing → partial → pending → complete
  return filtered.sort((a, b) => {
    const aHasPending = pendingApproval.some((p) => p.endsWith(`:${a.key}`));
    const bHasPending = pendingApproval.some((p) => p.endsWith(`:${b.key}`));

    const getOrder = (status: string, isPending: boolean) => {
      if (status === "missing") return 0;
      if (status === "partial") return 1;
      if (isPending) return 2;
      return 3; // complete
    };

    return getOrder(a.status, aHasPending) - getOrder(b.status, bHasPending);
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
          groups: result.data.groups || {},
          pendingApproval: result.data.pendingApproval || [],
          unusedKeys: result.data.unusedKeys || [],
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
        // Remove from pending approval on manual edit
        const pendingKey = `${language}:${key}`;
        state.value = {
          ...state.value,
          translations: {
            ...state.value.translations,
            [key]: {
              ...state.value.translations[key],
              [language]: value,
            },
          },
          pendingApproval: state.value.pendingApproval.filter(
            (k) => k !== pendingKey,
          ),
        };
      }
    } catch (error) {
      console.error("Failed to update translation:", error);
    }
  };

  const approveTranslation = async (key: string, language: string) => {
    try {
      const response = await fetch(
        `/api/translations/${encodeURIComponent(key)}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language }),
        },
      );

      const result = await response.json();

      if (result.success) {
        const pendingKey = `${language}:${key}`;
        state.value = {
          ...state.value,
          pendingApproval: state.value.pendingApproval.filter(
            (k) => k !== pendingKey,
          ),
        };
      }
    } catch (error) {
      console.error("Failed to approve translation:", error);
    }
  };

  const approveAllForKey = async (key: string) => {
    try {
      const response = await fetch(
        `/api/translations/${encodeURIComponent(key)}/approve-all`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );

      const result = await response.json();

      if (result.success) {
        state.value = {
          ...state.value,
          pendingApproval: result.data.pendingApproval,
        };

        // Auto-select the next pending key if available
        const nextPending = result.data.pendingApproval[0];
        if (nextPending) {
          selectKey(nextPending.split(":")[1]);
        }
      }
    } catch (error) {
      console.error("Failed to approve all translations:", error);
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

  const checkUnused = async () => {
    try {
      const response = await fetch("/api/extract/check-unused", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const result = await response.json();
      if (result.success) {
        state.value = {
          ...state.value,
          unusedKeys: result.data.unusedKeys,
        };
        return result.data;
      }
      throw new Error(result.error);
    } catch (error) {
      console.error("Failed to check unused:", error);
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
        // Add to pending approval for AI translations
        const pendingKey = `${language}:${key}`;
        const newPendingApproval = state.value.pendingApproval.includes(
          pendingKey,
        )
          ? state.value.pendingApproval
          : [...state.value.pendingApproval, pendingKey];

        state.value = {
          ...state.value,
          translations: {
            ...state.value.translations,
            [key]: {
              ...state.value.translations[key],
              [language]: result.data.translation,
            },
          },
          pendingApproval: newPendingApproval,
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

  const selectKey = (key: string | null) => {
    selectedKey.value = key;
  };

  const setFilter = (
    filter: "all" | "missing" | "partial" | "pending" | "complete" | "unused",
  ) => {
    statusFilter.value = filter;
  };

  const clearTranslations = async (key: string) => {
    const { masterLanguage, availableLanguages } = state.value;

    // Update all non-master languages to null
    for (const lang of availableLanguages) {
      if (lang !== masterLanguage) {
        await updateTranslation(key, lang, null);
      }
    }
  };

  return {
    state,
    searchQuery,
    selectedKey,
    statusFilter,
    translationStatuses,
    fetchTranslations,
    updateTranslation,
    approveTranslation,
    approveAllForKey,
    extractTranslations,
    checkUnused,
    generateSets,
    translateAll,
    translateSingle,
    setSearch,
    selectKey,
    setFilter,
    clearTranslations,
  };
}
