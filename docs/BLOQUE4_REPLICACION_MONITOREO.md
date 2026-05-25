# SIGEH - Bloque 4: Replicacion y Monitoreo

## 1) Estado inicial auditado

- PostgreSQL operativo en entorno local Windows.
- `wal_level = replica`, `max_wal_senders = 10`, `max_replication_slots = 10`.
- Scripts de backup/restore ya funcionales (Bloque 3).
- No existia estrategia de continuidad activa (solo backups puntuales).
- No existian endpoints de monitoreo operativo (CPU/RAM/locks/deadlocks/conexiones).

## 2) Estrategia elegida (realista para entorno escolar/local)

Se implemento **standby por refresco programado**:

- Se mantiene una base secundaria (`STANDBY_DB`, por defecto `sigeh_db_standby`).
- La standby se refresca con snapshot real (`pg_dump` + `psql`) desde la base primaria.
- Es una estrategia de continuidad practica y demostrable en local Windows sin infraestructura enterprise.

Justificacion:

- Compatible con entorno local y limitaciones del proyecto.
- Repetible y automatizable.
- Permite validacion de sincronizacion y recuperacion rapida.

## 3) Scripts implementados

- `scripts/setup-standby-replica.ps1`
  - Inicializa standby (wrapper de refresco).
- `scripts/refresh-standby-replica.ps1`
  - Genera snapshot, recrea standby y restaura datos.
- `scripts/check-standby-replica.ps1`
  - Compara metricas clave primaria vs standby (pacientes, consultas, facturas).
- `scripts/monitor-db.ps1`
  - Reporta metricas de SO + PostgreSQL.

Scripts npm agregados:

- `npm run replica:setup`
- `npm run replica:refresh`
- `npm run replica:check`
- `npm run monitor:db`

## 4) Monitoreo implementado

### API (backend)

- `GET /api/infra/monitor/overview` (ADMIN)
  - CPU
  - RAM
  - Disco
  - Conexiones totales y por estado
  - Locks en espera
  - Deadlocks acumulados
  - Consultas largas (>5s)
  - Tamaño de base de datos
- `GET /api/infra/replication/status` (ADMIN)
  - Estado de continuidad primaria vs standby
  - Deltas de tablas clave

### Frontend (integracion minima)

En Auditoria se agrego pestaña **Monitoreo**:

- Visualiza JSON de `overview` y `replication/status`.

## 5) Comandos de operacion

### Levantar standby por primera vez

```powershell
npm run replica:setup
```

### Refrescar standby

```powershell
npm run replica:refresh
```

### Verificar sincronizacion

```powershell
npm run replica:check
```

### Consultar monitoreo por script

```powershell
npm run monitor:db
```

### Monitoreo por API

```powershell
# con token admin
GET /api/infra/monitor/overview
GET /api/infra/replication/status
```

## 6) Evidencias esperadas

- Salida JSON de `replica:check` con deltas.
- Salida JSON de `monitor:db` con metricas reales.
- Respuesta de `/api/infra/monitor/overview` y `/api/infra/replication/status`.
- Existencia de `sigeh_db_standby` en `pg_database`.

## 7) Riesgos y limitaciones

- No es streaming replication en tiempo real; es continuidad por refresco programado.
- Si no se ejecuta refresco periodico, la standby puede quedar desactualizada.
- Para produccion real se requeriria HA formal (streaming/failover automatizado).

## 8) Validacion recomendada

1. Ejecutar `npm run replica:setup`.
2. Ejecutar `npm run replica:check` y confirmar deltas cero o esperados.
3. Ejecutar `npm run monitor:db`.
4. Verificar endpoints de infra autenticado como ADMIN.
5. Verificar pestaña Monitoreo en frontend.
