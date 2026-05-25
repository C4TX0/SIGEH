-- ============================================================
-- SIGEH - Practica obligatoria: mover tabla critica a tablespace
--
-- Objetivo:
-- Dejar evidencia reproducible para documentar que una tabla critica
-- puede moverse a otro tablespace sin romper la conexion de la app.
--
-- Tabla critica elegida:
-- - consultas
--
-- Razon:
-- La agenda medica, el expediente clinico, reportes y facturacion
-- dependen directa o indirectamente de las consultas.
--
-- IMPORTANTE:
-- Ejecutar como superusuario o usuario con permisos suficientes.
-- El tablespace destino debe existir antes de correr el ALTER TABLE.
-- En database.sql ya se define ts_logs, ts_datos, ts_index y ts_backup.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Estado antes del movimiento
-- Copiar esta salida al documento Word.
-- ------------------------------------------------------------

SELECT
  c.relname AS tabla,
  COALESCE(t.spcname, 'pg_default') AS tablespace_actual
FROM pg_class c
LEFT JOIN pg_tablespace t ON t.oid = c.reltablespace
WHERE c.relname = 'consultas';

-- Validacion funcional antes del movimiento.
SELECT COUNT(*) AS total_consultas_antes FROM consultas;

SELECT c.id_consulta, c.fecha_hora, c.motivo
FROM consultas c
ORDER BY c.fecha_hora DESC
LIMIT 5;

-- ------------------------------------------------------------
-- 2) Movimiento de tabla critica
--
-- Para documentar movimiento real:
-- - Si consultas esta en ts_datos, mover temporalmente a ts_logs.
-- - Despues puede regresarse a ts_datos.
--
-- Ejecuta SOLO UNO de los dos ALTER segun la evidencia que necesites.
-- ------------------------------------------------------------

ALTER TABLE consultas SET TABLESPACE ts_logs;

-- Opcional: regresar la tabla a su tablespace operativo original.
-- ALTER TABLE consultas SET TABLESPACE ts_datos;

-- ------------------------------------------------------------
-- 3) Estado despues del movimiento
-- Copiar esta salida al documento Word.
-- ------------------------------------------------------------

SELECT
  c.relname AS tabla,
  COALESCE(t.spcname, 'pg_default') AS tablespace_actual
FROM pg_class c
LEFT JOIN pg_tablespace t ON t.oid = c.reltablespace
WHERE c.relname = 'consultas';

-- Validacion funcional despues del movimiento.
SELECT COUNT(*) AS total_consultas_despues FROM consultas;

SELECT c.id_consulta, c.fecha_hora, c.motivo
FROM consultas c
ORDER BY c.fecha_hora DESC
LIMIT 5;

-- ------------------------------------------------------------
-- 4) Validacion desde la aplicacion
--
-- Despues de ejecutar el ALTER TABLE, probar en el navegador:
-- - Login como admin_demo / Demo12345
-- - Entrar a Reportes
-- - Entrar a Agenda
--
-- O probar desde API:
-- - GET /api/health
-- - GET /api/reportes/historial-consultas con token admin
--
-- Si esas pantallas/endpoints responden, se documenta que la app
-- siguio funcionando despues del movimiento.
-- ------------------------------------------------------------
