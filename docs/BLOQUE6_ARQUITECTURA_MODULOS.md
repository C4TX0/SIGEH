# SIGEH - Arquitectura y modulos

## Flujo general

1. El usuario abre el frontend.
2. El frontend llama al backend Express en `/api`.
3. El backend valida JWT, rol y payload.
4. El backend delega la logica critica a PostgreSQL mediante procedimientos y vistas.
5. La base de datos conserva auditoria, respaldos, usuarios, consultas, facturacion, reportes y continuidad.

## Carpetas principales

### `frontend/`

- `index.html`: interfaz principal.
- `app.js`: logica de sesiones, vistas y consumo de API.
- `styles.css`: estilos.

### `src/`

- `server.js`: punto de entrada Express.
- `config/db.js`: pool PostgreSQL y helpers de rol.
- `controllers/`: logica por dominio.
- `routes/`: exposicion de endpoints.
- `middleware/`: autenticacion y autorizacion.
- `services/`: backup, restore y monitoreo.

### `scripts/`

- Operacion de backup, restore, monitoreo y standby refrescado.

### `docs/`

- Evidencia y guias de bloques y entrega.

### `migrations/`

- Scripts incrementales usados durante el ajuste del esquema.

## Modulos del backend

### Auth

- Login JWT.
- Bitacora de accesos.
- Bloqueo temporal por intentos fallidos.

### Usuarios

- CRUD de usuarios.
- Manejo de roles y estatus.
- Validacion de username y password.

### Pacientes, medicos, consultas y expediente

- Operacion clinica base.
- Uso de procedimientos y vistas para mantener consistencia.

### Facturacion

- Generacion de factura y pago con procedures.

### Auditoria

- Bitacora de accesos.
- Bitacora de cambios.
- Respaldos reales con evidencia de archivo.

### Infraestructura

- Monitoreo de servidor y BD.
- Estado de standby y continuidad.

## Conexion frontend -> backend -> PostgreSQL

- Frontend usa `fetch` con `Authorization: Bearer <JWT>`.
- Backend valida token y rol.
- Controllers usan `queryWithRole` o `withRoleTransaction`.
- PostgreSQL ejecuta procedures/vistas y aplica constraints.

## Endpoints mas importantes

- `POST /api/auth/login`
- `GET /api/usuarios`
- `GET /api/auditoria/accesos`
- `GET /api/auditoria/cambios`
- `GET /api/auditoria/respaldos`
- `POST /api/auditoria/respaldos`
- `GET /api/reportes/ocupacion-camas`
- `GET /api/reportes/historial-consultas`
- `GET /api/reportes/inventario-farmacia`
- `GET /api/infra/monitor/overview`
- `GET /api/infra/replication/status`

## Procedures relevantes

- `registrar_nueva_consulta`
- `procesar_alta_hospitalaria`
- `surtir_receta_farmacia`
- `generar_factura_consulta`
- `registrar_pago_factura`

## Vistas relevantes

- `vw_expedientes_completos`
- `vw_ocupacion_camas`
- `vw_historial_consultas`
- `vw_inventario_farmacia`
- `vw_facturacion_mensual`
