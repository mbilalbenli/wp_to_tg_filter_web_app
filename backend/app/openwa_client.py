import os
import httpx

BASE = os.getenv("OPENWA_BASE_URL", "http://openwa:2785").rstrip("/")
KEY = os.getenv("OPENWA_API_KEY", "")


def _headers():
    return {"X-Api-Key": KEY} if KEY else {}


async def get_status():
    try:
        async with httpx.AsyncClient(timeout=3) as c:
            r = await c.get(f"{BASE}/api/sessions", headers=_headers())
            r.raise_for_status()
            return {"connected": True, "account": None, "qr": None, "state": "connected"}
    except Exception:
        return {"connected": False, "account": None, "qr": None, "state": "disconnected"}


async def get_qr():
    try:
        async with httpx.AsyncClient(timeout=3) as c:
            r = await c.get(f"{BASE}/api/sessions/default/qr", headers=_headers())
            if r.status_code < 400:
                d = r.json() if "json" in r.headers.get("content-type", "") else {}
                return d.get("qr") or d.get("data") or None
    except Exception:
        pass
    return None


async def list_groups():
    try:
        async with httpx.AsyncClient(timeout=3) as c:
            r = await c.get(f"{BASE}/api/groups", headers=_headers())
            r.raise_for_status()
            data = r.json()
            items = data if isinstance(data, list) else data.get("groups", data.get("data", []))
            out = []
            for g in items:
                out.append({"id": str(g.get("id", "")), "name": g.get("name", ""), "participants": int(g.get("participants", 0) or 0)})
            return out
    except Exception:
        return []
