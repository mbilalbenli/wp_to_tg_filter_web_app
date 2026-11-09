# SEED_DATA

Demo seed'i idempotenttir: uygulama açılışında eksikse oluşturulur, mevcut veriyi ezmez.

## Admin

| Alan | Değer | Kaynak |
|---|---|---|
| Kullanıcı adı | `admin` | `ADMIN_USERNAME` |
| Şifre | `wp_to_tg159753` | `ADMIN_PASSWORD` (env ile override; üretimde değiştirin) |

DB'de seed kullanıcı tablosu tutulmaz; kimlik env + JWT ile doğrulanır. Panelden şifre değişimi uygulanırsa hash DB'ye yazılır ve env'in önüne geçer.

## Varsayılan Ayarlar (Settings, tek satır)

```json
{"default_case_sensitive": false, "default_whole_word": false, "default_turkish_normalize": true}
```

## Seed Olmayan Veriler

Aşağıdakiler seed edilmez; panelden oluşturulur:

- WhatsApp grupları — `POST /api/groups/sync` ile OpenWA'dan çekilir, `selected=false` başlar.
- Telegram hedefleri — Wizard ile token/chat_id girilir; `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` env'leri yalnızca boş varsayılanlardır.
- Filtreler — kullanıcı oluşturur; örnek/demo filtre seed edilmez.
- Geçmiş — sadece gerçek eşleşmelerle dolar.

## Demo Akışı İçin Kurulum Sırası

1. `.env`: `ADMIN_PASSWORD`, `JWT_SECRET` ayarla → `docker compose up --build`.
2. Panelden QR ile WhatsApp bağla, grupları senkronize et ve seç.
3. Telegram hedefi ekle + test mesajı, sonra filtre oluştur.
