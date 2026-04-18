# Safe Changes

## Change Scope Safety
- Do not change public interfaces unless required.
- Do not perform large rename operations unless explicitly requested.
- Do not add new dependencies unless necessary for the task.
- Do not rewrite code only for cosmetic cleanup.
- Keep the modification surface as small as possible.

## Cross-Cutting Changes
- If a change is likely to affect many modules, explain the reason before proceeding.

## Post-Implementation Checks
- Confirm build health.
- Confirm type errors are not introduced.
- Confirm imports are not broken.
- Check for likely regression risk in affected flows.

## Test Strategy
- If tests exist, run the narrowest relevant tests first.
- Expand to broader checks only when needed.
