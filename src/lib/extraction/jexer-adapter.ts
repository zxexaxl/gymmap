export type ExtractionAdapterId = "generic_discovery" | "jexer_shared_schedule";

export function buildJexerSharedScheduleUrl(shopId: number) {
  return `https://www.jexer.jp/schedule/fitness/?shop=${shopId}`;
}
