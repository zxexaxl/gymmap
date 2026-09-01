# Lesson Search S1 — Structured Area Decision

## Baseline

- Base: `origin/main` at `149d419ff773bf3536a2914e0d13c7e2b4440afd`.
- Production: GitHub deployment `6200717552`, successful at the same SHA.
- Migration head: `0011_add_lesson_discovery_membership.sql`.
- Lesson authority: 369 positive memberships, 366 active, 358 mappable. Area search uses all 366 active members.
- Product/UI authority is closed; Map Polish P1–P4 is frozen; HYROX remains separate and unchanged.

## Current free-text contract

The single `area` query parameter is a case-insensitive substring filter over Lesson-member location name, slug, prefecture, city, and address. It has no autocomplete and no structured identity. Current result counts are `渋谷` 797, `港区` 260, and `東京都` 7,828 schedules. Submitting text without choosing a suggestion must retain this behavior.

## Available structured geography

`gym_locations.prefecture` and `gym_locations.city` are already exposed through positive `lesson_location_memberships`. All 366 active members have a prefecture; 336 have a city value; 30 have no city value. Some city values append neighborhood text, so the catalog derives only the first administrative city/ward prefix from `city`. It never parses `address_line` and never invents geography for blank or invalid city values.

## Implementation contract

- Area levels: prefecture and municipality/city/special ward.
- Catalog source: active positive Lesson members returned by `getLessonDiscoveryLocations`.
- Identity: explicit `prefecture` plus optional `municipality`; display strings are not identity.
- Matching: normalized exact/prefix matches before substring matches; bounded to six area suggestions and five store suggestions.
- Grouping: lightweight `エリア` followed by `店舗 / フリーワード` in the existing single field.
- Structured selection state: visible canonical label in `area`, explicit URL parameters `prefecture` and `municipality`.
- URL model: existing `area` URLs remain free text. Structured parameters are additive and shareable. When structured parameters exist, they are authoritative and `area` is display text only.
- Free-text fallback: submitting typed text without selecting an area preserves the existing area/store/address substring semantics.
- Clear/edit behavior: any manual edit, including clear, clears both hidden structured parameters immediately.
- Search execution: exact prefecture and derived municipality matching on the server. The existing membership-filtered legacy pagination path is used for structured searches because the current RPC accepts only opaque `p_area`; no database mutation is required.
- Result disclosure: structured searches are labeled `都道府県` or `市区町村`; free text remains labeled `エリア / 店舗`.
- Accessibility: WAI-ARIA combobox/listbox semantics, grouped labels, active descendant, Arrow Up/Down, Enter, Escape, Tab, pointer selection, and visible focus.

## Intended mutation set

- `docs/lesson-search-s1-structured-area-decision.md`
- `src/components/search/area-store-combobox.tsx`
- `src/components/search/search-form.tsx`
- `src/components/search/search-form.module.css`
- `src/app/page.tsx`
- `src/app/search/page.tsx`
- `src/lib/structured-area.ts`
- `src/lib/data.ts`
- `src/lib/types.ts`
- `src/lib/constants.ts`
- `src/lib/utils.ts`
- `src/lib/__tests__/structured-area.test.ts`
- focused existing Lesson search/UI tests where contracts change

Dependency delta: none. Migration/DB delta: none.
