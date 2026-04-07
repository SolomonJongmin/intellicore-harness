# Security Guidelines

## Pre-Merge Security Checklist

Before merging to main branch:
- [ ] No hardcoded secrets (API keys, passwords, tokens, connection strings)
- [ ] User inputs validated at system boundaries (API endpoints, form handlers, file uploads)
- [ ] SQL/NoSQL injection prevention (parameterized queries or ORM)
- [ ] XSS prevention (output encoding, context-aware sanitization)
- [ ] Authentication and authorization verified on protected endpoints
- [ ] Error messages don't expose internal details (stack traces, query structure, file paths)

## Secret Management

- NEVER commit secrets to source code or version control
- Use environment variables or a dedicated secret manager (Vault, AWS Secrets Manager, etc.)
- Validate that required secrets are present at application startup — fail fast if missing
- Rotate any secrets that may have been exposed; treat exposure as an incident

## Security Risk Tiers

**CRITICAL — Fix immediately, block merge:**
- Hardcoded secrets or credentials in code
- SQL/NoSQL injection vulnerabilities
- Authentication bypass
- Unvalidated file uploads allowing arbitrary execution

**HIGH — Fix before merge:**
- Missing input validation on user-facing endpoints
- XSS vulnerabilities
- Missing authorization checks on sensitive operations
- Sensitive data logged or exposed in error responses

**MEDIUM — Track and fix promptly:**
- Missing rate limiting on public endpoints
- CSRF protection gaps
- Overly permissive CORS configuration
- Dependencies with known vulnerabilities

## Dependency Security

- Audit dependencies regularly for known vulnerabilities
- Pin dependency versions in production; avoid floating ranges
- Review new dependencies before adding — check maintenance status, download counts, known issues

## OWASP Top 10 Check

1. **Injection** — Queries parameterized? User input sanitized? ORMs used safely?
2. **Broken Auth** — Passwords hashed (bcrypt/argon2)? Tokens validated? Sessions secure?
3. **Sensitive Data** — HTTPS enforced? Secrets in env vars? PII encrypted? Logs sanitized?
4. **XXE** — XML parsers configured securely? External entities disabled?
5. **Broken Access** — Auth checked on every route? CORS properly configured?
6. **Misconfiguration** — Default creds changed? Debug mode off in prod? Security headers set?
7. **XSS** — Output escaped? CSP set? Framework auto-escaping?
8. **Insecure Deserialization** — User input deserialized safely?
9. **Known Vulnerabilities** — Dependencies up to date? Audit clean?
10. **Insufficient Logging** — Security events logged? Alerts configured?

## Code Pattern Review

Flag these patterns immediately:

| Pattern | Severity | Fix |
|---------|----------|-----|
| Hardcoded secrets | CRITICAL | Use environment variables |
| Shell command with user input | CRITICAL | Use safe APIs or parameterized execution |
| String-concatenated SQL | CRITICAL | Parameterized queries |
| User input rendered without escaping | HIGH | Use framework sanitization |
| Fetch/request to user-provided URL | HIGH | Whitelist allowed domains |
| Plaintext password storage/comparison | CRITICAL | Use bcrypt/argon2 |
| No auth check on route | CRITICAL | Add authentication middleware/filter |
| Balance/inventory check without lock | CRITICAL | Use DB-level locking |
| No rate limiting on public API | HIGH | Add rate limiter |
| Logging passwords/secrets/PII | MEDIUM | Sanitize log output |

## Key Principles

1. **Defense in Depth** — Multiple layers of security
2. **Least Privilege** — Minimum permissions required
3. **Fail Securely** — Errors should not expose data
4. **Don't Trust Input** — Validate and sanitize everything
5. **Update Regularly** — Keep dependencies current

## Common False Positives

- Environment variables in `.env.example` (not actual secrets)
- Test credentials in test files (if clearly marked)
- Public API keys (if actually meant to be public)
- SHA256/MD5 used for checksums (not passwords)

**Always verify context before flagging.**

## Emergency Response

If you find a CRITICAL vulnerability:
1. Document with detailed report
2. Alert project owner immediately
3. Provide secure code example
4. Verify remediation works
5. Rotate secrets if credentials exposed

## When to Run

**ALWAYS:** New API endpoints, auth code changes, user input handling, DB query changes, file uploads, payment code, external API integrations, dependency updates.

**IMMEDIATELY:** Production incidents, dependency CVEs, user security reports, before major releases.

## Reference

For detailed vulnerability patterns and code examples, see skill: `security-review`.
For agent configuration security scanning, see skill: `security-scan`.
