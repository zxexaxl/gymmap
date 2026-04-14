const defaultGeminiModelId = "gemini-3.1-flash-lite-preview";
const geminiApiBaseUrl = "https://generativelanguage.googleapis.com/v1beta/models";

export type GeminiUsageMetadata = {
  prompt_token_count: number | null;
  candidates_token_count: number | null;
  total_token_count: number | null;
  thoughts_token_count?: number | null;
  cached_content_token_count?: number | null;
  model_id?: string | null;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
    thoughtsTokenCount?: number;
    cachedContentTokenCount?: number;
  };
};

export class GeminiStructuredResponseError extends Error {
  rawResponseJson: string;
  rawResponseText: string | null;

  constructor(message: string, details?: { rawResponseJson?: string; rawResponseText?: string | null }) {
    super(message);
    this.name = "GeminiStructuredResponseError";
    this.rawResponseJson = details?.rawResponseJson ?? "";
    this.rawResponseText = details?.rawResponseText ?? null;
  }
}

export type GeminiStructuredJsonResult<T> = {
  data: T;
  rawResponseJson: string;
  rawResponseText: string;
  usageMetadata: GeminiUsageMetadata | null;
};

export function getGeminiModelId() {
  return process.env.GEMINI_MODEL_ID?.trim() || defaultGeminiModelId;
}

function normalizeGeminiUsageMetadata(rawUsageMetadata: GeminiResponse["usageMetadata"], modelId: string): GeminiUsageMetadata | null {
  if (!rawUsageMetadata) {
    return null;
  }

  return {
    prompt_token_count: rawUsageMetadata.promptTokenCount ?? null,
    candidates_token_count: rawUsageMetadata.candidatesTokenCount ?? null,
    total_token_count: rawUsageMetadata.totalTokenCount ?? null,
    thoughts_token_count: rawUsageMetadata.thoughtsTokenCount ?? null,
    cached_content_token_count: rawUsageMetadata.cachedContentTokenCount ?? null,
    model_id: modelId,
  };
}

function getGeminiApiKey() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  return apiKey;
}

export async function generateStructuredJsonFromGemini<T>({
  systemPrompt,
  userPrompt,
  responseSchema,
}: {
  systemPrompt: string;
  userPrompt: string;
  responseSchema: Record<string, unknown>;
}): Promise<T> {
  const result = await generateStructuredJsonFromGeminiWithDebug<T>({
    systemPrompt,
    userPrompt,
    responseSchema,
  });

  return result.data;
}

export async function generateStructuredJsonFromGeminiWithDebug<T>({
  systemPrompt,
  userPrompt,
  responseSchema,
}: {
  systemPrompt: string;
  userPrompt: string;
  responseSchema: Record<string, unknown>;
}): Promise<GeminiStructuredJsonResult<T>> {
  const apiKey = getGeminiApiKey();
  const modelId = getGeminiModelId();
  const endpoint = `${geminiApiBaseUrl}/${modelId}:generateContent?key=${apiKey}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.1,
      },
    }),
  });

  const rawResponseJson = await response.text();

  if (!response.ok) {
    throw new GeminiStructuredResponseError(
      `Gemini API request failed: ${response.status} ${response.statusText} ${rawResponseJson}`,
      { rawResponseJson },
    );
  }

  let json: GeminiResponse;

  try {
    json = JSON.parse(rawResponseJson) as GeminiResponse;
  } catch {
    throw new GeminiStructuredResponseError("Gemini API returned invalid JSON.", { rawResponseJson });
  }

  const text = json.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();

  if (!text) {
    throw new GeminiStructuredResponseError("Gemini API returned an empty structured response.", {
      rawResponseJson,
      rawResponseText: null,
    });
  }

  try {
    return {
      data: JSON.parse(text) as T,
      rawResponseJson,
      rawResponseText: text,
      usageMetadata: normalizeGeminiUsageMetadata(json.usageMetadata, modelId),
    };
  } catch {
    throw new GeminiStructuredResponseError("Gemini structured response could not be parsed as JSON.", {
      rawResponseJson,
      rawResponseText: text,
    });
  }
}
