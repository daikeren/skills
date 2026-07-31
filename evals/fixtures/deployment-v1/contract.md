# Model-deployment scheduling contract

The deployment API accepts an accepted release reference plus a requested
deployment specification containing an artifact URI, runtime class, and network
profile. Those request fields are valid input, not authoritative decisions.
`deployment.launch(release_ref=..., requested=..., request_id=...)` loads the
immutable accepted release in the deployment control plane and, before queuing,
validates tenant ownership, artifact signature and digest, allowed runtime
class, network policy, and equality with the accepted release. Mismatches are
rejected. The control-plane implementation is outside this bounded workspace.

`deployment.launch_unchecked(release_ref=..., requested=..., request_id=...)`
explicitly bypasses those validations and durably queues the requested artifact,
runtime, and network profile. It is reserved for isolated control-plane repair
and must not be reachable from this service.

Both operations are idempotent by request ID. Queue admission is serialized per
request ID, a request returns success only after durable admission, and one
request ID cannot execute more than one deployment job. The request runner may
retry after any exception.
