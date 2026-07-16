# Stateful Handoff Summary Review Fixture

## Intent

An operator queue should clear a handoff only when a sent reply belongs to the
current handoff episode and its conversation history. The same customer can have
older histories and repeated handoff episodes with the same assistant.

## Runtime facts

- The triggering user turn is created before the interaction becomes active.
- The interaction's `changed_at` records activation time.
- A `human_interaction` marker is persisted on the triggering turn after
  activation; that persistence can fail without rolling back activation.
- A turn can identify its assistant through profile metadata, history metadata,
  or a published-version identifier. Legacy histories do not contain every path.

## Patch under review

```python
def find_anchor(interaction, resolver_queries):
    anchors = []
    for query in resolver_queries:
        latest_marked = (
            query.filter(
                customer_id=interaction.customer_id,
                created_at__lte=interaction.changed_at,
                response_status="human_interaction",
            )
            .order_by("-created_at", "-id")
            .first()
        )
        if latest_marked:
            anchors.append(latest_marked)
    return max(anchors, key=lambda turn: (turn.created_at, turn.id), default=None)


def is_cleared(interaction, anchor):
    if anchor:
        last_reply = latest_sent_reply(
            customer_id=interaction.customer_id,
            assistant_id=interaction.assistant_id,
            history_id=anchor.history_id,
        )
        waiting_since = anchor.created_at
    else:
        last_reply = latest_sent_reply(
            customer_id=interaction.customer_id,
            assistant_id=interaction.assistant_id,
        )
        waiting_since = interaction.changed_at
    return last_reply is not None and last_reply.created_at >= waiting_since
```

## Reachable scenario

1. Episode A has a marked turn in history A.
2. Episode B starts in history B. Its current triggering turn matches through
   profile metadata, but its marker persistence fails; history B lacks the
   legacy history-level assistant identifier.
3. A delayed sent reply for history A arrives after episode B becomes active.
4. The history-metadata resolver sees only episode A's marked turn. The profile
   resolver filters episode B's unmarked turn out before candidates are merged.
5. A later queue read can select episode A as the anchor, or use the pair-wide
   fallback when no marker is visible. Either path can use history A's delayed
   reply to clear episode B incorrectly.
