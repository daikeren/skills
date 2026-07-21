# Throwaway repository snapshot

The requested change is:

> Add request-origin metadata to sign-in audit events so we can eventually
> support end-to-end tracing.

## Repository evidence

`src/audit.js`

```js
export function writeAudit(event, context = {}) {
  return auditSink.write({ event, ...context });
}
```

`src/orders/create-order.js`

```js
import { writeAudit } from "../audit.js";

export async function createOrder(request) {
  const order = await orders.create(request.body);
  await writeAudit("order.created", { origin: request.origin });
  return order;
}
```

`src/auth/sign-in.js`

```js
import { writeAudit } from "../audit.js";

export async function signIn(request) {
  const session = await sessions.create(request.credentials);
  await writeAudit("session.created");
  return session;
}
```

`test/auth/sign-in.test.js` already tests the `session.created` event with the
repository's built-in test runner. `package.json` exposes the focused command:

```js
it("writes the session-created audit event", async () => {
  await signIn(request({ origin: "edge-us-east" }));

  expect(auditSink.last()).toMatchObject({
    event: "session.created"
  });
});
```

```text
npm test -- test/auth/sign-in.test.js
```

There is no tracing service, tracing dependency, or tracing configuration in the
repository.
