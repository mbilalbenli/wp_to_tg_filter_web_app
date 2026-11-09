# TESTING

## Backend (pytest)

```bash
cd backend && pytest -q
```

Kapsam:

- Auth: login başarılı/hatalı şifre `401`, `/api/auth/me` JWT'siz `401`.
- Filtre motoru (birim): içerir/tam kelime, `case_sensitive`, `turkish_normalize` (İ/I, ş/s), `exclude_keywords`, `sender_mode` (`all/only/except`), medya tipi, `link_mode`, min/maks uzunluk, grup kısıtı, sessiz saat (`drop` → `dropped_quiet`).
- Çoklu eşleşme: bir mesaj + iki filtre → iki ayrı Telegram gönderimi (Telegram mock'lanır) + iki history kaydı.
- Eşleşmeyen mesaj history'e yazılmaz; seçili olmayan grup işlenmez.
- Webhook: esnek OpenWA payload şekilleri (text/caption/medya) doğru çıkarılır.
- Telegram hedefleri: GET'te token maskeli (`bot_token_masked`), ham token dönülmez; test ucu mock ile.
- History filtreleri: `search`, `filter_id`, `group_id`.

## Frontend

```bash
cd frontend && npm run build
```

Build hatasız olmalı. (Varsa) `npm test` çalıştırılır.

## Manuel E2E Kontrol Listesi

- [ ] `docker compose up --build` ile openwa + backend + frontend ayağa kalkar
- [ ] `GET /api/health` → `{"status":"ok"}`
- [ ] `admin` / `wp_to_tg159753` ile giriş yapılır, hatalı şifre reddedilir
- [ ] Panelden QR taranır, WhatsApp durumu `connected` olur
- [ ] Gruplar senkronize edilir, seçim kaydedilir, yeniden açılışta korunur
- [ ] Wizard ile Telegram hedefi eklenir, test mesajı hedefe ulaşır
- [ ] Filtre oluşturulur (tüm alanlarla), aktif/pasif çalışır
- [ ] Seçili grupta kelime geçen mesaj, eşleşen her filtre için ayrı Telegram mesajı olarak sade metinle gider; medya varsa medyası+captions ile gider
- [ ] Hariç kelime / sessiz saat / gönderen kuralı eşleşmeyi beklenen şekilde engeller
- [ ] İletilen mesaj Geçmiş'te doğru filtre/grup/durumla görünür; arama çalışır
- [ ] `https://wp-tg-filter.mbbe.dev` üzerinden panele erişilir (tunnel profili aktifken)

## Doğrulama Kaydı (2026-11-09, yerel)

- `pytest backend/tests/ -q` → 10 passed (filtre motoru)
- TestClient smoke → health/login(200)/bad-login(401)/dashboard/filter/webhook(matched:1)/history/unauth(401) OK
- `npm run build` (frontend) → başarılı
- `docker compose config -q` → OK; `docker compose build backend frontend` → başarılı
- `docker compose up -d --no-deps backend frontend` → `curl localhost:5173/api/health` = `{"status":"ok"}`, panel HTML servis ediliyor
- OpenWA imajı resmi repodan doğrulandı: `ghcr.io/rmyndharis/openwa:latest`, port 2785
- Doğrulanmadı (mini-serverda yapılacak): gerçek OpenWA QR/session, gerçek Telegram teslimi, CF Tunnel (`wp-tg-filter.mbbe.dev`)
