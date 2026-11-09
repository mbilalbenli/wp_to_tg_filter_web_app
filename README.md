# WhatsApp → Telegram Filtre Paneli

WhatsApp gruplarındaki mesajları dinler, tanımladığınız kelime/filtrelerle eşleştirir ve eşleşen mesajları Telegram'a sade metin olarak iletir. Tek kullanıcılı MVP demo.

Hedef tanımı: [docs/PROJECT_TARGET.md](docs/PROJECT_TARGET.md)

## Hızlı Başlangıç

```bash
cp .env.example .env   # ADMIN_PASSWORD ve JWT_SECRET değerlerini kontrol edin
docker compose up --build
```

- Panel: http://localhost:5173
- Backend sağlık: http://localhost:8000/api/health
- Kullanıcı adı: `admin`
- Şifre: `wp_to_tg159753` (`.env` içindeki `ADMIN_PASSWORD` ile değiştirilebilir)

## İlk Kurulum (Panel İçinde)

1. **Giriş** — `admin` / şifrenizle giriş yapın.
2. **WhatsApp Bağlantısı** — "Bağlan"a tıklayın, panelde çıkan QR kodu WhatsApp > Bağlı Cihazlar ile tarayın. Durum "Bağlı" olmalı.
3. **Gruplar** — "Senkronize Et" ile grupları çekin, dinlenecek grupları işaretleyin, kaydedin.
4. **Telegram Hedefleri (Wizard)** — BotFather'dan bot token alın, botu hedef sohbete ekleyin, chat_id girin, "Test Mesajı Gönder" ile doğrulayın.
5. **Filtreler** — Kelime, hedef, hariç kelimeler, gönderen/sessiz saat/medya/link/uzunluk/grup kurallarını ayarlayıp aktif edin.
6. **Geçmiş** — İletilen mesajlar burada listelenir. Sadece eşleşen mesajlar saklanır.

## Mimari Özeti

```
WhatsApp Grupları → OpenWA → POST /api/webhook/openwa → FastAPI Filtre Motoru → Telegram Bot API
                                                              ↕ SQLite
                                                     React + Vite Panel (/api, JWT)
```

Detay: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · API: [docs/API_CONTRACT.md](docs/API_CONTRACT.md)

## Mini-Server / Tunnel ile Yayınlama

Domain: `wp-tg-filter.mbbe.dev`

```bash
# mini-server üzerinde
docker compose up --build -d
docker compose --profile tunnel up -d cloudflared   # TUNNEL_TOKEN .env içinde olmalı
```

1. Cloudflare Zero Trust > Networks > Tunnels içinde tunnel oluşturun, token'ı `.env`'e `TUNNEL_TOKEN` olarak yazın.
2. Public Hostname: `wp-tg-filter.mbbe.dev` → `http://frontend:5173` (veya host üzerinden yayınlıyorsanız `http://localhost:5173`).
3. Mevcut tünelleri doğrulamak için mini-server'a `cachyos-ssh` skill'i ile bağlanıp çalışan `cloudflared` servislerini / CF manager panelini kontrol edin. Bkz. [docs/INFRASTRUCTURE.md](docs/INFRASTRUCTURE.md).

> OpenWA imajı: `ghcr.io/rmyndharis/openwa:latest` (port 2785, resmi repodan doğrulandı).

## Geliştirme ve Test

- Backend testleri: `pytest` (bkz. [docs/TESTING.md](docs/TESTING.md))
- Dokümantasyon: `docs/` altındaki 12 doküman senkron tutulur.
