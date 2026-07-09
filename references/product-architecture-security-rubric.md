# Product, Architecture, and Security Rubric

Use this rubric for product and engineering planning or review. Apply only the sections relevant to the task.

## Product Surface

- User workflow: the change supports the actual user job and avoids unnecessary steps.
- Clarity: labels, states, errors, and empty/loading paths make the system understandable.
- Trust: permissions, billing, data use, destructive actions, and AI behavior are visible enough for users to make informed choices.
- Accessibility: keyboard, screen reader, contrast, motion, focus, and touch targets are not regressed.
- Support burden: edge cases have sane recovery paths and do not create avoidable manual support.

## Architecture and Maintainability

- Boundaries: ownership, module seams, API contracts, and data flow remain clear.
- Simplicity: the solution reuses existing patterns and avoids speculative abstractions.
- Compatibility: migrations, schema changes, API versions, and client/server contracts are sequenced safely.
- Reliability: retries, timeouts, idempotency, partial failure, observability, and recovery are considered when relevant.
- Scaling: hot paths, data size, fanout, queues, and external services are appropriate for expected load.

## Security and Privacy

- Authentication and authorization: every sensitive action checks the right subject, resource, and scope.
- Trust boundaries: untrusted input, webhooks, third-party APIs, generated content, and admin surfaces are validated.
- Sensitive data: collection, retention, logging, export, deletion, and exposure are minimized.
- Abuse cases: rate limits, enumeration, replay, injection, privilege escalation, and billing abuse are considered.
- Compliance: consent, policy, auditability, and data residency are addressed when the domain requires them.

## Operations, Cost, and Team Speed

- Rollout: feature flags, migrations, backfills, monitoring, and rollback paths fit the risk.
- Cost: compute, storage, tokens, vendor fees, queues, and support load are visible.
- Verification: tests and manual checks cover the riskiest behavior, not just happy paths.
- Team speed: the change is reviewable, independently releasable, and does not create avoidable coordination debt.
