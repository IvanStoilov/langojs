import { Router } from "express";
import type { LangoJSConfig, TranslationEntry } from "../../types/index.js";
import {
  readTranslations,
  writeTranslations,
  getPendingApprovalKey,
} from "../services/db.js";

export function createTranslationsRouter(config: LangoJSConfig): Router {
  const router = Router();

  router.get("/", (_req, res) => {
    try {
      const data = readTranslations(config);
      res.json({
        success: true,
        data: {
          translations: data.translations,
          pendingApproval: data.pendingApproval,
          metadata: data.metadata,
          config: {
            masterLanguage: config.masterLanguage,
            availableLanguages: config.availableLanguages,
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  router.put("/", (req, res) => {
    try {
      const { translations } = req.body as {
        translations: { [key: string]: TranslationEntry };
      };

      const data = readTranslations(config);
      data.translations = translations;
      writeTranslations(config, data);

      res.json({
        success: true,
        data: { updated: Object.keys(translations).length },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  router.patch("/:key", (req, res) => {
    try {
      const { key } = req.params;
      const { language, value } = req.body as {
        language: string;
        value: string | null;
      };

      const data = readTranslations(config);

      if (!data.translations[key]) {
        res.status(404).json({
          success: false,
          error: `Translation key "${key}" not found`,
        });
        return;
      }

      data.translations[key][language] = value;

      // Remove from pending approval when manually edited
      const pendingKey = getPendingApprovalKey(language, key);
      data.pendingApproval = data.pendingApproval.filter(
        (k) => k !== pendingKey,
      );

      writeTranslations(config, data);

      res.json({
        success: true,
        data: { key, language, value, pendingApproval: data.pendingApproval },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Approve a translation (remove from pending)
  router.post("/:key/approve", (req, res) => {
    try {
      const { key } = req.params;
      const { language } = req.body as { language: string };

      const data = readTranslations(config);

      if (!data.translations[key]) {
        res.status(404).json({
          success: false,
          error: `Translation key "${key}" not found`,
        });
        return;
      }

      const pendingKey = getPendingApprovalKey(language, key);
      data.pendingApproval = data.pendingApproval.filter(
        (k) => k !== pendingKey,
      );

      writeTranslations(config, data);

      res.json({
        success: true,
        data: { key, language, pendingApproval: data.pendingApproval },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  return router;
}
