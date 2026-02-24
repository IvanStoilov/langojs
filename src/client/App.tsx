import { useEffect } from "preact/hooks";
import { useTranslations, translationStatuses } from "./hooks/useTranslations";
import { TranslationTable } from "./components/TranslationTable";
import { SearchBox } from "./components/SearchBox";
import { ActionButtons } from "./components/ActionButtons";

export function App() {
  const {
    state,
    searchQuery,
    fetchTranslations,
    updateTranslation,
    extractTranslations,
    generateSets,
    translateAll,
    translateSingle,
    setSearch,
  } = useTranslations();

  useEffect(() => {
    fetchTranslations();
  }, []);

  if (state.value.loading) {
    return (
      <div class="min-h-screen flex items-center justify-center">
        <div class="text-gray-500">Loading translations...</div>
      </div>
    );
  }

  if (state.value.error) {
    return (
      <div class="min-h-screen flex items-center justify-center">
        <div class="text-red-500">Error: {state.value.error}</div>
      </div>
    );
  }

  const items = translationStatuses.value;
  const stats = {
    total: items.length,
    complete: items.filter((i) => i.status === "complete").length,
    partial: items.filter((i) => i.status === "partial").length,
    missing: items.filter((i) => i.status === "missing").length,
  };

  return (
    <div class="min-h-screen bg-gray-50">
      <header class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 py-4">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">TranslateJS</h1>
              <p class="text-sm text-gray-500">
                {stats.total} keys &middot;{" "}
                <span class="text-green-600">{stats.complete} complete</span>{" "}
                &middot;{" "}
                <span class="text-yellow-600">{stats.partial} partial</span>{" "}
                &middot;{" "}
                <span class="text-red-600">{stats.missing} missing</span>
              </p>
            </div>
            <ActionButtons
              onExtract={extractTranslations}
              onGenerate={generateSets}
              onTranslate={translateAll}
            />
          </div>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-4 py-6">
        <div class="mb-4">
          <SearchBox value={searchQuery.value} onChange={setSearch} />
        </div>

        <div class="bg-white rounded-lg shadow">
          <TranslationTable
            items={items}
            languages={state.value.availableLanguages}
            masterLanguage={state.value.masterLanguage}
            onUpdate={updateTranslation}
            onTranslateSingle={translateSingle}
          />
        </div>
      </main>
    </div>
  );
}
