# Personal Anthropic key

# Generation history

- [ ] Add private generation history with date, source material, status and safe error information.
- [ ] Verify generation tracking and dashboard history.
- [ ] Activate the history table — blocked by paused Lovable Cloud.

- [x] Add a password field, save/replace, delete and personal connection test in account settings.
- [x] Encrypt saved credentials and isolate them by authenticated account.
- [ ] Apply the credential migration and deploy the updated function — blocked by paused Lovable Cloud. Required table: user_anthropic_credentials (user_id UUID primary key, encrypted_key text not null, updated_at timestamptz default now()). Service-role-only grants, RLS with no client policies.
- [ ] Verify saving and reading status on a real signed-in account — blocked by paused Lovable Cloud.
