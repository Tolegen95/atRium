"""Step 2: complete the login using the code Telegram sent to your app.

Usage:
  python scripts/tg_2_complete_login.py <code> [2fa_password]
"""

import json
import sys

from telethon.sync import TelegramClient
from telethon.errors import SessionPasswordNeededError

STATE_FILE = "tg_login_state.json"
SESSION_NAME = "tg_export"


def main():
    if len(sys.argv) not in (2, 3):
        print("Usage: python scripts/tg_2_complete_login.py <code> [2fa_password]")
        sys.exit(1)

    code = sys.argv[1]
    password = sys.argv[2] if len(sys.argv) == 3 else None

    with open(STATE_FILE) as f:
        state = json.load(f)

    client = TelegramClient(SESSION_NAME, state["api_id"], state["api_hash"])
    client.connect()

    try:
        client.sign_in(
            phone=state["phone"],
            code=code,
            phone_code_hash=state["phone_code_hash"],
        )
    except SessionPasswordNeededError:
        if not password:
            print("Account has 2FA enabled. Re-run with the cloud password as the second argument.")
            sys.exit(1)
        client.sign_in(password=password)

    print("Logged in. Now run: python scripts/tg_3_export.py")
    client.disconnect()


if __name__ == "__main__":
    main()
