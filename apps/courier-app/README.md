# BocadO Repartidor — App Android

App nativa Android (Capacitor) que carga la web `/repartidor` del backend BocadO y envía **GPS en vivo** al panel admin (`/admin/repartidores` y `/admin/pedidos`).

## Requisitos

- Node.js 20+
- [Android Studio](https://developer.android.com/studio) con SDK 34+
- Variable `ANDROID_HOME` configurada
- Backend desplegado (Vercel) o `npm run dev` en local

## Configurar URL del servidor

```bash
cd apps/courier-app

# Producción (cambia por tu dominio Vercel)
BOCADO_APP_URL=https://tu-proyecto.vercel.app npm run config:prod

# Emulador Android → localhost del PC
npm run config:local
# usa http://10.0.2.2:4321 (mapea al puerto 4321 del host)

# Dispositivo físico en la misma WiFi (sustituye IP)
BOCADO_APP_URL=http://192.168.1.50:4321 npm run config:local
```

## Generar proyecto Android

```bash
cd apps/courier-app
npm install
npx cap add android
node scripts/patch-android-manifest.mjs
npm run sync
```

## Abrir en Android Studio / compilar APK

```bash
npm run open:android
# o APK debug directo:
npm run build:apk
```

El APK debug queda en:

`apps/courier-app/android/app/build/outputs/apk/debug/app-debug.apk`

## Cuenta demo repartidor

| Email | Contraseña |
|-------|------------|
| `repartidor@bocado.app` | `repartidor1234` |

## Flujo

1. Repartidor abre la app → login → acepta pedido en reparto
2. La app pide permiso de **ubicación** (siempre / en uso)
3. `PATCH /api/courier/location` envía coordenadas al servidor
4. Admin ve mapa en **Operaciones → Mapa GPS** o en el detalle del pedido

## Notas

- En **producción** usa HTTPS (`config:prod`); el GPS en WebView requiere conexión segura.
- Las cookies de sesión funcionan porque la app carga el mismo dominio que la API.
- Para compilar: usa **JDK 17 o 21** (Android Studio → Settings → Gradle JDK). Java 25 puede fallar con Gradle 8.2.
- Para publicar en Play Store: `npm run build:apk:release` con keystore firmado en Android Studio.
