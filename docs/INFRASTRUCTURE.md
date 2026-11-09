# INFRASTRUCTURE

## Docker Compose

`docker-compose.yml` servisleri: `openwa`, `backend` (`build ./backend`, `env_file .env`, `app_data:/data`), `frontend` (`build ./frontend`, `5173:5173`), `cloudflared` (profile `tunnel`).

```bash
cp .env.example .env
docker compose up --build          # panel: http://localhost:5173
docker compose --profile tunnel up -d cloudflared   # opsiyonel dış erişim
```

Volume: `app_data` (SQLite `/data/app.db`), `openwa_data` (OpenWA session/QR kalıcılığı).

## Ortam Değişkenleri

Bkz. `.env.example`: `ADMIN_USERNAME`, `ADMIN_PASSWORD=wp_to_tg159753`, `JWT_SECRET`, `OPENWA_IMAGE/OPENWA_PORT/OPENWA_BASE_URL/OPENWA_API_KEY/OPENWA_WEBHOOK_URL`, `TUNNEL_TOKEN`, boş `TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID`.

## OpenWA İmajı — Doğrulama Uyarısı

Compose'daki imaj `ghcr.io/rmyndharis/openwa:latest` olup 2026-11-09'da https://github.com/rmyndharis/OpenWA resmi docker-compose'undan doğrulandı (port 2785). Gerekirse `.env`'de `OPENWA_IMAGE` ile override edilebilir. OpenWA API uçları sürüme göre değişebildiğinden QR/session akışı mini-serverda gerçek session ile doğrulanmalıdır. OpenWA webhook'u backend'e `OPENWA_WEBHOOK_URL=http://backend:8000/api/webhook/openwa` olarak tanımlanır (panel/servis ayarından).

## Mini-Server Deploy

1. Sunucuda repo'yu çekin, `.env` oluşturun (`JWT_SECRET` güçlü, `ADMIN_PASSWORD` değiştirin).
2. `docker compose up --build -d`; `curl http://localhost:8000/api/health` → `{"status":"ok"}`.
3. Panel `http://localhost:5173` üzerinden QR + Wizard kurulumunu tamamlayın.

## Cloudflare Tunnel — wp-tg-filter.mbbe.dev

Domain: `wp-tg-filter.mbbe.dev`.

1. **Mevcut durumu doğrula:** Mini-server'daki mevcut tunnel'ları araştırın — `cachyos-ssh` skill'i ile sunucuya bağlanıp `cloudflared` servislerini/`/etc/cloudflared` yapılandırmasını kontrol edin ve/veya Cloudflare manager (Zero Trust) panelinde mevcut tunnel/DNS kayıtlarını inceleyin. Var olan tunnel'a yeni hostname eklemek, sıfırdan tunnel açmaktan önce tercih edilir.
2. **Tunnel oluştur/güncelle:** Zero Trust > Networks > Tunnels > (mevcut veya yeni) tunnel → token'ı sunucudaki `.env`'e `TUNNEL_TOKEN` olarak yazın.
3. **Public Hostname:** `wp-tg-filter.mbbe.dev` → Service `http://frontend:5173` (cloudflared aynı compose ağındaysa) veya `http://localhost:5173`.
4. **Başlat:** `docker compose --profile tunnel up -d cloudflared`; loglarda tunnel bağlantısını doğrulayın.
5. **Kabul:** `https://wp-tg-filter.mbbe.dev` üzerinden panel açılır, login çalışır.

Notlar: `TUNNEL_TOKEN` sırdır, commit edilmez. Named tunnel yerine token'lı (remotely-managed) tunnel kullanılır.

## Yedekleme

SQLite dosyası `app_data` volume'ünde (`/data/app.db`); volume yedeği yeterlidir. OpenWA session `openwa_data` volume'ündedir; kaybı yeniden QR gerektirir.
