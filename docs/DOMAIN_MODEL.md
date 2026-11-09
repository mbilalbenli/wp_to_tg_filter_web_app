# DOMAIN_MODEL

Kaynak: [PROJECT_TARGET.md](PROJECT_TARGET.md) §4 ve paylaşılan API sözleşmesi. SQLite tabloları.

## Admin / Ayarlar (tek kullanıcı)

Env tabanlı tek admin: `ADMIN_USERNAME=admin`, `ADMIN_PASSWORD` (varsayılan `wp_to_tg159753`). DB'de kullanıcı tablosu gerekmez; şifre değişimi varsa hash'li saklanır.

`Settings` (tek satır):

| Alan | Tip | Varsayılan |
|---|---|---|
| `default_case_sensitive` | bool | false |
| `default_whole_word` | bool | false |
| `default_turkish_normalize` | bool | true |

## WhatsAppGroup

| Alan | Tip | Not |
|---|---|---|
| `id` | string (WA group id) | PK, OpenWA'dan |
| `name` | string | |
| `participants` | int | |
| `selected` | bool | Dinlenecek mi? Sadece seçililer işlenir |

## Filter

| Alan | Tip | Varsayılan / Değerler |
|---|---|---|
| `id` | int PK | |
| `name` | string | |
| `keyword` | string | Kelime/ifade |
| `enabled` | bool | true |
| `case_sensitive` | bool | Settings varsayılanı |
| `whole_word` | bool | false (içerir) |
| `turkish_normalize` | bool | true |
| `telegram_target_id` | int FK→TelegramTarget, nullable | Filtre bazlı hedef |
| `exclude_keywords` | string[] (JSON) | Biri geçerse iptal |
| `sender_mode` | enum | `all` \| `only` \| `except` |
| `sender_list` | string[] (JSON) | Telefon/isim listesi |
| `quiet_hours_enabled` | bool | false |
| `quiet_start` / `quiet_end` | string `HH:MM` | Örn. 23:00 / 08:00 |
| `quiet_action` | enum | `drop` \| `queue` |
| `media_types` | string[] (JSON) | `text,image,video,audio,document,sticker` alt kümesi; boş = hepsi |
| `link_mode` | enum | `any` \| `only_link` \| `no_link` |
| `min_length` / `max_length` | int nullable | Karakter sayısı |
| `group_ids` | string[] (JSON) | Boş = tüm seçili gruplar |

## TelegramTarget

| Alan | Tip | Not |
|---|---|---|
| `id` | int PK | |
| `name` | string | |
| `bot_token` | string | DB'de saklanır; GET'te dönülmez, `bot_token_masked` döner |
| `chat_id` | string | |
| `chat_title` | string nullable | |
| `is_default` | bool | |

## HistoryItem (sadece eşleşenler)

| Alan | Tip | Not |
|---|---|---|
| `id` | int PK | |
| `wa_message_id` | string nullable | |
| `group_id` / `group_name` | string | |
| `sender` | string | |
| `text` | string | Metin/caption |
| `media_type` | string | `text,image,video,audio,document,sticker,unknown` |
| `matched_filter_id` / `matched_filter_name` | int / string | |
| `telegram_target_id` | int nullable | |
| `status` | enum | `sent` \| `failed` \| `dropped_quiet` |
| `error` | string nullable | Telegram hata mesajı |
| `created_at` | datetime | |

## İlişkiler

- Filter N—1 TelegramTarget; Filter N—N WhatsAppGroup (`group_ids` JSON).
- HistoryItem 1—1 Filter (eşleşme başına bir kayıt; çoklu eşleşmede çoklu kayıt + çoklu Telegram mesajı).
- Eşleşmeyen mesaj kalıcılaştırılmaz.
