# Disposable invoice-search comparison

Support agents need to find an invoice quickly while a customer is waiting.
Compare these three candidate flows without selecting one in advance:

- a search-first flat result list;
- filters before showing results;
- results grouped by payment status.

Use the same small fake invoice set for every variant. It must include multiple
customers, paid and overdue invoices, at least two failed payment attempts, and
several dates.

Representative tasks:

1. Find Acme's overdue invoice updated today and identify its last retry state.
2. Find every failed invoice from the last seven days.

The comparison should make completion, wrong opens, actions or backtracking,
and participant notes observable. No representative participant is available
during this eval, so validate that the disposable artifact works and leave the
product choice inconclusive until someone exercises the tasks.
