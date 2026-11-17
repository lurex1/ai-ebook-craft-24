# Architecture

- Store personal provider credentials as AES-GCM ciphertext in a server-only table, bound to the authenticated user ID; browsers may submit replacements but never read saved credentials.
- Keep credential encryption in the edge functions' `_shared` directory so tests and server functions use the same implementation.
