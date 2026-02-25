import { useSignal } from "@preact/signals";
import type { TranslationStatus } from "../../types/index.js";
import { StatusBadge } from "./StatusBadge";

interface TranslationRowProps {
  item: TranslationStatus;
  languages: string[];
  masterLanguage: string;
  onUpdate: (key: string, language: string, value: string | null) => void;
  onTranslateSingle: (key: string, language: string) => Promise<unknown>;
}

export function TranslationRow({
  item,
  languages,
  masterLanguage,
  onUpdate,
  onTranslateSingle,
}: TranslationRowProps) {
  const editingCell = useSignal<string | null>(null);
  const translatingCell = useSignal<string | null>(null);

  const handleBlur = (language: string, value: string) => {
    const newValue = value.trim() || null;
    if (newValue !== item.translations[language]) {
      onUpdate(item.key, language, newValue);
    }
    editingCell.value = null;
  };

  const handleTranslate = async (language: string) => {
    translatingCell.value = language;
    try {
      await onTranslateSingle(item.key, language);
    } finally {
      translatingCell.value = null;
    }
  };

  return (
    <tr class="border-b border-gray-200 hover:bg-gray-50">
      <td class="px-4 py-3 font-mono text-sm">
        <div class="flex items-center gap-2">
          <StatusBadge status={item.status} />
          <span class="text-gray-900">{item.key}</span>
          <span class="text-gray-400 text-xs">({item.group})</span>
        </div>
      </td>
      {languages.map((lang) => {
        const value = item.translations[lang];
        const isEmpty = value === null || value === undefined;
        const isMaster = lang === masterLanguage;
        const isEditing = editingCell.value === `${item.key}-${lang}`;
        const isTranslating = translatingCell.value === lang;

        return (
          <td key={lang} class="px-4 py-3">
            <div class="flex items-center gap-1">
              {isEditing ? (
                <input
                  type="text"
                  defaultValue={value || ""}
                  onBlur={(e) =>
                    handleBlur(lang, (e.target as HTMLInputElement).value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleBlur(lang, (e.target as HTMLInputElement).value);
                    }
                    if (e.key === "Escape") {
                      editingCell.value = null;
                    }
                  }}
                  class="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                />
              ) : (
                <div
                  onClick={() => {
                    editingCell.value = `${item.key}-${lang}`;
                  }}
                  class={`flex-1 px-2 py-1 rounded cursor-text min-h-[28px] ${
                    isEmpty
                      ? "bg-red-50 border border-red-200 text-red-400 italic"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {isEmpty ? "Empty" : value}
                </div>
              )}
              {isEmpty && !isMaster && !isEditing && (
                <button
                  onClick={() => handleTranslate(lang)}
                  disabled={isTranslating}
                  class="p-1 text-purple-600 hover:bg-purple-100 rounded disabled:opacity-50"
                  title="AI Translate"
                >
                  {isTranslating ? (
                    <svg
                      class="animate-spin h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        class="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="4"
                      />
                      <path
                        class="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  ) : (
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </td>
        );
      })}
    </tr>
  );
}
