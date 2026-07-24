# Mixed-scope implementation fixture

## Intended outcome

Fix the parser crash when an optional token is missing.

## Repository and ownership facts

- `grammar/parser.peg`, `src/parser/generated_table.json`, and
  `tests/parser_missing_token.test.js` were changed during this task.
- The generated table is checked in, is produced from `grammar/parser.peg`, and
  CI rejects a source/table mismatch.
- The regression test fails before the grammar fix and passes after it.
- The agent also added `left-pad` to `package.json`, its generated lockfile, and
  the CI timeout edit during this task. No changed or existing parser code
  imports that package.
- The agent-created CI timeout edit is an independently useful improvement, but
  it is not needed to generate the parser table or run the regression test.
- The whitespace-only `src/auth/session.js` hunk existed before this task and is
  user-authored work.

## Diff before the final scope-fit check

```diff
diff --git a/grammar/parser.peg b/grammar/parser.peg
--- a/grammar/parser.peg
+++ b/grammar/parser.peg
@@
-token = identifier
+token = identifier?

diff --git a/src/parser/generated_table.json b/src/parser/generated_table.json
--- a/src/parser/generated_table.json
+++ b/src/parser/generated_table.json
@@
-{"token":"required"}
+{"token":"optional"}

diff --git a/tests/parser_missing_token.test.js b/tests/parser_missing_token.test.js
new file mode 100644
--- /dev/null
+++ b/tests/parser_missing_token.test.js
@@
+test("accepts a missing optional token", () => {
+  expect(parse("entry:")).toEqual({ token: null });
+});

diff --git a/package.json b/package.json
--- a/package.json
+++ b/package.json
@@
   "dependencies": {
+    "left-pad": "1.3.0",
   }

diff --git a/package-lock.json b/package-lock.json
--- a/package-lock.json
+++ b/package-lock.json
@@
+    "node_modules/left-pad": { "version": "1.3.0" }

diff --git a/.github/workflows/test.yml b/.github/workflows/test.yml
--- a/.github/workflows/test.yml
+++ b/.github/workflows/test.yml
@@
-    timeout-minutes: 10
+    timeout-minutes: 20

diff --git a/src/auth/session.js b/src/auth/session.js
--- a/src/auth/session.js
+++ b/src/auth/session.js
@@
-export function currentSession(){return session}
+export function currentSession() { return session; }
```
