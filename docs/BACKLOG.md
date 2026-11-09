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
