# Vercel (no habilitado)

La aplicación usa actualmente `@astrojs/node` en modo `standalone`, PostgreSQL,
sesiones de servidor y migraciones Docker. El destino soportado es Node/Docker
en VPS; los archivos `vercel.json` antiguos se retiraron para evitar despliegues
que aparenten funcionar pero fallen en SSR.

Para recuperar Vercel habría que añadir y probar un adaptador actual compatible
con Astro 7, elegir almacenamiento de sesión distribuido, ejecutar migraciones
fuera del runtime y revisar la compatibilidad de todas las conexiones persistentes
(incluido SSE). Hasta completar ese trabajo, usa `npm run deploy:vps`.
