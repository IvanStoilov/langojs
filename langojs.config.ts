import type { LangoJSConfig } from "./src/types/index.js";

const config: LangoJSConfig = {
  masterLanguage: "en",
  availableLanguages: ["en", "es", "fr", "de"],
  aiModel: "gpt-4o",
  sourceRoot: "/Users/ivan/pulso/webapp",
  dbPath: "./translations.json",
  port: 4400,
  getGroup: (key: string) => {
    const prefix = key.split("_")[0];
    if (
      ["common", "sign", "mail", "api", "fastTrack", "site", "store"].includes(
        prefix,
      )
    ) {
      return prefix;
    }
    return "web";
  },
  sets: [
    {
      destination: "./output/translations",
      groups: ["web", "common"],
    },
  ],
};

export default config;
