import os
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, JSON, String, Text, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")
_connect = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=_connect)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)


class Filter(Base):
    __tablename__ = "filters"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    keyword = Column(String, nullable=False)
    enabled = Column(Boolean, default=True)
    case_sensitive = Column(Boolean, default=False)
    whole_word = Column(Boolean, default=False)
    turkish_normalize = Column(Boolean, default=False)
    telegram_target_id = Column(Integer, ForeignKey("telegram_targets.id"), nullable=True)
    exclude_keywords = Column(JSON, default=list)
    sender_mode = Column(String, default="all")
    sender_list = Column(JSON, default=list)
    quiet_hours_enabled = Column(Boolean, default=False)
    quiet_start = Column(String, default="23:00")
    quiet_end = Column(String, default="08:00")
    quiet_action = Column(String, default="drop")
    media_types = Column(JSON, default=list)
    link_mode = Column(String, default="any")
    min_length = Column(Integer, nullable=True)
    max_length = Column(Integer, nullable=True)
    group_ids = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)


class TelegramTarget(Base):
    __tablename__ = "telegram_targets"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    bot_token = Column(String, default="")
    chat_id = Column(String, default="")
    chat_title = Column(String, default="")
    is_default = Column(Boolean, default=False)


class Group(Base):
    __tablename__ = "groups"
    id = Column(String, primary_key=True)  # WhatsApp group id
    name = Column(String, default="")
    participants = Column(Integer, default=0)
    selected = Column(Boolean, default=False)


class History(Base):
    __tablename__ = "history"
    id = Column(Integer, primary_key=True)
    wa_message_id = Column(String, default="")
    group_id = Column(String, default="")
    group_name = Column(String, default="")
    sender = Column(String, default="")
    text = Column(Text, default="")
    media_type = Column(String, default="text")
    media_url = Column(String, default="")
    matched_filter_id = Column(Integer, nullable=True)
    matched_filter_name = Column(String, default="")
    telegram_target_id = Column(Integer, nullable=True)
    status = Column(String, default="sent")  # sent|failed|dropped_quiet
    error = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)


class Setting(Base):
    __tablename__ = "settings"
    key = Column(String, primary_key=True)
    value = Column(JSON, nullable=True)
