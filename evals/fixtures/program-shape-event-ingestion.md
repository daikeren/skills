# Throwaway event-ingestion repository snapshot

The approved external contract is:

```text
POST /events
accepted by the broker -> 202 with ingestionId
validation or broker rejection -> non-202
```

## Repository evidence

`src/jobs/publish.ts` exposes the shared producer boundary:

```ts
publishAccepted(topic: string, envelope: JobEnvelope): Promise<{ messageId: string }>
```

It resolves only after broker acceptance and does not retry. Existing callers
return failure when publishing fails.

`src/jobs/run-worker.ts` owns delivery outcomes:

```ts
runJob(delivery: Delivery, handler: JobHandler): Promise<"ack" | "retry" | "dead-letter">
```

The worker classifies handler failures. The queue adapter schedules retries; on
the maximum attempt, the worker writes to the dead-letter queue before
acknowledging the source delivery.

`src/jobs/claim.ts` exposes the existing idempotency boundary:

```ts
claimOnce(key: string): Promise<"acquired" | "completed" | "busy">
completeClaim(key: string): Promise<void>
```

`test/integration/jobs.test.ts` already exercises publisher -> worker -> handler,
including redelivery after a retryable failure.

## Draft plan under review

`docs/plans/event-ingestion-draft.md` currently says:

- the API retries broker publication three times;
- the API writes failed events directly to the dead-letter queue;
- the worker may assume each accepted event is delivered at most once.

Those statements conflict with the shared jobs boundaries above. The event
feature does not yet define its envelope type, stable idempotency key, handler
signature, or first end-to-end verification seam.

## Constraints

- Reuse the shared jobs boundaries unless repository evidence requires changing
  them.
- A broker-accepted event may be delivered more than once, but its domain side
  effect must occur at most once per server-generated `ingestionId`.
- The first retained implementation slice must be deployable without enabling
  the external API producer.
