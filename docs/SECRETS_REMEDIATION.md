# Secrets Remediation & Rotation — BEYU Health OS

> **Status:** Remediation **in progress** — current working tree is clean, but **compromised values remain in Git HISTORY across refs** and **must be rotated + purged by the owner** (see below).
> **Verified 2026-08-30 (Phase 1C fresh audit):**
> - **Working tree / `HEAD` tree:** clean — no secret values present.
> - **`origin/main` @ `69883d6`:** still contains the live `.env`, `.env.local`, and two credential `.txt` files → **NOT clean**.
> - **Reachable Git history on the active branch (commits `7f69400`, `b9023b1`, `f3d2898`) and on `main`/`origin/main`:** the raw database password is embedded in **`docs/BEYU_HEALTH_OS_AUDIT_AND_GAP_MATRIX.md`** in those historical versions → **NOT clean**. The Phase 0 purge removed the credential *files* but did **not** scrub the password string that had been written into the audit-matrix document.
> - **Owner action REQUIRED (not yet performed by agent):** rotate the live credentials and purge history on all refs.

## What was found
During the Phase 0 audit, live production credentials were committed to the repository (all since purged):

| File (was tracked) | Credential exposed |
|---|---|
| `.env` | Postgres/Supabase `DATABASE_URL` containing a plaintext database password |
| `.env.local` | Supabase URL + publishable (anon) key for the project |
| `NEXT_PUBLIC_SUPABASE_URL=httpssiyzy.txt` | Supabase URL + key (stray credential dump) |
| `VITE_SUPABASE_URL=httpstxcqhrhmredi.txt` | Supabase URL + key (stray credential dump) |
| `docs/BEYU_HEALTH_OS_AUDIT_AND_GAP_MATRIX.md` (historical versions) | raw database **password string** was reproduced in the audit-matrix document (present in commits `7f69400`, `b9023b1`, `f3d2898`) |

A plaintext **database password** and Supabase keys being in a public repository means they must be treated as **compromised**.

## What was done
1. Added a repository root **`.gitignore`** that excludes `.env*`, `.txt` credential dumps, `node_modules/`, `dist/`, logs, and tooling artifacts.
2. Removed the four secret files from the working tree.
3. **Rewrote git history** (`git filter-branch` + prune) to strip those files from every commit on branch `arena/01a05116-health-os-1-0`, then force-pushed the cleaned branch to `origin`.
4. Verified: `git ls-tree -r --name-only HEAD` contains **no** `.env`, `.env.local`, or credential `.txt` files.
5. Kept `.env.example` (placeholders only — safe to commit).

## ⚠️ REQUIRED OWNER ACTIONS — please do these now
1. **Rotate the Supabase database password** (Project Settings → Database → Reset password) and **regenerate the Supabase API keys** (anon + any service keys) for both referenced projects. Treat all previously committed values as compromised regardless of current DNS resolution.
2. **Purge history on ALL refs**, not just files:
   - Rewrite `origin/main` (currently @ `69883d6`) to strip the credential files **and** the password string embedded in `docs/BEYU_HEALTH_OS_AUDIT_AND_GAP_MATRIX.md`; force-push (coordinate with repo owners; this rewrites shared history).
   - Rewrite the active branch `arena/01a05116-health-os-1-0` and local `main` history to scrub the same password blob from commits `7f69400`, `b9023b1`, `f3d2898`; force-push.
   - Recommended tooling: `git filter-repo` (or BFG) targeting the secret files and the `Noelia@…` password string, then prune + repack + `git gc --prune=now --aggressive`. Verify with `git rev-list --all | xargs git grep …` that no value remains.
3. **Check GitHub secret scanning / Dependabot** alerts for this repo and mark resolved once keys are rotated and history is purged.
4. **Re-provision a safe `.env`** for local development using the NEW credentials only, and never commit it. Provide secrets via a secret manager or CI secret store in deployment (see `docs/DEPLOYMENT_GUIDE.md`).
5. **Set `NODE_ENV=production`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, and an explicit `CORS_ORIGIN`** allow-list. The backend now fails closed at boot in production when these are missing or default (`backend/src/main.ts`).

## Forward policy (non-negotiable)
- Never commit `.env`, `.env.*`, or any file containing credentials, tokens, or connection strings.
- Use `.env.example` with placeholders for documentation.
- Secrets must live in a secret manager / CI secret store / vault.
- Rotate any credential that is ever committed, even "temporarily".

---

## Phase 1D re-verification (2026-08-30)

Re-audited at Phase 1D. **No owner actions have been performed yet:**
credential rotation is **NOT VERIFIED**, `origin/main` remains at `69883d6` with
the credential files, and the raw DB password remains in active-branch history
(commits `7f69400`/`b9023b1`/`f3d2898`). Production gate remains **`BLOCKED`**.
All rotation + history-purge actions above remain REQUIRED.
