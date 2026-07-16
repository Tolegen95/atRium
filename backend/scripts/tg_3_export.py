"""Step 3: export the full channel history into backend/result.json.

Usage:
  python scripts/tg_3_export.py [channel_username] [output_path]

Defaults: channel_username=test_temp_nu, output_path=./result.json
"""

import json
import os
import sys
from zoneinfo import ZoneInfo

from telethon.sync import TelegramClient

STATE_FILE = "tg_login_state.json"
SESSION_NAME = "tg_export"

# The atrium is physically in Astana, Kazakhstan.
ATRIUM_TZ = ZoneInfo("Asia/Almaty")


def main():
    channel = sys.argv[1] if len(sys.argv) > 1 else "test_temp_nu"
    output_path = sys.argv[2] if len(sys.argv) > 2 else os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "result.json"
    )

    with open(STATE_FILE) as f:
        state = json.load(f)

    client = TelegramClient(SESSION_NAME, state["api_id"], state["api_hash"])
    client.connect()

    if not client.is_user_authorized():
        print("Not authorized yet. Run tg_1_send_code.py and tg_2_complete_login.py first.")
        sys.exit(1)

    messages = []
    for msg in client.iter_messages(channel, limit=None, reverse=True):
        text = msg.message or ""
        if not text.strip():
            continue
        naive_date = msg.date.astimezone(ATRIUM_TZ).replace(tzinfo=None)
        messages.append({"id": msg.id, "type": "message", "date": naive_date.isoformat(), "text": text})

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump({"name": channel, "type": "public_channel", "messages": messages}, f, ensure_ascii=False, indent=2)

    print(f"Exported {len(messages)} messages to {output_path}")
    client.disconnect()


if __name__ == "__main__":
    main()
