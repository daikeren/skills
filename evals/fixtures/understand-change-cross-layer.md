# Cross-Layer Change Fixture

Revision: `4f2c9aa`

This fixture intentionally omits a source-host URL and full revision. Use precise plain `path:Lx-Ly` references; do not invent immutable links.

The change turns a passive operations page into a next-action brief.

## Evidence service

- `service/attention.py:L40-L118` derives unresolved work from active handoffs, the latest user event, and the latest successfully sent operator reply.
- A reply only resolves work when it belongs to the same interaction episode and is newer than the waiting event.

## API contract

- `api/workspaces.py:L210-L228` exposes an attention summary to authorized workspace viewers.
- `web/api/attention.ts:L12-L46` defines the matching client type and query hook.

## Client decision model

- `web/pages/Operations.tsx:L330-L415` waits for agents, channels, traffic, and attention evidence before deriving a lifecycle state.
- Priority is setup, unresolved attention, launched without traffic, then active.
- Permission or load failure must show unavailable state; missing evidence must not be treated as zero.

## Presentation and verification

- `web/pages/Operations.tsx:L520-L610` renders one primary action from the lifecycle decision.
- `service/tests/test_attention.py:L80-L190` covers episode matching and reply ordering.
- `web/pages/Operations.test.tsx:L700-L860` covers precedence, loading, permission failure, and stale traffic.
