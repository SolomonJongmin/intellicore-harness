#!/usr/bin/env bash
# Post-Write Check — postToolUse hook for fs_write
# Runs static analysis on the written file
set -euo pipefail

INPUT="${KIRO_TOOL_INPUT:-}"
if [ -z "$INPUT" ]; then exit 0; fi

FILE_PATH=$(echo "$INPUT" | jq -r '.path // empty' 2>/dev/null)
if [ -z "$FILE_PATH" ] || [ ! -f "$FILE_PATH" ]; then exit 0; fi

# Java: check for common anti-patterns
if echo "$FILE_PATH" | grep -qE '\.java$'; then
  ISSUES=""
  grep -n 'System\.out\.println' "$FILE_PATH" && ISSUES="${ISSUES}⚠️ System.out.println 발견 — @Slf4j log를 사용하세요\n"
  grep -n '@Setter' "$FILE_PATH" | grep -v '//.*@Setter' && ISSUES="${ISSUES}⚠️ @Setter 발견 — Entity에서는 도메인 메서드를 사용하세요\n"
  grep -n 'throw new RuntimeException' "$FILE_PATH" && ISSUES="${ISSUES}⚠️ RuntimeException 직접 throw — BusinessException을 사용하세요\n"
  grep -n 'TODO\|FIXME' "$FILE_PATH" && ISSUES="${ISSUES}ℹ️ TODO/FIXME 코멘트 발견\n"
  if [ -n "$ISSUES" ]; then echo -e "$ISSUES"; fi
fi

# TypeScript: check for common anti-patterns
if echo "$FILE_PATH" | grep -qE '\.(ts|tsx)$'; then
  ISSUES=""
  grep -n 'console\.log' "$FILE_PATH" && ISSUES="${ISSUES}⚠️ console.log 발견 — logger를 사용하세요\n"
  grep -n ': any' "$FILE_PATH" && ISSUES="${ISSUES}⚠️ any 타입 발견 — 구체적 타입을 사용하세요\n"
  grep -n 'TODO\|FIXME' "$FILE_PATH" && ISSUES="${ISSUES}ℹ️ TODO/FIXME 코멘트 발견\n"
  if [ -n "$ISSUES" ]; then echo -e "$ISSUES"; fi
fi

# Python: check for common anti-patterns
if echo "$FILE_PATH" | grep -qE '\.py$'; then
  ISSUES=""
  grep -n '^[^#]*print(' "$FILE_PATH" && ISSUES="${ISSUES}⚠️ print() 발견 — logging을 사용하세요\n"
  grep -n 'except:' "$FILE_PATH" && ISSUES="${ISSUES}⚠️ bare except 발견 — 구체적 예외를 사용하세요\n"
  grep -n 'TODO\|FIXME' "$FILE_PATH" && ISSUES="${ISSUES}ℹ️ TODO/FIXME 코멘트 발견\n"
  if [ -n "$ISSUES" ]; then echo -e "$ISSUES"; fi
fi

exit 0
