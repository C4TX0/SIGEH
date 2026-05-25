-- SIGEH incremental migration for existing database: sigeh_db
-- Date: 2026-05-23
-- Scope: Sync Block 1 + Block 2 SQL objects without recreating DB/tablespaces/tables.
-- Safety goals:
-- 1) Do not drop tables or data.
-- 2) Use CREATE OR REPLACE for mutable objects.
-- 3) Apply grants needed by current backend endpoints.

BEGIN;

SET LOCAL search_path = public;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '120s';

-- ============================================================
-- Procedures required by backend flows (Block 1 + Block 2)
-- ============================================================

CREATE OR REPLACE PROCEDURE registrar_nueva_consulta(
    p_id_pac INTEGER,
    p_id_med INTEGER,
    p_id_est INTEGER,
    p_fecha TIMESTAMP,
    p_motivo TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM consultas
        WHERE id_medico = p_id_med
          AND fecha_hora = p_fecha
    ) THEN
        RAISE EXCEPTION 'Medico ya tiene una consulta en esa fecha y hora';
    END IF;

    INSERT INTO consultas (id_paciente, id_medico, id_estado, fecha_hora, motivo)
    VALUES (p_id_pac, p_id_med, p_id_est, p_fecha, p_motivo);
END;
$$;

CREATE OR REPLACE PROCEDURE procesar_alta_hospitalaria(
    p_id_hosp INTEGER,
    p_diag_egreso TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE hospitalizaciones
    SET fecha_alta = NOW(),
        diagnostico_egreso = p_diag_egreso
    WHERE id_hospitalizacion = p_id_hosp
      AND fecha_alta IS NULL;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Hospitalizacion no encontrada o ya fue dada de alta';
    END IF;
END;
$$;

CREATE OR REPLACE PROCEDURE surtir_receta_farmacia(
    p_id_receta_medica INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM 1
    FROM recetas
    WHERE id_receta = p_id_receta_medica
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Receta no existe';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM recetas
        WHERE id_receta = p_id_receta_medica
          AND dispensada = TRUE
    ) THEN
        RAISE EXCEPTION 'Receta ya fue dispensada';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM detalle_receta
        WHERE id_receta = p_id_receta_medica
    ) THEN
        RAISE EXCEPTION 'Receta sin detalle de medicamentos';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM (
            SELECT id_medicamento, SUM(duracion_dias) AS cantidad
            FROM detalle_receta
            WHERE id_receta = p_id_receta_medica
            GROUP BY id_medicamento
        ) req
        JOIN medicamentos m ON m.id_medicamento = req.id_medicamento
        WHERE m.stock < req.cantidad
    ) THEN
        RAISE EXCEPTION 'Stock insuficiente para surtir receta';
    END IF;

    UPDATE medicamentos m
    SET stock = m.stock - req.cantidad
    FROM (
        SELECT id_medicamento, SUM(duracion_dias) AS cantidad
        FROM detalle_receta
        WHERE id_receta = p_id_receta_medica
        GROUP BY id_medicamento
    ) req
    WHERE m.id_medicamento = req.id_medicamento;

    UPDATE recetas
    SET dispensada = TRUE,
        fecha_dispensacion = NOW()
    WHERE id_receta = p_id_receta_medica;
END;
$$;

-- Updated signature used by backend now: (id_pac, folio, subtotal, iva)
CREATE OR REPLACE PROCEDURE generar_factura_consulta(
    p_id_pac INTEGER,
    p_folio_fact VARCHAR,
    p_subtotal NUMERIC,
    p_iva NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_subtotal < 0 OR p_iva < 0 THEN
        RAISE EXCEPTION 'Montos invalidos para factura';
    END IF;

    INSERT INTO facturas (id_paciente, folio, subtotal, iva, total, estado)
    VALUES (p_id_pac, p_folio_fact, p_subtotal, p_iva, 0, 'Pendiente');
END;
$$;

CREATE OR REPLACE PROCEDURE registrar_pago_factura(
    p_id_fact INTEGER,
    p_metodo VARCHAR,
    p_monto NUMERIC,
    p_id_user INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM facturas
        WHERE id_factura = p_id_fact
    ) THEN
        RAISE EXCEPTION 'Factura no existe';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM facturas
        WHERE id_factura = p_id_fact
          AND estado = 'Cancelada'
    ) THEN
        RAISE EXCEPTION 'Factura cancelada no puede pagarse';
    END IF;

    INSERT INTO pagos (id_factura, metodo_pago, monto, id_usuario)
    VALUES (p_id_fact, p_metodo, p_monto, p_id_user);

    UPDATE facturas
    SET estado = 'Pagada',
        fecha_pago = NOW()
    WHERE id_factura = p_id_fact;
END;
$$;

-- ============================================================
-- Views consumed by report endpoints (Block 2)
-- ============================================================

CREATE OR REPLACE VIEW vw_ocupacion_camas AS
SELECT
    h.id_hospitalizacion,
    h.cama,
    h.fecha_ingreso,
    p.id_paciente,
    p.nombre AS nombre_paciente,
    p.apellido_paterno AS apellido_paciente,
    m.id_medico,
    m.nombre AS nombre_medico,
    m.apellido_paterno AS apellido_medico
FROM hospitalizaciones h
JOIN pacientes p ON p.id_paciente = h.id_paciente
JOIN medicos m ON m.id_medico = h.id_medico
WHERE h.fecha_alta IS NULL;

CREATE OR REPLACE VIEW vw_historial_consultas AS
SELECT
    c.id_consulta,
    c.fecha_hora,
    ec.nombre AS estado,
    c.diagnostico,
    p.id_paciente,
    p.nombre AS nombre_paciente,
    p.apellido_paterno AS apellido_paciente,
    m.id_medico,
    m.nombre AS nombre_medico,
    m.apellido_paterno AS apellido_medico
FROM consultas c
JOIN pacientes p ON p.id_paciente = c.id_paciente
JOIN medicos m ON m.id_medico = c.id_medico
JOIN estados_consulta ec ON ec.id_estado = c.id_estado;

CREATE OR REPLACE VIEW vw_inventario_farmacia AS
SELECT
    id_medicamento,
    nombre_generico,
    nombre_comercial,
    presentacion,
    stock,
    precio_unitario
FROM medicamentos
ORDER BY stock ASC;

-- Optional but used by existing report endpoint.
CREATE OR REPLACE VIEW vw_facturacion_mensual AS
SELECT
    EXTRACT(YEAR FROM p.fecha_pago) AS anio,
    EXTRACT(MONTH FROM p.fecha_pago) AS mes,
    SUM(p.monto) AS total_cobrado
FROM pagos p
GROUP BY EXTRACT(YEAR FROM p.fecha_pago), EXTRACT(MONTH FROM p.fecha_pago)
ORDER BY anio, mes;

-- ============================================================
-- Grants needed by backend endpoints
-- ============================================================

-- Procedure execution grants
GRANT EXECUTE ON PROCEDURE registrar_nueva_consulta(INTEGER, INTEGER, INTEGER, TIMESTAMP, TEXT)
TO rol_admin_sigeh, rol_usuario_general_sigeh;

GRANT EXECUTE ON PROCEDURE procesar_alta_hospitalaria(INTEGER, TEXT)
TO rol_admin_sigeh, rol_medico_sigeh;

GRANT EXECUTE ON PROCEDURE surtir_receta_farmacia(INTEGER)
TO rol_admin_sigeh;

GRANT EXECUTE ON PROCEDURE generar_factura_consulta(INTEGER, VARCHAR, NUMERIC, NUMERIC)
TO rol_admin_sigeh, rol_usuario_general_sigeh;

GRANT EXECUTE ON PROCEDURE registrar_pago_factura(INTEGER, VARCHAR, NUMERIC, INTEGER)
TO rol_admin_sigeh, rol_usuario_general_sigeh;

-- View and table access grants used by report/audit endpoints
GRANT SELECT ON vw_ocupacion_camas, vw_historial_consultas, vw_inventario_farmacia, vw_facturacion_mensual
TO rol_admin_sigeh;

GRANT SELECT, INSERT ON respaldos_realizados
TO rol_admin_sigeh;

COMMIT;

-- ============================================================
-- Notes:
-- 1) No ALTER TABLE required for this sync.
-- 2) No DROP statements included to avoid data/object loss.
-- 3) If old 3-arg generar_factura_consulta exists, it is left intact on purpose
--    (backward compatibility); backend now calls 4-arg signature.
-- ============================================================
