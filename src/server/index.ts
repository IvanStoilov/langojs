import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";
import type { LangoJSConfig } from "../types/index.js";
import { createTranslationsRouter } from "./routes/translations.js";
import { createExtractRouter } from "./routes/extract.js";
import { createGenerateRouter } from "./routes/generate.js";
import { createAIRouter } from "./routes/ai.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function loadConfig(): Promise<LangoJSConfig> {
  const configPaths = [
    join(process.cwd(), "langojs.config.ts"),
    join(process.cwd(), "langojs.config.js"),
    join(process.cwd(), "langojs.config.mjs"),
  ];

  for (const configPath of configPaths) {
    if (existsSync(configPath)) {
      const config = await import(configPath);
      return config.default as LangoJSConfig;
    }
  }

  throw new Error("No langojs.config.ts/js/mjs found in the current directory");
}

export async function createServer(config: LangoJSConfig) {
  const app = express();
  const port = config.port || 4400;

  app.use(cors());
  app.use(express.json());

  app.use("/api/translations", createTranslationsRouter(config));
  app.use("/api/extract", createExtractRouter(config));
  app.use("/api/generate", createGenerateRouter(config));
  app.use("/api/translate", createAIRouter(config));

  // Try multiple client paths: dist/client (when running from source) or ../client (when bundled)
  const clientPaths = [
    join(process.cwd(), "dist/client"),
    join(__dirname, "../../dist/client"),
    join(__dirname, "../client"),
  ];

  const clientPath = clientPaths.find(
    (p) => existsSync(p) && existsSync(join(p, "index.html")),
  );

  if (clientPath) {
    app.use(express.static(clientPath));
    app.get("/{*path}", (_req, res) => {
      res.sendFile(join(clientPath, "index.html"));
    });
  }

  return { app, port };
}

export async function startServer() {
  try {
    const config = await loadConfig();
    const { app, port } = await createServer(config);

    app.listen(port, () => {
      console.log(`LangoJS server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}
