# Small Configuration Rename Fixture

The application reads `request_timeout_ms` from local configuration. This change renames the key to `http_request_timeout_ms`; the value, default, parsing behavior, and only call site remain unchanged. The configuration example and focused parser test use the new key.
