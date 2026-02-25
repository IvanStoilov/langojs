#!/usr/bin/env node
import { Command } from "commander";
import open from "open";
import { loadConfig, createServer } from "./server/index.js";

const program = new Command();

program
  .name("langojs")
  .description(
    "Translation management tool with GUI and AI-powered auto-translation",
  )
  .version("1.0.0");

program
  .command("serve", { isDefault: true })
  .description("Start the LangoJS GUI server")
  .option("-p, --port <port>", "Port to run the server on")
  .option("--no-open", "Don't open browser automatically")
  .action(async (options) => {
    try {
      const config = await loadConfig();
      const port = options.port
        ? parseInt(options.port, 10)
        : config.port || 4400;
      const { app } = await createServer({ ...config, port });

      const server = app.listen(port, () => {
        const url = `http://localhost:${port}`;
        console.log(`\n  LangoJS running at ${url}\n`);

        if (options.open !== false) {
          open(url);
        }
      });

      const shutdown = () => {
        console.log("\n  Shutting down...\n");
        server.close(() => {
          process.exit(0);
        });
      };

      process.on("SIGINT", shutdown);
      process.on("SIGTERM", shutdown);
    } catch (error) {
      console.error("Failed to start server:", error);
      process.exit(1);
    }
  });

program
  .command("extract")
  .description("Extract translation keys from codebase")
  .option("-p, --patterns <patterns...>", "Glob patterns to search", [
    "**/*.{ts,tsx,js,jsx}",
  ])
  .action(async (options) => {
    try {
      const { extractFromCodebase } =
        await import("./server/services/extractor.js");
      const config = await loadConfig();
      const result = await extractFromCodebase(config, options.patterns);

      console.log(`\n  Extraction complete:`);
      console.log(`    Found: ${result.extracted.length} translation calls`);
      console.log(`    Added: ${result.added} new keys`);
      console.log(`    Existing: ${result.existing} keys\n`);
    } catch (error) {
      console.error("Extraction failed:", error);
      process.exit(1);
    }
  });

program
  .command("generate")
  .description("Generate translation set files")
  .action(async () => {
    try {
      const { generateTranslationSets } =
        await import("./server/services/generator.js");
      const config = await loadConfig();
      const files = generateTranslationSets(config);

      console.log(`\n  Generated ${files.length} files:`);
      for (const file of files) {
        console.log(
          `    ${file.path} (${file.language}: ${file.keyCount} keys)`,
        );
      }
      console.log("");
    } catch (error) {
      console.error("Generation failed:", error);
      process.exit(1);
    }
  });

program
  .command("translate")
  .description("AI translate all missing strings")
  .action(async () => {
    try {
      if (!process.env.OPENAI_API_KEY) {
        console.error(
          "\n  Error: OPENAI_API_KEY environment variable is required\n",
        );
        process.exit(1);
      }

      const { translateMissingStrings } =
        await import("./server/services/translator.js");
      const config = await loadConfig();

      console.log("\n  Translating missing strings...\n");
      const results = await translateMissingStrings(config);

      console.log(`  Translated ${results.length} strings:`);
      for (const result of results) {
        console.log(
          `    ${result.key} [${result.language}]: ${result.translation}`,
        );
      }
      console.log("");
    } catch (error) {
      console.error("Translation failed:", error);
      process.exit(1);
    }
  });

program.parse();
