import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from app.openwa_client import _status_of


def test_ready_is_connected():
    s = _status_of({"status": "ready", "phone": "90555", "pushName": "A"})
    assert s["connected"] is True and s["state"] == "ready" and s["account"] == "90555"


def test_disconnected_with_phone_is_not_connected():
    # Phone stays on the stored session after a drop; it must not read as connected.
    s = _status_of({"status": "disconnected", "phone": "90555"})
    assert s["connected"] is False and s["state"] == "disconnected"


def test_qr_ready_carries_qr():
    s = _status_of({"status": "qr_ready"}, qr="data:image/png;base64,x")
    assert s["connected"] is False and s["qr"].startswith("data:image")


def test_no_session():
    assert _status_of(None)["state"] == "disconnected"
