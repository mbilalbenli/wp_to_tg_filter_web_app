# WhatsApp → Telegram Filtre Paneli

WhatsApp gruplarındaki mesajları dinler, tanımladığınız kelime/filtrelerle eşleştirir ve eşleşen mesajları Telegram'a iletir. Tek kullanıcılı panel: QR ile WhatsApp bağlantısı, grup seçimi, kelime bazlı filtreler, Telegram bot sihirbazı ve geçmiş.

## Tek Komutla Kurulum

Gereksinim: Docker + Docker Compose v2, Git.

```bash
curl -fsSL https://raw.githubusercontent.com/mbilalbenli/wp_to_tg_filter_web_app/main/install.sh | bash
```

Kendi adresinizle (önerilen; WhatsApp webhook'u için public HTTPS gerekir):

```bash
PUBLIC_URL=https://wp-tg-filter.ornek.com ADMIN_PASSWORD=guclu-bir-sifre \
  curl -fsSL https://raw.githubusercontent.com/mbilalbenli/wp_to_tg_filter_web_app/main/install.sh | bash
```

Repo'yu zaten klonladıysanız:

```bash
./install.sh
```

Script şunları yapar: Docker kontrolü → repo klonlama/güncelleme → `.env` oluşturma (rastgele `JWT_SECRET` üretir) → `docker compose up -d --build` → sağlık kontrolü → panel adresi ve ilk adımları yazdırır.

Kurulum bitince:

- Panel: http://localhost:5173
- Kullanıcı: `admin`
- Şifre: `.env` içindeki `ADMIN_PASSWORD` (varsayılan `wp_to_tg159753`, demo içindir; değiştirin)

## Manuel Kurulum

```bash
git clone https://github.com/mbilalbenli/wp_to_tg_filter_web_app.git
cd wp_to_tg_filter_web_app
cp .env.example .env   # ADMIN_PASSWORD, JWT_SECRET ve OPENWA_WEBHOOK_URL değerlerini düzenleyin
docker compose up -d --build
```

## Panelde İlk Kurulum

1. **WhatsApp:** "Bağlan / QR Al" deyin, QR'ı WhatsApp → Bağlı Cihazlar ile tarayın. Durum `ready / Bağlı` olmalı.
2. **Gruplar:** "Grupları Senkronize Et" ile listeyi çekin, dinlenecek grupları işaretleyip kaydedin. Hiç grup seçilmezse tüm gruplar dinlenir (demo davranışı).
3. **Telegram (Sihirbaz):**
   - BotFather'ı açıp `/newbot` ile bot oluşturun, tokeni yapıştırın, **Tokeni Doğrula** (bot `@kullanıcıadı` ile doğrulanır).
   - **Botu Aç** deyip bota `/start` yazın; **Sohbeti Otomatik Bul** chat ID'yi `getUpdates` üzerinden bulur, listeden seçin. Grup için botu gruba ekleyip bir mesaj yazmanız yeterli.
   - Kaydedip **Test Mesajı Gönder** ile doğrulayın.
4. **Filtreler:** Kelime, hedef, hariç kelimeler, gönderen filtresi, sessiz saatler, medya/link/uzunluk/grup kurallarını ayarlayın. Bir mesaj birden çok filtreyle eşleşirse her filtre ayrı Telegram mesajı gönderir.

## Mimari

```
WhatsApp Grupları → OpenWA → webhook (public HTTPS) → FastAPI Filtre Motoru → Telegram Bot API
                                                              ↕ SQLite
                                                     React + Vite Panel (/api, JWT)
```

Servisler (Docker Compose): `openwa` (`ghcr.io/rmyndharis/openwa`, port 2785), `backend` (FastAPI, 8000), `frontend` (5173), `cloudflared` (opsiyonel `tunnel` profili).

Önemli notlar:

- OpenWA webhook URL'i **public HTTPS** olmalıdır; iç adresler SSRF korumasına takılır. Adresi `.env` içinde `OPENWA_WEBHOOK_URL=https://<adresiniz>/api/webhook/openwa` olarak tanımlayın.
- OpenWA API anahtarı ilk açılışta üretilir ve kalıcı olarak `/app/data/.api-key` içinde saklanır; bu değeri sunucudaki `.env` içinde `OPENWA_API_KEY` olarak tanımlayın.
- **Bağlantıyı Kes ve Bilgileri Sil**, WhatsApp oturumunu tamamen siler (numara dahil); tekrar bağlanmak için yeni QR gerekir.

## Cloudflare Tunnel ile Yayınlama

```bash
# .env içine TUNNEL_TOKEN yazın, sonra:
docker compose --profile tunnel up -d
```

Tünel yapılandırması, mini-server kurulumu ve doğrulama adımları: [docs/INFRASTRUCTURE.md](docs/INFRASTRUCTURE.md)

## Dokümantasyon

Hedef ve interview kararları: [docs/PROJECT_TARGET.md](docs/PROJECT_TARGET.md) · Mimari: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · API: [docs/API_CONTRACT.md](docs/API_CONTRACT.md) · Test: [docs/TESTING.md](docs/TESTING.md) · Diğer 12 doküman `docs/` altında.

## Testler

```bash
python -m pytest backend/tests/ -q
cd frontend && npm run build
```

## Güvenlik Notu

Bu proje tek kullanıcılı demo hedefiyle yazıldı: tek admin hesabı, JWT oturumu, bot tokenları veritabanında. Üretimde `ADMIN_PASSWORD` ve `JWT_SECRET` değerlerini güçlü seçin, `.env` dosyasını asla commit etmeyin.
