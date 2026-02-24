import { Router } from "express";
import type { TranslateJSConfig } from "../../types/index.js";
import { extractFromCodebase } from "../services/extractor.js";

export function createExtractRouter(config: TranslateJSConfig): Router {
  const router = Router();

  router.post("/", async (req, res) => {
    try {
      const { patterns } = req.body as { patterns?: string[] };
      const result = await extractFromCodebase(config, patterns);

      res.json({
        success: true,
        data: {
          totalFound: result.extracted.length,
          added: result.added,
          existing: result.existing,
          extracted: result.extracted,
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
