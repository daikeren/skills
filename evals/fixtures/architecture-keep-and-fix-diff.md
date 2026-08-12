# Intended behavior

The patch adds `auto | human_only` delivery policy while preserving existing per-client manual and temporary overrides.

- Published `WorkspaceDeliveryPolicy` is the only workspace policy source.
- Existing `ClientOverride` rows contain only real per-client lifecycle state.
- Immediate and queued delivery use the same effective decision semantics.
- A temporary handoff is active only at the time the turn is finally admitted.
- Existing provider claim, queue locking, retry, and transaction boundaries remain separate.

# Patch shape

```diff
+ @dataclass(frozen=True)
+ class DeliveryDecision:
+     mode: Literal["ai", "human"]
+     reason: Literal["workspace_policy", "manual", "temporary_handoff"]
+
+ def resolve_delivery(policy, override, at):
+     if override and override.source == "manual":
+         return DeliveryDecision("human", "manual")
+     if override and override.source == "temporary_handoff" and override.expires_at > at:
+         return DeliveryDecision("human", "temporary_handoff")
+     return DeliveryDecision("human" if policy.mode == "human_only" else "ai", "workspace_policy")

  def admit_immediate_turn(workspace, client, turn):
+     decision = resolve_delivery(
+         load_published_policy(workspace),
+         load_client_override_for_update(workspace, client),
+         clock.now(),
+     )
+     return persist_or_queue(turn, decision)

  def admit_queued_batch(batch):
+     decision = resolve_delivery(
+         load_published_policy_for_update(batch.workspace_id),
+         load_client_override_for_update(batch.workspace_id, batch.client_id),
+         batch.created_at,
+     )
+     return persist_or_queue_batch(batch, decision)

  def authorize_platform_reply(workspace, client, transcript):
+     decision = resolve_delivery(
+         load_published_policy(workspace),
+         load_client_override(workspace, client),
+         clock.now(),
+     )
+     return decision.mode == "human" and transcript.is_replyable
```

# Observed consequence

A batch created while a temporary handoff is active can be admitted after the handoff expires. The queued path passes `batch.created_at` to the shared resolver, so it still returns Human; final admission is required to use the current admission time. The published policy ownership, override representation, pure resolver, and separate transactional boundaries otherwise match the stated contract.

Review this as a bounded release candidate. Determine whether the defect needs a local repair or architectural rework.
