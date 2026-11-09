"""Pure, testable filter matching engine (data-driven, no hard-coded rules)."""
import re
from datetime import datetime, time

_FOLD = str.maketrans({"ş": "s", "ğ": "g", "ü": "u", "ö": "o", "ç": "c", "ı": "i", "â": "a", "î": "i", "û": "u"})


def turkish_normalize_text(text: str) -> str:
    # Turkish-aware lowercase: İ->i, I->ı before generic lower()
    t = (text or "").replace("İ", "i").replace("I", "ı")
    t = t.lower().translate(_FOLD)
    return t


def _prepare(text, case_sensitive, turkish_normalize):
    if turkish_normalize:
        return turkish_normalize_text(text or "")
    if case_sensitive:
        return text or ""
    return (text or "").replace("İ", "i").replace("I", "ı").lower()


def _contains(haystack, needle, whole_word):
    if not needle:
        return False
    if whole_word:
        return re.search(r"(?<!\w)" + re.escape(needle) + r"(?!\w)", haystack) is not None
    return needle in haystack


def _in_quiet_hours(now_time, start_s, end_s):
    try:
        sh, sm = [int(x) for x in str(start_s).split(":")[:2]]
        eh, em = [int(x) for x in str(end_s).split(":")[:2]]
    except Exception:
        return False
    start, end = time(sh, sm), time(eh, em)
    if start <= end:
        return start <= now_time < end
    return now_time >= start or now_time < end  # overnight e.g. 23:00-08:00


def _get(obj, key, default=None):
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)


def evaluate_filter(flt, message, now=None):
    """Return (matched: bool, reason: str). message keys: text, sender, media_type, group_id."""
    if not _get(flt, "enabled", True):
        return False, "disabled"
    text = _get(message, "text", "") or ""
    sender = _get(message, "sender", "") or ""
    media_type = (_get(message, "media_type", "text") or "text").lower()
    group_id = _get(message, "group_id", "") or ""

    group_ids = _get(flt, "group_ids", []) or []
    if group_ids and group_id not in group_ids:
        return False, "group_not_allowed"

    media_types = [str(m).lower() for m in (_get(flt, "media_types", []) or [])]
    if media_types and media_type not in media_types:
        return False, "media_type"

    min_len = _get(flt, "min_length", None)
    max_len = _get(flt, "max_length", None)
    if min_len is not None and len(text) < int(min_len):
        return False, "too_short"
    if max_len is not None and len(text) > int(max_len):
        return False, "too_long"

    link_mode = _get(flt, "link_mode", "any") or "any"
    has_link = bool(re.search(r"https?://|www\.|t\.me/", text, re.I))
    if link_mode == "only_link" and not has_link:
        return False, "link_required"
    if link_mode == "no_link" and has_link:
        return False, "link_forbidden"

    sender_mode = _get(flt, "sender_mode", "all") or "all"
    sender_list = [str(s) for s in (_get(flt, "sender_list", []) or [])]
    if sender_mode == "only" and sender_list and sender not in sender_list:
        return False, "sender_not_allowed"
    if sender_mode == "except" and sender in sender_list:
        return False, "sender_excluded"

    cs = bool(_get(flt, "case_sensitive", False))
    tn = bool(_get(flt, "turkish_normalize", False))
    ww = bool(_get(flt, "whole_word", False))
    hay = _prepare(text, cs, tn)

    for ex in (_get(flt, "exclude_keywords", []) or []):
        if ex and _contains(hay, _prepare(str(ex), cs, tn), ww):
            return False, "exclude_keyword"

    keyword = _prepare(str(_get(flt, "keyword", "") or ""), cs, tn)
    if not keyword or not _contains(hay, keyword, ww):
        return False, "keyword_not_found"

    if _get(flt, "quiet_hours_enabled", False):
        n = now or datetime.now()
        nt = n.time() if isinstance(n, datetime) else n
        if _in_quiet_hours(nt, _get(flt, "quiet_start", "23:00"), _get(flt, "quiet_end", "08:00")):
            return False, f"quiet_hours:{_get(flt, 'quiet_action', 'drop') or 'drop'}"
    return True, "matched"


def matches_filter(flt, message, now=None):
    return evaluate_filter(flt, message, now=now)[0]


def match_filters(filters, message, now=None):
    """Return list of (filter, reason) for matched; quiet-drop filters get reason quiet_hours:* and matched=False handled by caller via evaluate."""
    out = []
    for f in filters:
        ok, reason = evaluate_filter(f, message, now=now)
        if ok:
            out.append(f)
    return out
