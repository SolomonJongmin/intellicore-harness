#!/usr/bin/env bash
# Stop hook — runs after each assistant turn
# Reminds user to run tests
set -euo pipefail

TEST_CMD="${HARNESS_TEST_CMD:-./gradlew test}"
echo "✅ 작업 완료. 테스트 실행을 권장합니다: $TEST_CMD"
