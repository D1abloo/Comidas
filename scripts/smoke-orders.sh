#!/usr/bin/env bash
# Smoke test seguro y de solo lectura.
set -euo pipefail

BASE="${BASE:-http://127.0.0.1:4321}"

fail() { echo "✗ $1"; exit 1; }
ok() { echo "✓ $1"; }

check_route() {
  local route="$1"
  local expected="${2:-200}"
  local code
  code="$(curl -sS -o /dev/null -w '%{http_code}' "$BASE$route")"
  [ "$code" = "$expected" ] || fail "$route HTTP $code (esperado $expected)"
  ok "$route HTTP $code"
}

check_route "/"
check_route "/movil"
check_route "/checkout"
check_route "/api/health"

health="$(curl -sS "$BASE/api/health")"
echo "$health" | grep -q '"ok":true' || fail "Health inválido"

echo "Smoke OK — $BASE"
