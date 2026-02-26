import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { extractFromFile, extractFromCodebase } from "../extractor.js";
import type { LangoJSConfig } from "../../../types/index.js";

const TEST_DIR = join(process.cwd(), ".test-fixtures");

describe("extractFromFile", () => {
  beforeAll(() => {
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterAll(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it("extracts simple t() calls with double quotes", () => {
    const filePath = join(TEST_DIR, "simple-double.tsx");
    writeFileSync(filePath, `const text = t("hello_world", "Hello, World!");`);

    const results = extractFromFile(filePath);

    expect(results).toHaveLength(1);
    expect(results[0].key).toBe("hello_world");
    expect(results[0].defaultValue).toBe("Hello, World!");
  });

  it("extracts simple t() calls with single quotes", () => {
    const filePath = join(TEST_DIR, "simple-single.tsx");
    writeFileSync(filePath, `const text = t('hello_world', 'Hello, World!');`);

    const results = extractFromFile(filePath);

    expect(results).toHaveLength(1);
    expect(results[0].key).toBe("hello_world");
    expect(results[0].defaultValue).toBe("Hello, World!");
  });

  it("extracts t() calls with backticks", () => {
    const filePath = join(TEST_DIR, "backticks.tsx");
    writeFileSync(filePath, "const text = t(`hello_world`, `Hello, World!`);");

    const results = extractFromFile(filePath);

    expect(results).toHaveLength(1);
    expect(results[0].key).toBe("hello_world");
    expect(results[0].defaultValue).toBe("Hello, World!");
  });

  it("extracts multiple t() calls from a file", () => {
    const filePath = join(TEST_DIR, "multiple.tsx");
    writeFileSync(
      filePath,
      `
const title = t("page_title", "Welcome");
const subtitle = t("page_subtitle", "This is the subtitle");
const button = t("button_submit", "Submit");
`,
    );

    const results = extractFromFile(filePath);

    expect(results).toHaveLength(3);
    expect(results[0].key).toBe("page_title");
    expect(results[1].key).toBe("page_subtitle");
    expect(results[2].key).toBe("button_submit");
  });

  it("extracts multiline t() calls", () => {
    const filePath = join(TEST_DIR, "multiline.tsx");
    writeFileSync(
      filePath,
      `
const text = t(
  "site_marquee_text",
  "Built for Small & Medium Rental Businesses · Only Features You Need"
);
`,
    );

    const results = extractFromFile(filePath);

    expect(results).toHaveLength(1);
    expect(results[0].key).toBe("site_marquee_text");
    expect(results[0].defaultValue).toBe(
      "Built for Small & Medium Rental Businesses · Only Features You Need",
    );
  });

  it("extracts t() calls with empty default value", () => {
    const filePath = join(TEST_DIR, "empty-value.tsx");
    writeFileSync(filePath, `const text = t("empty_key", "");`);

    const results = extractFromFile(filePath);

    expect(results).toHaveLength(1);
    expect(results[0].key).toBe("empty_key");
    expect(results[0].defaultValue).toBe(undefined);
  });

  it("extracts t() calls with key only (no default value)", () => {
    const filePath = join(TEST_DIR, "key-only.tsx");
    writeFileSync(filePath, `const text = t("common_transfer");`);

    const results = extractFromFile(filePath);

    expect(results).toHaveLength(1);
    expect(results[0].key).toBe("common_transfer");
    expect(results[0].defaultValue).toBeUndefined();
  });

  it("extracts both t(key) and t(key, default) calls", () => {
    const filePath = join(TEST_DIR, "mixed-args.tsx");
    writeFileSync(
      filePath,
      `
const a = t("key_with_default", "Default value");
const b = t("key_only");
const c = t('another_key');
const d = t("key_with_options", { count: 5 });
`,
    );

    const results = extractFromFile(filePath);

    expect(results).toHaveLength(4);
    expect(
      results.find((r) => r.key === "key_with_default")?.defaultValue,
    ).toBe("Default value");
    expect(
      results.find((r) => r.key === "key_only")?.defaultValue,
    ).toBeUndefined();
    expect(
      results.find((r) => r.key === "another_key")?.defaultValue,
    ).toBeUndefined();
    expect(
      results.find((r) => r.key === "key_with_options")?.defaultValue,
    ).toBeUndefined();
  });

  it("extracts t(key) with various spacing and newlines", () => {
    const filePath = join(TEST_DIR, "key-only-spacing.tsx");
    writeFileSync(
      filePath,
      `
const a = t("spaced_key"  );
const b = t(
  "multiline_key"
);
const c = t(  'single_quoted_key'  );
`,
    );

    const results = extractFromFile(filePath);

    expect(results).toHaveLength(3);
    expect(results.map((r) => r.key)).toContain("spaced_key");
    expect(results.map((r) => r.key)).toContain("multiline_key");
    expect(results.map((r) => r.key)).toContain("single_quoted_key");
  });

  it("only extracts keys with valid characters (letters, numbers, underscore, dash, dot)", () => {
    const filePath = join(TEST_DIR, "key-validation.tsx");
    writeFileSync(
      filePath,
      `
const valid1 = t("valid_key", "Valid");
const valid2 = t("valid-key", "Valid");
const valid3 = t("valid.key", "Valid");
const valid4 = t("ValidKey123", "Valid");
const valid5 = t("valid_key-with.all", "Valid");
const invalid1 = t("invalid key", "Has space");
const invalid2 = t("invalid/key", "Has slash");
const invalid3 = t("invalid@key", "Has at sign");
const invalid4 = t("invalid#key", "Has hash");
const invalid5 = t("invalid:key", "Has colon");
`,
    );

    const results = extractFromFile(filePath);

    expect(results).toHaveLength(5);
    expect(results.map((r) => r.key)).toContain("valid_key");
    expect(results.map((r) => r.key)).toContain("valid-key");
    expect(results.map((r) => r.key)).toContain("valid.key");
    expect(results.map((r) => r.key)).toContain("ValidKey123");
    expect(results.map((r) => r.key)).toContain("valid_key-with.all");
    // Invalid keys should not be extracted
    expect(results.map((r) => r.key)).not.toContain("invalid key");
    expect(results.map((r) => r.key)).not.toContain("invalid/key");
    expect(results.map((r) => r.key)).not.toContain("invalid@key");
    expect(results.map((r) => r.key)).not.toContain("invalid#key");
    expect(results.map((r) => r.key)).not.toContain("invalid:key");
  });

  it("handles t() with third argument (options object) correctly", () => {
    const filePath = join(TEST_DIR, "with-options.tsx");
    writeFileSync(
      filePath,
      `
const text = t("greeting", "Hello, {{name}}!", { name: userName });
const other = t("farewell", "Goodbye!");
`,
    );

    const results = extractFromFile(filePath);

    expect(results).toHaveLength(2);
    expect(results[0].key).toBe("greeting");
    expect(results[0].defaultValue).toBe("Hello, {{name}}!");
    expect(results[1].key).toBe("farewell");
    expect(results[1].defaultValue).toBe("Goodbye!");
  });

  it("does not cross quote boundaries between multiple t() calls", () => {
    const filePath = join(TEST_DIR, "no-cross-boundary.tsx");
    writeFileSync(
      filePath,
      `
<div className="form-field-wrapper">
  {signUp.error === "CREATE_FREE_TRIAL_EMAIL_IN_USE" ? (
    <p
      className="text-slate-700 text-sm p-4 rounded-xl bg-blue-50 border-2 border-blue-200"
      style={{ fontFamily: "'Inter', sans-serif" }}
      dangerouslySetInnerHTML={{
        __html: t(
          "site_createFreeTrial_email_in_use_error",
          'You have already used this email to create a free trial. <a class="text-blue-700 underline" href="https://app.pulsorent.com/login?email={{email}}">Log in Pulso</a> or <a class="text-blue-700 underline" href="https://app.pulsorent.com/external/reset-password?email={{email}}">reset your password</a> if you have forgotten it.',
          {
            email: encodeURIComponent(signupForm.getValues().email),
          }
        ),
      }}
    ></p>
  ) : (
    <p className="text-red-600 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
      {t(
        "site_createFreeTrial_generic_error",
        "An error occurred while creating your account. Please try again later."
      )}
    </p>
  )}
</div>
`,
    );

    const results = extractFromFile(filePath);

    expect(results).toHaveLength(2);
    expect(results[0].key).toBe("site_createFreeTrial_email_in_use_error");
    expect(results[0].defaultValue).toBe(
      `You have already used this email to create a free trial. <a class="text-blue-700 underline" href="https://app.pulsorent.com/login?email={{email}}">Log in Pulso</a> or <a class="text-blue-700 underline" href="https://app.pulsorent.com/external/reset-password?email={{email}}">reset your password</a> if you have forgotten it.`,
    );
    expect(results[1].key).toBe("site_createFreeTrial_generic_error");
    expect(results[1].defaultValue).toBe(
      "An error occurred while creating your account. Please try again later.",
    );
  });

  it("handles mixed quote types", () => {
    const filePath = join(TEST_DIR, "mixed-quotes.tsx");
    writeFileSync(
      filePath,
      `
const a = t("key_a", "Value A");
const b = t('key_b', 'Value B');
const c = t("key_c", 'Value C');
`,
    );

    const results = extractFromFile(filePath);

    expect(results).toHaveLength(3);
    expect(results[0].key).toBe("key_a");
    expect(results[0].defaultValue).toBe("Value A");
    expect(results[1].key).toBe("key_b");
    expect(results[1].defaultValue).toBe("Value B");
    expect(results[2].key).toBe("key_c");
    expect(results[2].defaultValue).toBe("Value C");
  });

  it("normalizes whitespace in multiline default values", () => {
    const filePath = join(TEST_DIR, "normalize-whitespace.tsx");
    writeFileSync(
      filePath,
      `
const text = t(
  "long_text",
  "This is a very long text
   that spans multiple lines
   and should be normalized"
);
`,
    );

    const results = extractFromFile(filePath);

    expect(results).toHaveLength(1);
    expect(results[0].defaultValue).toBe(
      "This is a very long text that spans multiple lines and should be normalized",
    );
  });

  it("reports correct line numbers", () => {
    const filePath = join(TEST_DIR, "line-numbers.tsx");
    writeFileSync(
      filePath,
      `// Line 1
// Line 2
const a = t("key_a", "Value A"); // Line 3
// Line 4
// Line 5
const b = t("key_b", "Value B"); // Line 6
`,
    );

    const results = extractFromFile(filePath);

    expect(results).toHaveLength(2);
    expect(results[0].line).toBe(3);
    expect(results[1].line).toBe(6);
  });

  it("ignores t() calls that are not translation functions", () => {
    const filePath = join(TEST_DIR, "ignore-non-translation.tsx");
    writeFileSync(
      filePath,
      `
const result = someObject.t("not_a_translation", "value");
const translation = t("real_translation", "Real value");
`,
    );

    const results = extractFromFile(filePath);

    // Should only match standalone t(), not someObject.t()
    expect(results).toHaveLength(1);
    expect(results[0].key).toBe("real_translation");
  });

  it("test #10", () => {
    const filePath = join(TEST_DIR, "ignore-non-translation.tsx");
    writeFileSync(
      filePath,
      `
        <TooltipSimple
          className="flex"
          text={
            !hasEmail
              ? t(
                  "booking_details_documents_send_missingEmail",
                  "Add the customer email, if you would like them to receive the document"
                )
              : doc.isSignable && !doc.signedAt && !doc.poNumber
                ? t(
                    "booking_details_documents_send_missingSignature",
                    "Cannot be sent because it is not signed yet."
                  )
                : doc.sentAt
                  ? t("booking_details_documents_send_sentAt", "The document was sent on {{date}}", {
                      date: formatDate(doc.sentAt),
                    })
                  : t("booking_details_documents_send_sendToCustomer", "Send the document to the customer")
          }
        >`,
    );

    const results = extractFromFile(filePath);

    // Should only match standalone t(), not someObject.t()
    expect(results).toHaveLength(4);
    expect(results[0].key).toBe("booking_details_documents_send_missingEmail");
    expect(results[0].defaultValue).toBe(
      "Add the customer email, if you would like them to receive the document",
    );
    expect(results[1].key).toBe(
      "booking_details_documents_send_missingSignature",
    );
    expect(results[1].defaultValue).toBe(
      "Cannot be sent because it is not signed yet.",
    );
    expect(results[2].key).toBe("booking_details_documents_send_sentAt");
    expect(results[2].defaultValue).toBe("The document was sent on {{date}}");
    expect(results[3].key).toBe(
      "booking_details_documents_send_sendToCustomer",
    );
    expect(results[3].defaultValue).toBe("Send the document to the customer");
  });
});

describe("extractFromCodebase", () => {
  const testConfig: LangoJSConfig = {
    masterLanguage: "en",
    availableLanguages: ["en", "es"],
    aiModel: "gpt-4o",
    sourceRoot: TEST_DIR,
    dbPath: join(TEST_DIR, "translations.json"),
    getGroup: (key: string) => key.split("_")[0],
    sets: [],
  };

  beforeAll(() => {
    mkdirSync(TEST_DIR, { recursive: true });
    mkdirSync(join(TEST_DIR, "components"), { recursive: true });
  });

  afterAll(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it("extracts translations from multiple files", async () => {
    writeFileSync(
      join(TEST_DIR, "page.tsx"),
      `const title = t("page_title", "Welcome");`,
    );
    writeFileSync(
      join(TEST_DIR, "components", "Button.tsx"),
      `const label = t("button_label", "Click me");`,
    );

    const result = await extractFromCodebase(testConfig);

    expect(result.extracted).toHaveLength(2);
    expect(result.extracted.map((e) => e.key)).toContain("page_title");
    expect(result.extracted.map((e) => e.key)).toContain("button_label");
  });

  it("respects glob patterns", async () => {
    writeFileSync(
      join(TEST_DIR, "include.tsx"),
      `const a = t("include_key", "Include");`,
    );
    writeFileSync(
      join(TEST_DIR, "exclude.js"),
      `const b = t("exclude_key", "Exclude");`,
    );

    const result = await extractFromCodebase(testConfig, ["**/*.tsx"]);

    expect(result.extracted.map((e) => e.key)).toContain("include_key");
    expect(result.extracted.map((e) => e.key)).not.toContain("exclude_key");
  });
});
