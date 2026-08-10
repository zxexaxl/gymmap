import { programMaster, type ProgramBrand } from "@/lib/program-master";

const supplementalFeaturedPrograms: ReadonlyArray<{ name: string; brand: ProgramBrand }> = [
  { name: "BODYBALANCE", brand: "Les Mills" },
  { name: "BODYSTEP", brand: "Les Mills" },
  { name: "FIGHT DO", brand: "Radical Fitness" },
  { name: "UBOUND", brand: "Radical Fitness" },
  { name: "X55", brand: "Radical Fitness" },
  { name: "OXIGENO", brand: "Radical Fitness" },
];

export const featuredProgramShortcuts: ReadonlyArray<{ name: string; query: string; brand: ProgramBrand }> = [
  { name: "BODYATTACK", query: "BODYATTACK", brand: "Les Mills" },
  { name: "BODYJAM", query: "BODYJAM", brand: "Les Mills" },
  { name: "BODYBALANCE", query: "BODYBALANCE", brand: "Les Mills" },
  { name: "BODYSTEP", query: "BODYSTEP", brand: "Les Mills" },
  { name: "X55", query: "X55", brand: "Radical Fitness" },
  { name: "OXIGENO", query: "OXIGENO", brand: "Radical Fitness" },
  { name: "Group Fight", query: "Group Fight", brand: "MOSSA" },
  { name: "Group Power", query: "Group Power", brand: "MOSSA" },
  { name: "Group Groove", query: "Group Groove", brand: "MOSSA" },
];

const featuredBrandByProgramName = new Map<string, ProgramBrand>([
  ...programMaster.flatMap((program) =>
    program.programBrand ? [[program.canonicalProgramName, program.programBrand] as const] : [],
  ),
  ...supplementalFeaturedPrograms.map(({ name, brand }) => [name, brand] as const),
]);

export const supplementalLandingProgramNames = supplementalFeaturedPrograms.map(({ name }) => name);

export function getFeaturedProgramBrand(programName: string): ProgramBrand | null {
  return featuredBrandByProgramName.get(programName) ?? null;
}
