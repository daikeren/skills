# Low-likelihood recoverable UI review fixture

Intent: show export retry progress while background status refreshes.

```diff
 function RetryStatus({ retry, refreshedRetry }) {
   const visibleRetry = refreshedRetry ?? retry;
+  if (retry.startedAt > visibleRetry.startedAt) {
+    return <StatusBadge>Retrying</StatusBadge>;
+  }
   return <StatusBadge>{visibleRetry.status}</StatusBadge>;
 }
```

Runtime evidence:

- A late refresh can leave the `Retrying` badge visible after completion.
- The next 30-second poll replaces the stale status.
- The export continues in the background and the completed file remains available.
- Reloading the page immediately restores the correct status.
