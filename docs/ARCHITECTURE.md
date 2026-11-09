# ARCHITECTURE

Hedef kaynağı: [PROJECT_TARGET.md](PROJECT_TARGET.md). Tek kullanıcılı MVP demo.

## Sistem Diyagramı

```
WhatsApp Grupları
      │ (tek hesap, seçili gruplar)
      ▼
┌─────────────┐  webhook   ┌────────────────────┐  Bot API   ┌────────────┐
│   OpenWA    │ ─────────► │  FastAPI Backend   │ ─────────► │  Telegram  │
│  (Docker)   │ POST       │  - Auth (JWT)      │  sendMsg/  │  Hedefleri │
└──────┬──────┘ /api/      │  - Filtre Motoru   │  sendPhoto │ └────────────┘
       │ webhook/openwa    │  - SQLite (/data)  │
       │ QR/status API     └─────────┬──────────┘
       └───────────── status/connect ┤ REST /api (JWT Bearer)
                             ┌───────▼──────────┐
                             │ React + Vite SPA │ Türkçe, koyu tema
                             │ Admin Paneli     │ :5173
                             └──────────────────┘
Dış erişim: Cloudflare Tunnel → https://wp-tg-filter.mbbe.dev (mini-server)
```

## Servisler (docker-compose.yml)

| Servis | Kaynak | Port | Bağımlılık |
|---|---|---|---|
| `openwa` | `${OPENWA_IMAGE:-ghcr.io/rmyndharis/openwa:latest}` | 2785 | — |
| `backend` | `build: ./backend` | 8000 | openwa |
| `frontend` | `build: ./frontend` | 5173:5173 | backend |
| `cloudflared` | `cloudflare/cloudflared:latest`, profile `tunnel` | — | frontend |

Volume: `openwa_data` (OpenWA session), `app_data:/data` (SQLite `app.db`).

## Veri Akışı

1. OpenWA, seçili WhatsApp gruplarındaki mesajı `POST /api/webhook/openwa` ile backend'e gönderir. Payload esnek kabul edilir; chat/group id, sender, text/caption, media_type çıkarılır.
2. Backend grubu kontrol eder: grup `selected` değilse mesaj atlanır, saklanmaz.
3. Filtre motoru aktif filtreleri değerlendirir (bkz. Filtre Motoru).
4. Eşleşen her filtre için **ayrı** Telegram mesajı gönderilir (birleştirme yok).
5. Sadece eşleşen mesajlar `history` tablosuna yazılır: `sent`, `failed`, `dropped_quiet`.
6. Frontend `/api` üzerinden JWT ile dashboard, gruplar, filtreler, hedefler ve geçmişi çeker.

## Filtre Motoru (veri-tabanlı, hard-coded kural yok)

Sıralama her mesaj için:

1. `enabled` filtresi ve grup kısıtı (`group_ids` boşsa tüm seçili gruplar).
2. Sessiz saat kontrolü: `quiet_hours_enabled` ve saat aralığındaysa `quiet_action` = `drop` (history: `dropped_quiet`) veya `queue` (MVP'de kuyruk BACKLOG; uygulanırsa bekletilir).
3. Metin kaynağı: mesaj metni + medya caption'ı.
4. Hariç kelimeler: `exclude_keywords`'den biri geçerse eşleşme iptal.
5. Ana kelime eşleşmesi: `case_sensitive`, `whole_word`, `turkish_normalize` (İ/I, ş/s vb.) uygulanır.
6. Gönderen: `sender_mode` `all|only|except` + `sender_list`.
7. Medya: `media_types` (boşsa hepsi), Link: `link_mode` `any|only_link|no_link`, Uzunluk: `min_length`/`max_length`.
8. Eşleşirse filtrenin `telegram_target_id` hedefiyle Telegram'a gönder; hedef yok/geçersizse `failed` + `error` history'e yazılır.

## İletim Formatı

- Sade metin: orijinal mesaj metni aynen.
- Medya varsa Telegram'ın desteklediği şekilde medya + `caption=text`.
- Her eşleşen filtre ayrı mesaj.

## Kimlik Doğrulama

`POST /api/auth/login` → JWT Bearer. Tüm `/api/*` (health, login, webhook hariç) JWT ister. Tek admin: env `ADMIN_USERNAME`/`ADMIN_PASSWORD`.

## Kararlar

- SQLite: tek kullanıcı/demo için yeterli; dosya `/data/app.db`.
- OpenWA tek session; QR panelden gösterilir (`GET /api/whatsapp/status` içindeki `qr`).
- Şifreler/token'lar: bot token DB'de saklanır, GET'te maskelenir (`bot_token_masked`).
