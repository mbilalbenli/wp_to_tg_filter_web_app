# WhatsApp → Telegram Filter Panel

Listens to WhatsApp group messages, matches them against user-defined keyword filters, and forwards matching messages to Telegram. Single-user panel: QR-based WhatsApp connection, group selection, per-keyword filters, a Telegram bot setup wizard, and history.

## One-Command Install

Requirements: Docker + Docker Compose v2, Git.

```bash
curl -fsSL https://raw.githubusercontent.com/mbilalbenli/wp_to_tg_filter_web_app/main/install.sh | bash
```

With your own password (recommended):

```bash
ADMIN_PASSWORD=a-strong-password \
  curl -fsSL https://raw.githubusercontent.com/mbilalbenli/wp_to_tg_filter_web_app/main/install.sh | bash
```

If you already cloned the repository:

```bash
./install.sh
```

The script checks Docker, clones/updates the repo, creates `.env` with a random `JWT_SECRET`, fetches the OpenWA API key into `.env`, runs `docker compose up -d --build`, waits for health checks, and prints the panel URL and next steps.

After install:

- Panel: http://localhost:5173
- Username: `admin`
- Password: `ADMIN_PASSWORD` in `.env` (default `wp_to_tg159753`, demo only — change it)

## Manual Install

```bash
git clone https://github.com/mbilalbenli/wp_to_tg_filter_web_app.git
cd wp_to_tg_filter_web_app
cp .env.example .env   # edit ADMIN_PASSWORD, JWT_SECRET (and OPENWA_WEBHOOK_URL if you publish, see below)
docker compose up -d --build
```

## First-Time Setup (in the panel)

1. **WhatsApp:** Click "Connect / Get QR" and scan the QR code with WhatsApp → Linked Devices. Status should become `ready / Connected`.
2. **Groups:** Click "Sync Groups", select the groups to listen to, and save. If no group is selected, all groups are listened to (demo behavior).
3. **Telegram (Wizard):**
   - Open BotFather, create a bot with `/newbot`, paste the token, and click **Verify Token** (the bot is confirmed by its `@username`).
   - Click **Open Bot**, send `/start`, then **Find Chat Automatically** — chat ID is discovered via `getUpdates`; pick it from the list. For a group, add the bot to the group and send a message.
   - Save and verify with **Send Test Message**.
4. **Filters:** Set the keyword, target, excluded keywords, sender filter, quiet hours, and media/link/length/group rules. If one message matches multiple filters, each filter sends a separate Telegram message.

## Architecture

```
WhatsApp Groups → OpenWA → webhook (public HTTPS) → FastAPI Filter Engine → Telegram Bot API
                                                              ↕ SQLite
                                                     React + Vite Panel (/api, JWT)
```

Services (Docker Compose): `openwa` (`ghcr.io/rmyndharis/openwa`, port 2785), `backend` (FastAPI, 8000), `frontend` (5173). An optional `cloudflared` service exists behind the `tunnel` profile (see below).

Important notes:

- The OpenWA webhook URL must be a **public HTTPS** address; internal addresses are rejected by its SSRF guard. Set it in `.env` as `OPENWA_WEBHOOK_URL=https://<your-address>/api/webhook/openwa`. Without a public address, the panel still works locally, but incoming WhatsApp messages cannot be delivered to the backend.
- The OpenWA API key is generated on first boot and stored persistently in `/app/data/.api-key`; `install.sh` copies it into `.env` as `OPENWA_API_KEY` automatically.
- **Disconnect and Delete Data** completely wipes the WhatsApp session (including the phone number); a fresh QR scan is required to reconnect.

## Publishing (Optional): Cloudflare Tunnel

The tunnel is **optional**. The app runs fully on `http://localhost:5173` without it. Use a tunnel only if you need to reach the panel from outside or give OpenWA a public webhook address, and you don't already have a reverse proxy / public HTTPS endpoint.

```bash
# Put TUNNEL_TOKEN in .env, then:
docker compose --profile tunnel up -d
```

Tunnel setup, mini-server deployment, and verification steps: [docs/INFRASTRUCTURE.md](docs/INFRASTRUCTURE.md)

Alternatives: any public HTTPS endpoint in front of the frontend works the same way — just point `OPENWA_WEBHOOK_URL` at `https://<your-address>/api/webhook/openwa`.

## Documentation

Project target and interview decisions: [docs/PROJECT_TARGET.md](docs/PROJECT_TARGET.md) · Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · API: [docs/API_CONTRACT.md](docs/API_CONTRACT.md) · Testing: [docs/TESTING.md](docs/TESTING.md) · Full set of 12 documents under `docs/`.

## Tests

```bash
python -m pytest backend/tests/ -q
cd frontend && npm run build
```

## Security Note

This project targets a single-user demo: one admin account, JWT sessions, bot tokens stored in the database. For production, choose strong `ADMIN_PASSWORD` and `JWT_SECRET` values, and never commit your `.env` file.
