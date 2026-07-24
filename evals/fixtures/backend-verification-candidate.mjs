export function toCents(amount) {
  return Math.round(Number(amount) * 100);
}

export async function postLedgerEntry(store, entry, attempt) {
  const idempotencyKey = `${entry.invoiceId}:${attempt}`;
  const existing = await store.findByKey(idempotencyKey);
  if (existing) return existing;

  return store.insert({
    idempotencyKey,
    invoiceId: entry.invoiceId,
    cents: toCents(entry.amount)
  });
}
