# BACKLOG

Kapsam dışı / engelleyici olmayan maddeler. Öncelik sırası yoktur; her madde ayrı kararla ele alınır. Kaynak: [PROJECT_TARGET.md](PROJECT_TARGET.md) §8.

| # | Madde | Not |
|---|---|---|
| 1 | Regex filtreler | Şu an içerir/tam kelime; regex motoru + panelde doğrulama eklenebilir |
| 2 | Çoklu kullanıcı / rol yönetimi | Demo tek admin; SaaS öncesi zorunlu |
| 3 | SaaS / tenant, ödeme | Kapsam dışı karar; ayrı ürün fazı |
| 4 | Açık/koyu tema geçişi | Tek koyu tema seçildi; token'lar hazır (DESIGN.md) |
| 5 | Sessiz saat kuyruğu (`queue`) retry | MVP `drop` odaklı; kuyruk + saat bitiminde toplu iletim + retry/backoff |
| 6 | Telegram gönderim retry | `failed` kayıtları için otomatik yeniden deneme |
| 7 | Tüm ham mesaj arşivi | Şu an sadece eşleşenler saklanıyor; politika değişirse ayrı tablo |
| 8 | Çoklu WhatsApp hesabı/session | Şu an tek hesap |
| 9 | Filtre şablonları / toplu içe-dışa aktarma | JSON export/import |
| 10 | OpenWA imaj pinleme | İmaj doğrulandıktan sonra sürüm pin + güncelleme notu (INFRASTRUCTURE.md) |

## İnceleme Notları

Engelleyici olmayan bulgular buraya kısa gerekçeyle kaydedilir ve ana görev sürdürülür (AGENTS.md §1).

## Düzeltildi (2026-11-09, QR gelmeme)

- Kök nedenler: (1) backend'de OPENWA_API_KEY boştu (OpenWA 401), (2) client uydurma uçlar kullanıyordu (/sessions/default/qr), session hiç oluşturulup start edilmiyordu, (3) openwa volume /data yerine /app/data olmalıydı; yanlış mount key/session'ı her restart'ta sıfırlıyordu, (4) healthcheck 8080 yerine 2785 olmalı.
- Gerçek akış: POST /api/sessions {name} -> POST /:id/start -> GET /:id/qr ({qrCode: data:image/png;base64,...}). API key kalıcı kaynak: container içi /app/data/.api-key, sunucu .env OPENWA_API_KEY'e yazılır.
- Doğrulama: panel API'si ve https://wp-tg-filter.mbbe.dev üzerinden state=qr_ready, qr_len=6322 alındı.
