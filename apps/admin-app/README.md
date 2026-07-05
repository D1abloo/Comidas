# BocadO Admin — App Android

App nativa Android (Capacitor) que carga el **panel de administración** (`/admin`) del backend BocadO. El mismo panel que usas en el ordenador, optimizado para móvil y tablet.

## Qué incluye

- Pedidos en vivo, avisos de nuevos pedidos y Bizum
- Mapa GPS de repartidores
- Gestión de platos, usuarios, ajustes y facturas
- Misma sesión y API que la web (cookies en el dominio de producción)

## Requisitos

- Node.js 20+
- [Android Studio](https://developer.android.com/studio) con SDK 34+
- Backend en Vercel o `npm run dev` en local

## Configurar URL del servidor

```bash
cd apps/admin-app

# Producción (tu dominio Vercel)
BOCADO_APP_URL=https://tu-proyecto.vercel.app npm run config:prod

# Emulador → localhost del PC
npm run config:local

# Dispositivo físico en la misma WiFi
BOCADO_APP_URL=http://192.168.1.50:4321 npm run config:local
```

## Instalar y sincronizar

```bash
cd apps/admin-app
npm install
node scripts/patch-android-manifest.mjs
npm run sync
```

## Abrir en Android Studio / APK

```bash
npm run open:android
# APK debug:
npm run build:apk
```

APK: `apps/admin-app/android/app/build/outputs/apk/debug/app-debug.apk`

## Cuenta demo admin

| Email | Contraseña |
|-------|------------|
| `admin@bocado.app` | `admin1234` |

## Uso junto al ordenador

1. Despliega el backend en Vercel (o corre `npm run dev` en la red local).
2. Configura la misma URL en la app (`config:prod` o `config:local`).
3. Inicia sesión en el móvil con la cuenta admin.
4. Los cambios (pedidos, repartidores, GPS) se ven al instante en **cualquier dispositivo** conectado al mismo servidor.

## Notas

- Usa **HTTPS** en producción.
- Para compilar: **JDK 17 o 21** en Android Studio (Gradle JDK).
- App repartidor separada: `apps/courier-app` (GPS del repartidor → mapa admin).
