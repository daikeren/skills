# Sample Diff Fixture

Use this throwaway fixture for behavioral review evals.

```diff
diff --git a/server/admin.ts b/server/admin.ts
--- a/server/admin.ts
+++ b/server/admin.ts
@@
-router.post("/admin/users/:id/export", requireAdmin, exportUserData)
+router.post("/users/:id/export", exportUserData)
```

Expected review behavior: flag backend authorization regression rather than focusing only on route naming.
