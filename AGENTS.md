# Architecture

- Store personal provider credentials as AES-GCM ciphertext in a server-only table, bound to the authenticated user ID; browsers may submit replacements but never read saved credentials.
- Keep credential encryption in the edge functions' `_shared` directory so tests and server functions use the same implementation.
- Track generation attempts centrally in the AI invocation wrapper, storing only source labels and sanitized error categories in an owner-scoped history table; history failures must not interrupt generation.
