import { Router } from "express";
import type { LangoJSConfig } from "../../types/index.js";
import {
  translateMissingStrings,
  translateSingleString,
} from "../services/translator.js";

export function createAIRouter(config: LangoJSConfig): Router {
  const router = Router();

  router.post("/", async (req, res) => {
    try {
      const { keys } = req.body as { keys?: string[] };

      if (!process.env.OPENAI_API_KEY) {
        res.status(400).json({
          success: false,
          error:
            "OPENAI_API_KEY environment variable is required for AI translation",
        });
        return;
      }

      const results = await translateMissingStrings(config, keys);

      res.json({
        success: true,
        data: {
          translated: results.length,
          results,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  router.post("/single", async (req, res) => {
    try {
      const { key, language } = req.body as { key: string; language: string };

      if (!process.env.OPENAI_API_KEY) {
        res.status(400).json({
          success: false,
          error:
            "OPENAI_API_KEY environment variable is required for AI translation",
        });
        return;
      }

      if (!key || !language) {
        res.status(400).json({
          success: false,
          error: "Both 'key' and 'language' are required",
        });
        return;
      }

      const result = await translateSingleString(config, key, language);

      if (result) {
        res.json({
          success: true,
          data: result,
        });
      } else {
        res.status(500).json({
          success: false,
          error: "Translation failed",
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  return router;
}
