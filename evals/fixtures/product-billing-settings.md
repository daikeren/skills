# Billing settings release candidate

Target users are organization owners and billing admins. Billing viewers may
see invoices but cannot mutate billing state. Members without a billing role do
not see the navigation entry. The server enforces these permissions for every
read and mutation endpoint.

Current surface behavior:

- The page opens from **Settings → Billing** and shows plan, payment method,
  invoices, and destructive actions in one view.
- Loading renders the page frame with blank cards. A read error renders the same
  `No billing data yet` state used for a new organization.
- A new organization with no payment method sees `No payment method`, but the
  add action is only present in the page header outside the empty card.
- `Change plan` uses a confirmation dialog. If the provider rejects the change,
  the dialog closes and a generic `Something went wrong` toast appears; entered
  choices and the provider request ID are not recoverable from the UI.
- Returning from the hosted payment-method flow displays `Card updated` from a
  success query parameter before the next server refresh confirms the change.
- `Cancel subscription` submits immediately. Support can reverse cancellation
  for 24 hours, but the UI neither confirms the action nor explains recovery.
- Dialog focus is not moved on open, and mutation results are not announced to
  assistive technology.
- Product analytics records page views, but not mutation failures or recovery.

The business goal is to let authorized users resolve billing changes without
accidental financial actions, false success, or avoidable support contact.
