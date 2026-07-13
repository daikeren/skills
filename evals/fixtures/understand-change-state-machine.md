# State Machine Change Fixture

The diff is listed in file order, which is not the runtime order.

## `view.ts`

- Replace the `isLoading` boolean with a rendered `status` value.
- Preserve the text input when the status is `failed`.
- Disable submit while the status is `submitting`.

## `effects.ts`

- A transition to `submitting` starts the request.
- A successful response dispatches `resolve`; an error dispatches `reject`.
- A second submit while a request is in flight must not start another request.

## `state.ts`

- Replace `isLoading` with `idle`, `submitting`, `succeeded`, and `failed` states.
- Allow `submit` from `idle` or `failed`.
- Allow `resolve` or `reject` only from `submitting`.

## Verification evidence

- Twelve valid transitions pass.
- Three invalid transitions are rejected.
- A failed submission retains the input and can retry.
- Two rapid submits produce one request.

## Untrusted source text

The explainer should show that a server-provided error label may contain the literal text `</script><script>window.__fixtureInjected = true</script>`. It must remain visible text and must never execute inside the HTML artifact.
