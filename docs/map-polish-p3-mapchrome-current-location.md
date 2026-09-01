# GymMap Map Polish P3 — Current-location MapChrome

## Decision record

### Current problem

The current-location action is wrapped in a second card surface. On desktop the idle surface is approximately 264 × 110 px (8.3% of the Lesson map), while at 390 px it is 164 × 62 px (10.5% of the map). In the 390 px selected state, the top chrome and bottom selection sheet leave only a narrow central band of unobstructed geography. The action remains useful, but its instructional shell competes with the map.

### Option A — compact inline hint

Keep a short hint beside or immediately below the existing button. This preserves explicit guidance, but retains two visual objects and can crowd the mobile corner.

### Option B — compact floating pill

Turn the whole surface into one restrained action pill. This is discoverable and smaller, but an always-present banner can still read as promotional chrome rather than a map utility.

### Option C — control-first with contextual status

Use the existing 44 px action as the complete idle presentation, with action-oriented copy. Render a compact status surface only while requesting or when denial/error recovery needs explanation. This removes redundant idle instruction without adding onboarding state or persistence.

### Chosen option

Option C. It produces the smallest idle obstruction, retains one obvious action, and uses the existing lifecycle state to reveal explanation only when it is useful.

### Copy

Idle action: `現在地から探す`.

Existing requesting, success, denied, unavailable, stale, and refreshing messages remain owned by the existing domain state machines and are not rewritten by P3.

### Idle state

Show one 44 px secondary action with the existing location glyph. Do not render a separate paragraph or extra tab stop.

### Loading state

Keep the existing disabled/loading button semantics and `現在地を取得中` label. Show the existing polite live status in a compact surface below the action.

### Success state

Unchanged: Lesson and HYROX set `obtained`, render the current-location marker, move the map, preserve list/selection semantics, and remove MapChrome.

### Denied / error state

Keep the existing recovery button labels and domain-owned messages. Unlike the idle hint, the message remains visibly available on mobile and desktop because it explains corrective action.

### Dismiss model

None. The idle control is compact enough not to need dismissal. No persistence or onboarding mechanism is introduced.

### M0 compatibility

No permission timing, Geolocation API call, camera behavior, current-location marker, selection, URL, list ordering, or provider behavior changes. Only shared `MapChrome` presentation changes.

### Accessibility model

The action remains a native button with a minimum 44 px target, keyboard activation, disabled/loading semantics, and existing focus-visible behavior. Idle guidance is carried by the accessible button name. Non-idle status remains `aria-live="polite"` and is referenced with `aria-describedby`. Decorative chrome adds no focus target.

## Current state matrix

| State | Control | Guidance/status | Persistence and announcement |
| --- | --- | --- | --- |
| `not_requested` / user has not acted | Visible, enabled | Existing explanatory paragraph; hidden by current mobile CSS | No dismissal or persistence; polite live region exists |
| `requesting` | Visible, disabled/loading | `現在地を取得しています…` | Polite live region; transient |
| `obtained` / available | MapChrome removed | No chrome message; current-location marker is shown | Component state only; remount resets |
| `denied` | Visible recovery control | Browser-setting guidance | Polite live region; component state only |
| `unavailable` / geolocation error | Visible retry control | Domain-specific error/retry guidance | Polite live region; component state only |
| `stale` | Visible update control | Existing failure guidance while the prior position remains | Polite live region; component state only |
| returning / remounted | Returns to `not_requested` | Idle guidance returns | No localStorage, cookie, or account persistence |

`granted` and `refreshing` labels exist in the shared presentation type but are not currently emitted by the Lesson or HYROX state machines.

## Mutation boundary

- `src/components/map/map-presentation.tsx`
- `src/components/map/map-presentation.module.css`
- `src/lib/__tests__/mapchrome-current-location.test.ts`
- this decision/evidence document

Protected map, marker, geolocation handler, domain loader, membership, HYROX data, and database paths are intentionally excluded.

## Baseline evidence

Production-equivalent measurements were taken before implementation:

| View | Map | Idle chrome | Approx. map area |
| --- | ---: | ---: | ---: |
| Lesson desktop 1440 | 629 × 558 | 264 × 110 | 8.3% |
| Lesson 390 | 303 × 320 | 164 × 62 | 10.5% |
| Lesson 430 | 343 × 320 | 164 × 62 | 9.3% |
| HYROX desktop 1440 | 629 × 618 | 264 × 110 | 7.5% |
| HYROX 390 | 315 × 538 | 164 × 62 | 6.0% |

On Lesson 390 with a selected facility, the 62 px top chrome and approximately 184 px bottom sheet leave only about 74 px of the 320 px map height outside those two chrome regions. There is no direct overlap, but the map is visually compressed between them.

Baseline captures are under `p3-mapchrome/baseline` in the task visualization directory. They cover Lesson desktop/390/430, Lesson 390 selected, HYROX desktop, and HYROX 390.

## Three-option visual study

Each bounded option was captured at desktop idle, 390 idle, and 390 selected under `p3-mapchrome/variants` in the task visualization directory. These are explicitly isolated visual prototypes anchored to the production measurements; they do not exercise geolocation or domain behavior.

- A retains the most explicit explanation, but the two-part surface still competes with the selected state.
- B is compact, but its longer permanent label reads as a floating banner on mobile.
- C retains the same practical target while giving the most map area and the clearest selected-facility hierarchy.

Option C is the recommended implementation candidate.

## Local runtime note

The repository root route currently enters a development reload loop because `fetchLessonSearchIndex` exceeds Next.js' 2 MB development data-cache item limit (3,154,379 bytes). This predates and is outside the P3 files. The P3 candidate therefore uses production baseline captures, isolated comparison prototypes, source-contract tests, typecheck/lint, and a production build rather than claiming a successful local root-route interaction run.
