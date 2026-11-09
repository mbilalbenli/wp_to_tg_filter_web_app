# PACKAGES

Kesin sürümler `backend/requirements.txt` ve `frontend/package.json` içindedir; bu doküman seçilen paketleri ve gerekçelerini listeler.

## Backend (Python / FastAPI)

| Paket | Kullanım |
|---|---|
| `fastapi` | REST API (`/api/*`) |
| `uvicorn[standard]` | ASGI sunucu |
| `sqlalchemy` | SQLite ORM (`/data/app.db`) |
| `pydantic` / `pydantic-settings` | Şema doğrulama, env ayarları |
| `python-jose[cryptography]` veya `pyjwt` | JWT üretme/doğrulama |
| `passlib[bcrypt]` veya `pwdlib` | Şifre hash (admin şifre değişimi) |
| `httpx` | OpenWA ve Telegram Bot API çağrıları |
| `python-multipart` | Form/multipart (gerekirse) |
| `pytest`, `httpx` (test) | Testler (bkz. TESTING.md) |

Harici servis istemcileri: OpenWA HTTP API, Telegram Bot API (`https://api.telegram.org/bot<token>/...`).

## Frontend (React + Vite)

| Paket | Kullanım |
|---|---|
| `react`, `react-dom` | UI |
| `vite` | Dev/build (`:5173`) |
| `react-router-dom` | Sayfa yönlendirme |
| (opsiyonel) `axios` veya native `fetch` | `/api` client; tek tercih kullanılır |

Ekstra UI kütüphanesi zorunlu değildir; koyu tema CSS değişkenleriyle uygulanır (DESIGN.md).

## Altyapı İmajları

| İmaj | Kullanım |
|---|---|
| `ghcr.io/rmyndharis/openwa:latest` | WhatsApp servisi |
| `cloudflare/cloudflared:latest` | Opsiyonel tunnel profili |
| `python:3.12-slim` (backend base, öneri) | Backend |
| `node:20-alpine` (frontend base, öneri) | Frontend dev/build |
