# LangoJS

A translation management tool for JavaScript projects featuring a web-based GUI, AI-powered auto-translation, and CLI commands for extracting and generating translation files.

## Installation

```bash
npm install langojs
# or
yarn add langojs
```

## Configuration

Create a `langojs.config.ts` file in your project root:

```typescript
import type { LangoJSConfig } from "langojs";

export default {
  masterLanguage: "en",
  availableLanguages: ["en", "es", "fr", "de"],
  aiModel: "gpt-4o",
  sourceRoot: "./src",
  dbPath: "./translations.json",
  port: 4400,
  getGroup: (key: string) => key.split("_")[0],
  sets: [
    {
      destination: "./src/locales",
      groups: ["app", "common"],
    },
  ],
} satisfies LangoJSConfig;
```

### Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `masterLanguage` | `string` | The primary language for translations (e.g., `"en"`) |
| `availableLanguages` | `string[]` | List of all supported languages |
| `aiModel` | `string` | OpenAI model for auto-translation (e.g., `"gpt-4o"`) |
| `sourceRoot` | `string` | Root directory to scan for translation keys |
| `dbPath` | `string` | Path to the translations JSON file (default: `./translations.json`) |
| `port` | `number` | Port for the GUI server (default: `4400`) |
| `getGroup` | `function` | Function to determine translation group from key |
| `sets` | `array` | Output configuration for generated translation files |

## Environment Variables

Create a `.env` file in your project root:

```
OPENAI_API_KEY=your-openai-api-key
```

The OpenAI API key is required for AI-powered auto-translation.

## CLI Commands

### Start the GUI

```bash
npx langojs serve
# or simply
npx langojs
```

Options:
- `-p, --port <port>` - Custom port number
- `--no-open` - Don't open browser automatically

### Extract Translation Keys

Scan your codebase for `t("key", "default value")` patterns and add them to the translations database:

```bash
npx langojs extract
```

Options:
- `-p, --patterns <patterns...>` - Custom glob patterns (default: `**/*.{ts,tsx,js,jsx}`)

### Generate Translation Files

Generate JSON files for each language based on your `sets` configuration:

```bash
npx langojs generate
```

### AI Translate Missing Strings

Automatically translate all missing strings using OpenAI:

```bash
npx langojs translate
```

## GUI Features

The web interface provides:

- **Translation List** - Sidebar showing all translation keys with status indicators
- **Status Filtering** - Filter by Missing, Partial, Pending, or Complete
- **Search** - Full-text search across keys and values
- **Inline Editing** - Edit translations directly in the browser
- **AI Translation** - Translate individual strings or all missing translations
- **Approval Workflow** - AI translations are marked as pending until approved
- **Batch Actions** - Extract keys, generate files, and translate all from the UI

### Translation Statuses

| Status | Description |
|--------|-------------|
| Missing (red) | Only master language has a value |
| Partial (yellow) | Some languages are missing translations |
| Pending (yellow icon) | AI-translated, awaiting approval |
| Complete (green) | All languages have translations |

## Usage in Code

Use the `t()` function pattern in your code for translations:

```typescript
// The extractor will find these patterns
t("app_welcome", "Welcome to our app")
t("common_save", "Save")
t("app_greeting", "Hello, {{name}}!")
```

Placeholders like `{{name}}` are preserved during AI translation.

## Database Format

Translations are stored in a JSON file (`translations.json`):

```json
{
  "translations": {
    "app_welcome": {
      "en": "Welcome to our app",
      "es": "Bienvenido a nuestra aplicacion",
      "fr": null,
      "de": null
    }
  },
  "pendingApproval": ["es:app_welcome"],
  "metadata": {
    "lastUpdated": "2024-01-01T00:00:00.000Z",
    "version": 1
  }
}
```

## License

MIT
