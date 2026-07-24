# Low-likelihood destructive migration review fixture

Proposal:

1. Add `canonical_customer_id` and backfill it from `legacy_customer_id`.
2. Deploy application code that writes only `canonical_customer_id`.
3. Drop `legacy_customer_id` immediately after the backfill job reports complete.

Operational evidence:

- Workers from the prior release may run for up to 15 minutes after deployment.
- Those workers still write only `legacy_customer_id`.
- The backfill has no final reconciliation pass after old workers drain.
- Dropping the legacy column permanently discards late writes.
- The table has no point-in-time recovery or source event log.
