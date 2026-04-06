#!/usr/bin/env bash
# Pre-Write Guard — preToolUse hook for fs_write
# Exit 2 = block, Exit 0 = allow
set -euo pipefail

INPUT="${KIRO_TOOL_INPUT:-}"
if [ -z "$INPUT" ]; then exit 0; fi

# 1. Block secret file writes (.env, .pem, .key)
FILE_PATH=$(echo "$INPUT" | jq -r '.path // empty' 2>/dev/null)
if echo "$FILE_PATH" | grep -qE '\.(env|pem|key)$'; then
  echo "❌ 시크릿 파일 직접 수정 금지. 환경변수를 사용하세요: $FILE_PATH"
  exit 2
fi

# 2. Block files over 800 lines
CONTENT=$(echo "$INPUT" | jq -r '.file_text // empty' 2>/dev/null)
if [ -n "$CONTENT" ]; then
  LINE_COUNT=$(echo "$CONTENT" | wc -l)
  if [ "$LINE_COUNT" -gt 800 ]; then
    echo "❌ ${LINE_COUNT}줄 — 800줄 초과. 400줄 이하 모듈로 분리하세요."
    exit 2
  fi
fi

exit 0
