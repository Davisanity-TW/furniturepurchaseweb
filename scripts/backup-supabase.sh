#!/bin/zsh
set -uo pipefail

cd /Users/davidlin/.openclaw/workspace/furniturepurchaseweb

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

LOG_DIR="$HOME/Backups/furniture-purchase-web/logs"
mkdir -p "$LOG_DIR"

LOG_FILE="$LOG_DIR/backup.log"
RUN_LOG="$(mktemp -t furniturepurchaseweb-backup.XXXXXX.log)"
STARTED_AT="$(date '+%Y-%m-%d %H:%M:%S %Z')"
TELEGRAM_TARGET="8494991595"

send_telegram() {
  local message="$1"

  if ! command -v openclaw >/dev/null 2>&1; then
    echo "WARN: openclaw CLI not found; cannot send Telegram notification." >> "$LOG_FILE"
    return 0
  fi

  openclaw message send \
    --account default \
    --channel telegram \
    --target "$TELEGRAM_TARGET" \
    --message "$message" >> "$LOG_FILE" 2>&1 || {
      echo "WARN: failed to send Telegram notification." >> "$LOG_FILE"
    }
}

/opt/homebrew/bin/node scripts/backup-supabase.mjs > "$RUN_LOG" 2>&1
STATUS=$?

cat "$RUN_LOG" >> "$LOG_FILE"
SUMMARY="$(tail -n 8 "$RUN_LOG")"
rm -f "$RUN_LOG"

if [[ "$STATUS" -eq 0 ]]; then
  send_telegram "✅ furniturepurchaseweb cron 成功
開始：$STARTED_AT
結果：$SUMMARY"
else
  send_telegram "❌ furniturepurchaseweb cron 失敗
開始：$STARTED_AT
exit code：$STATUS
錯誤摘要：$SUMMARY"
fi

exit "$STATUS"
