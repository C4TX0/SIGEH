-- ============================================================
-- SIGEH - Sistema Integral de Gestion Hospitalaria
-- Script DDL para PostgreSQL con TABLESPACES explicitos
-- Modelo relacional normalizado con 20 tablas
--
-- Requisitos previos antes de ejecutar este archivo:
-- 1) Crear carpetas fisicas:
--    C:/sigeh/ts_datos
--    C:/sigeh/ts_index
--    C:/sigeh/ts_logs
--    C:/sigeh/ts_backup
-- 2) Dar permisos de lectura/escritura/modificar a SERVICIO DE RED
-- 3) Crear tablespaces desde la base postgres:
CREATE TABLESPACE ts_datos  LOCATION 'C:/sigeh/ts_datos';
CREATE TABLESPACE ts_index  LOCATION 'C:/sigeh/ts_index';
CREATE TABLESPACE ts_logs   LOCATION 'C:/sigeh/ts_logs';
CREATE TABLESPACE ts_backup LOCATION 'C:/sigeh/ts_backup';
-- 4) Crear base de datos:
CREATE DATABASE sigeh_db WITH OWNER = postgres ENCODING = 'UTF8' TABLESPACE = ts_datos;

-- 5) Conectarse a sigeh_db y ejecutar este script.
-- ============================================================

-- ============================================================
-- 0. Roles y permisos
-- ============================================================
-- 1. Creación de Roles [cite: 964]
CREATE ROLE rol_admin_sigeh;
CREATE ROLE rol_medico_sigeh;
CREATE ROLE rol_usuario_general_sigeh;

-- 2. Creación de Usuarios con contraseña [cite: 964]
CREATE USER admin_sigeh            WITH PASSWORD 'AdminSIGEH2025';
CREATE USER medico_sigeh           WITH PASSWORD 'MedicoSIGEH2025';
CREATE USER usuario_general_sigeh  WITH PASSWORD 'UsuarioSIGEH2025';

-- 3. Asociación de Usuarios a Roles [cite: 964]
GRANT rol_admin_sigeh           TO admin_sigeh;
GRANT rol_medico_sigeh          TO medico_sigeh;
GRANT rol_usuario_general_sigeh TO usuario_general_sigeh;

-- 4. Permisos de Conexión y Uso de Esquema (para todos los roles) [cite: 966]
GRANT CONNECT ON DATABASE sigeh_db TO rol_admin_sigeh, rol_medico_sigeh, rol_usuario_general_sigeh;
GRANT USAGE ON SCHEMA public TO rol_admin_sigeh, rol_medico_sigeh, rol_usuario_general_sigeh;

-- 5. Permisos del Administrador (Acceso Total) [cite: 966]
GRANT ALL PRIVILEGES ON ALL TABLES    IN SCHEMA public TO rol_admin_sigeh;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rol_admin_sigeh;

-- 6. Permisos del Médico (Lectura clínica + Escritura operativa) [cite: 966]
GRANT SELECT ON pacientes, tipos_sangre, medicos, especialidades,
    consultas, estados_consulta, expedientes, hospitalizaciones,
    recetas, detalle_receta, medicamentos, estudios_laboratorio, laboratorios
    TO rol_medico_sigeh;

GRANT INSERT, UPDATE ON pacientes, consultas, expedientes, recetas,
    detalle_receta, estudios_laboratorio TO rol_medico_sigeh;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO rol_medico_sigeh;

-- 7. Permisos del Usuario General (Recepcionista/Administrativo) [cite: 899, 901]
GRANT SELECT ON pacientes, medicos, especialidades, consultas, estados_consulta,
    facturas, pagos, medicamentos, laboratorios, estudios_laboratorio
    TO rol_usuario_general_sigeh;

GRANT INSERT, UPDATE ON pacientes, consultas, facturas, pagos
    TO rol_usuario_general_sigeh;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO rol_usuario_general_sigeh;

-- ============================================================
-- 1. TABLAS DE CATALOGO - TABLESPACE ts_datos
-- ============================================================

CREATE TABLE especialidades (
    id_especialidad SERIAL NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT especialidades_pkey PRIMARY KEY (id_especialidad) USING INDEX TABLESPACE ts_index,
    CONSTRAINT especialidades_nombre_key UNIQUE (nombre) USING INDEX TABLESPACE ts_index
) TABLESPACE ts_datos;

CREATE TABLE tipos_sangre (
    id_tipo_sangre SERIAL NOT NULL,
    nombre VARCHAR(5) NOT NULL,
    descripcion TEXT,
    CONSTRAINT tipos_sangre_pkey PRIMARY KEY (id_tipo_sangre) USING INDEX TABLESPACE ts_index,
    CONSTRAINT tipos_sangre_nombre_key UNIQUE (nombre) USING INDEX TABLESPACE ts_index
) TABLESPACE ts_datos;

CREATE TABLE laboratorios (
    id_laboratorio SERIAL NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    descripcion TEXT,
    unidad_referencia VARCHAR(50),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT laboratorios_pkey PRIMARY KEY (id_laboratorio) USING INDEX TABLESPACE ts_index,
    CONSTRAINT laboratorios_nombre_key UNIQUE (nombre) USING INDEX TABLESPACE ts_index
) TABLESPACE ts_datos;

CREATE TABLE medicamentos (
    id_medicamento SERIAL NOT NULL,
    nombre_generico VARCHAR(120) NOT NULL,
    nombre_comercial VARCHAR(120),
    presentacion VARCHAR(100) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    precio_unitario NUMERIC(10,2) NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT medicamentos_pkey PRIMARY KEY (id_medicamento) USING INDEX TABLESPACE ts_index,
    CONSTRAINT chk_medicamentos_stock CHECK (stock >= 0),
    CONSTRAINT chk_medicamentos_precio_unitario CHECK (precio_unitario >= 0)
) TABLESPACE ts_datos;

CREATE TABLE estados_consulta (
    id_estado SERIAL NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT,
    CONSTRAINT estados_consulta_pkey PRIMARY KEY (id_estado) USING INDEX TABLESPACE ts_index,
    CONSTRAINT estados_consulta_nombre_key UNIQUE (nombre) USING INDEX TABLESPACE ts_index
) TABLESPACE ts_datos;

CREATE TABLE roles (
    id_rol SERIAL NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT roles_pkey PRIMARY KEY (id_rol) USING INDEX TABLESPACE ts_index,
    CONSTRAINT roles_nombre_key UNIQUE (nombre) USING INDEX TABLESPACE ts_index
) TABLESPACE ts_datos;

-- ============================================================
-- 2. TABLAS OPERATIVAS Y DE SEGURIDAD BASE - TABLESPACE ts_datos
-- ============================================================

CREATE TABLE pacientes (
    id_paciente SERIAL NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido_paterno VARCHAR(80) NOT NULL,
    apellido_materno VARCHAR(80),
    fecha_nacimiento DATE NOT NULL,
    curp CHAR(18) NOT NULL,
    telefono VARCHAR(15),
    correo_electronico VARCHAR(120),
    id_tipo_sangre INTEGER,
    alergias TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_registro TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT pacientes_pkey PRIMARY KEY (id_paciente) USING INDEX TABLESPACE ts_index,
    CONSTRAINT pacientes_curp_key UNIQUE (curp) USING INDEX TABLESPACE ts_index,
    CONSTRAINT fk_pacientes_tipos_sangre FOREIGN KEY (id_tipo_sangre)
        REFERENCES tipos_sangre(id_tipo_sangre) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_pacientes_fecha_nacimiento CHECK (fecha_nacimiento < CURRENT_DATE),
    CONSTRAINT chk_pacientes_curp_longitud CHECK (char_length(curp) = 18)
) TABLESPACE ts_datos;

CREATE TABLE medicos (
    id_medico SERIAL NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido_paterno VARCHAR(80) NOT NULL,
    apellido_materno VARCHAR(80),
    cedula_profesional VARCHAR(10) NOT NULL,
    id_especialidad INTEGER NOT NULL,
    telefono VARCHAR(15),
    correo_electronico VARCHAR(120),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT medicos_pkey PRIMARY KEY (id_medico) USING INDEX TABLESPACE ts_index,
    CONSTRAINT medicos_cedula_profesional_key UNIQUE (cedula_profesional) USING INDEX TABLESPACE ts_index,
    CONSTRAINT fk_medicos_especialidades FOREIGN KEY (id_especialidad)
        REFERENCES especialidades(id_especialidad) ON DELETE RESTRICT ON UPDATE CASCADE
) TABLESPACE ts_datos;

CREATE TABLE usuarios (
    id_usuario SERIAL NOT NULL,
    username VARCHAR(60) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    id_rol INTEGER NOT NULL,
    id_medico INTEGER,
    intentos_fallidos SMALLINT NOT NULL DEFAULT 0,
    bloqueado BOOLEAN NOT NULL DEFAULT FALSE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_ultimo_acceso TIMESTAMP,
    CONSTRAINT usuarios_pkey PRIMARY KEY (id_usuario) USING INDEX TABLESPACE ts_index,
    CONSTRAINT usuarios_username_key UNIQUE (username) USING INDEX TABLESPACE ts_index,
    CONSTRAINT fk_usuarios_roles FOREIGN KEY (id_rol)
        REFERENCES roles(id_rol) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_usuarios_medicos FOREIGN KEY (id_medico)
        REFERENCES medicos(id_medico) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_usuarios_intentos_fallidos CHECK (intentos_fallidos >= 0 AND intentos_fallidos <= 5)
) TABLESPACE ts_datos;

-- ============================================================
-- 3. TABLAS CLINICAS Y OPERATIVAS - TABLESPACE ts_datos
-- ============================================================

CREATE TABLE consultas (
    id_consulta SERIAL NOT NULL,
    id_paciente INTEGER NOT NULL,
    id_medico INTEGER NOT NULL,
    id_estado INTEGER NOT NULL,
    fecha_hora TIMESTAMP NOT NULL,
    motivo TEXT NOT NULL,
    diagnostico TEXT,
    notas TEXT,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT consultas_pkey PRIMARY KEY (id_consulta) USING INDEX TABLESPACE ts_index,
    CONSTRAINT fk_consultas_pacientes FOREIGN KEY (id_paciente)
        REFERENCES pacientes(id_paciente) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_consultas_medicos FOREIGN KEY (id_medico)
        REFERENCES medicos(id_medico) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_consultas_estados_consulta FOREIGN KEY (id_estado)
        REFERENCES estados_consulta(id_estado) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT uq_consultas_paciente_fecha UNIQUE (id_paciente, fecha_hora) USING INDEX TABLESPACE ts_index,
    CONSTRAINT uq_consultas_medico_fecha UNIQUE (id_medico, fecha_hora) USING INDEX TABLESPACE ts_index
) TABLESPACE ts_datos;

CREATE TABLE expedientes (
    id_expediente SERIAL NOT NULL,
    id_paciente INTEGER NOT NULL,
    antecedentes_heredo TEXT,
    antecedentes_personales TEXT,
    antecedentes_quirurgicos TEXT,
    fecha_apertura TIMESTAMP NOT NULL DEFAULT NOW(),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT expedientes_pkey PRIMARY KEY (id_expediente) USING INDEX TABLESPACE ts_index,
    CONSTRAINT expedientes_id_paciente_key UNIQUE (id_paciente) USING INDEX TABLESPACE ts_index,
    CONSTRAINT fk_expedientes_pacientes FOREIGN KEY (id_paciente)
        REFERENCES pacientes(id_paciente) ON DELETE RESTRICT ON UPDATE CASCADE
) TABLESPACE ts_datos;

CREATE TABLE hospitalizaciones (
    id_hospitalizacion SERIAL NOT NULL,
    id_paciente INTEGER NOT NULL,
    id_medico INTEGER NOT NULL,
    cama VARCHAR(20) NOT NULL,
    fecha_ingreso TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_alta TIMESTAMP,
    diagnostico_ingreso TEXT NOT NULL,
    diagnostico_egreso TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT hospitalizaciones_pkey PRIMARY KEY (id_hospitalizacion) USING INDEX TABLESPACE ts_index,
    CONSTRAINT fk_hospitalizaciones_pacientes FOREIGN KEY (id_paciente)
        REFERENCES pacientes(id_paciente) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_hospitalizaciones_medicos FOREIGN KEY (id_medico)
        REFERENCES medicos(id_medico) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_hospitalizaciones_fechas CHECK (fecha_alta IS NULL OR fecha_alta >= fecha_ingreso)
) TABLESPACE ts_datos;

CREATE TABLE recetas (
    id_receta SERIAL NOT NULL,
    id_consulta INTEGER NOT NULL,
    id_medico INTEGER NOT NULL,
    fecha_emision TIMESTAMP NOT NULL DEFAULT NOW(),
    dispensada BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_dispensacion TIMESTAMP,
    observaciones TEXT,
    CONSTRAINT recetas_pkey PRIMARY KEY (id_receta) USING INDEX TABLESPACE ts_index,
    CONSTRAINT fk_recetas_consultas FOREIGN KEY (id_consulta)
        REFERENCES consultas(id_consulta) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_recetas_medicos FOREIGN KEY (id_medico)
        REFERENCES medicos(id_medico) ON DELETE RESTRICT ON UPDATE CASCADE
) TABLESPACE ts_datos;

CREATE TABLE detalle_receta (
    id_detalle SERIAL NOT NULL,
    id_receta INTEGER NOT NULL,
    id_medicamento INTEGER NOT NULL,
    dosis VARCHAR(50) NOT NULL,
    unidad_dosis VARCHAR(20) NOT NULL,
    frecuencia VARCHAR(100) NOT NULL,
    duracion_dias INTEGER NOT NULL,
    indicaciones TEXT,
    CONSTRAINT detalle_receta_pkey PRIMARY KEY (id_detalle) USING INDEX TABLESPACE ts_index,
    CONSTRAINT fk_detalle_receta_recetas FOREIGN KEY (id_receta)
        REFERENCES recetas(id_receta) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_detalle_receta_medicamentos FOREIGN KEY (id_medicamento)
        REFERENCES medicamentos(id_medicamento) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_detalle_receta_duracion CHECK (duracion_dias > 0)
) TABLESPACE ts_datos;

CREATE TABLE estudios_laboratorio (
    id_estudio SERIAL NOT NULL,
    id_consulta INTEGER NOT NULL,
    id_laboratorio INTEGER NOT NULL,
    id_medico INTEGER NOT NULL,
    fecha_solicitud TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_resultado TIMESTAMP,
    resultado TEXT,
    observaciones TEXT,
    estado VARCHAR(30) NOT NULL DEFAULT 'Solicitado',
    CONSTRAINT estudios_laboratorio_pkey PRIMARY KEY (id_estudio) USING INDEX TABLESPACE ts_index,
    CONSTRAINT fk_estudios_laboratorio_consultas FOREIGN KEY (id_consulta)
        REFERENCES consultas(id_consulta) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_estudios_laboratorio_laboratorios FOREIGN KEY (id_laboratorio)
        REFERENCES laboratorios(id_laboratorio) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_estudios_laboratorio_medicos FOREIGN KEY (id_medico)
        REFERENCES medicos(id_medico) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_estudios_laboratorio_estado CHECK (estado IN ('Solicitado', 'En proceso', 'Completado', 'Cancelado')),
    CONSTRAINT chk_estudios_laboratorio_fechas CHECK (fecha_resultado IS NULL OR fecha_resultado >= fecha_solicitud)
) TABLESPACE ts_datos;

CREATE TABLE facturas (
    id_factura SERIAL NOT NULL,
    id_paciente INTEGER NOT NULL,
    folio VARCHAR(30) NOT NULL,
    fecha_emision TIMESTAMP NOT NULL DEFAULT NOW(),
    subtotal NUMERIC(10,2) NOT NULL,
    iva NUMERIC(10,2) NOT NULL DEFAULT 0,
    total NUMERIC(10,2) NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'Pendiente',
    fecha_pago TIMESTAMP,
    CONSTRAINT facturas_pkey PRIMARY KEY (id_factura) USING INDEX TABLESPACE ts_index,
    CONSTRAINT facturas_folio_key UNIQUE (folio) USING INDEX TABLESPACE ts_index,
    CONSTRAINT fk_facturas_pacientes FOREIGN KEY (id_paciente)
        REFERENCES pacientes(id_paciente) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_facturas_subtotal CHECK (subtotal >= 0),
    CONSTRAINT chk_facturas_iva CHECK (iva >= 0),
    CONSTRAINT chk_facturas_total CHECK (total > 0),
    CONSTRAINT chk_facturas_estado CHECK (estado IN ('Pendiente', 'Pagada', 'Cancelada'))
) TABLESPACE ts_datos;

CREATE TABLE pagos (
    id_pago SERIAL NOT NULL,
    id_factura INTEGER NOT NULL,
    metodo_pago VARCHAR(50) NOT NULL,
    monto NUMERIC(10,2) NOT NULL,
    fecha_pago TIMESTAMP NOT NULL DEFAULT NOW(),
    referencia VARCHAR(100),
    id_usuario INTEGER NOT NULL,
    CONSTRAINT pagos_pkey PRIMARY KEY (id_pago) USING INDEX TABLESPACE ts_index,
    CONSTRAINT fk_pagos_facturas FOREIGN KEY (id_factura)
        REFERENCES facturas(id_factura) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_pagos_usuarios FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_pagos_monto CHECK (monto > 0)
) TABLESPACE ts_datos;

-- ============================================================
-- 4. TABLAS DE AUDITORIA Y ADMINISTRACION
--    bitacora/auditoria => ts_logs
--    respaldos          => ts_backup
-- ============================================================

CREATE TABLE bitacora_accesos (
    id_bitacora BIGSERIAL NOT NULL,
    id_usuario INTEGER,
    username_intento VARCHAR(60) NOT NULL,
    fecha_hora TIMESTAMP NOT NULL DEFAULT NOW(),
    ip_origen VARCHAR(45),
    tipo_evento VARCHAR(30) NOT NULL,
    exito BOOLEAN NOT NULL,
    descripcion TEXT,
    CONSTRAINT bitacora_accesos_pkey PRIMARY KEY (id_bitacora) USING INDEX TABLESPACE ts_index,
    CONSTRAINT fk_bitacora_accesos_usuarios FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_bitacora_accesos_tipo_evento CHECK (tipo_evento IN ('LOGIN_OK', 'LOGIN_FAIL', 'LOGOUT', 'BLOQUEO'))
) TABLESPACE ts_logs;

CREATE TABLE auditoria_cambios (
    id_auditoria BIGSERIAL NOT NULL,
    tabla_afectada VARCHAR(60) NOT NULL,
    id_registro INTEGER NOT NULL,
    campo_modificado VARCHAR(80) NOT NULL,
    valor_anterior TEXT,
    valor_nuevo TEXT,
    id_usuario INTEGER,
    fecha_hora TIMESTAMP NOT NULL DEFAULT NOW(),
    operacion VARCHAR(10) NOT NULL,
    CONSTRAINT auditoria_cambios_pkey PRIMARY KEY (id_auditoria) USING INDEX TABLESPACE ts_index,
    CONSTRAINT fk_auditoria_cambios_usuarios FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_auditoria_cambios_operacion CHECK (operacion IN ('INSERT', 'UPDATE', 'DELETE'))
) TABLESPACE ts_logs;

CREATE TABLE respaldos_realizados (
    id_respaldo SERIAL NOT NULL,
    tipo_respaldo VARCHAR(30) NOT NULL,
    fecha_inicio TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_fin TIMESTAMP,
    tamanio_mb NUMERIC(10,2),
    ruta_archivo TEXT NOT NULL,
    estado VARCHAR(30) NOT NULL,
    id_usuario INTEGER NOT NULL,
    CONSTRAINT respaldos_realizados_pkey PRIMARY KEY (id_respaldo) USING INDEX TABLESPACE ts_index,
    CONSTRAINT fk_respaldos_realizados_usuarios FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_respaldos_realizados_tipo CHECK (tipo_respaldo IN ('completo', 'incremental', 'diferencial')),
    CONSTRAINT chk_respaldos_realizados_estado CHECK (estado IN ('Exitoso', 'Fallido', 'En proceso')),
    CONSTRAINT chk_respaldos_realizados_tamanio CHECK (tamanio_mb IS NULL OR tamanio_mb >= 0),
    CONSTRAINT chk_respaldos_realizados_fechas CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
) TABLESPACE ts_backup;

-- ============================================================
-- 5. INDICES CANDIDATOS PARA BUSQUEDAS FRECUENTES - ts_index
-- ============================================================

CREATE INDEX idx_pacientes_curp ON pacientes(curp) TABLESPACE ts_index;
CREATE INDEX idx_pacientes_apellido_paterno ON pacientes(apellido_paterno) TABLESPACE ts_index;
CREATE INDEX idx_consultas_fecha_hora ON consultas(fecha_hora) TABLESPACE ts_index;
CREATE INDEX idx_consultas_id_medico ON consultas(id_medico) TABLESPACE ts_index;
CREATE INDEX idx_consultas_id_paciente ON consultas(id_paciente) TABLESPACE ts_index;
CREATE INDEX idx_estudios_laboratorio_id_consulta ON estudios_laboratorio(id_consulta) TABLESPACE ts_index;
CREATE INDEX idx_estudios_laboratorio_id_medico ON estudios_laboratorio(id_medico) TABLESPACE ts_index;
CREATE INDEX idx_facturas_folio ON facturas(folio) TABLESPACE ts_index;
CREATE INDEX idx_bitacora_accesos_fecha_hora ON bitacora_accesos(fecha_hora) TABLESPACE ts_index;
CREATE INDEX idx_usuarios_username ON usuarios(username) TABLESPACE ts_index;
CREATE INDEX idx_hospitalizaciones_activo ON hospitalizaciones(activo) TABLESPACE ts_index;

-- ============================================================
-- 6. DATOS BASE SUGERIDOS PARA CATALOGOS
-- ============================================================

INSERT INTO tipos_sangre (nombre, descripcion) VALUES
('A+', 'Grupo sanguineo A positivo'),
('A-', 'Grupo sanguineo A negativo'),
('B+', 'Grupo sanguineo B positivo'),
('B-', 'Grupo sanguineo B negativo'),
('AB+', 'Grupo sanguineo AB positivo'),
('AB-', 'Grupo sanguineo AB negativo'),
('O+', 'Grupo sanguineo O positivo'),
('O-', 'Grupo sanguineo O negativo');

INSERT INTO especialidades (nombre, descripcion) VALUES
('Medicina General', 'Atencion primaria y medicina familiar'),
('Pediatria', 'Atencion medica a ninos y adolescentes'),
('Ginecologia', 'Salud reproductiva y atencion a la mujer'),
('Cardiologia', 'Enfermedades del corazon'),
('Traumatologia', 'Lesiones y sistema musculoesqueletico'),
('Neurologia', 'Sistema nervioso y trastornos neurologicos'),
('Dermatologia', 'Enfermedades de la piel'),
('Oftalmologia', 'Salud visual y ocular'),
('Otorrinolaringologia', 'Oido, nariz y garganta'),
('Psiquiatria', 'Salud mental');

INSERT INTO estados_consulta (nombre, descripcion) VALUES
('Programada', 'Consulta registrada en agenda'),
('En atencion', 'Consulta actualmente en proceso'),
('Atendida', 'Consulta finalizada con registro medico'),
('Cancelada', 'Consulta cancelada'),
('Reprogramada', 'Consulta modificada a nueva fecha u horario');

INSERT INTO roles (nombre, descripcion) VALUES
('ADMIN', 'Administrador general del sistema y de la base de datos'),
('MEDICO', 'Usuario medico con acceso a consultas, recetas y expedientes'),
('USUARIO_GENERAL', 'Usuario operativo para areas administrativas del hospital');

INSERT INTO medicamentos (nombre_generico, nombre_comercial, presentacion, stock, precio_unitario) VALUES
('Paracetamol', 'Tempra', 'Tabletas 500 mg', 120, 18.50),
('Ibuprofeno', 'Advil', 'Capsulas 400 mg', 80, 28.00),
('Amoxicilina', 'Amoxil', 'Capsulas 500 mg', 60, 55.00),
('Loratadina', 'Claritine', 'Tabletas 10 mg', 90, 22.00),
('Omeprazol', 'Losec', 'Capsulas 20 mg', 75, 35.00),
('Metformina', 'Glucophage', 'Tabletas 850 mg', 100, 42.00);

INSERT INTO laboratorios (nombre, descripcion, unidad_referencia) VALUES
('Biometria hematica', 'Conteo sanguineo completo', 'mg/dL'),
('Quimica sanguinea 6', 'Panel metabolico basico', 'mg/dL'),
('Glucosa', 'Glucosa en sangre', 'mg/dL'),
('Perfil lipidico', 'Colesterol total y fracciones', 'mg/dL'),
('EGO', 'Examen general de orina', 'mL'),
('Tiempos de coagulacion', 'PT y aPTT', 'seg');

-- ============================================================
-- 6.1 USUARIOS BASE POR ROL (APP)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO usuarios (username, password_hash, id_rol, activo)
VALUES
('admin', crypt('AdminSIGEH2025', gen_salt('bf')),
 (SELECT id_rol FROM roles WHERE nombre = 'ADMIN'), TRUE),
('medico', crypt('MedicoSIGEH2025', gen_salt('bf')),
 (SELECT id_rol FROM roles WHERE nombre = 'MEDICO'), TRUE),
('usuario_general', crypt('UsuarioSIGEH2025', gen_salt('bf')),
 (SELECT id_rol FROM roles WHERE nombre = 'USUARIO_GENERAL'), TRUE);

-- Crear expedientes para pacientes existentes que aun no lo tengan
INSERT INTO expedientes (id_paciente)
SELECT p.id_paciente
FROM pacientes p
LEFT JOIN expedientes e ON e.id_paciente = p.id_paciente
WHERE e.id_paciente IS NULL;

-- ============================================================
-- 7. PROCEDIMIENTOS ALMACENADOS (LOGICA INTERNA)
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
    START TRANSACTION;

    PERFORM 1
    FROM recetas
    WHERE id_receta = p_id_receta_medica
    FOR UPDATE;

    IF NOT FOUND THEN
        ROLLBACK;
        RAISE EXCEPTION 'Receta no existe';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM recetas
        WHERE id_receta = p_id_receta_medica
          AND dispensada = TRUE
    ) THEN
        ROLLBACK;
        RAISE EXCEPTION 'Receta ya fue dispensada';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM detalle_receta
        WHERE id_receta = p_id_receta_medica
    ) THEN
        ROLLBACK;
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
        ROLLBACK;
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

    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END;
$$;

CREATE OR REPLACE PROCEDURE generar_factura_consulta(
    p_id_pac INTEGER,
    p_folio_fact VARCHAR,
    p_importe NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO facturas (id_paciente, folio, subtotal, iva, total, estado)
    VALUES (p_id_pac, p_folio_fact, p_importe, 0, p_importe, 'Pendiente');
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
-- 8. VISTAS
-- ============================================================

CREATE OR REPLACE VIEW vw_expedientes_completos AS
SELECT
    p.id_paciente,
    p.nombre,
    p.apellido_paterno,
    p.apellido_materno,
    p.fecha_nacimiento,
    ts.nombre AS tipo_sangre,
    p.alergias,
    e.id_expediente,
    e.antecedentes_heredo,
    e.antecedentes_personales,
    e.antecedentes_quirurgicos,
    e.fecha_apertura,
    e.activo AS expediente_activo
FROM pacientes p
JOIN expedientes e ON e.id_paciente = p.id_paciente
LEFT JOIN tipos_sangre ts ON ts.id_tipo_sangre = p.id_tipo_sangre;

GRANT SELECT ON vw_expedientes_completos TO rol_medico_sigeh;

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

CREATE OR REPLACE VIEW vw_facturacion_mensual AS
SELECT
    EXTRACT(YEAR FROM p.fecha_pago) AS anio,
    EXTRACT(MONTH FROM p.fecha_pago) AS mes,
    SUM(p.monto) AS total_cobrado
FROM pagos p
GROUP BY EXTRACT(YEAR FROM p.fecha_pago), EXTRACT(MONTH FROM p.fecha_pago)
ORDER BY anio, mes;

-- ============================================================
-- 9. TRIGGERS OPERATIVOS
-- ============================================================

CREATE OR REPLACE FUNCTION fn_auditar_cambios()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_pk_col TEXT := TG_ARGV[0];
    v_id_registro INTEGER;
    v_old JSONB;
    v_new JSONB;
    v_key TEXT;
    v_old_val TEXT;
    v_new_val TEXT;
    v_user_id_text TEXT;
    v_user_id INTEGER;
BEGIN
    v_user_id_text := current_setting('sigeh.usuario_id', true);
    v_user_id := NULLIF(v_user_id_text, '')::INTEGER;

    IF TG_OP = 'INSERT' THEN
        v_new := to_jsonb(NEW);
        v_id_registro := (v_new ->> v_pk_col)::INTEGER;

        FOR v_key, v_new_val IN SELECT key, value FROM jsonb_each_text(v_new)
        LOOP
            INSERT INTO auditoria_cambios (
                tabla_afectada, id_registro, campo_modificado,
                valor_anterior, valor_nuevo, id_usuario,
                fecha_hora, operacion
            ) VALUES (
                TG_TABLE_NAME, v_id_registro, v_key,
                NULL, v_new_val, v_user_id,
                NOW(), 'INSERT'
            );
        END LOOP;

        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        v_old := to_jsonb(OLD);
        v_id_registro := (v_old ->> v_pk_col)::INTEGER;

        FOR v_key, v_old_val IN SELECT key, value FROM jsonb_each_text(v_old)
        LOOP
            INSERT INTO auditoria_cambios (
                tabla_afectada, id_registro, campo_modificado,
                valor_anterior, valor_nuevo, id_usuario,
                fecha_hora, operacion
            ) VALUES (
                TG_TABLE_NAME, v_id_registro, v_key,
                v_old_val, NULL, v_user_id,
                NOW(), 'DELETE'
            );
        END LOOP;

        RETURN OLD;
    ELSE
        v_new := to_jsonb(NEW);
        v_old := to_jsonb(OLD);
        v_id_registro := (v_new ->> v_pk_col)::INTEGER;

        FOR v_key, v_new_val IN SELECT key, value FROM jsonb_each_text(v_new)
        LOOP
            v_old_val := v_old ->> v_key;
            IF v_old_val IS DISTINCT FROM v_new_val THEN
                INSERT INTO auditoria_cambios (
                    tabla_afectada, id_registro, campo_modificado,
                    valor_anterior, valor_nuevo, id_usuario,
                    fecha_hora, operacion
                ) VALUES (
                    TG_TABLE_NAME, v_id_registro, v_key,
                    v_old_val, v_new_val, v_user_id,
                    NOW(), 'UPDATE'
                );
            END IF;
        END LOOP;

        RETURN NEW;
    END IF;
END;
$$;

CREATE TRIGGER trg_auditar_especialidades
AFTER INSERT OR UPDATE OR DELETE ON especialidades
FOR EACH ROW EXECUTE FUNCTION fn_auditar_cambios('id_especialidad');

CREATE TRIGGER trg_auditar_tipos_sangre
AFTER INSERT OR UPDATE OR DELETE ON tipos_sangre
FOR EACH ROW EXECUTE FUNCTION fn_auditar_cambios('id_tipo_sangre');

CREATE TRIGGER trg_auditar_laboratorios
AFTER INSERT OR UPDATE OR DELETE ON laboratorios
FOR EACH ROW EXECUTE FUNCTION fn_auditar_cambios('id_laboratorio');

CREATE TRIGGER trg_auditar_medicamentos
AFTER INSERT OR UPDATE OR DELETE ON medicamentos
FOR EACH ROW EXECUTE FUNCTION fn_auditar_cambios('id_medicamento');

CREATE TRIGGER trg_auditar_estados_consulta
AFTER INSERT OR UPDATE OR DELETE ON estados_consulta
FOR EACH ROW EXECUTE FUNCTION fn_auditar_cambios('id_estado');

CREATE TRIGGER trg_auditar_roles
AFTER INSERT OR UPDATE OR DELETE ON roles
FOR EACH ROW EXECUTE FUNCTION fn_auditar_cambios('id_rol');

CREATE TRIGGER trg_auditar_pacientes
AFTER INSERT OR UPDATE OR DELETE ON pacientes
FOR EACH ROW EXECUTE FUNCTION fn_auditar_cambios('id_paciente');

CREATE TRIGGER trg_auditar_medicos
AFTER INSERT OR UPDATE OR DELETE ON medicos
FOR EACH ROW EXECUTE FUNCTION fn_auditar_cambios('id_medico');

CREATE TRIGGER trg_auditar_usuarios
AFTER INSERT OR UPDATE OR DELETE ON usuarios
FOR EACH ROW EXECUTE FUNCTION fn_auditar_cambios('id_usuario');

CREATE TRIGGER trg_auditar_consultas
AFTER INSERT OR UPDATE OR DELETE ON consultas
FOR EACH ROW EXECUTE FUNCTION fn_auditar_cambios('id_consulta');

CREATE TRIGGER trg_auditar_expedientes
AFTER INSERT OR UPDATE OR DELETE ON expedientes
FOR EACH ROW EXECUTE FUNCTION fn_auditar_cambios('id_expediente');

CREATE TRIGGER trg_auditar_hospitalizaciones
AFTER INSERT OR UPDATE OR DELETE ON hospitalizaciones
FOR EACH ROW EXECUTE FUNCTION fn_auditar_cambios('id_hospitalizacion');

CREATE TRIGGER trg_auditar_recetas
AFTER INSERT OR UPDATE OR DELETE ON recetas
FOR EACH ROW EXECUTE FUNCTION fn_auditar_cambios('id_receta');

CREATE TRIGGER trg_auditar_detalle_receta
AFTER INSERT OR UPDATE OR DELETE ON detalle_receta
FOR EACH ROW EXECUTE FUNCTION fn_auditar_cambios('id_detalle');

CREATE TRIGGER trg_auditar_estudios_laboratorio
AFTER INSERT OR UPDATE OR DELETE ON estudios_laboratorio
FOR EACH ROW EXECUTE FUNCTION fn_auditar_cambios('id_estudio');

CREATE TRIGGER trg_auditar_facturas
AFTER INSERT OR UPDATE OR DELETE ON facturas
FOR EACH ROW EXECUTE FUNCTION fn_auditar_cambios('id_factura');

CREATE TRIGGER trg_auditar_pagos
AFTER INSERT OR UPDATE OR DELETE ON pagos
FOR EACH ROW EXECUTE FUNCTION fn_auditar_cambios('id_pago');

CREATE TRIGGER trg_auditar_respaldos_realizados
AFTER INSERT OR UPDATE OR DELETE ON respaldos_realizados
FOR EACH ROW EXECUTE FUNCTION fn_auditar_cambios('id_respaldo');

CREATE OR REPLACE FUNCTION fn_validar_stock_medicamento()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_stock INTEGER;
BEGIN
    SELECT stock INTO v_stock
    FROM medicamentos
    WHERE id_medicamento = NEW.id_medicamento;

    IF v_stock IS NULL THEN
        RAISE EXCEPTION 'Medicamento no existe';
    END IF;

    IF v_stock < NEW.duracion_dias THEN
        RAISE EXCEPTION 'Stock insuficiente para el medicamento';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validar_stock_medicamento
BEFORE INSERT ON detalle_receta
FOR EACH ROW
EXECUTE FUNCTION fn_validar_stock_medicamento();

CREATE OR REPLACE FUNCTION fn_evitar_empalme_medico()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM consultas c
        WHERE c.id_medico = NEW.id_medico
          AND c.fecha_hora = NEW.fecha_hora
          AND (TG_OP = 'INSERT' OR c.id_consulta <> NEW.id_consulta)
    ) THEN
        RAISE EXCEPTION 'Medico ya tiene una consulta en esa fecha y hora';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_evitar_empalme_medico
BEFORE INSERT OR UPDATE ON consultas
FOR EACH ROW
EXECUTE FUNCTION fn_evitar_empalme_medico();

CREATE OR REPLACE FUNCTION fn_validar_edad_paciente()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.fecha_nacimiento >= CURRENT_DATE THEN
        RAISE EXCEPTION 'Fecha de nacimiento invalida';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validar_edad_paciente
BEFORE INSERT ON pacientes
FOR EACH ROW
EXECUTE FUNCTION fn_validar_edad_paciente();

CREATE OR REPLACE FUNCTION fn_crear_expediente_paciente()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO expedientes (id_paciente)
    VALUES (NEW.id_paciente)
    ON CONFLICT (id_paciente) DO NOTHING;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_crear_expediente_paciente
AFTER INSERT ON pacientes
FOR EACH ROW
EXECUTE FUNCTION fn_crear_expediente_paciente();

CREATE OR REPLACE FUNCTION fn_autocalcular_total_factura()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.total := COALESCE(NEW.subtotal, 0) + COALESCE(NEW.iva, 0);
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_autocalcular_total_factura
BEFORE INSERT ON facturas
FOR EACH ROW
EXECUTE FUNCTION fn_autocalcular_total_factura();

CREATE OR REPLACE FUNCTION fn_evitar_doble_hospitalizacion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM hospitalizaciones h
        WHERE h.id_paciente = NEW.id_paciente
          AND h.fecha_alta IS NULL
    ) THEN
        RAISE EXCEPTION 'Paciente ya tiene hospitalizacion activa';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_evitar_doble_hospitalizacion
BEFORE INSERT ON hospitalizaciones
FOR EACH ROW
EXECUTE FUNCTION fn_evitar_doble_hospitalizacion();

-- ============================================================
-- Fin del script DDL SIGEH con tablespaces
-- ============================================================
