# COMPONENTS

React + Vite SPA. Sayfa = route, ortak parçalar `components/` altında. API erişimi tek client üzerinden (`/api`, JWT Bearer; token login'den).

## Sayfalar (Pages)

| Sayfa | Route | API |
|---|---|---|
| `LoginPage` | `/login` | `POST /api/auth/login` |
| `DashboardPage` | `/` | `GET /api/dashboard` |
| `WhatsAppPage` | `/whatsapp` | `GET /api/whatsapp/status`, `POST connect/disconnect` |
| `GroupsPage` | `/groups` | `GET /api/groups`, `PUT selection`, `POST sync` |
| `FiltersPage` | `/filters` | `GET/POST /api/filters`, `PUT/DELETE /api/filters/{id}` |
| `TelegramTargetsPage` | `/telegram` | `GET/POST /api/telegram/targets`, `PUT/DELETE /{id}`, `POST /{id}/test` |
| `HistoryPage` | `/history` | `GET /api/history?search=&filter_id=&group_id=` |
| `SettingsPage` | `/settings` | `GET/PUT /api/settings` |

## Ortak Bileşenler

| Bileşen | Görev |
|---|---|
| `AppLayout` | Kenar çubuğu (Türkçe menü), üst bar, çıkış |
| `ProtectedRoute` | JWT yoksa `/login`'e yönlendirir |
| `StatusBadge` | Durum rozeti: `sent/failed/dropped_quiet`, WA `connected/qr/...` |
| `QrPanel` | QR görseli + polling ile durum yenileme |
| `FilterForm` | Filtrenin tüm alanları; Temel/Eşleşme/Genişletilmiş grupları |
| `TargetWizard` | Türkçe adım adım bot kurulumu + Test Mesajı Gönder |
| `GroupList` | Checkbox'lı grup seçimi |
| `HistoryTable` | Arama/filtre kontrolleri + liste |
| `ConfirmDialog` / `Toast` | Silme onayı, işlem geri bildirimi |
| `EmptyState` / `LoadingSpinner` / `ErrorBox` | Bkz. STATES.md |

## Veri Akışı

Her sayfa kendi verisini API'den çeker (global store gerekmez); login token'ı `localStorage`/bellekte tutulur, `401`'de login'e dönülür.
