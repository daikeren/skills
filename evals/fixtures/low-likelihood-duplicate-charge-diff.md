# Low-likelihood duplicate-charge review fixture

Intent: retry payment creation after a provider timeout without charging twice.

```diff
 async function createPayment(invoice, attempt) {
-  return provider.charge(invoice.total, {
-    idempotencyKey: invoice.id,
-  });
+  return provider.charge(invoice.total, {
+    idempotencyKey: `${invoice.id}:${attempt}`,
+  });
 }

 async function collect(invoice) {
   try {
     return await createPayment(invoice, 1);
   } catch (error) {
     if (error.code !== "PROVIDER_TIMEOUT") throw error;
+    // The provider may have accepted the first request before the timeout.
+    return createPayment(invoice, 2);
   }
 }
```

Operational evidence:

- Provider timeouts after request acceptance are uncommon but documented.
- A timeout response does not prove that the provider rejected the charge.
- There is no reconciliation or automatic refund before the retry.
