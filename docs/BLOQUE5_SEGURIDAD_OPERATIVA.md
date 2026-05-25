# SIGEH - Bloque 5: Seguridad operativa y hardening

## 1) Vulnerabilidades encontradas

- El backend estaba expuesto sin `helmet` ni limitación de solicitudes.
- El login no tenía bloqueo temporal real por intentos fallidos.
- El backend usaba una cuenta PostgreSQL demasiado privilegiada para operar la app.
- El JWT quedaba persistido en `localStorage` en el frontend.
- Algunas rutas sensibles dependían solo de la estructura de roles, sin evidencia adicional de control ante abuso.
- El login podía revelar demasiada información si se dejaba sin validación de entrada.

## 2) Qué se corrigió

- Se agregó `helmet` en el backend.
- Se agregó rate limiting global para `/api` y rate limiting específico para `/api/auth/login`.
- Se implementó bloqueo temporal persistente usando `usuarios.bloqueado_hasta`.
- Se agregaron validaciones de username/password en login y de username/password/booleanos en usuarios.
- Se migró la sesión del frontend a `sessionStorage`.
- Se creó la cuenta PostgreSQL limitada `sigeh_app` para la aplicación.
- Se reforzaron los GRANTs para el rol admin después de la creación real de tablas.

## 3) Medidas de hardening implementadas

- `helmet` activo.
- CORS restringido a `localhost`, `127.0.0.1` y origen nulo de desarrollo local.
- Rate limit global en API.
- Rate limit del login con mensajes controlados.
- Bloqueo temporal de cuentas tras intentos fallidos.
- Reseteo automático de bloqueo vencido.
- Validación mínima de entradas críticas.
- Token en `sessionStorage` en lugar de `localStorage`.
- Usuario de aplicación sin superusuario.

## 4) Rutas protegidas

- `/api/usuarios/*` requiere `ADMIN`.
- `/api/auditoria/*` requiere `ADMIN`.
- `/api/facturacion/*` requiere `ADMIN` o `USUARIO_GENERAL`.
- `/api/medico/*` requiere el rol correspondiente según la ruta.
- `/api/infra/*` requiere `ADMIN`.
- `/api/auth/login` quedó protegido por rate limit y bloqueo temporal de cuenta.

## 5) Validaciones agregadas

- Username de login con formato permitido y longitud controlada.
- Password de login con longitud mínima y máxima.
- Username de alta/edición de usuarios con formato permitido.
- Password de alta/edición de usuarios con longitud mínima y máxima.
- Booleanos de edición normalizados antes de llegar a SQL.
- IDs positivos en usuarios.

## 6) Riesgos pendientes

- El rate limit vive en memoria y se reinicia si el proceso se reinicia.
- El bloqueo temporal sí persiste en base de datos, pero depende del reloj del servidor.
- No se añadió MFA ni un sistema enterprise de identidad, por alcance del proyecto.
- El frontend sigue siendo una app local; si se sirve en otro contexto, habría que revisar CSP y orígenes permitidos.

## 7) Evidencia runtime real

- `GET /api/infra/monitor/overview` respondió `200` con métricas reales de CPU, RAM, disco y PostgreSQL.
- `GET /api/infra/replication/status` respondió `200` con `healthy: true`.
- Login admin respondió `200` tras reinicio del backend.
- `GET /api/infra/monitor/overview` con JWT de rol no admin respondió `403`.
- `POST /api/auth/login` con usuario inexistente alcanzó `429` por rate limit.
- `POST /api/auth/login` con password incorrecta en admin devolvió `423` al quinto intento por bloqueo temporal.
- El frontend dejó el token en `sessionStorage` y limpió `localStorage` tras recarga.
- La pestaña Monitoreo cargó JSON real desde la API protegida.

## 8) Documentación generada

- `docs/BLOQUE5_SEGURIDAD_OPERATIVA.md`
- `docs/BLOQUE4_REPLICACION_MONITOREO.md` sigue como base de continuidad operativa.

## 9) Decisiones técnicas

- Se priorizó un hardening mínimo, consistente y justificable académicamente.
- Se evitó introducir OAuth, Vault, Kubernetes o componentes excesivos.
- La seguridad operativa se apoyó en controles simples y verificables: headers, rate limits, bloqueo temporal, validación y menor privilegio.
