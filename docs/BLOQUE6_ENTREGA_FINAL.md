# SIGEH - Bloque 6: Documentacion, pruebas y cierre final

## 1) Que faltaba en documentacion

- No existia un README central reproducible.
- La documentacion estaba dispersa por bloques.
- Faltaba una guia de instalacion y ejecucion unificada.
- Faltaba una explicacion completa de la arquitectura real.
- Faltaba un indice de pruebas y evidencias con comandos reutilizables.
- Faltaba una guia para DBA y otra para operacion diaria.

## 2) Documentos creados

- [README.md](../README.md)
- [docs/BLOQUE6_ARQUITECTURA_MODULOS.md](BLOQUE6_ARQUITECTURA_MODULOS.md)
- [docs/BLOQUE6_GUIA_OPERATIVA.md](BLOQUE6_GUIA_OPERATIVA.md)
- [docs/BLOQUE6_GUIA_DBA.md](BLOQUE6_GUIA_DBA.md)
- [docs/BLOQUE6_TROUBLESHOOTING.md](BLOQUE6_TROUBLESHOOTING.md)
- [docs/BLOQUE6_CHECKLIST_DESPLIEGUE.md](BLOQUE6_CHECKLIST_DESPLIEGUE.md)
- [docs/BLOQUE6_EVIDENCIAS.md](BLOQUE6_EVIDENCIAS.md)
- [docs/BLOQUE6_VALIDACION_PRACICA_ORIGINAL.md](BLOQUE6_VALIDACION_PRACICA_ORIGINAL.md)

## 3) Pruebas documentadas

- Login JWT exitoso.
- Acceso a endpoints protegidos.
- Respuesta `403` en infraestructura para rol no admin.
- Respuesta `429` por rate limit de login.
- Respuesta `423` por bloqueo temporal.
- Monitoreo operativo real.
- Réplica/standby por refresco programado.
- Backups y restore reales.
- Frontend consumiendo la API protegida.

## 4) Reproducibilidad

- `npm install`
- configurar `.env`
- cargar `database.sql`
- `npm run dev`
- `npm run backup:db`
- `npm run restore:db`
- `npm run replica:setup`
- `npm run replica:check`
- `npm run monitor:db`

## 5) Estado de la practica original

- Cubierto: diseño, instalacion, seguridad, monitoreo, recuperacion, auditoria, respaldos, replicacion, arquitectura, scripts y evidencias.
- No se encontro un archivo de practica/rubrica original dentro del workspace para citarlo literalmente.
- La validacion se realizo contra la implementacion real y contra los requisitos funcionales ya trabajados en Bloques 1 a 5.

## 6) Riesgos o limitaciones

- Algunos controles, como rate limiting, son por proceso local.
- La continuidad es por refresco programado, no por clustering enterprise.
- La documentacion de evidencias usa outputs verificados en consola y API; no incluye capturas adicionales porque no se generaron nuevas durante este bloque.
