from typing import List, Optional
from pydantic import BaseModel


class LoginIn(BaseModel):
    username: str
    password: str


class FilterIn(BaseModel):
    name: str
    keyword: str
    enabled: bool = True
    case_sensitive: bool = False
    whole_word: bool = False
    turkish_normalize: bool = False
    telegram_target_id: Optional[int] = None
    exclude_keywords: List[str] = []
    sender_mode: str = "all"
    sender_list: List[str] = []
    quiet_hours_enabled: bool = False
    quiet_start: str = "23:00"
    quiet_end: str = "08:00"
    quiet_action: str = "drop"
    media_types: List[str] = []
    link_mode: str = "any"
    min_length: Optional[int] = None
    max_length: Optional[int] = None
    group_ids: List[str] = []


class TargetIn(BaseModel):
    name: str
    bot_token: str = ""
    chat_id: str = ""
    chat_title: str = ""
    is_default: bool = False


class SelectionIn(BaseModel):
    group_ids: List[str] = []


class SettingsIn(BaseModel):
    default_case_sensitive: bool = False
    default_whole_word: bool = False
    default_turkish_normalize: bool = False
