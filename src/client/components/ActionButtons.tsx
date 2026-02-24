import { signal } from "@preact/signals";

interface ActionButtonsProps {
  onExtract: () => Promise<unknown>;
  onGenerate: () => Promise<unknown>;
  onTranslate: () => Promise<unknown>;
}

const loading = signal<string | null>(null);
const message = signal<{ type: "success" | "error"; text: string } | null>(
  null
);

export function ActionButtons({
  onExtract,
  onGenerate,
  onTranslate,
}: ActionButtonsProps) {
  const handleAction = async (
    action: string,
    fn: () => Promise<unknown>,
    successMessage: string
  ) => {
    loading.value = action;
    message.value = null;

    try {
      await fn();
      message.value = { type: "success", text: successMessage };
      setTimeout(() => {
        message.value = null;
      }, 3000);
    } catch (error) {
      message.value = {
        type: "error",
        text: error instanceof Error ? error.message : "Action failed",
      };
    } finally {
      loading.value = null;
    }
  };

  return (
    <div class="flex flex-col gap-2">
      <div class="flex gap-2">
        <button
          onClick={() =>
            handleAction("extract", onExtract, "Extraction complete!")
          }
          disabled={loading.value !== null}
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading.value === "extract" && <Spinner />}
          Extract
        </button>
        <button
          onClick={() =>
            handleAction("generate", onGenerate, "Files generated!")
          }
          disabled={loading.value !== null}
          class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading.value === "generate" && <Spinner />}
          Generate
        </button>
        <button
          onClick={() =>
            handleAction("translate", onTranslate, "AI translation complete!")
          }
          disabled={loading.value !== null}
          class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading.value === "translate" && <Spinner />}
          AI Translate
        </button>
      </div>
      {message.value && (
        <div
          class={`px-3 py-2 rounded text-sm ${
            message.value.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message.value.text}
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
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
  );
}
