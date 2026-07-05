# BocadO — App Android unificada

Un solo APK con el **logo BocadO**. Al iniciar sesión detecta el rol del usuario:

| Rol | Panel |
|-----|--------|
| `admin` | `/admin` — gestión completa |
| `courier` | `/repartidor` — entregas + GPS |

## Configurar

```bash
cd apps/mobile-app
BOCADO_APP_URL=https://tu-dominio.vercel.app npm run config:prod
npm install
npm run icons
node scripts/patch-android-manifest.mjs
npm run sync
```

## Compilar APK

```bash
npm run build:apk
```

APK: `android/app/build/outputs/apk/debug/app-debug.apk`

## Cuentas demo

- Admin: `admin@bocado.app` / `admin1234`
- Repartidor: `repartidor@bocado.app` / `repartidor1234`

## Notas

- Entrada web: `/movil`
- Al cerrar sesión en la app vuelves a `/movil`
- Las apps separadas (`admin-app`, `courier-app`) siguen disponibles pero **este APK las sustituye**
