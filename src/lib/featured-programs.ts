import { programMaster, type ProgramBrand } from "@/lib/program-master";

const supplementalFeaturedPrograms: ReadonlyArray<{ name: string; brand: ProgramBrand }> = [
  { name: "FIGHT DO", brand: "Radical Fitness" },
  { name: "UBOUND", brand: "Radical Fitness" },
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
