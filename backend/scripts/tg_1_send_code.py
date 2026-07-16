"""Step 1: request a login code from Telegram.

Usage:
  python scripts/tg_1_send_code.py <api_id> <api_hash> <phone>

Creates a local session file (tg_export.session) and a state file
(tg_login_state.json) holding the phone_code_hash needed for step 2.
Both files are gitignored and safe to delete once the export is done.
"""

import json
import sys

from telethon.sync import TelegramClient

STATE_FILE = "tg_login_state.json"
SESSION_NAME = "tg_export"


def main():
    if len(sys.argv) != 4:
        print("Usage: python scripts/tg_1_send_code.py <api_id> <api_hash> <phone>")
        sys.exit(1)

    api_id, api_hash, phone = int(sys.argv[1]), sys.argv[2], sys.argv[3]

    client = TelegramClient(SESSION_NAME, api_id, api_hash)
    client.connect()

    if client.is_user_authorized():
        print("Already authorized, you can run scripts/tg_3_export.py directly.")
        client.disconnect()
        return

    sent = client.send_code_request(phone)
    with open(STATE_FILE, "w") as f:
        json.dump(
            {"api_id": api_id, "api_hash": api_hash, "phone": phone, "phone_code_hash": sent.phone_code_hash},
            f,
        )
    print("Code sent to your Telegram app. Now run:")
    print("  python scripts/tg_2_complete_login.py <code> [2fa_password]")
    client.disconnect()


if __name__ == "__main__":
    main()
