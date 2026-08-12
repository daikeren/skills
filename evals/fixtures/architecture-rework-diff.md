# Intended behavior

The patch adds a published workspace delivery policy, `auto | human_only`.

- The current published workspace configuration is the authoritative policy.
- Existing `ClientOverride` rows remain the authoritative per-client manual or temporary override.
- Immediate and queued delivery must make the same effective Human-versus-AI decision.
- A client created after publication must immediately follow the current workspace policy.
- Human platform replies remain allowed when a replyable transcript exists.
- There is no current requirement for assignment, acknowledgement, SLA tracking, or a durable human-reply queue.

# Patch shape

```diff
+ class ClientDeliveryState(Model):
+     workspace_id: UUID
+     client_id: UUID
+     mode: str
+     source: str  # workspace_policy | manual | temporary_handoff
+     expires_at: datetime | None

  def publish_workspace(workspace, draft):
      published = save_published_configuration(workspace, draft)
+     for client in workspace.clients.all():
+         ClientDeliveryState.update_or_create(
+             workspace_id=workspace.id,
+             client_id=client.id,
+             defaults={"mode": published.delivery_mode, "source": "workspace_policy"},
+         )
      return published

  def admit_immediate_turn(workspace, client, turn):
+     state = ClientDeliveryState.filter(workspace_id=workspace.id, client_id=client.id).first()
+     if state is None:
+         return queue_ai(turn)
+     if state.mode == "human_only" or state.source == "manual":
+         return persist_for_human(turn)
+     return queue_ai(turn)

  def admit_queued_batch(batch):
+     state = ClientDeliveryState.filter(
+         workspace_id=batch.workspace_id,
+         client_id=batch.client_id,
+         source__in=["workspace_policy", "temporary_handoff"],
+     ).first()
+     if state and (
+         (state.source == "workspace_policy" and state.mode == "human_only")
+         or (state.source == "temporary_handoff" and state.expires_at > now())
+     ):
+         return persist_batch_for_human(batch)
+     return queue_batch_for_ai(batch)

  def get_dashboard(workspace):
+     for client in workspace.clients.without_delivery_state():
+         ClientDeliveryState.create(
+             workspace_id=workspace.id,
+             client_id=client.id,
+             mode=workspace.published_configuration.delivery_mode,
+             source="workspace_policy",
+         )
+     return list_waiting_clients_from_delivery_state(workspace)

  def authorize_platform_reply(workspace, client, transcript):
+     return ClientDeliveryState.filter(workspace_id=workspace.id, client_id=client.id).exists()
```

# Observed consequences

- A client created after publication has no `ClientDeliveryState`; its immediate turn defaults to AI until someone reads the dashboard.
- Immediate admission treats any temporary handoff row with mode `human_only` as active even after expiry, while queued admission checks expiry but ignores manual rows.
- Publishing and dashboard reads both write policy projections. Override, cleanup, and unpublish paths also update or delete the same table.
- Platform reply authorization depends on the projection row rather than the published policy, active override, and replyable transcript.

Review this as a bounded release candidate. Existing provider claim, queue locking, and retry boundaries are outside the patch and are required to remain separate.
