# Stateful Integration Lens

Use this lens when a change combines lifecycle states, async work, retries or fallbacks, time ordering, or several ways to identify the same entity.

1. Write the shortest event timeline that can explain the behavior, including creation, activation, persistence, retry, reply, timeout, and cleanup steps that matter. For every eligibility or ordering predicate, name the semantic event its boundary is meant to represent and verify that the code uses that event's authoritative timestamp and intended strictness; a nearby object's timestamp is not equivalent. Test alternate orderings instead of trusting call-site order at a glance.
2. Identify the canonical source of truth, identity, and episode boundary from the authoritative contract. Map each alternate field or lookup path to the record type and lifecycle state where it is valid. If several applicable paths represent the same entity, verify that per-path filtering or ranking cannot hide a globally newer or more authoritative candidate; do not broaden the path set beyond the supplied schema.
3. Distinguish loading, unavailable, error, empty, success, historical, and active states. Check precedence explicitly instead of inferring it from scattered booleans or nullable values.
4. Challenge fallbacks with prior workspace, account, request, history, episode, and legacy-data scenarios. A broad fallback must not turn unknown state into a consequential success such as cleared, authorized, paid, published, or deleted.
5. Inspect ownership across async boundaries: cancellation, request generation, idempotency, late responses, partial persistence, retries, and swallowed errors.
6. Compare tests with the model. End-state examples alone are insufficient when transition, race, timeline, or cross-path behavior is the risk; expect table-driven or adversarial regression coverage for the reachable invariant.
