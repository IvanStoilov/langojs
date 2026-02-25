import { useSignal } from "@preact/signals";
import type { TranslationStatus } from "../../types/index.js";

interface TranslationEditorProps {
  item: TranslationStatus | null;
  languages: string[];
  masterLanguage: string;
  pendingApproval: string[];
  onUpdate: (key: string, language: string, value: string | null) => void;
  onApprove: (key: string, language: string) => Promise<void>;
  onTranslateSingle: (key: string, language: string) => Promise<unknown>;
  onTranslateAll: () => Promise<unknown>;
  onExtract: () => Promise<unknown>;
  onGenerate: () => Promise<unknown>;
  onClearTranslations: (key: string) => Promise<void>;
}

export function TranslationEditor({
  item,
  languages,
  masterLanguage,
  pendingApproval,
  onUpdate,
  onApprove,
  onTranslateSingle,
  onTranslateAll,
  onExtract,
  onGenerate,
  onClearTranslations,
}: TranslationEditorProps) {
  const actionLoading = useSignal<string | null>(null);

  const handleAction = async (action: string, fn: () => Promise<unknown>) => {
    actionLoading.value = action;
    try {
      await fn();
    } finally {
      actionLoading.value = null;
    }
  };

  if (!item) {
    return (
      <div class="flex-1 flex flex-col">
        {/* Header with actions */}
        <header class="h-14 border-b border-gray-200 flex items-center justify-between px-6 bg-surface">
          <div></div>
          <div class="flex items-center gap-2">
            <button
              onClick={() => handleAction("extract", onExtract)}
              disabled={actionLoading.value !== null}
              class="btn-secondary flex items-center gap-2"
            >
              {actionLoading.value === "extract" && <Spinner />}
              <svg
                class="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Extract
            </button>
            <button
              onClick={() => handleAction("generate", onGenerate)}
              disabled={actionLoading.value !== null}
              class="btn-secondary flex items-center gap-2"
            >
              {actionLoading.value === "generate" && <Spinner />}
              <svg
                class="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Generate
            </button>
            <button
              onClick={() => handleAction("translateAll", onTranslateAll)}
              disabled={actionLoading.value !== null}
              class="btn-primary flex items-center gap-2"
            >
              {actionLoading.value === "translateAll" && <Spinner />}
              <svg
                class="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              AI Translate All
            </button>
          </div>
        </header>

        {/* Empty state */}
        <div class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <div class="w-16 h-16 rounded-full bg-[var(--color-surface-raised)] flex items-center justify-center mx-auto mb-4">
              <svg
                class="w-8 h-8 text-[var(--color-text-dim)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                />
              </svg>
            </div>
            <p class="text-[var(--color-text-muted)] text-sm">
              Select a translation to edit
            </p>
            <p class="text-[var(--color-text-dim)] text-xs mt-1">
              Or use the actions above to manage translations
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div class="flex-1 flex flex-col">
      {/* Header */}
      <header class="h-14 border-b border-[var(--color-border)] flex items-center justify-between px-6 bg-[var(--color-surface)]">
        <div class="flex items-center gap-3">
          <StatusBadge status={item.status} />
          <span class="font-mono text-sm text-[var(--color-text)]">
            {item.key}
          </span>
          <span class="text-xs text-[var(--color-text-dim)] uppercase tracking-wide">
            {item.group}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <button
            onClick={() => handleAction("extract", onExtract)}
            disabled={actionLoading.value !== null}
            class="btn-secondary flex items-center gap-2"
          >
            {actionLoading.value === "extract" && <Spinner />}
            Extract
          </button>
          <button
            onClick={() => handleAction("generate", onGenerate)}
            disabled={actionLoading.value !== null}
            class="btn-secondary flex items-center gap-2"
          >
            {actionLoading.value === "generate" && <Spinner />}
            Generate
          </button>
          <button
            onClick={() => handleAction("translateAll", onTranslateAll)}
            disabled={actionLoading.value !== null}
            class="btn-primary flex items-center gap-2"
          >
            {actionLoading.value === "translateAll" && <Spinner />}
            AI Translate All
          </button>
        </div>
      </header>

      {/* Editor content */}
      <div class="flex-1 overflow-y-auto p-6">
        <div class="max-w-2xl space-y-6 animate-fade-in">
          {languages.map((lang) => {
            const isPending = pendingApproval.includes(`${lang}:${item.key}`);
            return (
              <LanguageField
                key={lang}
                language={lang}
                value={item.translations[lang]}
                isMaster={lang === masterLanguage}
                isPending={isPending}
                translationKey={item.key}
                onUpdate={onUpdate}
                onApprove={onApprove}
                onTranslate={onTranslateSingle}
              />
            );
          })}

          {/* Clear translations button */}
          <div class="pt-4 border-t border-[var(--color-border)]">
            <button
              onClick={() =>
                handleAction("clear", () => onClearTranslations(item.key))
              }
              disabled={actionLoading.value !== null}
              class="btn-ghost text-[var(--color-error)] hover:bg-[var(--color-error)]/10 flex items-center gap-1.5"
            >
              {actionLoading.value === "clear" ? (
                <Spinner />
              ) : (
                <svg
                  class="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              )}
              Clear all translations
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface LanguageFieldProps {
  language: string;
  value: string | null;
  isMaster: boolean;
  isPending: boolean;
  translationKey: string;
  onUpdate: (key: string, language: string, value: string | null) => void;
  onApprove: (key: string, language: string) => Promise<void>;
  onTranslate: (key: string, language: string) => Promise<unknown>;
}

const intl = new Intl.DisplayNames(["en"], { type: "language" });

function LanguageField({
  language,
  value,
  isMaster,
  isPending,
  translationKey,
  onUpdate,
  onApprove,
  onTranslate,
}: LanguageFieldProps) {
  const isTranslating = useSignal(false);
  const isApproving = useSignal(false);
  const isEmpty = value === null || value === undefined || value === "";

  const handleBlur = (e: Event) => {
    const newValue = (e.target as HTMLTextAreaElement).value.trim() || null;
    if (newValue !== value) {
      onUpdate(translationKey, language, newValue);
    }
  };

  const handleTranslate = async () => {
    isTranslating.value = true;
    try {
      await onTranslate(translationKey, language);
    } finally {
      isTranslating.value = false;
    }
  };

  const handleApprove = async () => {
    isApproving.value = true;
    try {
      await onApprove(translationKey, language);
    } finally {
      isApproving.value = false;
    }
  };

  return (
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <label class="flex items-center gap-2">
          <span class=" inline-flex items-center gap-1 text-sm font-medium text-[var(--color-text)]">
            <Flag language={language} /> {intl.of(language) ?? language}
          </span>
          {isMaster && (
            <span class="text-[10px] px-1.5 py-0.5 rounded font-medium">
              MASTER
            </span>
          )}
          {isPending && !isMaster && (
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-warning)]/20 text-[var(--color-warning)] font-medium">
              PENDING
            </span>
          )}
          {isEmpty && !isMaster && (
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-error)]/20 text-[var(--color-error)] font-medium">
              MISSING
            </span>
          )}
        </label>
        <div class="flex items-center gap-2">
          {isPending && !isMaster && (
            <button
              onClick={handleApprove}
              disabled={isApproving.value}
              class="btn-ghost text-[var(--color-success)] hover:bg-[var(--color-success)]/10 flex items-center gap-1.5"
            >
              {isApproving.value ? (
                <Spinner />
              ) : (
                <svg
                  class="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
              Approve
            </button>
          )}
          {!isMaster && (
            <button
              onClick={handleTranslate}
              disabled={isTranslating.value}
              class="btn-ghost flex items-center gap-1.5"
            >
              {isTranslating.value ? (
                <Spinner />
              ) : (
                <svg
                  class="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              )}
              {isEmpty ? "AI Translate" : "Re-translate"}
            </button>
          )}
        </div>
      </div>
      <textarea
        class="translation-textarea"
        placeholder={isEmpty ? "Enter translation..." : ""}
        defaultValue={value || ""}
        onBlur={handleBlur}
        key={`${translationKey}-${language}-${value}`}
      />
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: "complete" | "partial" | "missing";
}) {
  const styles = {
    complete:
      "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20",
    partial:
      "bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/20",
    missing:
      "bg-[var(--color-error)]/10 text-[var(--color-error)] border-[var(--color-error)]/20",
  };

  const labels = {
    complete: "Complete",
    partial: "Partial",
    missing: "Missing",
  };

  return (
    <span
      class={`text-[10px] font-medium uppercase tracking-wide px-2 py-1 rounded border ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function Spinner() {
  return (
    <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
  );
}

function Flag({ language }: { language: string }) {
  let region: string | undefined;
  try {
    region = new Intl.Locale(language).maximize().region;
  } catch {
    region = undefined;
  }

  const flag = region
    ? String.fromCodePoint(
        ...[...region.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)),
      )
    : "🏳️";

  return <span className="text-lg">{flag}</span>;
}
