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
  if curl -fsSL --max-time 90 -A "BocadO/1.0" -o "$OUT/$file" "$url"; then
    return 0
  fi
  echo "FAIL $file"
  return 1
}

# Bebidas — fotos de producto (Wikimedia Commons, licencia libre)
fetch "coca-cola-lata.jpg" "https://upload.wikimedia.org/wikipedia/commons/9/94/Coca_cola_1-1-.jpg"
fetch "pepsi-lata.jpg" "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Pepsi_Max_can.jpg/960px-Pepsi_Max_can.jpg"
fetch "fanta-naranja-lata.jpg" "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Fanta-Orange-Can-330ml_84177_%287116950883%29.jpg/960px-Fanta-Orange-Can-330ml_84177_%287116950883%29.jpg"
fetch "monster-energy-lata.jpg" "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Monster_Energy_Mega_can.jpg/960px-Monster_Energy_Mega_can.jpg"
fetch "aquarius-limon-lata.jpg" "https://upload.wikimedia.org/wikipedia/commons/d/d2/Active_diet_by_AQUARIUS.JPG"
fetch "limonada-jengibre.jpg" "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Armenian_lemonade.jpg/960px-Armenian_lemonade.jpg"

# Platos (Unsplash — acorde al nombre)
fetch "ramen-tonkotsu.jpg" "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=85"
fetch "gyozas-pollo.jpg" "https://images.unsplash.com/photo-1496116218417-1a781b67df0e?auto=format&fit=crop&w=1200&q=85"
fetch "gyozas-cerdo.jpg" "https://images.unsplash.com/photo-1455619452474-d660be986d72?auto=format&fit=crop&w=1200&q=85"
fetch "poke-salmon.jpg" "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=1200&q=85"
fetch "bowl-mediterraneo.jpg" "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=85"
fetch "ensalada-cesar.jpg" "https://images.unsplash.com/photo-1551248429-40975aa4de74?auto=format&fit=crop&w=1200&q=85"
fetch "pizza-margherita-bufala.jpg" "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1200&q=85"
fetch "pizza-diavola.jpg" "https://images.unsplash.com/photo-1593504049359-74330189a345?auto=format&fit=crop&w=1200&q=85"
fetch "pizza-quattro-formaggi.jpg" "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=85"
fetch "pizza-pepperoni.jpg" "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=1200&q=85"
fetch "pizza-vegana-verde.jpg" "https://images.unsplash.com/photo-1571997463535-a7cbdaef7779?auto=format&fit=crop&w=1200&q=85"
fetch "lasana-bolognesa.jpg" "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=1200&q=85"
fetch "spaghetti-carbonara.jpg" "https://images.unsplash.com/photo-1612874742137-652c2a9d3653?auto=format&fit=crop&w=1200&q=85"
fetch "tagliatelle-pesto.jpg" "https://images.unsplash.com/photo-1473093295047-4ddfd7ba2c7c?auto=format&fit=crop&w=1200&q=85"
fetch "ravioli-ricotta-espinacas.jpg" "https://images.unsplash.com/photo-1587740904311-2d7f4a2c4e0a?auto=format&fit=crop&w=1200&q=85"
fetch "risotto-setas.jpg" "https://images.unsplash.com/photo-1476124369801-b43f9aef2f0b?auto=format&fit=crop&w=1200&q=85"
fetch "fabada-asturiana.jpg" "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1200&q=85"
fetch "callos-madrilenos.jpg" "https://images.unsplash.com/photo-1604908176997-4313efdd2453?auto=format&fit=crop&w=1200&q=85"
fetch "cocido-madrileno.jpg" "https://images.unsplash.com/photo-1604908177522-402cfa3a0c0a?auto=format&fit=crop&w=1200&q=85"
fetch "gazpacho-andaluz.jpg" "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=85"
fetch "pad-thai-pollo.jpg" "https://images.unsplash.com/photo-1455619452474-d660be986d72?auto=format&fit=crop&w=1200&q=85"
fetch "prado-classic.jpg" "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=85"
fetch "smash-doble-bacon.jpg" "https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=1200&q=85"
fetch "alitas-bbq.jpg" "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?auto=format&fit=crop&w=1200&q=85"
fetch "croquetas-jamon.jpg" "https://images.unsplash.com/photo-1601050690597-df57b8c1ed45?auto=format&fit=crop&w=1200&q=85"
fetch "patatas-rustic.jpg" "https://images.unsplash.com/photo-1518013431117-eb1465fa5752?auto=format&fit=crop&w=1200&q=85"
fetch "tiramisu-clasico.jpg" "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=1200&q=85"
fetch "brownie-chocolate.jpg" "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=1200&q=85"
fetch "panna-cotta-frutos.jpg" "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1200&q=85"
fetch "menu-dia-paella-valenciana.jpg" "https://images.unsplash.com/photo-1534080564583-591bebc13fec?auto=format&fit=crop&w=1200&q=85"
fetch "menu-dia-lasana-bolo.jpg" "https://images.unsplash.com/photo-1574894709920-7b0e6b8b2b8a?auto=format&fit=crop&w=1200&q=85"
fetch "menu-dia-bowl-verde.jpg" "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=85"

if [[ ! -f "$OUT/placeholder.jpg" ]]; then
  cp "$OUT/ramen-tonkotsu.jpg" "$OUT/placeholder.jpg" 2>/dev/null || \
    fetch "placeholder.jpg" "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=85"
fi

echo "Done. $(ls -1 "$OUT" 2>/dev/null | wc -l) files"
