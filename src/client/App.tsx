import { useEffect } from "preact/hooks";
import { computed } from "@preact/signals";
import { useTranslations, translationStatuses } from "./hooks/useTranslations";
import { Sidebar } from "./components/Sidebar";
import { TranslationEditor } from "./components/TranslationEditor";

export function App() {
  const {
    state,
    searchQuery,
    selectedKey,
    statusFilter,
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
  } = useTranslations();

  useEffect(() => {
    fetchTranslations();
  }, []);

  // Global keyboard navigation for translation list
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        return;
      }

      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") {
        return;
      }

      const items = translationStatuses.value;
      if (items.length === 0) return;

      e.preventDefault();

      const currentKey = selectedKey.value;
      const currentIndex = currentKey
        ? items.findIndex((item) => item.key === currentKey)
        : -1;

      let newIndex: number;
      if (e.key === "ArrowUp") {
        newIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
      } else {
        newIndex = currentIndex >= items.length - 1 ? 0 : currentIndex + 1;
      }

      selectKey(items[newIndex].key);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const selectedItem = computed(() => {
    if (!selectedKey.value) return null;
    return translationStatuses.value.find((item) => item.key === selectedKey.value) || null;
  });

  if (state.value.loading) {
    return (
      <div class="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div class="flex items-center gap-3">
          <svg class="w-5 h-5 animate-spin text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span class="text-[var(--color-text-muted)] text-sm">Loading translations...</span>
        </div>
      </div>
    );
  }

  if (state.value.error) {
    return (
      <div class="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div class="text-center">
          <div class="w-12 h-12 rounded-full bg-[var(--color-error)]/10 flex items-center justify-center mx-auto mb-3">
            <svg class="w-6 h-6 text-[var(--color-error)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p class="text-[var(--color-error)] text-sm">{state.value.error}</p>
        </div>
      </div>
    );
  }

  const items = translationStatuses.value;
  const stats = {
    total: items.length,
    complete: items.filter((i) => i.status === "complete").length,
    partial: items.filter((i) => i.status === "partial").length,
    missing: items.filter((i) => i.status === "missing").length,
    pending: state.value.pendingApproval.length,
    unused: state.value.unusedKeys.length,
  };

  return (
    <div class="flex h-screen bg-[var(--color-bg)]">
      <Sidebar
        items={items}
        selectedKey={selectedKey}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        pendingApproval={state.value.pendingApproval}
        unusedKeys={state.value.unusedKeys}
        onSearch={setSearch}
        onSelect={selectKey}
        onFilterChange={setFilter}
        stats={stats}
      />
      <TranslationEditor
        item={selectedItem.value}
        languages={state.value.availableLanguages}
        masterLanguage={state.value.masterLanguage}
        pendingApproval={state.value.pendingApproval}
        onUpdate={updateTranslation}
        onApprove={approveTranslation}
        onApproveAll={approveAllForKey}
        onTranslateSingle={translateSingle}
        onTranslateAll={translateAll}
        onExtract={extractTranslations}
        onCheckUnused={checkUnused}
        onGenerate={generateSets}
        onClearTranslations={clearTranslations}
      />
    </div>
  );
}
