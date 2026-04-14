import { loadEnvConfig } from "@next/env";

const trackedKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GEMINI_API_KEY",
  "GEMINI_MODEL_ID",
] as const;

const beforeLoad = new Map<string, string | undefined>(
  trackedKeys.map((key) => [key, process.env[key]]),
);

loadEnvConfig(process.cwd());

for (const key of trackedKeys) {
  const before = beforeLoad.get(key);
  const after = process.env[key];
  const source =
    before && before.trim().length > 0
      ? "shell"
      : after && after.trim().length > 0
        ? ".env.local"
        : "missing";

  process.env[`CODEX_ENV_SOURCE_${key}`] = source;
}
