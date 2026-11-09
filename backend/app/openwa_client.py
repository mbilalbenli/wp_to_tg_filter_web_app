import os
import httpx

BASE = os.getenv("OPENWA_BASE_URL", "http://openwa:2785").rstrip("/")
KEY = os.getenv("OPENWA_API_KEY", "")
SESSION_NAME = os.getenv("OPENWA_SESSION_NAME", "default")
WEBHOOK_URL = os.getenv("OPENWA_WEBHOOK_URL", "")

_session_id = None
_CONNECTED = {"connected", "ready", "authenticated", "open"}


def _headers():
    return {"X-API-Key": KEY} if KEY else {}


async def _get_session(c: httpx.AsyncClient):
    """Find (or create) the configured session; returns session dict or None."""
    global _session_id
    r = await c.get(f"{BASE}/api/sessions", headers=_headers())
    r.raise_for_status()
    sessions = r.json() if isinstance(r.json(), list) else []
    for s in sessions:
        if s.get("name") == SESSION_NAME:
            _session_id = s.get("id")
            return s
    r = await c.post(f"{BASE}/api/sessions", headers=_headers(), json={"name": SESSION_NAME})
    r.raise_for_status()
    s = r.json()
    _session_id = s.get("id")
    return s


def _status_of(session, qr=None):
    if not session:
        return {"connected": False, "account": None, "qr": None, "state": "disconnected"}
    st = str(session.get("status") or "").lower()
    connected = st in _CONNECTED
    account = session.get("phone") or session.get("pushName")
    return {"connected": connected, "account": account, "qr": None if connected else qr,
            "state": st or ("connected" if connected else "disconnected")}


async def _fetch_qr(c, sid):
    try:
        r = await c.get(f"{BASE}/api/sessions/{sid}/qr", headers=_headers())
        if r.status_code < 400:
            d = r.json() if "json" in r.headers.get("content-type", "") else {}
            return d.get("qrCode") or d.get("qr") or d.get("data") or None
    except Exception:
        pass
    return None


async def _register_webhook(c, sid):
    if not WEBHOOK_URL or not sid:
        return
    try:
        r = await c.get(f"{BASE}/api/sessions/{sid}/webhooks", headers=_headers())
        hooks = r.json() if r.status_code < 400 else []
        items = hooks if isinstance(hooks, list) else hooks.get("data", [])
        if any(h.get("url") == WEBHOOK_URL for h in items if isinstance(h, dict)):
            return
        await c.post(f"{BASE}/api/sessions/{sid}/webhooks", headers=_headers(),
                     json={"url": WEBHOOK_URL, "events": ["message.received", "message.sent"]})
    except Exception:
        pass


async def get_status(with_qr=True):
    try:
        async with httpx.AsyncClient(timeout=8) as c:
            s = await _get_session(c)
            if s:
                await _register_webhook(c, s.get("id"))
            st = _status_of(s)
            if st["connected"]:
                # OpenWA can keep a stale "ready" after the phone revokes the
                # linked device; probe the engine with a live query.
                try:
                    r = await c.get(f"{BASE}/api/sessions/{s.get('id')}/chats",
                                    headers=_headers(), params={"limit": 1})
                    if r.status_code >= 400:
                        return {"connected": False, "account": st["account"], "qr": None,
                                "state": "disconnected"}
                except Exception:
                    return {"connected": False, "account": st["account"], "qr": None,
                            "state": "disconnected"}
            qr = None
            if s and not _status_of(s)["connected"] and with_qr and s.get("status") not in (None, "created"):
                qr = await _fetch_qr(c, s.get("id"))
            return _status_of(s, qr)
    except Exception:
        return {"connected": False, "account": None, "qr": None, "state": "disconnected"}


async def connect():
    """Create session if needed and start the engine so a QR is generated."""
    try:
        async with httpx.AsyncClient(timeout=30) as c:
            s = await _get_session(c)
            sid = s.get("id")
            if not _status_of(s)["connected"]:
                r = await c.post(f"{BASE}/api/sessions/{sid}/start", headers=_headers())
                if r.status_code < 400:
                    s = r.json()
            await _register_webhook(c, sid)
            qr = None
            if not _status_of(s)["connected"]:
                qr = await _fetch_qr(c, sid)
            return _status_of(s, qr)
    except Exception:
        return {"connected": False, "account": None, "qr": None, "state": "disconnected"}


async def disconnect():
    try:
        async with httpx.AsyncClient(timeout=10) as c:
            s = await _get_session(c)
            if s:
                await c.post(f"{BASE}/api/sessions/{s.get('id')}/stop", headers=_headers())
    except Exception:
        pass
    return {"connected": False, "account": None, "qr": None, "state": "disconnected"}


async def get_qr():
    st = await get_status()
    return st.get("qr")


async def list_groups():
    try:
        async with httpx.AsyncClient(timeout=10) as c:
            s = await _get_session(c)
            if not s:
                return []
            r = await c.get(f"{BASE}/api/sessions/{s.get('id')}/groups", headers=_headers())
            r.raise_for_status()
            data = r.json()
            items = data if isinstance(data, list) else data.get("groups", data.get("data", []))
            out = []
            for g in items:
                gid = g.get("id") or g.get("_serialized") or ""
                if isinstance(gid, dict):
                    gid = gid.get("_serialized", "")
                out.append({"id": str(gid), "name": g.get("name", ""),
                            "participants": int(g.get("participants", 0) or 0)})
            return out
    except Exception:
        return []
