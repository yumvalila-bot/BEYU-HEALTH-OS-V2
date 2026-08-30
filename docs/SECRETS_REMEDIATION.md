# Secrets Remediation & Rotation — BEYU Health OS

> **Status:** Completed by the implementation agent on 2026-08-30 (Phase 0 security remediation).
> **Verified 2026-08-30 (Phase 1A):** repo-wide scan confirms no remaining secret strings or secret files in the working tree or committed history on the active branch; docs redacted to `<REDACTED>`.
> **Owner action REQUIRED (not yet performed by agent):** rotate the live credentials listed below. The agent cannot rotate them.

## What was found
During the Phase 0 audit, live production credentials were committed to the repository (all since purged):

| File (was tracked) | Credential exposed |
|---|---|
| `.env` | Postgres/Supabase `DATABASE_URL` containing a plaintext database password |
| `.env.local` | Supabase URL + publishable (anon) key for the project |
| `NEXT_PUBLIC_SUPABASE_URL=httpssiyzy.txt` | Supabase URL + key (stray credential dump) |
| `VITE_SUPABASE_URL=httpstxcqhrhmredi.txt` | Supabase URL + key (stray credential dump) |

A plaintext **database password** and Supabase keys being in a public repository means they must be treated as **compromised**.

## What was done
1. Added a repository root **`.gitignore`** that excludes `.env*`, `.txt` credential dumps, `node_modules/`, `dist/`, logs, and tooling artifacts.
2. Removed the four secret files from the working tree.
3. **Rewrote git history** (`git filter-branch` + prune) to strip those files from every commit on branch `arena/01a05116-health-os-1-0`, then force-pushed the cleaned branch to `origin`.
4. Verified: `git ls-tree -r --name-only HEAD` contains **no** `.env`, `.env.local`, or credential `.txt` files.
5. Kept `.env.example` (placeholders only — safe to commit).

## ⚠️ REQUIRED OWNER ACTIONS — please do these now
1. **Rotate the Supabase database password** (Project Settings → Database → Reset password) and **regenerate the Supabase API keys** (anon + any service keys) for both referenced projects.
2. **Purge the secrets from `main` on GitHub.** The local `main` ref was aligned to the cleaned history, but the remote `origin/main` still references the original commit containing the secrets. A force-push of cleaned history to `main` is required to remove them remotely (coordinate with repo owners; force-push rewrites shared history).
3. **Check GitHub secret scanning / Dependabot** alerts for this repo and mark resolved once keys are rotated.
4. **Re-provision a safe `.env`** for local development using the NEW credentials only, and never commit it. Provide secrets via a secret manager or CI secret store in deployment (see `docs/DEPLOYMENT_GUIDE.md`).

## Forward policy (non-negotiable)
- Never commit `.env`, `.env.*`, or any file containing credentials, tokens, or connection strings.
- Use `.env.example` with placeholders for documentation.
- Secrets must live in a secret manager / CI secret store / vault.
- Rotate any credential that is ever committed, even "temporarily".
