export type ParsedGeminiDebugArtifacts = {
  parsedJson: string | null;
  parseErrorJson: string | null;
};

export function buildParsedGeminiDebugArtifacts(rawResponseText: string): ParsedGeminiDebugArtifacts {
  try {
    const parsed = JSON.parse(rawResponseText) as unknown;

    return {
      parsedJson: JSON.stringify(parsed, null, 2),
      parseErrorJson: null,
    };
  } catch (error) {
    return {
      parsedJson: null,
      parseErrorJson: JSON.stringify(
        {
          error: error instanceof Error ? error.message : String(error),
          raw_text_preview: rawResponseText.slice(0, 4000),
        },
        null,
        2,
      ),
    };
  }
}
