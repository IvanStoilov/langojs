import type { TranslationStatus } from "../../types/index.js";
import { TranslationRow } from "./TranslationRow";

interface TranslationTableProps {
  items: TranslationStatus[];
  languages: string[];
  masterLanguage: string;
  onUpdate: (key: string, language: string, value: string | null) => void;
  onTranslateSingle: (key: string, language: string) => Promise<unknown>;
}

export function TranslationTable({
  items,
  languages,
  masterLanguage,
  onUpdate,
  onTranslateSingle,
}: TranslationTableProps) {
  if (items.length === 0) {
    return (
      <div class="text-center py-12 text-gray-500">
        No translations found. Click "Extract" to scan your codebase.
      </div>
    );
  }

  return (
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gray-100">
          <tr>
            <th class="px-4 py-3 text-left text-sm font-semibold text-gray-900">
              Key
            </th>
            {languages.map((lang) => (
              <th
                key={lang}
                class="px-4 py-3 text-left text-sm font-semibold text-gray-900"
              >
                {lang.toUpperCase()}
                {lang === masterLanguage && (
                  <span class="ml-1 text-xs text-gray-500">(master)</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <TranslationRow
              key={item.key}
              item={item}
              languages={languages}
              masterLanguage={masterLanguage}
              onUpdate={onUpdate}
              onTranslateSingle={onTranslateSingle}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
