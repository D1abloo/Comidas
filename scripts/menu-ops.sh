#!/usr/bin/env bash
# Menú sencillo de operaciones BocadO (para usar en la VPS).
# Uso:  cd /root/comidas && bash scripts/menu-ops.sh
#   o:  bash /root/comidas/scripts/menu-ops.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_FILE="$ROOT/.env.deploy"
COMPOSE=(docker compose --env-file "$ENV_FILE")
BACKUP_DIR="/root/backups"
DOMAIN="bocado.31-70-114-94.sslip.io"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "No encuentro $ENV_FILE"
  echo "Este script debe ejecutarse en el servidor, dentro de /root/comidas"
  exit 1
fi

pause() {
  echo
  read -r -p "Pulsa Enter para volver al menú… " _
}

say() { printf '%s\n' "$*"; }
ok() { printf '✓ %s\n' "$*"; }
warn() { printf '! %s\n' "$*"; }

need_web() {
  if ! "${COMPOSE[@]}" ps --status running --services 2>/dev/null | grep -qx web; then
    warn "El servicio web no está en marcha. Arrancando…"
    "${COMPOSE[@]}" up -d web
    sleep 2
  fi
}

need_postgres() {
  if ! "${COMPOSE[@]}" ps --status running --services 2>/dev/null | grep -qx postgres; then
    warn "PostgreSQL no está en marcha. Arrancando…"
    "${COMPOSE[@]}" up -d postgres
    sleep 3
  fi
}

hash_password() {
  local pass="$1"
  need_web
  "${COMPOSE[@]}" exec -T web node -e \
    "const b=require('bcryptjs'); process.stdout.write(b.hashSync(process.argv[1], 12))" \
    "$pass"
}

ask_password() {
  local pass pass2
  while true; do
    read -r -s -p "Nueva contraseña (mín. 10 caracteres, no se muestra): " pass
    echo
    if [[ ${#pass} -lt 10 ]]; then
      warn "Demasiado corta. Usa al menos 10 caracteres."
      continue
    fi
    read -r -s -p "Repite la contraseña: " pass2
    echo
    if [[ "$pass" != "$pass2" ]]; then
      warn "No coinciden. Inténtalo de nuevo."
      continue
    fi
    printf '%s' "$pass"
    return 0
  done
}

change_password() {
  local email="$1"
  local label="$2"
  say
  say "Cambiar contraseña de $label ($email)"
  say "----------------------------------------"
  local pass hash
  pass="$(ask_password)"
  say "Generando… un momento."
  hash="$(hash_password "$pass")"
  need_postgres
  local n
  n="$("${COMPOSE[@]}" exec -T postgres psql -U bocado -d bocado -tAc \
    "UPDATE users SET password_hash = '${hash}' WHERE lower(email) = lower('${email}'); SELECT COUNT(*) FROM users WHERE lower(email)=lower('${email}');")"
  n="$(echo "$n" | tr -d '[:space:]')"
  if [[ "$n" != "1" ]]; then
    warn "No encontré el usuario $email (filas=$n)."
    return 1
  fi
  "${COMPOSE[@]}" restart web >/dev/null
  ok "Contraseña de $label actualizada."
  say
  say "Guárdala en tu archivo de contraseñas del Escritorio:"
  say "  Email:        $email"
  say "  Contraseña:   $pass"
  say
  say "Prueba a entrar en:"
  if [[ "$label" == "admin" ]]; then
    say "  https://$DOMAIN/admin/login"
  else
    say "  https://$DOMAIN/repartidor/login"
  fi
}

create_user() {
  local role="$1"
  local label="$2"
  say
  say "Crear usuario $label"
  say "----------------------------------------"
  local email name phone pass hash id
  read -r -p "Email: " email
  read -r -p "Nombre completo: " name
  read -r -p "Teléfono (opcional): " phone
  phone="${phone:-+34000000000}"
  if [[ -z "$email" || -z "$name" ]]; then
    warn "Email y nombre son obligatorios."
    return 1
  fi
  pass="$(ask_password)"
  say "Creando… un momento."
  hash="$(hash_password "$pass")"
  id="u-$(head -c 8 /dev/urandom | od -An -tx1 | tr -d ' \n' | head -c 8)"
  need_postgres
  if "${COMPOSE[@]}" exec -T postgres psql -U bocado -d bocado -tAc \
    "SELECT 1 FROM users WHERE lower(email)=lower('${email}')" | grep -q 1; then
    warn "Ya existe un usuario con ese email."
    return 1
  fi
  "${COMPOSE[@]}" exec -T postgres psql -U bocado -d bocado -v ON_ERROR_STOP=1 -c \
    "INSERT INTO users (id, email, full_name, role, phone, password_hash)
     VALUES ('${id}', '${email}', '${name}', '${role}', '${phone}', '${hash}');" >/dev/null
  ok "Usuario $label creado."
  say "  Email:        $email"
  say "  Contraseña:   $pass"
  say "  Guárdalos en tu archivo de contraseñas."
}

list_users() {
  need_postgres
  say
  say "Usuarios en el servidor"
  say "----------------------------------------"
  "${COMPOSE[@]}" exec -T postgres psql -U bocado -d bocado -c \
    "SELECT role AS rol, email, full_name AS nombre, created_at::date AS creado
     FROM users ORDER BY role, email;"
}

check_site() {
  say
  say "Comprobar estado"
  say "----------------------------------------"
  "${COMPOSE[@]}" ps
  echo
  df -h / | tail -1
  echo
  local url="https://$DOMAIN"
  if [[ -f "$ENV_FILE" ]] && grep -q '^PUBLIC_APP_URL=' "$ENV_FILE"; then
    url="$(grep '^PUBLIC_APP_URL=' "$ENV_FILE" | head -1 | cut -d= -f2-)"
  fi
  say "Probando $url/carta …"
  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$url/carta" || true)"
  if [[ "$code" == "200" ]]; then
    ok "La carta responde bien (HTTP $code)."
  else
    warn "La carta no responde bien (HTTP ${code:-error})."
    say "Puedes probar la opción 6 (reiniciar web)."
  fi
  say "Probando salud…"
  curl -s --max-time 10 "$url/api/health" || true
  echo
}

restart_web() {
  say
  say "Reiniciando la web…"
  "${COMPOSE[@]}" restart web
  sleep 2
  ok "Web reiniciada."
  check_site
}

backup_db() {
  need_postgres
  mkdir -p "$BACKUP_DIR"
  local file="$BACKUP_DIR/bocado-backup-$(date +%F-%H%M).sql"
  say
  say "Creando copia de seguridad…"
  "${COMPOSE[@]}" exec -T postgres pg_dump -U bocado -d bocado --no-owner > "$file"
  ok "Backup guardado en:"
  say "  $file"
  ls -lh "$file"
  say
  say "Para bajarlo a tu PC (en otra terminal):"
  say "  scp root@31.70.114.94:$file ~/Escritorio/"
}

clean_disk() {
  say
  say "Liberar espacio en disco"
  say "----------------------------------------"
  say "Esto borra basura de Docker (imágenes viejas, caché)."
  say "NO borra tus pedidos ni la base de datos."
  read -r -p "¿Continuar? (escribe si): " conf
  if [[ "$conf" != "si" && "$conf" != "sí" && "$conf" != "SI" ]]; then
    say "Cancelado."
    return 0
  fi
  df -h / | tail -1
  "${COMPOSE[@]}" stop web 2>/dev/null || true
  docker builder prune -af || true
  docker system prune -af --volumes=false || true
  "${COMPOSE[@]}" up -d web || true
  echo
  df -h / | tail -1
  ok "Limpieza terminada."
}

show_links() {
  say
  say "Enlaces útiles"
  say "----------------------------------------"
  say "Tienda:       https://$DOMAIN"
  say "Carta:        https://$DOMAIN/carta"
  say "Admin:        https://$DOMAIN/admin/login"
  say "Repartidor:   https://$DOMAIN/repartidor/login"
  say
  say "Recuerda: las contraseñas están en tu PC:"
  say "  /home/isaac/Escritorio/bocado-credenciales-vps.txt"
  say "(ese archivo NO está en el servidor, solo en tu ordenador)"
}

menu() {
  clear 2>/dev/null || true
  cat <<EOF
========================================
  BocadO — menú del servidor
========================================
  1) Cambiar contraseña del ADMIN
  2) Cambiar contraseña del REPARTIDOR
  3) Crear usuario ADMIN nuevo
  4) Crear usuario REPARTIDOR nuevo
  5) Ver lista de usuarios
  6) Comprobar si la web va bien
  7) Reiniciar la web
  8) Hacer copia de seguridad (backup)
  9) Liberar espacio en disco
 10) Ver enlaces útiles
   0) Salir
========================================
EOF
  read -r -p "Elige un número: " op
  case "$op" in
    1) change_password 'admin@bocado.app' 'admin' ;;
    2) change_password 'repartidor@bocado.app' 'repartidor' ;;
    3) create_user 'admin' 'admin' ;;
    4) create_user 'courier' 'repartidor' ;;
    5) list_users ;;
    6) check_site ;;
    7) restart_web ;;
    8) backup_db ;;
    9) clean_disk ;;
    10) show_links ;;
    0) say "Hasta luego."; exit 0 ;;
    *) warn "Opción no válida." ;;
  esac
  pause
}

while true; do
  menu
done
