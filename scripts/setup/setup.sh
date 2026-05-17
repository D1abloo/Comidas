#!/usr/bin/env bash
set -euo pipefail

echo "[bocado] Instalando dependencias..."
npm install

if [ ! -f .env ]; then
  cp .env.example .env
  echo "[bocado] .env creado desde .env.example. Edítalo antes de continuar."
fi

if command -v docker >/dev/null 2>&1; then
  echo "[bocado] Levantando Redis + MailHog..."
  docker compose -f infrastructure/docker/docker-compose.yml up -d
else
  echo "[bocado] Docker no encontrado. Salta este paso si ya tienes Redis."
fi

echo "[bocado] Listo. Ejecuta: npm run dev"
