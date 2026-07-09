# Agent Instructions

This repository contains public, installable Agent Skills.

## Working Rules

- Start read-only: check current directory, repository state, and this file before editing.
- Keep the public core generic. Do not assume any specific repository host, issue tracker, package manager, framework, CI, or monorepo layout.
- Keep skills small, triggerable, and testable.
- Do not add per-skill README files. Use concise `SKILL.md` files plus optional shared references.
- Keep personal preferences out of public skills.
- Preserve user work and avoid unrelated cleanup.

## Validation

Run:

```bash
npm run validate
npm run eval
```

The repo intentionally uses zero runtime dependencies for validation scripts.
