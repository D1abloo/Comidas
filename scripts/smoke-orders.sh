#!/usr/bin/env bash
# Smoke test: home, móvil, crear pedido, admin orders
set -euo pipefail

BASE="${BASE:-https://bocado.31-70-114-94.sslip.io}"
COOKIE_JAR="$(mktemp)"
trap 'rm -f "$COOKIE_JAR"' EXIT

fail() { echo "✗ $1"; exit 1; }
ok() { echo "✓ $1"; }

code="$(curl -s -o /dev/null -w '%{http_code}' "$BASE/")"
[ "$code" = "200" ] || fail "Home HTTP $code (esperado 200)"
ok "Home $code"

code="$(curl -s -o /dev/null -w '%{http_code}' "$BASE/movil")"
[ "$code" = "200" ] || fail "Móvil HTTP $code"
ok "Móvil $code"

ORDER_JSON="$(curl -s -X POST "$BASE/api/orders" \
  -H 'content-type: application/json' \
  -d '{
    "customer": {"full_name":"Test Smoke","email":"smoke@test.local","phone":"+34600000001"},
    "delivery_address": {"line1":"Calle Test 1","city":"Madrid","postal_code":"28001","country":"ES"},
    "payment_method": "bizum",
    "items": [{"dish_id":"d-ramen","quantity":1}]
  }')"

echo "$ORDER_JSON" | grep -q '"number"' || fail "POST /api/orders: $ORDER_JSON"
ORDER_NUM="$(echo "$ORDER_JSON" | sed -n 's/.*"number":"\([^"]*\)".*/\1/p')"
ok "Pedido creado $ORDER_NUM"

curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" -X POST "$BASE/admin/login" \
  -H 'content-type: application/x-www-form-urlencoded' \
  -d 'email=admin@bocado.app&password=admin1234' -o /dev/null -w '%{http_code}' | grep -qE '302|200' \
  || fail "Login admin"

ADMIN_JSON="$(curl -s -b "$COOKIE_JAR" "$BASE/api/admin/orders")"
echo "$ADMIN_JSON" | grep -q "$ORDER_NUM" || fail "Pedido no visible en admin: $ADMIN_JSON"
ok "Admin ve pedido $ORDER_NUM"

echo ""
echo "Smoke OK — $BASE"
