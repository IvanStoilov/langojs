import type { TranslateJSConfig } from "./src/types/index.js";

const config: TranslateJSConfig = {
  masterLanguage: "en",
  availableLanguages: ["en", "es", "fr", "de"],
  aiModel: "gpt-4o",
  dbPath: "./translations.json",
  port: 4400,
  getGroup: (key: string) => key.split("_")[0],
  sets: [
    {
      destination: "./output/translations",
      groups: ["app", "common"],
    },
  ],
};

export default config;
