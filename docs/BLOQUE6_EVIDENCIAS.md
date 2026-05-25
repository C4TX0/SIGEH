# SIGEH - Evidencias tecnicas

## Login JWT

Comando validado:

```powershell
$base = 'http://localhost:3000'
$login = Invoke-RestMethod -Uri "$base/api/auth/login" -Method POST -ContentType 'application/json' -Body (@{ username='admin'; password='admin123' } | ConvertTo-Json)
```

Resultado:

- `login_ok = true`

## Infra protegida

JWT de rol no admin contra infraestructura:

- Resultado: `403`

## Rate limit

Intentos repetidos de login incorrecto:

- Resultado observado: `429`

## Bloqueo temporal

Contrasena incorrecta sobre admin:

- Resultado observado: `423` al quinto intento

## Monitoreo

`GET /api/infra/monitor/overview`

- `200`
- CPU, RAM, disco, conexiones, locks, deadlocks, queries largas y tamano de BD

`GET /api/infra/replication/status`

- `200`
- `healthy: true`
- `deltas: 0`

## Replica

- `npm run replica:setup` -> `ok: true`
- `npm run replica:check` -> primaria y standby alineadas
- `npm run replica:refresh` -> snapshot restaurado correctamente

## Respaldo y restore

- `npm run backup:db` -> respaldo real en `backups/`
- `npm run restore:db` -> restauracion verificada sobre base temporal de prueba

## Frontend

- El token queda en `sessionStorage`.
- `localStorage` queda vacio para la sesion.
- La pestaña Monitoreo consume la API real.
