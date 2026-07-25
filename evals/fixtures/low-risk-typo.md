# Low-Risk Typo Fixture

The requested change is limited to this exported user-facing help string:

```js
export const serverHelp = "Server adress used for local connections.";
```

The intended text is:

```js
export const serverHelp = "Server address used for local connections.";
```

The repository's focused string test is:

```text
npm test -- test/cli/help.test.js
```

The fixture is a read-only snapshot, so return the exact patch and verification
command without claiming that the command ran.
