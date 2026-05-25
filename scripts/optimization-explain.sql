-- ============================================================
-- SIGEH - Evidencia para Capitulo 8: Optimizacion
--
-- Objetivo:
-- Generar planes de ejecucion "antes" y "despues" para documentar
-- el impacto de los indices definidos en database.sql.
--
-- Uso sugerido en pgAdmin:
-- 1. Ejecutar database.sql y seed_demo_data.sql.
-- 2. Abrir este archivo en Query Tool.
-- 3. Ejecutar bloque por bloque.
-- 4. Copiar las salidas de EXPLAIN ANALYZE al documento Word.
--
-- Nota:
-- El "antes" se simula deshabilitando los scans por indice dentro de
-- la sesion. No borra indices ni modifica la estructura de la BD.
-- ============================================================

-- ------------------------------------------------------------
-- Consulta 1: agenda por medico y fecha
-- Indices relacionados:
-- - idx_consultas_id_medico
-- - idx_consultas_fecha_hora
-- - uq_consultas_medico_fecha
-- ------------------------------------------------------------

BEGIN;

SET LOCAL enable_indexscan = off;
SET LOCAL enable_bitmapscan = off;

EXPLAIN (ANALYZE, BUFFERS)
SELECT c.id_consulta, c.fecha_hora, c.motivo, ec.nombre AS estado,
       p.nombre, p.apellido_paterno
FROM consultas c
JOIN pacientes p ON p.id_paciente = c.id_paciente
JOIN estados_consulta ec ON ec.id_estado = c.id_estado
WHERE c.id_medico = (
  SELECT id_medico FROM medicos WHERE cedula_profesional = 'MEDDEMO01'
)
  AND c.fecha_hora >= CURRENT_DATE
  AND c.fecha_hora < CURRENT_DATE + INTERVAL '1 day'
ORDER BY c.fecha_hora;

ROLLBACK;

EXPLAIN (ANALYZE, BUFFERS)
SELECT c.id_consulta, c.fecha_hora, c.motivo, ec.nombre AS estado,
       p.nombre, p.apellido_paterno
FROM consultas c
JOIN pacientes p ON p.id_paciente = c.id_paciente
JOIN estados_consulta ec ON ec.id_estado = c.id_estado
WHERE c.id_medico = (
  SELECT id_medico FROM medicos WHERE cedula_profesional = 'MEDDEMO01'
)
  AND c.fecha_hora >= CURRENT_DATE
  AND c.fecha_hora < CURRENT_DATE + INTERVAL '1 day'
ORDER BY c.fecha_hora;

-- ------------------------------------------------------------
-- Consulta 2: busqueda de paciente por CURP
-- Indice relacionado:
-- - idx_pacientes_curp
-- - pacientes_curp_key
-- ------------------------------------------------------------

BEGIN;

SET LOCAL enable_indexscan = off;
SET LOCAL enable_bitmapscan = off;

EXPLAIN (ANALYZE, BUFFERS)
SELECT id_paciente, nombre, apellido_paterno, apellido_materno, curp
FROM pacientes
WHERE curp = 'GOML900101HDFRRS01';

ROLLBACK;

EXPLAIN (ANALYZE, BUFFERS)
SELECT id_paciente, nombre, apellido_paterno, apellido_materno, curp
FROM pacientes
WHERE curp = 'GOML900101HDFRRS01';

-- ------------------------------------------------------------
-- Consulta 3: facturacion por folio
-- Indice relacionado:
-- - idx_facturas_folio
-- - facturas_folio_key
-- ------------------------------------------------------------

BEGIN;

SET LOCAL enable_indexscan = off;
SET LOCAL enable_bitmapscan = off;

EXPLAIN (ANALYZE, BUFFERS)
SELECT id_factura, folio, subtotal, iva, total, estado, fecha_pago
FROM facturas
WHERE folio = 'FAC-DEMO-0001';

ROLLBACK;

EXPLAIN (ANALYZE, BUFFERS)
SELECT id_factura, folio, subtotal, iva, total, estado, fecha_pago
FROM facturas
WHERE folio = 'FAC-DEMO-0001';

-- ------------------------------------------------------------
-- Consulta auxiliar para documentar los indices existentes.
-- ------------------------------------------------------------

SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
