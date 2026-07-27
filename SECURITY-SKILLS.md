# Security Skills

Before security-related work, route broad application changes through
`appsec-engineer` and use OWASP ASVS/API Security as the verification baseline.

- Model trust boundaries before changing authentication, authorization,
  payments, order ownership, or persistence.
- Validate all untrusted input at the server boundary.
- Enforce object- and function-level authorization on every endpoint.
- Keep demo credentials and simulated integrations out of production.
- Prefer deny-by-default production behavior when an external provider,
  credential, or signing key is unavailable.
- Use transactions, constraints, idempotency, safe error handling, and
  redacted logging for security-relevant workflows.
- Verify changes with type checks, tests, dependency audit, runtime smoke tests,
  and a focused review of the resulting diff.
