export interface TranslationEntry {
  [language: string]: string | null;
}

export interface TranslationsData {
  translations: {
    [key: string]: TranslationEntry;
  };
  pendingApproval: string[]; // Format: "language:key" e.g. "es:app_welcome"
  unusedKeys: string[]; // Keys not found in the codebase
  metadata: {
    lastUpdated: string;
    version: number;
  };
}

export interface LangoJSConfig {
  masterLanguage: string;
  availableLanguages: string[];
  aiModel: string;
  sourceRoot: string;
  dbPath?: string;
  port?: number;
  ignorePaths?: string[];
  getGroup: (key: string) => string;
  sets: Array<{
    destination: string;
    groups: string[];
  }>;
}

export interface ExtractedTranslation {
  key: string;
  defaultValue?: string;
  file: string;
  line: number;
}

export interface TranslationStatus {
  key: string;
  translations: TranslationEntry;
  status: "complete" | "partial" | "missing";
  group: string;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
