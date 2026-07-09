# Sample Spec Fixture

Build a team-visible audit log for admin billing changes.

Goals:
- Show who changed billing settings.
- Preserve existing billing behavior.
- Support rollback if audit writes fail.

Constraints:
- Must not expose payment identifiers to non-admins.
- Must ship incrementally behind an existing feature flag if available.
