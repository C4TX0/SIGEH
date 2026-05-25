# SIGEH - Bloque 3: Respaldos y Recuperacion Reales

## 1. Objetivo

Dejar el modulo de respaldos como funcional y verificable:

- Generar respaldo real de PostgreSQL (`pg_dump`).
- Registrar evidencia en `respaldos_realizados`.
- Restaurar respaldo en base temporal de prueba.
- Exponer evidencia por API (`GET /api/auditoria/respaldos`).

## 2. Estrategia implementada

- Tipo soportado actualmente: `completo`.
- Formato de respaldo: SQL plano (`.sql`).
- Herramientas: `pg_dump` para backup y `psql`/`pg_restore` para restore.
- Carpeta de salida por defecto: `./backups` (configurable por `BACKUP_DIR` o por API).
- Nomenclatura: `<db>_completo_YYYYMMDD_HHMMSS.sql`.

## 3. Automatizacion

### Scripts Node

- `npm run backup:db`
- `npm run restore:db -- --file=ruta/al/backup.sql --db=sigeh_restore_test`

### Wrappers PowerShell

- `./scripts/backup-db.ps1 -Tipo completo -Dir ./backups`
- `./scripts/restore-db.ps1 -File .\backups\backup.sql -Db sigeh_restore_test`

## 4. Endpoints involucrados

- `GET /api/auditoria/respaldos`
  - Devuelve historial y evidencia de archivo real:
    - `archivo_existe`
    - `tamano_archivo_mb_real`
- `POST /api/auditoria/respaldos`
  - Genera respaldo real y registra fila en `respaldos_realizados`.
  - Payload minimo:
    ```json
    { "tipo_respaldo": "completo" }
    ```
  - Payload con directorio personalizado:
    ```json
    { "tipo_respaldo": "completo", "directorio": "./backups" }
    ```

## 5. Registro en BD

Cada ejecucion (exitosa o fallida) registra:

- `tipo_respaldo`
- `fecha_inicio`
- `fecha_fin`
- `tamanio_mb`
- `ruta_archivo`
- `estado`
- `id_usuario`

## 6. Procedimiento de restore (prueba)

1. Crear base temporal vacia:
   ```powershell
   createdb -h $env:PGHOST -p $env:PGPORT -U $env:PGUSER sigeh_restore_test
   ```
2. Restaurar respaldo:
   ```powershell
   npm run restore:db -- --file=./backups/backup.sql --db=sigeh_restore_test
   ```
3. Validar contenido:
   ```powershell
   psql -h $env:PGHOST -p $env:PGPORT -U $env:PGUSER -d sigeh_restore_test -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';"
   ```

## 7. Tiempos estimados

- Backup local base pequena: 5 a 30 segundos.
- Restore base pequena: 10 a 60 segundos.
- Validacion SQL posterior: 1 a 5 minutos.

## 8. Responsables

- Operacion diaria: Admin SIGEH.
- Verificacion de integridad post-restore: DBA/Backend owner.

## 9. Validaciones recomendadas post-restore

- Conteo de tablas esperadas.
- Consulta de usuarios y roles base.
- Health endpoint del backend contra la base restaurada.
- Prueba de login y consulta de reportes.

## 10. Riesgos pendientes

- No hay scheduler interno; ejecucion es manual (o por Task Scheduler/cron externo).
- Solo se soporta `completo` de forma real por ahora.
- Restauracion debe ejecutarse fuera de produccion o ventana controlada.
