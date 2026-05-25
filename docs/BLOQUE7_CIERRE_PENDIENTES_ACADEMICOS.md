# SIGEH - Bloque 7: Cierre de pendientes academicos

## 1. Pendientes revisados

Este bloque cierra los ultimos temas detectados entre la practica original, la auditoria final y la checklist final:

- Backup incremental.
- Backup diferencial.
- PITR.
- Migracion a otro servidor.
- Comparativa de optimizacion.
- Alertas de monitoreo.

## 2. Backup incremental y diferencial

### Criterio adoptado

PostgreSQL con `pg_dump` no ofrece incremental/diferencial fisico nativo en el mismo sentido que soluciones especializadas. Para el alcance academico de SIGEH se adopto una estrategia valida y reproducible:

- `backup:db` sigue siendo el respaldo completo real y el punto de recuperacion base.
- `backup:diferencial` y `backup:incremental` generan un **delta logico** sobre el ultimo respaldo exitoso, usando `auditoria_cambios` como fuente de verdad para identificar tablas impactadas.
- El resultado es un manifest JSON con las tablas afectadas, el ultimo cambio y la referencia al respaldo base.

### Scripts y comandos

- `npm run backup:diferencial`
- `npm run backup:incremental`

### Evidencia producida

- Archivo JSON en `backups/deltas/`.
- Registro en `respaldos_realizados` con tipo `diferencial` o `incremental`.
- Baseline trazable al ultimo backup exitoso.

### Limitacion conocida

No se presenta como backup block-level de produccion enterprise; es una representacion logica y academica, defendible porque usa la auditoria real del sistema.

## 3. PITR

### Criterio adoptado

El proyecto documenta PITR con WAL y `recovery_target_time` sin introducir infraestructura pesada adicional.

### Script y comando

- `npm run pitr:plan`

### Flujo reproducible

1. Tomar como base el ultimo respaldo completo exitoso.
2. Habilitar `wal_level` y archivado de WAL en el servidor PostgreSQL.
3. Definir un `recovery_target_time`.
4. Restaurar el respaldo base en el servidor de recuperacion.
5. Aplicar el comando de recuperacion con el target definido.
6. Validar el estado de los datos en el punto solicitado.

### Evidencia producida

- Plan Markdown en `backups/pitr/`.
- Parametros de recuperacion documentados en el plan.

### Limitacion conocida

La activacion de `archive_mode` y la ubicacion fisica del archive WAL dependen del servidor PostgreSQL. Eso se deja como prerequisito de despliegue y no como feature adicional de la app.

## 4. Migracion a otro servidor

### Criterio adoptado

La migracion se cubre con backup + restore hacia un target PostgreSQL distinto.

### Script y comando

- `npm run migrate:db`

### Flujo reproducible

1. Generar un backup completo o usar un archivo existente.
2. Indicar `target-host`, `target-port`, `target-user`, `target-password` y `target-db`.
3. Restaurar el archivo sobre el servidor destino.
4. Generar un reporte de migracion.

### Evidencia producida

- Reporte JSON en `backups/migrations/`.
- Restore reutiliza el flujo real ya validado en Bloque 3.

### Limitacion conocida

La migracion es de PostgreSQL a PostgreSQL. No se fuerza una migracion a otro SGBD porque implicaria una conversion de tipos, procedures y roles que rompe el alcance academico y el modelo actual.

## 5. Comparativa de optimizacion

### Criterio adoptado

La mejora se demuestra con `EXPLAIN ANALYZE` comparando el mismo query:

- Una ejecucion con index scan deshabilitado para simular un escenario no optimizado.
- Una ejecucion con el plan normal del motor, que aprovecha los indices existentes.

### Script y comando

- `npm run optimize:compare`

### Evidencia producida

- Reporte JSON en `backups/optimization/`.
- Reporte Markdown con tabla antes/despues.

### Limitacion conocida

El resultado depende de la cardinalidad real de la base local. El metodo es correcto porque compara el plan sobre el mismo dataset y explica la mejora con el optimizador real de PostgreSQL.

## 6. Alertas de monitoreo

### Criterio adoptado

Se agregan alertas basicas sin Prometheus ni componentes enterprise:

- CPU por encima del umbral.
- Memoria por encima del umbral.
- Locks en espera.
- Deadlocks acumulados.
- Consultas largas.
- Replica no saludable.

### Script y comando

- `npm run alerts:check`

### Evidencia producida

- JSON de alertas en `backups/alerts/`.
- Log append-only en `backups/alerts/alerts.log`.
- Exit code `2` cuando existen alertas activas.

### Limitacion conocida

Son alertas locales de verificacion, validas para defensa academica y demo tecnica. No se integran con un sistema de notificacion externo porque eso excede el alcance.

## 7. Coherencia con el proyecto

- No se rehizo el backend.
- No se cambiaron las rutas base ni la seguridad existente.
- No se rompieron los respaldos completos, la replica, el monitoreo ni la documentacion previa.
- Las nuevas herramientas se conectan a objetos ya existentes: `auditoria_cambios`, `respaldos_realizados`, `monitorService`, `backupService`.

## 8. Conclusiones

Los ultimos pendientes de la practica quedaron cerrados a nivel academico con implementaciones ligeras, reproducibles y defendibles:

- Incremental/diferencial: delta logico respaldado por auditoria real.
- PITR: plan WAL reproducible.
- Migracion: backup/restore entre servidores PostgreSQL.
- Optimizacion: comparativa real con `EXPLAIN ANALYZE`.
- Alertas: umbrales basicos y log de eventos.

El proyecto mantiene su arquitectura original y sigue siendo coherente con la entrega ya validada.
