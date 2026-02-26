import { Router } from "express";
import type { LangoJSConfig } from "../../types/index.js";
import { extractFromCodebase, checkUnusedKeys } from "../services/extractor.js";

export function createExtractRouter(config: LangoJSConfig): Router {
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

  router.post("/check-unused", async (req, res) => {
    try {
      const { patterns } = req.body as { patterns?: string[] };
      const result = await checkUnusedKeys(config, patterns);

      res.json({
        success: true,
        data: {
          unusedKeys: result.unusedKeys,
          usedKeys: result.usedKeys,
          totalKeys: result.totalKeys,
          unusedCount: result.unusedKeys.length,
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
