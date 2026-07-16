"""Pulls the latest sensor readings from the channel's public web preview
(https://t.me/s/<channel>) without needing any Telegram API credentials.
Only the most recent ~20 messages are available this way, which is enough
for a manual "refresh" action — it is not meant to replace the full
Telethon-based export in app/seed.py.
"""

import httpx
from bs4 import BeautifulSoup

PUBLIC_PREVIEW_URL = "https://t.me/s/{channel}"
DEFAULT_CHANNEL = "test_temp_nu"


def fetch_public_preview_messages(channel: str = DEFAULT_CHANNEL) -> list[dict]:
    url = PUBLIC_PREVIEW_URL.format(channel=channel)
    headers = {"User-Agent": "Mozilla/5.0 (compatible; AtriumComfortMonitor/1.0)"}
    response = httpx.get(url, headers=headers, timeout=10.0)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")
    messages = []
    for block in soup.select(".tgme_widget_message"):
        text_el = block.select_one(".tgme_widget_message_text")
        time_el = block.select_one(".tgme_widget_message_date time")
        if text_el is None or time_el is None or not time_el.has_attr("datetime"):
            continue
        messages.append({"date": time_el["datetime"], "text": text_el.get_text()})
    return messages
