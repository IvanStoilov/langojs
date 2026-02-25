import type { LangoJSConfig } from "./src/types/index.js";

const config: LangoJSConfig = {
  masterLanguage: "en",
  availableLanguages: ["en", "es", "fr", "de"],
  aiModel: "gpt-4o",
  sourceRoot: "/Users/ivan/pulso/pulso-website",
  dbPath: "/Users/ivan/pulso/pulso-website/translations.json",
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
      destination: "/Users/ivan/pulso/webapp/packages/web/public/i18n",
      groups: ["web", "common", "fastTrack", "mail"],
    },
    {
      destination: "/Users/ivan/pulso/webapp/packages/sign/src/translations",
      groups: ["sign"],
    },
    {
      destination: "/Users/ivan/pulso/webapp/packages/mail/src/translations",
      groups: ["mail", "common"],
    },
    {
      destination: "/Users/ivan/pulso/webapp/packages/api/src/translations",
      groups: ["api", "common"],
    },
    {
      destination: "/Users/ivan/pulso/webapp/packages/site/translations",
      groups: ["site"],
    },
    {
      destination: "/Users/ivan/pulso/webapp/packages/store/public/i18n",
      groups: ["store", "common", "fastTrack"],
    },
    {
      destination: "/Users/ivan/pulso/webapp/packages/fast-track/public/i18n",
      groups: ["fastTrack", "sign", "common"],
    },
  ],
};

export default config;
