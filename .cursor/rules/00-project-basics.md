# Project Basics

## Goal
- Understand project intent, major modules, and runtime boundaries before making changes.
- Identify key directories, entrypoints, routing, API layer, schema/model definitions, and configuration flow.

## First Files to Inspect
- `README.md`
- One package manifest: `package.json`, `pyproject.toml`, `Cargo.toml`, or `go.mod`
- Main app entrypoint(s)
- Routing files
- API layer files
- Schema/model files
- Core config files

## Commands to Confirm Early
- Install dependencies
- Start local development
- Build production artifacts
- Run tests
- Run lint
- Run typecheck

## Execution Rule
- Prefer commands and workflows already defined in `README.md` and existing scripts.
- Do not invent a parallel setup if a project-standard path already exists.
