# Hosting PazaakWorld Nakama outside GitHub Pages

GitHub Pages only ships the **browser client**. Matchmaking and authoritative play need
**Nakama + PostgreSQL** on infrastructure you control, plus correct `VITE_*` values in the
PazaakWorld build.

This document covers **ongoing $0** options only (no paid “hobby” tiers, no trial credits framed
as free). There is **no** managed free PaaS that faithfully gives you “always-on Nakama + HA
Postgres + WebSocket failover” forever; what exists are **VM-shaped** free allowances and **manual**
disaster-recovery paths.

## What actually stays $0 (ranked)

| Option | Fits Docker Compose + Postgres + port 7350? | Caveats |
| --- | --- | --- |
| **[Oracle Cloud Infrastructure — Always Free](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)** | **Yes** — Ampere A1 flex + block storage in home region | You operate the VM (patches, backups, firewall). **Idle** Always Free VMs can be **reclaimed** if utilization stays very low for **7 days** (see Oracle doc). “Out of capacity” can block new shapes in some regions. |
| **[Google Cloud — Always Free `e2-micro`](https://docs.cloud.google.com/free/docs/free-cloud-features)** | **Tight but possible** — one non-preemptible `e2-micro`/month in **us-west1, us-central1, or us-east1** | RAM/CPU are small for Postgres + Nakama together; you may need swap, tuning, or a slimmer Postgres footprint. **Billing account** required; charges can apply for disk/egress outside included slices. |
| **Render / Koyeb “free”** | **Poor fit** for durable Nakama | Render [free tier](https://render.com/docs/free): web services **spin down** when idle; free Postgres is **time-limited** ([30-day expiry changelog](https://render.com/changelog/free-postgresql-instances-now-expire-after-30-days-previously-90)). Koyeb free Postgres is capped at **~5 hours active time** ([pricing FAQ](https://www.koyeb.com/docs/faqs/pricing)). |

**Hetzner, Scaleway serverless quotas, Fly.io, Railway hobby, etc.** are **not** documented here as
$0 backends for this stack — they are paid or metered.

Cloudflare Workers, Vercel Functions, and Netlify **do not** replace Nakama — you need a normal
long-lived process and Postgres on the wire.

## Idempotent bootstrap (same commands, safe re-runs)

The repo path is designed so repeat runs do not require “nuke the VM first”:

1. **`pnpm --filter @openkotor/pazaak-nakama build`** — overwrites `infra/nakama/modules/pazaak-world.js`; safe to re-run.
2. **`docker compose -f infra/nakama/docker-compose.cloud.yml up -d`** — reconciles containers; **idempotent** for steady state.
3. **`docker-entrypoint.cloud.sh`** — runs **`nakama migrate up`** before **`nakama`**. Migrations are **forward-only and safe to re-run** when already applied (Heroic Labs migrate semantics).

**Volumes:** Postgres data lives in the named volume `nakama-postgres-cloud`. To reset from scratch
only when you intend to wipe data:

```bash
docker compose -f infra/nakama/docker-compose.cloud.yml down -v
```

## “Failover” between free stacks — realistic expectations

**Automatic live failover** (two independent free hosts, one Postgres primary, seamless promotion
without split-brain) is **not realistic at $0**: you lack managed synchronous replication, shared
storage, and health-checked cross-provider load balancing.

What **is** realistic:

- **Primary:** one Always Free VM (OCI recommended) running **`docker-compose.cloud.yml`**.
- **Cold standby / second path:** a second documented bootstrap on **another** $0 allowance (e.g.
  GCP `e2-micro`) kept **stopped** or empty until needed, **or** the same compose files on a fresh
  OCI VM after outage.
- **Cutover:** `pg_dump` / restore, redeploy, then update **GitHub repository Variables**
  (`VITE_NAKAMA_HOST`, etc.) and re-run **Deploy PazaakWorld to GitHub Pages** so the static client
  points at the new host. Treat that as **manual DR**, not HA.

## One-command stack on a VM (primary path)

Prerequisites: [Docker Engine](https://docs.docker.com/engine/install/) and this repo (or a
tarball with `infra/nakama/` plus a built `infra/nakama/modules/pazaak-world.js`).

1. **Build the TypeScript runtime:**

   ```bash
   corepack pnpm install --frozen-lockfile
   pnpm --filter @openkotor/platform build
   pnpm --filter @openkotor/blackjack-engine build
   pnpm --filter @openkotor/pazaak-engine build
   pnpm --filter @openkotor/pazaak-nakama build
   ```

2. **Set a database password** (URL-safe characters; avoid raw `@`, `:`, `/`, `?` in the password
   unless URL-encoded in the DSN).

   ```bash
   export NAKAMA_POSTGRES_PASSWORD='replace-me'
   ```

3. **Start Postgres + Nakama:**

   ```bash
   docker compose -f infra/nakama/docker-compose.cloud.yml up -d
   ```

4. **Firewall / security list:** allow inbound **TCP 7350**. Prefer **not** exposing **7351**
   (console); use an SSH tunnel.

5. **TLS:** Pages is `https://`; browsers need **wss://**. Terminate TLS with Caddy/nginx/Traefik on
   the VM (443 → 7350) or another free **Always Free** load balancer (OCI documents Always Free LB
   allowances — see Oracle link above).

## Point GitHub Pages builds at your Nakama

See `apps/pazaak-world/src/nakamaClient.ts`. In **GitHub Actions**
(`.github/workflows/deploy-pazaakworld.yml`), set **repository Variables**:

| Variable | Example | Purpose |
| --- | --- | --- |
| `VITE_PAZAAK_BACKEND` | `nakama` | Force Nakama backend |
| `VITE_NAKAMA_HOST` | `nakama.example.com` | Host only (no scheme) |
| `VITE_NAKAMA_PORT` | `443` | Port your proxy exposes |
| `VITE_NAKAMA_USE_SSL` | `true` | Use `wss` / `https` client |
| `VITE_NAKAMA_SERVER_KEY` | `defaultkey` | Must match `socket.server_key` in `cloud.yml` until rotated |

Re-run the Pages deploy workflow after changes.

**Security:** rotate `defaultkey` for anything public; read `infra/nakama/README.md` on
`authenticateCustom` before inviting strangers.

## Custom image (GHCR, raw VM, Kubernetes)

From the **repository root** after `pnpm --filter @openkotor/pazaak-nakama build`:

```bash
docker build -f infra/nakama/Dockerfile.cloud -t ghcr.io/your-org/pazaakworld-nakama:latest .
```

Runtime: set **`NAKAMA_DATABASE_ADDRESS`** to `user:password@host:port/dbname?sslmode=require` (no
`postgres://` prefix). Entrypoint runs `nakama migrate up` then `nakama` with `--database.address`
overriding the placeholder in `infra/nakama/cloud.yml`.

## chitin.key and Holocron

Online modes may stay gated behind `chitin.key`. Holocron / Trask needs **`trask-http-server`** or
the bot API — unrelated to Nakama.

## References

- Heroic Labs — [Docker install](https://heroiclabs.com/docs/nakama/getting-started/install/docker/), [Configuration](https://heroiclabs.com/docs/nakama/getting-started/configuration/), [CLI / migrate](https://heroiclabs.com/docs/nakama/getting-started/commands/)
- Local stack: `infra/nakama/README.md`
