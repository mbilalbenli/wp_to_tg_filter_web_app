import httpx

_METHODS = {"image": "sendPhoto", "photo": "sendPhoto", "video": "sendVideo", "audio": "sendAudio", "voice": "sendAudio"}


async def send_telegram(bot_token: str, chat_id: str, text: str, media_type: str = "text", media_url: str = ""):
    """Returns (ok, error). Graceful failure when token/chat missing."""
    if not bot_token or not chat_id:
        return False, "Telegram bot_token/chat_id eksik"
    base = f"https://api.telegram.org/bot{bot_token}"
    mt = (media_type or "text").lower()
    try:
        async with httpx.AsyncClient(timeout=10) as c:
            if media_url and mt in _METHODS:
                field = {"sendPhoto": "photo", "sendVideo": "video", "sendAudio": "audio"}[_METHODS[mt]]
                r = await c.post(f"{base}/{_METHODS[mt]}", json={"chat_id": chat_id, field: media_url, "caption": text or ""})
            elif media_url and mt in ("document", "file"):
                r = await c.post(f"{base}/sendDocument", json={"chat_id": chat_id, "document": media_url, "caption": text or ""})
            else:
                r = await c.post(f"{base}/sendMessage", json={"chat_id": chat_id, "text": text or ""})
            if r.status_code >= 400:
                return False, f"Telegram {r.status_code}: {r.text[:300]}"
            return True, ""
    except Exception as e:
        return False, str(e)


async def send_test(bot_token: str, chat_id: str):
    return await send_telegram(bot_token, chat_id, "Test mesajı — wp_to_tg bağlantısı çalışıyor.")
