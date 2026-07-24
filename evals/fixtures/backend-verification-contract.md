# Backend verification contract

The candidate implementation is `evals/fixtures/backend-verification-candidate.mjs`.
Treat this contract as the independently specified oracle; do not derive expected
results from the candidate implementation.

## Decimal conversion

`toCents(amount)` accepts a decimal string and uses exact base-10 half-up rounding
to the nearest cent.

Expected results:

| Input | Expected cents |
| --- | ---: |
| `"10.074"` | `1007` |
| `"10.075"` | `1008` |
| `"0.105"` | `11` |
| `"999999.995"` | `100000000` |

## Retry idempotency

- One `invoiceId` represents one logical ledger effect across all retry attempts.
- If the first call inserts an entry and then reports an ambiguous timeout, retrying
  the same invoice with another attempt number must return the original entry and
  leave exactly one stored entry.
- Different invoice IDs must still create distinct entries.

A disposable harness may provide an in-memory store implementing `findByKey(key)`
and `insert(entry)`. It should simulate an ambiguous timeout after the first insert,
retry with a different attempt number, and print the stored-entry count, keys, and
cent values. Concrete command output is required; narrated expected behavior alone
is not evidence.
