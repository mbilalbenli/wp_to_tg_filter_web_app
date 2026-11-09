import os
from datetime import datetime, time as dtime
from fastapi import Depends, FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import openwa_client, telegram_client
from .filter_engine import evaluate_filter
from .models import Base, Filter, Group, History, SessionLocal, Setting, TelegramTarget, User, engine, get_db
from .schemas import FilterIn, LoginIn, SelectionIn, SettingsIn, TargetIn, TokenIn
from .security import create_token, hash_password, require_auth, verify_password

app = FastAPI(title="wp_to_tg_filter")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "wp_to_tg159753")
DEFAULT_SETTINGS = {"default_case_sensitive": False, "default_whole_word": False, "default_turkish_normalize": False}


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if not db.query(User).filter_by(username=ADMIN_USERNAME).first():
            db.add(User(username=ADMIN_USERNAME, password_hash=hash_password(ADMIN_PASSWORD)))
        for k, v in DEFAULT_SETTINGS.items():
            if not db.get(Setting, k):
                db.add(Setting(key=k, value=v))
        db.commit()
    finally:
        db.close()


def filter_dict(f: Filter):
    return {"id": f.id, "name": f.name, "keyword": f.keyword, "enabled": bool(f.enabled),
            "case_sensitive": bool(f.case_sensitive), "whole_word": bool(f.whole_word),
            "turkish_normalize": bool(f.turkish_normalize), "telegram_target_id": f.telegram_target_id,
            "exclude_keywords": f.exclude_keywords or [], "sender_mode": f.sender_mode or "all",
            "sender_list": f.sender_list or [], "quiet_hours_enabled": bool(f.quiet_hours_enabled),
            "quiet_start": f.quiet_start or "23:00", "quiet_end": f.quiet_end or "08:00",
            "quiet_action": f.quiet_action or "drop", "media_types": f.media_types or [],
            "link_mode": f.link_mode or "any", "min_length": f.min_length, "max_length": f.max_length,
            "group_ids": f.group_ids or []}


def target_dict(t: TelegramTarget):
    tok = t.bot_token or ""
    masked = (tok[:4] + "****" + tok[-4:]) if len(tok) > 8 else ("****" if tok else "")
    return {"id": t.id, "name": t.name, "bot_token_masked": masked, "chat_id": t.chat_id,
            "chat_title": t.chat_title or "", "is_default": bool(t.is_default)}


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/auth/login")
def login(body: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter_by(username=body.username).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "Kullanıcı adı veya şifre hatalı")
    return {"access_token": create_token(user.username), "token_type": "bearer"}


@app.get("/api/auth/me")
def me(user=Depends(require_auth)):
    return {"username": user}


@app.get("/api/dashboard")
def dashboard(db: Session = Depends(get_db), user=Depends(require_auth)):
    today = datetime.utcnow().date()
    total = db.query(History).filter(History.status == "sent").count()
    sent_today = db.query(History).filter(History.status == "sent").all()
    sent_today = len([h for h in sent_today if h.created_at and h.created_at.date() == today])
    recent = db.query(History).order_by(History.id.desc()).limit(10).all()
    selected = db.query(Group).filter_by(selected=True).count()
    return {"wa_connected": False, "wa_account": None,
            "active_filters": db.query(Filter).filter_by(enabled=True).count(),
            "selected_groups": selected, "sent_today": sent_today, "total_sent": total,
            "recent_matches": [history_dict(h) for h in recent]}


@app.get("/api/whatsapp/status")
async def wa_status(user=Depends(require_auth)):
    return await openwa_client.get_status()


@app.post("/api/whatsapp/connect")
async def wa_connect(user=Depends(require_auth)):
    return await openwa_client.connect()


@app.post("/api/whatsapp/disconnect")
async def wa_disconnect(user=Depends(require_auth)):
    return await openwa_client.disconnect()


@app.get("/api/groups")
def groups(db: Session = Depends(get_db), user=Depends(require_auth)):
    return [{"id": g.id, "name": g.name, "participants": g.participants, "selected": bool(g.selected)} for g in db.query(Group).all()]


@app.put("/api/groups/selection")
def set_selection(body: SelectionIn, db: Session = Depends(get_db), user=Depends(require_auth)):
    ids = set(body.group_ids)
    for g in db.query(Group).all():
        g.selected = g.id in ids
    db.commit()
    return {"selected": sorted(ids)}


@app.post("/api/groups/sync")
async def sync_groups(db: Session = Depends(get_db), user=Depends(require_auth)):
    remote = await openwa_client.list_groups()
    existing = {g.id: g for g in db.query(Group).all()}
    for r in remote:
        if r["id"] in existing:
            existing[r["id"]].name, existing[r["id"]].participants = r["name"], r["participants"]
        elif r["id"]:
            db.add(Group(id=r["id"], name=r["name"], participants=r["participants"], selected=False))
    db.commit()
    return [{"id": g.id, "name": g.name, "participants": g.participants, "selected": bool(g.selected)} for g in db.query(Group).all()]


@app.get("/api/filters")
def list_filters(db: Session = Depends(get_db), user=Depends(require_auth)):
    return [filter_dict(f) for f in db.query(Filter).all()]


@app.post("/api/filters")
def create_filter(body: FilterIn, db: Session = Depends(get_db), user=Depends(require_auth)):
    f = Filter(**body.model_dump())
    db.add(f); db.commit(); db.refresh(f)
    return filter_dict(f)


@app.get("/api/filters/{fid}")
def get_filter(fid: int, db: Session = Depends(get_db), user=Depends(require_auth)):
    f = db.get(Filter, fid)
    if not f: raise HTTPException(404, "Filtre bulunamadı")
    return filter_dict(f)


@app.put("/api/filters/{fid}")
def update_filter(fid: int, body: FilterIn, db: Session = Depends(get_db), user=Depends(require_auth)):
    f = db.get(Filter, fid)
    if not f: raise HTTPException(404, "Filtre bulunamadı")
    for k, v in body.model_dump().items(): setattr(f, k, v)
    db.commit(); db.refresh(f)
    return filter_dict(f)


@app.delete("/api/filters/{fid}")
def delete_filter(fid: int, db: Session = Depends(get_db), user=Depends(require_auth)):
    f = db.get(Filter, fid)
    if not f: raise HTTPException(404, "Filtre bulunamadı")
    db.delete(f); db.commit()
    return {"ok": True}


@app.post("/api/telegram/validate-token")
async def validate_token(body: TokenIn, user=Depends(require_auth)):
    bot, err = await telegram_client.get_me(body.bot_token.strip())
    if not bot:
        raise HTTPException(400, f"Token doğrulanamadı: {err}")
    return {"ok": True, "bot": bot}


@app.post("/api/telegram/discover-chat")
async def discover_chat(body: TokenIn, user=Depends(require_auth)):
    chats, err = await telegram_client.discover_chats(body.bot_token.strip())
    if err:
        raise HTTPException(400, f"Sohbetler alınamadı: {err}")
    return {"chats": chats}


@app.get("/api/telegram/targets")
def list_targets(db: Session = Depends(get_db), user=Depends(require_auth)):
    return [target_dict(t) for t in db.query(TelegramTarget).all()]


@app.post("/api/telegram/targets")
def create_target(body: TargetIn, db: Session = Depends(get_db), user=Depends(require_auth)):
    t = TelegramTarget(**body.model_dump())
    db.add(t); db.commit(); db.refresh(t)
    return target_dict(t)


@app.put("/api/telegram/targets/{tid}")
def update_target(tid: int, body: TargetIn, db: Session = Depends(get_db), user=Depends(require_auth)):
    t = db.get(TelegramTarget, tid)
    if not t: raise HTTPException(404, "Hedef bulunamadı")
    for k, v in body.model_dump().items(): setattr(t, k, v)
    db.commit(); db.refresh(t)
    return target_dict(t)


@app.delete("/api/telegram/targets/{tid}")
def delete_target(tid: int, db: Session = Depends(get_db), user=Depends(require_auth)):
    t = db.get(TelegramTarget, tid)
    if not t: raise HTTPException(404, "Hedef bulunamadı")
    db.delete(t); db.commit()
    return {"ok": True}


@app.post("/api/telegram/targets/{tid}/test")
async def test_target(tid: int, db: Session = Depends(get_db), user=Depends(require_auth)):
    t = db.get(TelegramTarget, tid)
    if not t: raise HTTPException(404, "Hedef bulunamadı")
    ok, err = await telegram_client.send_test(t.bot_token or "", t.chat_id or "")
    return {"ok": ok, "error": err}


@app.get("/api/settings")
def get_settings(db: Session = Depends(get_db), user=Depends(require_auth)):
    out = dict(DEFAULT_SETTINGS)
    for k in out:
        row = db.get(Setting, k)
        if row is not None: out[k] = row.value
    return out


@app.put("/api/settings")
def put_settings(body: SettingsIn, db: Session = Depends(get_db), user=Depends(require_auth)):
    for k, v in body.model_dump().items():
        row = db.get(Setting, k)
        if row: row.value = v
        else: db.add(Setting(key=k, value=v))
    db.commit()
    return get_settings(db=db, user=user)


def history_dict(h: History):
    return {"id": h.id, "wa_message_id": h.wa_message_id, "group_id": h.group_id, "group_name": h.group_name,
            "sender": h.sender, "text": h.text, "media_type": h.media_type,
            "matched_filter_id": h.matched_filter_id, "matched_filter_name": h.matched_filter_name,
            "telegram_target_id": h.telegram_target_id, "status": h.status, "error": h.error or "",
            "created_at": h.created_at.isoformat() if h.created_at else None}


@app.get("/api/history")
def history(search: str = "", filter_id: int = None, group_id: str = "", db: Session = Depends(get_db), user=Depends(require_auth)):
    q = db.query(History).order_by(History.id.desc())
    if search: q = q.filter(History.text.contains(search))
    if filter_id is not None: q = q.filter(History.matched_filter_id == filter_id)
    if group_id: q = q.filter(History.group_id == group_id)
    items = q.limit(200).all()
    return {"items": [history_dict(h) for h in items], "total": len(items)}


def _extract(payload):
    """Tolerate flexible OpenWA payload shapes."""
    d = payload if isinstance(payload, dict) else {}
    msg = d.get("message") or d.get("data") or d
    if isinstance(msg, dict) and "message" in msg and isinstance(msg["message"], dict):
        msg = msg["message"]
    def pick(*keys):
        for src in (msg, d):
            for k in keys:
                if isinstance(src, dict) and src.get(k) not in (None, ""):
                    return src[k]
        return ""
    text = pick("text", "body", "caption", "content") or ""
    media_type = str(pick("media_type", "mediaType", "type") or "text").lower()
    mapping = {"image": "image", "photo": "image", "video": "video", "audio": "audio", "voice": "audio", "document": "document", "file": "document", "sticker": "sticker", "chat": "text", "text": "text"}
    media_type = mapping.get(media_type, media_type if media_url_present(msg) else "text")
    return {"wa_message_id": str(pick("id", "message_id", "wa_message_id") or ""),
            "group_id": str(pick("group_id", "groupId", "chatId", "chat_id", "from", "remoteJid") or ""),
            "group_name": str(pick("group_name", "groupName", "chatName") or ""),
            "sender": str(pick("sender", "author", "participant", "pushName") or ""),
            "text": str(text), "media_type": media_type,
            "media_url": str(pick("media_url", "mediaUrl", "url") or "")}


def media_url_present(msg):
    return isinstance(msg, dict) and bool(msg.get("media_url") or msg.get("mediaUrl"))


@app.post("/api/webhook/openwa")
async def webhook(request: Request, db: Session = Depends(get_db)):
    try:
        payload = await request.json()
    except Exception:
        payload = {}
    m = _extract(payload)
    if not m["text"] and m["media_type"] == "text":
        return {"ok": True, "matched": 0}
    selected_ids = {g.id for g in db.query(Group).filter_by(selected=True).all()}
    if selected_ids and m["group_id"] and m["group_id"] not in selected_ids:
        return {"ok": True, "matched": 0, "skipped": "group_not_selected"}
    filters = db.query(Filter).filter_by(enabled=True).all()
    default_target = db.query(TelegramTarget).filter_by(is_default=True).first()
    matched = 0
    for f in filters:
        ok, reason = evaluate_filter(filter_dict(f), m)
        is_quiet = reason.startswith("quiet_hours")
        # re-check keyword match ignoring quiet: if quiet-blocked but would otherwise match, record dropped
        if not ok and is_quiet:
            # verify keyword etc. by temporarily checking with quiet disabled
            fd = filter_dict(f); fd["quiet_hours_enabled"] = False
            ok2, _ = evaluate_filter(fd, m)
            if not ok2: continue
            db.add(History(wa_message_id=m["wa_message_id"], group_id=m["group_id"], group_name=m["group_name"],
                           sender=m["sender"], text=m["text"], media_type=m["media_type"], media_url=m["media_url"],
                           matched_filter_id=f.id, matched_filter_name=f.name,
                           telegram_target_id=f.telegram_target_id, status="dropped_quiet", error="quiet_hours"))
            matched += 1
            continue
        if not ok: continue
        target = db.get(TelegramTarget, f.telegram_target_id) if f.telegram_target_id else default_target
        if target:
            sent, err = await telegram_client.send_telegram(target.bot_token or "", target.chat_id or "", m["text"], m["media_type"], m["media_url"])
            status = "sent" if sent else "failed"
        else:
            sent, err, status = False, "Telegram hedefi yok", "failed"
        db.add(History(wa_message_id=m["wa_message_id"], group_id=m["group_id"], group_name=m["group_name"],
                       sender=m["sender"], text=m["text"], media_type=m["media_type"], media_url=m["media_url"],
                       matched_filter_id=f.id, matched_filter_name=f.name,
                       telegram_target_id=target.id if target else f.telegram_target_id,
                       status=status, error=err))
        matched += 1
    db.commit()
    return {"ok": True, "matched": matched}
