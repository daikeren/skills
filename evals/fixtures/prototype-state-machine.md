# Prototype State Machine Findings

Chosen direction: use an explicit four-state model: `idle`, `submitting`, `succeeded`, and `failed`.

Evidence:
- `node state-machine-spike.js` exercised 12 valid transitions and rejected 3 invalid transitions.
- A failed submission retained the user's input and returned to `submitting` on retry.
- Two rapid submit events produced one request while the state was `submitting`.

Discard:
- The throw-away CLI harness and hard-coded fixture data.
- The earlier boolean `isLoading` model because it could not distinguish success from recoverable failure.
