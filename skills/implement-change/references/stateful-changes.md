# Stateful-Change Checkpoint

Before implementation, name only the dimensions that can change correctness:

- State axes and precedence, especially loading, unavailable, error, empty, success, historical, and active states.
- The canonical source of truth and identity or episode boundary. Do not rely on several partial identifiers when one authoritative relation can be recorded.
- Event order and ownership across requests, retries, persistence steps, queues, callbacks, or workspace/account switches.
- Fallback semantics. State which fallbacks are display-only and which may authorize, clear, charge, delete, publish, or otherwise make a consequential decision; consequential uncertainty should normally fail closed.
- A compact adversarial matrix covering prior episodes, stale responses, partial or legacy data, alternate matching paths, equal timestamps, and permission variants that are reachable for this change.

Turn the important invariants into table-driven, transition, timeline, or race regression coverage before or alongside the implementation. Prefer a first-class identity or state transition over increasingly broad inference and fallback logic.
