/** Publication contract for managed Lesson writers, not a map runtime filter. */
export const LESSON_COORDINATE_LIMITS = { latitude: 90, longitude: 180 } as const;

export type LessonCoordinatePublication = {
  id?: string;
  isActive: boolean;
  lessonMembershipRequested: boolean;
  latitude: number | null | undefined;
  longitude: number | null | undefined;
};

export function validateLessonMapEligibilityForPublication(input: LessonCoordinatePublication): void {
  if (input.lessonMembershipRequested === false) return;
  if (input.lessonMembershipRequested === true && input.isActive === false) return;
  if (input.lessonMembershipRequested !== true || input.isActive !== true ||
      typeof input.latitude !== "number" || !Number.isFinite(input.latitude) ||
      typeof input.longitude !== "number" || !Number.isFinite(input.longitude) ||
      Math.abs(input.latitude) > LESSON_COORDINATE_LIMITS.latitude ||
      Math.abs(input.longitude) > LESSON_COORDINATE_LIMITS.longitude) {
    throw new Error(`LESSON_COORDINATE_PUBLICATION_HOLD: ${input.id ?? "unknown location"} requires complete valid coordinates`);
  }
}

export type LessonPublicationLocation = {
  id: string;
  is_active: boolean;
  latitude: number | null;
  longitude: number | null;
};

/** Validate the entire resolved batch before any membership/program/schedule mutation. */
export function validateLessonPublicationLocations(locations: readonly LessonPublicationLocation[]): void {
  for (const location of locations) {
    validateLessonMapEligibilityForPublication({
      id: location.id,
      isActive: location.is_active,
      lessonMembershipRequested: true,
      latitude: location.latitude,
      longitude: location.longitude,
    });
  }
}

/** Equivalent SQL contract. Embedded packets are checked against this by regression tests. */
export function lessonCoordinatePublicationSqlGuard(): string {
  return `do $$
begin
  if exists (
    select 1 from public.gym_locations g
    join public.lesson_location_memberships m on m.location_id = g.id
    where g.is_active and (
      g.latitude is null or g.longitude is null
      or not (g.latitude between -${LESSON_COORDINATE_LIMITS.latitude} and ${LESSON_COORDINATE_LIMITS.latitude})
      or not (g.longitude between -${LESSON_COORDINATE_LIMITS.longitude} and ${LESSON_COORDINATE_LIMITS.longitude})
    )
  ) then
    raise exception 'LESSON_COORDINATE_PUBLICATION_HOLD: active Lesson location requires complete valid coordinates';
  end if;
end;
$$;`;
}
