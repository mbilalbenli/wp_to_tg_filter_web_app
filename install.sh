#!/usr/bin/env bash
# wp_to_tg_filter_web_app - tek komutluk kurulum
#
# Kullanim:
#   curl -fsSL https://raw.githubusercontent.com/mbilalbenli/wp_to_tg_filter_web_app/main/install.sh | bash
# veya (repo icinden):
#   ./install.sh
#
# Secenekler (ortam degiskenleri):
#   INSTALL_DIR    Kurulum dizini (varsayilan: ./wp_to_tg_filter_web_app, repo icindeysen mevcut dizin)
#   ADMIN_PASSWORD Panel sifresi (varsayilan: wp_to_tg159753 - demo; uretimde degistirin)
#   PUBLIC_URL     Dis adres, ornek: https://wp-tg-filter.mbbe.dev
#                  (OpenWA webhook'u icin gerekir; verilmezse webhook'u panel dis adresinizle
#                   sonra .env icinden OPENWA_WEBHOOK_URL olarak tanimlayin)
set -euo pipefail

REPO_URL="https://github.com/mbilalbenli/wp_to_tg_filter_web_app.git"
say() { printf '\n==> %s\n' "$*"; }
fail() { printf 'HATA: %s\n' "$*" >&2; exit 1; }

command -v docker >/dev/null 2>&1 || fail "Docker bulunamadi. Once Docker kurun: https://docs.docker.com/get-docker/"
docker compose version >/dev/null 2>&1 || fail "Docker Compose v2 bulunamadi (docker compose)."
docker info >/dev/null 2>&1 || fail "Docker calismiyor. Servisi baslatip tekrar deneyin."

# Repo icindeysek klonlama; degilsek klonla
if [ -f docker-compose.yml ] && [ -f backend/app/main.py ]; then
  cd "$(dirname "$0")" 2>/dev/null || true
else
  DIR="${INSTALL_DIR:-wp_to_tg_filter_web_app}"
  if [ -d "$DIR/.git" ]; then
    say "Mevcut kurulum guncelleniyor: $DIR"
    git -C "$DIR" pull --ff-only || true
  else
    say "Repo klonlaniyor: $REPO_URL"
    git clone "$REPO_URL" "$DIR"
  fi
  cd "$DIR"
fi

# .env hazirla
if [ ! -f .env ]; then
  say ".env olusturuluyor"
  cp .env.example .env
  SECRET="$(python3 -c 'import secrets; print(secrets.token_hex(32))' 2>/dev/null || openssl rand -hex 32 2>/dev/null || date +%s | shasum -a 256 | cut -d' ' -f1)"
  python3 - "$SECRET" <<'PY'
import pathlib, re, sys
p = pathlib.Path(".env"); t = p.read_text()
t = re.sub(r"^JWT_SECRET=.*$", "JWT_SECRET=" + sys.argv[1], t, flags=re.M)
p.write_text(t)
PY
else
  say "Mevcut .env korunuyor"
fi

if [ -n "${ADMIN_PASSWORD:-}" ]; then
  python3 - "$ADMIN_PASSWORD" <<'PY'
import pathlib, re, sys
p = pathlib.Path(".env"); t = p.read_text()
t = re.sub(r"^ADMIN_PASSWORD=.*$", "ADMIN_PASSWORD=" + sys.argv[1], t, flags=re.M)
p.write_text(t)
PY
fi

# OpenWA webhook adresi (SSRF korumasi nedeniyle public HTTPS olmali)
if [ -n "${PUBLIC_URL:-}" ]; then
  python3 - "$PUBLIC_URL" <<'PY'
import pathlib, re, sys
p = pathlib.Path(".env"); t = p.read_text()
url = sys.argv[1].rstrip("/") + "/api/webhook/openwa"
if re.search(r"^OPENWA_WEBHOOK_URL=.*$", t, flags=re.M):
    t = re.sub(r"^OPENWA_WEBHOOK_URL=.*$", "OPENWA_WEBHOOK_URL=" + url, t, flags=re.M)
else:
    t += "\nOPENWA_WEBHOOK_URL=" + url + "\n"
p.write_text(t)
PY
fi

say "Servisler derlenip baslatiliyor (ilk kurulum birkac dakika surebilir)"
docker compose up -d --build

say "Saglik kontrolu bekleniyor"
for i in $(seq 1 30); do
  if curl -fsS http://localhost:8000/api/health >/dev/null 2>&1; then break; fi
  sleep 2
  [ "$i" = 30 ] && fail "Backend saglik kontrolu gecmedi. Loglar: docker compose logs backend"
done
for i in $(seq 1 30); do
  if curl -fsS http://localhost:5173/ >/dev/null 2>&1; then break; fi
  sleep 2
  [ "$i" = 30 ] && fail "Frontend saglik kontrolu gecmedi. Loglar: docker compose logs frontend"
done

cat <<'DONE'

Kurulum tamam.

  Panel:    http://localhost:5173
  Kullanici: admin
  Sifre:     ADMIN_PASSWORD (.env) - varsayilan wp_to_tg159753

Siradaki adimlar (panel icinde):
  1. WhatsApp sayfasindan QR okutup baglanin.
  2. Gruplar sayfasindan senkronize edip dinlenecek gruplari secin.
  3. Telegram sayfasindaki sihirbazla botu baglayin (token dogrula -> bota /start -> sohbet otomatik bulunur -> test).
  4. Filtreler sayfasindan kelime kurallarinizi olusturun.

Not: WhatsApp mesajlarinin panele dusmesi icin OpenWA webhook'unun public HTTPS
adresinize ulasmasi gerekir. PUBLIC_URL vermediyseniz .env icinde
OPENWA_WEBHOOK_URL=https://<adresiniz>/api/webhook/openwa tanimlayip
"docker compose up -d" calistirin. Detaylar: README.md ve docs/INFRASTRUCTURE.md
DONE
