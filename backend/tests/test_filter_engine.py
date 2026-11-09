import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from datetime import datetime
from app.filter_engine import matches_filter, turkish_normalize_text

BASE = {"name": "t", "keyword": "iş", "enabled": True}
def msg(text="iş ilanı var", **kw):
    d = {"text": text, "sender": "Ali", "media_type": "text", "group_id": "g1"}
    d.update(kw); return d

def test_contains_case_insensitive_default():
    assert matches_filter(BASE, msg("İŞ İLANI"))
    assert not matches_filter({**BASE, "case_sensitive": True}, msg("İŞ İLANI"))

def test_whole_word():
    f = {**BASE, "keyword": "iş", "whole_word": True}
    assert matches_filter(f, msg("iş var"))
    assert not matches_filter(f, msg("işçi aranıyor"))

def test_turkish_normalize():
    assert turkish_normalize_text("IŞIK") == turkish_normalize_text("ışık")
    f = {**BASE, "keyword": "ışık", "turkish_normalize": True}
    assert matches_filter(f, msg("ISIK yandı"))
    f2 = {**BASE, "keyword": "is", "turkish_normalize": True}
    assert matches_filter(f2, msg("İŞ başvurusu"))

def test_exclude():
    f = {**BASE, "exclude_keywords": ["staj"]}
    assert not matches_filter(f, msg("iş staj ilanı"))
    assert matches_filter(f, msg("iş ilanı"))

def test_sender_only_except():
    assert not matches_filter({**BASE, "sender_mode": "only", "sender_list": ["Veli"]}, msg())
    assert matches_filter({**BASE, "sender_mode": "only", "sender_list": ["Ali"]}, msg())
    assert not matches_filter({**BASE, "sender_mode": "except", "sender_list": ["Ali"]}, msg())

def test_link_modes():
    assert matches_filter({**BASE, "link_mode": "only_link"}, msg("iş https://x.com"))
    assert not matches_filter({**BASE, "link_mode": "only_link"}, msg("iş ilanı"))
    assert not matches_filter({**BASE, "link_mode": "no_link"}, msg("iş https://x.com"))

def test_length():
    assert not matches_filter({**BASE, "min_length": 100}, msg())
    assert not matches_filter({**BASE, "max_length": 3}, msg())
    assert matches_filter({**BASE, "min_length": 3, "max_length": 100}, msg())

def test_media():
    assert not matches_filter({**BASE, "media_types": ["image"]}, msg())
    assert matches_filter({**BASE, "media_types": ["image"]}, msg(media_type="image"))

def test_quiet_hours():
    f = {**BASE, "quiet_hours_enabled": True, "quiet_start": "23:00", "quiet_end": "08:00", "quiet_action": "drop"}
    assert not matches_filter(f, msg(), now=datetime(2024, 1, 1, 2, 0))
    assert matches_filter(f, msg(), now=datetime(2024, 1, 1, 12, 0))

def test_group_restriction():
    assert not matches_filter({**BASE, "group_ids": ["g2"]}, msg())
    assert matches_filter({**BASE, "group_ids": ["g1"]}, msg())
    assert matches_filter({**BASE, "group_ids": []}, msg(group_id="zzz"))
