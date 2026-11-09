# STATES

## WhatsApp Bağlantı Durumları (`GET /api/whatsapp/status` → `state`)

| State | Anlam | UI |
|---|---|---|
| `disconnected` | Bağlı değil | "Bağlan" butonu |
| `qr` | QR bekleniyor | QR görseli + otomatik yenileme |
| `connecting` | QR tarandı, bağlanıyor | Bekleme göstergesi |
| `connected` | Bağlı | Hesap bilgisi, "Bağlantıyı Kes" |

`connected=false` iken grup senkronu/filtre iletimi çalışmaz; dashboard bunu gösterir.

## Filtre Durumları

- `enabled=true` aktif, `false` pasif (motor pasifi atlar).
- Yeni filtre Settings varsayılanlarıyla başlar (`case_sensitive`, `whole_word`, `turkish_normalize`).
- Hedefi silinmiş/eksik filtre eşleşirse iletim `failed` olur, history'e hata yazılır.

## Geçmiş Durumları (`HistoryItem.status`)

| Status | Anlam |
|---|---|
| `sent` | Telegram'a iletildi |
| `failed` | Telegram hatası (`error` alanında detay) |
| `dropped_quiet` | Sessiz saatlerde düşürüldü |

`quiet_action=queue` MVP'de uygulanırsa bekleyen kayıtlar ayrı değerlendirilir (bkz. BACKLOG).

## UI Durumları (her liste/form sayfası)

| Durum | Davranış |
|---|---|
| Loading | Spinner/skeleton; butonlar devre dışı |
| Empty | Türkçe boş durum metni + ilgili aksiyon (örn. "Henüz filtre yok — Filtre Ekle") |
| Error | API `detail` mesajı Türkçe hata kutusunda + Tekrar Dene |
| Success | Toast + liste yenileme |
| Unauthorized (401) | Token temizlenir, `/login`'e yönlendirilir |

## Sessiz Saat

`quiet_hours_enabled` ve şimdi `quiet_start–quiet_end` aralığında (gece aşımı desteklenir, örn. 23:00–08:00): `drop` → `dropped_quiet`; `queue` → BACKLOG davranışı.
