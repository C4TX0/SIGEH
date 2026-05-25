-- ============================================================
-- SIGEH incremental patch for partially built sigeh_db
-- Creates only missing tables (safe for existing populated DB)
-- NO database creation, NO tablespace creation, NO drops, NO deletes.
-- ============================================================

BEGIN;

SET LOCAL search_path = public;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '120s';

-- ------------------------------------------------------------
-- 1) Missing table: auditoria_cambios
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auditoria_cambios (
    id_auditoria BIGSERIAL NOT NULL,
    tabla_afectada VARCHAR(60) NOT NULL,
    id_registro INTEGER NOT NULL,
    campo_modificado VARCHAR(80) NOT NULL,
    valor_anterior TEXT,
    valor_nuevo TEXT,
    id_usuario INTEGER,
    fecha_hora TIMESTAMP NOT NULL DEFAULT NOW(),
    operacion VARCHAR(10) NOT NULL,
    CONSTRAINT auditoria_cambios_pkey PRIMARY KEY (id_auditoria),
    CONSTRAINT fk_auditoria_cambios_usuarios FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_auditoria_cambios_operacion CHECK (operacion IN ('INSERT', 'UPDATE', 'DELETE'))
);

-- ------------------------------------------------------------
-- 2) Missing table: facturas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS facturas (
    id_factura SERIAL NOT NULL,
    id_paciente INTEGER NOT NULL,
    folio VARCHAR(30) NOT NULL,
    fecha_emision TIMESTAMP NOT NULL DEFAULT NOW(),
    subtotal NUMERIC(10,2) NOT NULL,
    iva NUMERIC(10,2) NOT NULL DEFAULT 0,
    total NUMERIC(10,2) NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'Pendiente',
    fecha_pago TIMESTAMP,
    CONSTRAINT facturas_pkey PRIMARY KEY (id_factura),
    CONSTRAINT facturas_folio_key UNIQUE (folio),
    CONSTRAINT fk_facturas_pacientes FOREIGN KEY (id_paciente)
        REFERENCES pacientes(id_paciente) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_facturas_subtotal CHECK (subtotal >= 0),
    CONSTRAINT chk_facturas_iva CHECK (iva >= 0),
    CONSTRAINT chk_facturas_total CHECK (total > 0),
    CONSTRAINT chk_facturas_estado CHECK (estado IN ('Pendiente', 'Pagada', 'Cancelada'))
);

-- ------------------------------------------------------------
-- 3) Missing table: pagos (depends on facturas)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pagos (
    id_pago SERIAL NOT NULL,
    id_factura INTEGER NOT NULL,
    metodo_pago VARCHAR(50) NOT NULL,
    monto NUMERIC(10,2) NOT NULL,
    fecha_pago TIMESTAMP NOT NULL DEFAULT NOW(),
    referencia VARCHAR(100),
    id_usuario INTEGER NOT NULL,
    CONSTRAINT pagos_pkey PRIMARY KEY (id_pago),
    CONSTRAINT fk_pagos_facturas FOREIGN KEY (id_factura)
        REFERENCES facturas(id_factura) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_pagos_usuarios FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_pagos_monto CHECK (monto > 0)
);

-- ------------------------------------------------------------
-- 4) Missing table: respaldos_realizados
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS respaldos_realizados (
    id_respaldo SERIAL NOT NULL,
    tipo_respaldo VARCHAR(30) NOT NULL,
    fecha_inicio TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_fin TIMESTAMP,
    tamanio_mb NUMERIC(10,2),
    ruta_archivo TEXT NOT NULL,
    estado VARCHAR(30) NOT NULL,
    id_usuario INTEGER NOT NULL,
    CONSTRAINT respaldos_realizados_pkey PRIMARY KEY (id_respaldo),
    CONSTRAINT fk_respaldos_realizados_usuarios FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_respaldos_realizados_tipo CHECK (tipo_respaldo IN ('completo', 'incremental', 'diferencial')),
    CONSTRAINT chk_respaldos_realizados_estado CHECK (estado IN ('Exitoso', 'Fallido', 'En proceso')),
    CONSTRAINT chk_respaldos_realizados_tamanio CHECK (tamanio_mb IS NULL OR tamanio_mb >= 0),
    CONSTRAINT chk_respaldos_realizados_fechas CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
);

-- ------------------------------------------------------------
-- 5) Missing table: estudios_laboratorio
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS estudios_laboratorio (
    id_estudio SERIAL NOT NULL,
    id_consulta INTEGER NOT NULL,
    id_laboratorio INTEGER NOT NULL,
    id_medico INTEGER NOT NULL,
    fecha_solicitud TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_resultado TIMESTAMP,
    resultado TEXT,
    observaciones TEXT,
    estado VARCHAR(30) NOT NULL DEFAULT 'Solicitado',
    CONSTRAINT estudios_laboratorio_pkey PRIMARY KEY (id_estudio),
    CONSTRAINT fk_estudios_laboratorio_consultas FOREIGN KEY (id_consulta)
        REFERENCES consultas(id_consulta) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_estudios_laboratorio_laboratorios FOREIGN KEY (id_laboratorio)
        REFERENCES laboratorios(id_laboratorio) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_estudios_laboratorio_medicos FOREIGN KEY (id_medico)
        REFERENCES medicos(id_medico) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_estudios_laboratorio_estado CHECK (estado IN ('Solicitado', 'En proceso', 'Completado', 'Cancelado')),
    CONSTRAINT chk_estudios_laboratorio_fechas CHECK (fecha_resultado IS NULL OR fecha_resultado >= fecha_solicitud)
);

-- ------------------------------------------------------------
-- 6) Important indexes (safe/idempotent)
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_estudios_laboratorio_id_consulta ON estudios_laboratorio(id_consulta);
CREATE INDEX IF NOT EXISTS idx_estudios_laboratorio_id_medico ON estudios_laboratorio(id_medico);
CREATE INDEX IF NOT EXISTS idx_facturas_folio ON facturas(folio);

-- Existing table index from original schema; kept idempotent
CREATE INDEX IF NOT EXISTS idx_bitacora_accesos_fecha_hora ON bitacora_accesos(fecha_hora);

-- ------------------------------------------------------------
-- 7) Grants aligned with original SIGEH permissions
-- ------------------------------------------------------------
GRANT ALL PRIVILEGES ON TABLE facturas, pagos, auditoria_cambios, respaldos_realizados, estudios_laboratorio TO rol_admin_sigeh;

GRANT SELECT ON estudios_laboratorio TO rol_medico_sigeh, rol_usuario_general_sigeh;
GRANT INSERT, UPDATE ON estudios_laboratorio TO rol_medico_sigeh;

GRANT SELECT ON facturas, pagos TO rol_usuario_general_sigeh;
GRANT INSERT, UPDATE ON facturas, pagos TO rol_usuario_general_sigeh;

GRANT SELECT, INSERT ON auditoria_cambios TO rol_medico_sigeh, rol_usuario_general_sigeh;
GRANT SELECT, INSERT ON respaldos_realizados TO rol_admin_sigeh;

-- Sequence grants for new serial/bigserial sequences
GRANT USAGE, SELECT ON SEQUENCE facturas_id_factura_seq TO rol_admin_sigeh, rol_usuario_general_sigeh;
GRANT USAGE, SELECT ON SEQUENCE pagos_id_pago_seq TO rol_admin_sigeh, rol_usuario_general_sigeh;
GRANT USAGE, SELECT ON SEQUENCE estudios_laboratorio_id_estudio_seq TO rol_admin_sigeh, rol_medico_sigeh, rol_usuario_general_sigeh;
GRANT USAGE, SELECT ON SEQUENCE auditoria_cambios_id_auditoria_seq TO rol_admin_sigeh, rol_medico_sigeh, rol_usuario_general_sigeh;
GRANT USAGE, SELECT ON SEQUENCE respaldos_realizados_id_respaldo_seq TO rol_admin_sigeh;

COMMIT;

-- ============================================================
-- Post-apply dependency note:
-- After this patch, migration `2026-05-23_sync_block1_block2.sql`
-- can execute correctly because required tables now exist:
-- facturas, pagos, auditoria_cambios, respaldos_realizados, estudios_laboratorio.
-- ============================================================
