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


async def get_me(bot_token: str):
    """Validate a token via getMe. Returns (bot_dict_or_None, error)."""
    if not bot_token:
        return None, "Bot token boş"
    try:
        async with httpx.AsyncClient(timeout=10) as c:
            r = await c.get(f"https://api.telegram.org/bot{bot_token}/getMe")
            d = r.json() if "json" in r.headers.get("content-type", "") else {}
            if r.status_code >= 400 or not d.get("ok"):
                return None, (d.get("description") or f"Telegram {r.status_code}")
            b = d.get("result") or {}
            return {"id": b.get("id"), "username": b.get("username"),
                    "first_name": b.get("first_name"),
                    "link": f"https://t.me/{b.get('username')}" if b.get("username") else None}, ""
    except Exception as e:
        return None, str(e)


async def discover_chats(bot_token: str):
    """Collect distinct chats from getUpdates after the user /start'ed the bot
    or wrote in a group the bot is in. Returns (chats, error)."""
    if not bot_token:
        return [], "Bot token boş"
    try:
        async with httpx.AsyncClient(timeout=10) as c:
            r = await c.get(f"https://api.telegram.org/bot{bot_token}/getUpdates")
            d = r.json() if "json" in r.headers.get("content-type", "") else {}
            if r.status_code >= 400 or not d.get("ok"):
                return [], (d.get("description") or f"Telegram {r.status_code}")
            chats = {}
            for u in d.get("result") or []:
                msg = u.get("message") or u.get("channel_post") or u.get("my_chat_member") or {}
                chat = msg.get("chat") if isinstance(msg, dict) else None
                if not chat:
                    continue
                cid = str(chat.get("id"))
                frm = msg.get("from") or {} if isinstance(msg, dict) else {}
                chats[cid] = {"chat_id": cid, "type": chat.get("type"),
                              "title": chat.get("title") or " ".join(x for x in [chat.get("first_name"), chat.get("last_name")] if x) or chat.get("username") or "",
                              "username": chat.get("username"), "from": frm.get("first_name")}
            return list(chats.values()), ""
    except Exception as e:
        return [], str(e)
