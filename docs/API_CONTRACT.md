# API_CONTRACT

Base: `/api`. JSON. Bearer JWT (`Authorization: Bearer <token>`) — `health`, `auth/login`, `webhook/openwa` hariç tüm uçlar JWT ister. Hata formatı: `{"detail": "..."}` (FastAPI varsayılanı).

## Health

`GET /api/health` → `{"status":"ok"}`

## Auth

`POST /api/auth/login` — İstek: `{"username":"admin","password":"wp_to_tg159753"}`
→ `{"access_token":"<jwt>","token_type":"bearer"}`; hatalı girişte `401`.

`GET /api/auth/me` → `{"username":"admin"}`

## Dashboard

`GET /api/dashboard` →
```json
{"wa_connected":true,"wa_account":"+90... / İsim","active_filters":3,"selected_groups":5,"sent_today":12,"total_sent":340,
 "recent_matches":[{"id":1,"group_name":"Grup","sender":"+90...","text":"...","matched_filter_name":"Filtre","status":"sent","created_at":"2026-11-09T12:00:00Z"}]}
```

## WhatsApp

`GET /api/whatsapp/status` → `{"connected":bool,"account":string|null,"qr":string|null,"state":"disconnected|qr|connecting|connected"}`
`qr`: data URL veya null; bağlıyken null.

`POST /api/whatsapp/connect` → status nesnesi (QR üretimini başlatır).
`POST /api/whatsapp/disconnect` → status nesnesi.

## Gruplar

`GET /api/groups` → `[{"id":"120363...@g.us","name":"Grup","participants":42,"selected":true}]`
`PUT /api/groups/selection` — `{"group_ids":["..."]}` → güncel liste.
`POST /api/groups/sync` → OpenWA'dan grupları çeker/günceller, güncel liste döner.

## Filtreler

`GET /api/filters` → Filter[] · `POST /api/filters` → oluşturulan Filter (`201`)
`GET /api/filters/{id}` · `PUT /api/filters/{id}` · `DELETE /api/filters/{id}` → `204`/silinen id.

Filter gövdesi (POST/PUT):
```json
{"name":"İş İlanı","keyword":"eleman aranıyor","enabled":true,"case_sensitive":false,"whole_word":false,
 "turkish_normalize":true,"telegram_target_id":1,"exclude_keywords":["stajyer"],
 "sender_mode":"all","sender_list":[],"quiet_hours_enabled":false,"quiet_start":"23:00","quiet_end":"08:00",
 "quiet_action":"drop","media_types":[],"link_mode":"any","min_length":null,"max_length":null,"group_ids":[]}
```
Geçersiz enum/değer → `422`.

## Telegram Hedefleri

`GET /api/telegram/targets` → `[{"id":1,"name":"Ana","bot_token_masked":"1234...abcd","chat_id":"-100...","chat_title":"Kanal","is_default":true}]` (ham `bot_token` dönülmez)
`POST /api/telegram/targets` — `{"name","bot_token","chat_id","chat_title?","is_default"}` → oluşturulan hedef (maskeli).
`PUT /api/telegram/targets/{id}` · `DELETE /api/telegram/targets/{id}`
`POST /api/telegram/targets/{id}/test` → `{"ok":true}` veya `{"ok":false,"error":"..."}`; Telegram'a test mesajı gönderir.
Not: `GET/POST /api/telegram/bots` ayrı ucu yoktur; bot token hedef kaydındadır.

## Ayarlar

`GET /api/settings` → `{"default_case_sensitive":false,"default_whole_word":false,"default_turkish_normalize":true}`
`PUT /api/settings` — aynı alanlar → güncel ayarlar.

## Geçmiş

`GET /api/history?search=&filter_id=&group_id=` →
```json
{"items":[{"id":1,"wa_message_id":"...","group_id":"...@g.us","group_name":"Grup","sender":"+90...","text":"...",
 "media_type":"text","matched_filter_id":1,"matched_filter_name":"İş İlanı","telegram_target_id":1,
 "status":"sent","error":null,"created_at":"2026-11-09T12:00:00Z"}],"total":1}
```
`status`: `sent|failed|dropped_quiet`. Sadece eşleşen mesajlar bulunur.

## Webhook (OpenWA)

`POST /api/webhook/openwa` — JWT yok (OpenWA çağırır). Esnek payload tolere edilir; olası şekillerden `chatId/groupId/from/chat`, `sender/author`, `body/text/caption`, medya tipi çıkarılır. Seçili olmayan grup/eşleşme yoksa `{"ok":true,"matched":0}`; eşleşmede `{"ok":true,"matched":<filtre sayısı>}`.

## Telegram Wizard Uçları (2026-11-09)

- `POST /api/telegram/validate-token` {bot_token} -> {ok, bot:{id,username,first_name,link}} (getMe; geçersizse 400 Türkçe)
- `POST /api/telegram/discover-chat` {bot_token} -> {chats:[{chat_id,type,title,username,from}]} (getUpdates; kullanıcı bota /start yazdıktan veya botun olduğu grupta mesaj attıktan sonra dolar)
