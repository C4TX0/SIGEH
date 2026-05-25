# SIGEH - Guia DBA

## Objetivo

Mantener la base de datos de SIGEH consistente, respaldada y recuperable.

## Tareas de DBA

- Validar que existan roles y permisos correctos.
- Confirmar que `rol_admin_sigeh` pueda leer las tablas que usa la app.
- Verificar que `sigeh_app` sea la cuenta de conexion del backend.
- Supervisar respaldos y restores.
- Revisar la standby por refresco programado.
- Confirmar la vigencia de `bloqueado_hasta` y de la bitacora de accesos.

## Objetos criticos

- Tablas: `usuarios`, `bitacora_accesos`, `auditoria_cambios`, `respaldos_realizados`, `pagos`, `facturas`.
- Procedures: los de consulta, alta hospitalaria, farmacia y facturacion.
- Vistas: reportes, expediente y monitoreo.

## Respaldos

- Generar respaldo:

```powershell
npm run backup:db
```

- Restaurar respaldo:

```powershell
npm run restore:db
```

## Replica

- Crear o refrescar standby:

```powershell
npm run replica:setup
npm run replica:refresh
```

- Verificar diferencia primaria/standby:

```powershell
npm run replica:check
```

## Monitoreo

- Revisar:
  - conexiones
  - locks
  - deadlocks
  - queries largas
  - tamano de base
  - ocupacion del servidor

```powershell
npm run monitor:db
```

## Limpieza de entrega

- No borrar `database.sql`.
- No borrar `docs/`.
- Mantener `backups/` solo con evidencia necesaria.
- Evitar exponer `.env` o credenciales en nuevas capturas.
