# Subagent Briefs

Ask subagents for concise findings only. Budget each subagent to at most 5 findings and about 400 words. Require the format `[severity][confidence][likelihood][disposition] location/surface - issue`, followed by evidence, impact, and fix direction. Tell subagents to classify each item as a current defect/regression, missing validation, or optional improvement; keep impact severity separate from confidence, likelihood, and release disposition; and use `Blocking` only when concrete evidence of reachability or a missing required high-risk gate is cited. Do not pass your suspected findings unless asking a subagent to validate a specific concern. Useful briefs:

- Spec and product reviewer: compare the diff with the requested behavior; report missing requirements, wrong behavior, scope creep, and user-facing regressions.
- Standards and architecture reviewer: compare the diff with repo standards and local patterns; report boundary, contract, data-flow, complexity, or maintainability risks.
- Security and privacy reviewer: inspect trust boundaries and sensitive data paths; report authorization, exposure, logging, secrets, integration, public API, billing, or abuse risks.
- Operations and verification reviewer: inspect release safety; report migration, rollback, observability, queue, retry, external dependency, cost, and test gaps.
- State and temporal reviewer: for stateful changes, reconstruct the event timeline and state precedence; challenge canonical identity, async ownership, alternate matching paths, prior episodes, partial persistence, and fallback behavior. Fold this into the architecture or operations pass when concurrency is limited.
