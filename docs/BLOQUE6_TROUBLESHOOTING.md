# SIGEH - Troubleshooting

## Backend no levanta

- Confirmar que PostgreSQL esta activo.
- Verificar `.env`.
- Revisar que el puerto `3000` este libre.
- Ejecutar `npm run dev` desde la raiz del proyecto.

## Login devuelve 401

- Validar usuario y password.
- Confirmar que el JWT no haya expirado.
- Verificar que el backend este usando el `.env` correcto.

## Login devuelve 423

- La cuenta quedo bloqueada temporalmente por intentos fallidos.
- Esperar el tiempo configurado o resetear el estado en base de datos con autorizacion.

## Infra devuelve 403

- El JWT no pertenece al rol `ADMIN`.
- Las rutas de infraestructura estan protegidas.

## Backup o restore falla

- Confirmar que `pg_dump`, `psql`, `createdb` y `dropdb` esten en PATH.
- Verificar `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`.

## Monitoreo no muestra datos

- Revisar que la base de datos no este caida.
- Confirmar que la cuenta de conexion tenga permisos sobre los objetos consultados.
- Verificar que el frontend este recargando la version mas reciente.
