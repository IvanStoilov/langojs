import { Router } from "express";
import type { TranslateJSConfig } from "../../types/index.js";
import { generateTranslationSets } from "../services/generator.js";

export function createGenerateRouter(config: TranslateJSConfig): Router {
  const router = Router();

  router.post("/", (_req, res) => {
    try {
      const files = generateTranslationSets(config);

      res.json({
        success: true,
        data: {
          filesGenerated: files.length,
          files,
        },
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
