import { programMaster, type ProgramBrand } from "@/lib/program-master";
import type { MapLocationLessonIndex, Program } from "@/lib/types";

export const standardProgramGenreNames = ["ヨガ", "ピラティス", "エアロビクス", "ステップ"] as const;

const canonicalSlugs: Readonly<Record<string, string>> = {
  BODYCOMBAT: "bodycombat",
  BODYPUMP: "bodypump",
  "BODYPUMP HEAVY": "bodypump-heavy",
  BODYATTACK: "bodyattack",
  BODYBALANCE: "bodybalance",
  BODYJAM: "bodyjam",
  BODYSTEP: "bodystep",
  RPM: "rpm",
  GRIT: "grit",
  "LES MILLS CORE": "les-mills-core",
  "LES MILLS SHAPES": "les-mills-shapes",
  "LES MILLS TONE": "les-mills-tone",
  "LES MILLS DANCE": "les-mills-dance",
  "FIGHT DO": "fight-do",
  UBOUND: "ubound",
  X55: "x55",
  OXIGENO: "oxigeno",
  "RADICAL POWER": "radical-power",
  リトモス: "ritmos",
  メガダンス: "megadanz",
  "Group Fight": "group-fight",
  "Group Power": "group-power",
  "Group Groove": "group-groove",
  "Group Blast": "group-blast",
  ZUMBA: "zumba",
  バイラバイラ: "baila-baila",
  ヨガ: "yoga",
  ピラティス: "pilates",
  エアロビクス: "エアロビクス",
  ステップ: "step",
};

const programPriority = [
  "BODYCOMBAT", "BODYPUMP", "BODYPUMP HEAVY", "BODYATTACK", "BODYBALANCE", "BODYJAM", "LES MILLS DANCE",
  "BODYSTEP", "RPM", "GRIT", "LES MILLS CORE", "LES MILLS SHAPES", "LES MILLS TONE",
  "FIGHT DO", "UBOUND", "メガダンス", "リトモス", "X55", "OXIGENO", "RADICAL POWER",
  "Group Fight", "Group Power", "Group Groove", "Group Blast", "ZUMBA", "バイラバイラ",
  ...standardProgramGenreNames,
];

export type ProgramCatalogGroupId = "les-mills" | "radical" | "mossa" | "other-brands" | "standard" | "other";

export type ProgramCatalogItem = {
  canonicalProgramName: string;
  displayName: string;
  slug: string;
  programBrand: ProgramBrand | null;
  facilityCount: number;
  weeklyLessonCount: number;
  databaseProgram: Program | null;
  searchTerms: string[];
};

export type ProgramCatalogGroup = {
  id: ProgramCatalogGroupId;
  label: string;
  description: string;
  items: ProgramCatalogItem[];
};

const groupDefinitions: ReadonlyArray<Omit<ProgramCatalogGroup, "items">> = [
  { id: "les-mills", label: "LES MILLS", description: "世界各地で展開されるグループフィットネスプログラム" },
  { id: "radical", label: "Radical Fitness", description: "ダンス、格闘技、コンディショニング系のブランドプログラム" },
  { id: "mossa", label: "MOSSA", description: "音楽と動きを組み合わせたグループフィットネス" },
  { id: "other-brands", label: "その他のブランド", description: "ZUMBA、BAILA BAILAなどのブランドプログラム" },
  { id: "standard", label: "定番ジャンル", description: "ジムをまたいで探しやすい定番のレッスンジャンル" },
  { id: "other", label: "その他", description: "GymMapで現在見つけられるレッスンプログラム" },
];

export function getCanonicalProgramSlug(canonicalProgramName: string) {
  return canonicalSlugs[canonicalProgramName] ?? canonicalProgramName.toLocaleLowerCase("en-US");
}

export function findCatalogMasterEntryBySlug(slug: string) {
  const normalizedSlug = decodeURIComponent(slug).trim().toLocaleLowerCase("en-US");
  return programMaster.find(
    (entry) => getCanonicalProgramSlug(entry.canonicalProgramName).toLocaleLowerCase("en-US") === normalizedSlug,
  ) ?? null;
}

function getGroupId(programBrand: ProgramBrand | null, canonicalProgramName: string): ProgramCatalogGroupId {
  if ((standardProgramGenreNames as readonly string[]).includes(canonicalProgramName)) return "standard";
  if (programBrand === "Les Mills") return "les-mills";
  if (programBrand === "Radical Fitness") return "radical";
  if (programBrand === "MOSSA") return "mossa";
  if (programBrand === "ZUMBA" || programBrand === "BAILA BAILA") return "other-brands";
  return "other";
}

function compareCatalogItems(left: ProgramCatalogItem, right: ProgramCatalogItem) {
  const leftPriority = programPriority.indexOf(left.canonicalProgramName);
  const rightPriority = programPriority.indexOf(right.canonicalProgramName);
  return (leftPriority < 0 ? Number.MAX_SAFE_INTEGER : leftPriority)
    - (rightPriority < 0 ? Number.MAX_SAFE_INTEGER : rightPriority)
    || right.facilityCount - left.facilityCount
    || left.displayName.localeCompare(right.displayName, "ja");
}

export function buildProgramCatalog(index: MapLocationLessonIndex[], databasePrograms: Program[]): ProgramCatalogGroup[] {
  const masterByCanonicalName = new Map(programMaster.map((entry) => [entry.canonicalProgramName, entry]));
  const programsByName = new Map(databasePrograms.map((program) => [program.name, program]));
  const aggregates = new Map<string, { facilityIds: Set<string>; weeklyLessonCount: number }>();

  for (const location of index) {
    for (const lesson of location.lessons) {
      const canonicalProgramName = lesson[1];
      if (!canonicalProgramName || !masterByCanonicalName.has(canonicalProgramName)) continue;
      const aggregate = aggregates.get(canonicalProgramName) ?? { facilityIds: new Set<string>(), weeklyLessonCount: 0 };
      aggregate.facilityIds.add(location.locationId);
      aggregate.weeklyLessonCount += lesson[3];
      aggregates.set(canonicalProgramName, aggregate);
    }
  }

  const items = Array.from(aggregates, ([canonicalProgramName, aggregate]) => {
    const master = masterByCanonicalName.get(canonicalProgramName)!;
    return {
      canonicalProgramName,
      displayName: canonicalProgramName,
      slug: getCanonicalProgramSlug(canonicalProgramName),
      programBrand: master.programBrand,
      facilityCount: aggregate.facilityIds.size,
      weeklyLessonCount: aggregate.weeklyLessonCount,
      databaseProgram: programsByName.get(canonicalProgramName) ?? null,
      searchTerms: Array.from(new Set([canonicalProgramName, ...master.searchAliases])),
    } satisfies ProgramCatalogItem;
  }).sort(compareCatalogItems);

  return groupDefinitions.flatMap((definition) => {
    const groupItems = items.filter((item) => getGroupId(item.programBrand, item.canonicalProgramName) === definition.id);
    return groupItems.length ? [{ ...definition, items: groupItems }] : [];
  });
}

export function flattenProgramCatalog(groups: ProgramCatalogGroup[]) {
  return groups.flatMap((group) => group.items);
}
