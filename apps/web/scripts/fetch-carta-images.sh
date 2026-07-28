#!/usr/bin/env bash
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/public/carta"
mkdir -p "$OUT"

fetch() {
  local file="$1"
  local url="$2"
  if [[ -f "$OUT/$file" ]] && [[ -s "$OUT/$file" ]] && [[ -z "${FORCE:-}" ]]; then
    echo "skip $file"
    return 0
  fi
  echo "get $file"
  if curl -fsSL --max-time 90 -A "BocadO/1.0" -o "$OUT/$file.tmp" "$url"; then
    mv "$OUT/$file.tmp" "$OUT/$file"
    return 0
  fi
  rm -f "$OUT/$file.tmp"
  echo "FAIL $file"
  return 1
}

# Bebidas — fotos de producto (Wikimedia Commons)
fetch "coca-cola-lata.jpg" "https://upload.wikimedia.org/wikipedia/commons/9/94/Coca_cola_1-1-.jpg"
fetch "pepsi-lata.jpg" "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Pepsi_Max_can.jpg/960px-Pepsi_Max_can.jpg"
fetch "fanta-naranja-lata.jpg" "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Fanta-Orange-Can-330ml_84177_%287116950883%29.jpg/960px-Fanta-Orange-Can-330ml_84177_%287116950883%29.jpg"
fetch "monster-energy-lata.jpg" "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Monster_Energy_Mega_can.jpg/960px-Monster_Energy_Mega_can.jpg"
fetch "aquarius-limon-lata.jpg" "https://upload.wikimedia.org/wikipedia/commons/d/d2/Active_diet_by_AQUARIUS.JPG"
fetch "limonada-jengibre.jpg" "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Armenian_lemonade.jpg/960px-Armenian_lemonade.jpg"

# Platos — Unsplash / Wikimedia acordes al nombre
fetch "ramen-tonkotsu.jpg" "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=85"
fetch "gyozas-pollo.jpg" "https://images.unsplash.com/photo-1496116218417-1a781b67df0e?auto=format&fit=crop&w=1200&q=85"
fetch "gyozas-cerdo.jpg" "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1200&q=85"
fetch "poke-salmon.jpg" "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=85"
fetch "bowl-mediterraneo.jpg" "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=85"
fetch "ensalada-cesar.jpg" "https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=1200&q=85"
fetch "pizza-margherita-bufala.jpg" "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1200&q=85"
fetch "pizza-diavola.jpg" "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=1200&q=85"
fetch "pizza-quattro-formaggi.jpg" "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=85"
fetch "pizza-pepperoni.jpg" "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=1200&q=85"
fetch "pizza-vegana-verde.jpg" "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=85"
fetch "lasana-bolognesa.jpg" "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&w=1200&q=85"
fetch "spaghetti-carbonara.jpg" "https://images.unsplash.com/photo-1588013273468-315fd88ea34c?auto=format&fit=crop&w=1200&q=85"
fetch "tagliatelle-pesto.jpg" "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=1200&q=85"
fetch "ravioli-ricotta-espinacas.jpg" "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1200&q=85"
fetch "risotto-setas.jpg" "https://images.unsplash.com/photo-1476124369801-b43f9aef2f0b?w=1200&q=85"
fetch "fabada-asturiana.jpg" "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1200&q=85"
fetch "callos-madrilenos.jpg" "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=1200&q=85"
fetch "cocido-madrileno.jpg" "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85"
fetch "gazpacho-andaluz.jpg" "https://images.unsplash.com/photo-1572449043416-55f4685c9bb7?auto=format&fit=crop&w=1200&q=85"
fetch "pad-thai-pollo.jpg" "https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=1200&q=85"
fetch "prado-classic.jpg" "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=85"
fetch "smash-doble-bacon.jpg" "https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=1200&q=85"
fetch "alitas-bbq.jpg" "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?auto=format&fit=crop&w=1200&q=85"
fetch "croquetas-jamon.jpg" "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=1200&q=85"
fetch "patatas-rustic.jpg" "https://images.unsplash.com/photo-1518013431117-eb1465fa5752?auto=format&fit=crop&w=1200&q=85"
fetch "tiramisu-clasico.jpg" "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=1200&q=85"
fetch "brownie-chocolate.jpg" "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=1200&q=85"
fetch "panna-cotta-frutos.jpg" "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1200&q=85"
fetch "menu-dia-paella-valenciana.jpg" "https://images.unsplash.com/photo-1534080564583-591bebc13fec?w=1200&q=85"
fetch "menu-dia-lasana-bolo.jpg" "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&w=1200&q=85"
fetch "menu-dia-bowl-verde.jpg" "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=85"

# Fallback Wikimedia si Unsplash falla en ravioli
if [[ ! -s "$OUT/ravioli-ricotta-espinacas.jpg" ]]; then
  fetch "ravioli-ricotta-espinacas.jpg" "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Ravioli_with_spinach_and_ricotta.jpg/960px-Ravioli_with_spinach_and_ricotta.jpg"
fi

if [[ ! -f "$OUT/placeholder.jpg" ]] || [[ -n "${FORCE:-}" ]]; then
  cp "$OUT/ramen-tonkotsu.jpg" "$OUT/placeholder.jpg" 2>/dev/null || true
fi

echo "Done. $(ls -1 "$OUT" 2>/dev/null | wc -l) files"
