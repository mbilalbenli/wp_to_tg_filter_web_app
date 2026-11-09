# DESIGN

## İlkeler

- Tamamen Türkçe arayüz; tek **koyu tema** (tema geçişi yok — BACKLOG).
- Responsive: mobilde tek sütun, masaüstünde kenar çubuğu + içerik.
- Gereksiz ikincil etiket/açıklama yok; düzen kendi kendini anlatır. Eyebrow text kullanılmaz.
- Durum renkleri: bağlı/başarılı yeşil, bekliyor sarı, hata/bağlı değil kırmızı, pasif gri.

## Renk / Tipografi (koyu tema)

| Token | Değer (öneri) | Kullanım |
|---|---|---|
| `--bg` | `#0f1115` | Sayfa zemini |
| `--surface` | `#171a21` | Kart/panel |
| `--border` | `#262b36` | Kenarlık |
| `--text` | `#e8eaf0` | Ana metin |
| `--text-muted` | `#9aa3b2` | İkincil metin |
| `--accent` | `#2ea6ff` (Telegram mavisi) | Birincil buton, link |
| `--success` / `--danger` / `--warning` | `#2fbf71` / `#e5534b` / `#e3b341` | Durumlar |

Font: sistem font yığını; başlıklar semibold, gövde 14–16px.

## Sayfalar

1. **Giriş** — ortalanmış kart: kullanıcı adı, şifre, "Giriş Yap".
2. **Dashboard** — durum kartları (WhatsApp, aktif filtre, seçili grup, bugün iletilen, toplam) + son eşleşmeler listesi.
3. **WhatsApp Bağlantısı** — QR alanı / bağlı hesap bilgisi, Bağlan / Bağlantıyı Kes.
4. **Gruplar** — Senkronize Et butonu, checkbox'lı grup listesi, Kaydet.
5. **Filtreler** — liste + ekle/düzenle formu (tüm Filter alanları, gruplandırılmış: Temel, Eşleşme, Genişletilmiş).
6. **Telegram Hedefleri** — Türkçe adım adım Wizard (BotFather → token → sohbete ekle → chat_id → test) + hedef listesi.
7. **Geçmiş** — arama + filtre/grup seçimi, durum rozetli liste.
8. **Ayarlar** — varsayılan eşleşme ayarları, şifre değiştirme.

## Etkileşim

- Kaydetme sonrası toast/geri bildirim; silmede onay.
- QR beklerken otomatik yenileme (polling); bağlanınca QR gizlenir.
- Form hataları alan altında Türkçe gösterilir.
