# Evidence-Amplification Checkpoint

When existing tests, tools, or inspection cannot settle a material implementation claim, consider a disposable verification probe before expanding or hardening the production change:

1. State the claim or invariant to challenge and the concrete observation that would falsify it.
2. Choose an isolated probe suited to the path: UI interaction harness, request replay, differential or adversarial input generator, load or concurrency probe, migration dry run, custom trace or debugger, or temporary lint or contract check. Apply this across frontend, backend, data, integration, and operational code rather than treating it as a UI-only technique.
3. Keep the retained production diff small and keep the probe separate when practical. Generate the probe because it improves evidence, not merely because code is cheap.
4. For consequential claims, compare against an independent oracle, invariant, known-good result, or separately derived implementation. Generated production code and generated verification may share the same failure mode.
5. Record the result, then discard or quarantine the probe by default. Promote it into durable tests or tooling only when ongoing value, reviewability, and maintenance cost justify retention.

Disposable verification supplements required human review, release gates, and durable regression coverage; it does not replace them. Skip this checkpoint when existing focused verification already answers the material question.
