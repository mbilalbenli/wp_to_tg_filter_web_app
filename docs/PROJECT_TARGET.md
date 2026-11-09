# PROJECT_TARGET — wp_to_tg_filter_web_app

> Bu doküman, 2026-11-09 tarihinde `muse.request_user_input` ile yapılan detaylı interview'ın
> kaydıdır. Tüm kararlar kullanıcı tarafından seçilmiştir. Geliştirme bu hedefe kilitlenir;
> sapma gerekirse önce bu doküman güncellenir.

## 1. Müşteri Talebi (Özgün Metin)

```
benim WhatsApp gruplarından yapılan iş paylaşımlarını kullanıcının seçtiği kelimeleri takip
Edip kullanıcının seçtiği kelimenin geçen yazıyı Telegram üzerinden kullanıcıya iletebilecek
bir sistem kurmak istiyorum
```

**Özet:** WhatsApp gruplarındaki mesajları dinle → kullanıcı tanımlı kelime/filtrelerle eşleştir
→ eşleşen mesajı Telegram üzerinden ilet. Tek kişilik (single-user) demo.

## 2. Interview Kapsamı

Interview 6 tur, 17 soru ile aşağıdaki alanların tamamını kapsadı:

| # | Alan | Karar Özeti |
|---|------|-------------|
| 1 | Kapsam / ölçek | Tek kişilik MVP demo |
| 2 | WhatsApp kaynağı | Tek hesap, panelden seçili gruplar |
| 3 | Eşleşme kuralı | İçerir + harf duyarsız (varsayılan), kelime bazlı override |
| 4 | Telegram hedefi | Filtre bazlı hedef (her filtre kendi hedefine gidebilir) |
| 5 | Medya | Metin + medya birlikte iletilir, caption'da da arama yapılır |
| 6 | İletim formatı | Sade metin (orijinal mesaj metni aynen) |
| 7 | Panel kapsamı | Tam MVP panel: Giriş, Dashboard, Gruplar, Kelimeler/Filtreler, Telegram Hedefleri, Log/Geçmiş, Ayarlar |
| 8 | Geçmiş politikası | Sadece eşleşen/iletilen mesajlar DB'de saklanır |
| 9 | Tekrar / çoklu eşleşme | Her filtre ayrı Telegram mesajı gönderir (birleştirme yok) |
| 10 | Kelime bazlı ayarlar | Aktif/pasif, harf duyarlı, tam kelime, Telegram hedefi + genişletilmiş set (bkz. §4) |
| 11 | Domain | `wp-tg-filter.mbbe.dev` (Cloudflare Tunnel, mini-server) |
| 12 | Bot kurulumu | Panelden token/chat_id, tamamen Türkçe anlatımlı Wizard arayüzü |
| 13 | WhatsApp bağlantısı | Panelden QR ile bağlan, durum panelde canlı |
| 14 | Ek kurallar | Hariç kelimeler, gönderen filtresi, sessiz saatler + genişletilmiş filtreler |
| 15 | Dil / tema | Arayüz tamamen Türkçe, tek koyu tema, responsive |
| 16 | Stack | Python FastAPI + SQLite, Docker Compose destekli |
| 17 | Güvenlik | Tek admin girişi: `admin` / `wp_to_tg159753` (demo, bkz. §6) |

## 3. Hedef Mimari

```
WhatsApp Grupları
      │  (OpenWA — https://github.com/rmyndharis/OpenWA)
      ▼
┌─────────────┐   webhook/poll   ┌──────────────────┐   Telegram Bot API   ┌────────────┐
│   OpenWA    │ ───────────────► │  FastAPI Backend │ ───────────────────► │  Telegram  │
│  (Docker)   │                  │  Filtre Motoru   │   core.telegram.org  │  Hedefleri │
└─────────────┘                  │  SQLite DB       │                      └────────────┘
                                 └────────┬─────────┘
                                          │ REST API (JWT)
                                 ┌────────▼─────────┐
                                 │ React + Vite SPA │  (Türkçe, koyu tema)
                                 │  Admin Paneli    │
                                 └──────────────────┘
      Dış erişim: Cloudflare Tunnel → https://wp-tg-filter.mbbe.dev (mini-server)
```

- **Backend:** Python + FastAPI, SQLite, Docker Compose.
- **WhatsApp:** OpenWA (Docker imajı/servisi), tek session, QR panelden.
- **Telegram:** Bot API; token/chat_id paneldeki Türkçe Wizard ile girilir, DB'de saklanır.
- **Frontend:** React + Vite, tamamen Türkçe, koyu tema, responsive.
- **Deploy:** Mini-server üzerinde `docker compose up`, Cloudflare Tunnel ile
  `wp-tg-filter.mbbe.dev` adresine bağlanır. Tunnel işlemleri için mini-serverdaki mevcut
  tüneller araştırılır; gerekirse `cachyos-ssh` skill'i / CF manager kullanılır.

## 4. Filtre (Kelime) Modeli — Kelime Başına Ayarlar

Her filtre kaydı şu alanları taşır (panelde checkbox/select ile düzenlenir):

**Temel:**
- Kelime/ifade metni, Aktif/Pasif, Telegram hedefi (filtre bazlı)

**Eşleşme (kelime bazlı override edilebilir):**
- Büyük/küçük harf duyarlı mı?
- Tam kelime mi, içerir mi?
- Türkçe karakter normalize (İ/I, ş/s vb. duyarsızlık)

**Genişletilmiş (interview'da onaylanan ek set):**
- Hariç tutulan kelimeler (biri geçerse eşleşme iptal)
- Gönderen filtresi: sadece listedekiler / listedekiler hariç
- Sessiz saatler (örn. 23:00–08:00 arası iletme, kuyruğa al veya düşür — varsayılan: iletme)
- Medya tipi filtresi (metin / resim / video / ses / dosya / sticker)
- Link içeriyor mu? (sadece linkliler / linksizler / fark etmez)
- Min./maks. mesaj uzunluğu
- Grup kısıtı (filtre sadece seçili gruplarda geçerli; boşsa tüm seçili gruplar)

**Davranış:**
- Bir mesaj birden çok filtreyle eşleşirse **her filtre ayrı** Telegram mesajı gönderir.
- Sadece eşleşen mesajlar geçmişe yazılır (ham mesajlar saklanmaz).

## 5. Panel Sayfaları

1. **Giriş** — tek admin (bkz. §6)
2. **Dashboard** — WhatsApp bağlantı durumu, aktif filtre sayısı, bugün iletilen, son eşleşmeler
3. **WhatsApp Bağlantısı** — QR ile bağlan, hesap bilgisi, yeniden bağlan
4. **Gruplar** — OpenWA'dan grupları listele, dinlenecekleri seç (checkbox)
5. **Kelimeler / Filtreler** — CRUD + §4'teki tüm ayarlar
6. **Telegram Hedefleri** — bot token/chat_id Wizard (Türkçe adım adım), hedef CRUD, test mesajı
7. **Geçmiş / Log** — iletilen mesajlar, filtre/grup/zaman arama
8. **Ayarlar** — genel eşleşme varsayılanları, admin şifre değiştirme

## 6. Güvenlik (Demo)

- Kullanıcı adı: `admin`
- Şifre: `wp_to_tg159753`  ← **kullanıcının açık talebiyle dokümana yazıldı; ortam demo ve
  güvenli kabul ediliyor.** Üretimde `.env`'den değiştirilmeli.
- Oturum: JWT (httpOnly cookie veya Bearer), backend'de hash'li doğrulama.
- Şifre `.env` (`ADMIN_PASSWORD`) ile override edilebilir; panelden değiştirilebilir.

## 7. Kabul Kriterleri (MVP)

- [x] `docker compose up` ile openwa + backend + frontend ayağa kalkar
- [ ] Panelden QR taranır, WhatsApp bağlanır, gruplar listelenir ve seçilir
- [ ] Wizard ile Telegram bot token + chat_id girilir, test mesajı gider
- [ ] Filtre (kelime + tüm §4 ayarları) oluşturulur
- [ ] Seçili grupta kelime geçen mesaj, eşleşen her filtre için ayrı Telegram mesajı olarak,
      sade metin formatında, medya varsa medyasıyla iletilir
- [ ] İletilen mesaj Geçmiş sayfasında görünür
- [x] `https://wp-tg-filter.mbbe.dev` üzerinden panele erişilir (mini-server + CF Tunnel)

## 8. Kapsam Dışı (Demo için)

- Çoklu kullanıcı / rol yönetimi, SaaS/tenant, ödeme
- Tüm ham mesajların arşivlenmesi
- Regex filtreler (BACKLOG'a not edilebilir)
- Açık/koyu tema geçişi (tek koyu tema seçildi)

## 9. Çalışma Şekli

- Geliştirme **paralel agentlar** ile yapılır (backend / frontend / docs+infra).
- Repo **commit'lerle** güncel tutulur; her anlamlı adım ayrı commit.
- `docs/` altındaki 12 dokümanın tamamı her aşamada senkron tutulur (AGENTS.md §2).
- Sağlam ve dinamik yapı: filtre motoru veri-tabanlı (hard-coded kural yok), yeni filtre
  alanları şema genişletilerek eklenebilir.
