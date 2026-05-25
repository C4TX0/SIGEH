-- ============================================================
-- SIGEH - Datos demo masivos
-- Ejecutar despues de database.sql sobre la base sigeh_db.
--
-- Objetivo:
-- - Poblar pacientes, medicos, usuarios, consultas, expedientes,
--   recetas, estudios, hospitalizaciones, facturas, pagos y auditoria.
-- - Dejar al usuario `medico` con informacion clinica visible:
--   agenda de hoy, expedientes, hospitalizaciones y pendientes.
--
-- Credenciales demo agregadas/aseguradas:
-- - admin_demo / Demo12345
-- - recepcion_demo / Demo12345
-- - medico / MedicoSIGEH2025
-- - medico_cardio / Demo12345
-- - medico_pedia / Demo12345
--
-- El script es mayormente idempotente: usa ON CONFLICT donde existen
-- restricciones unicas y evita duplicar recetas/estudios/pagos demo.
-- ============================================================

BEGIN;

SET search_path = public;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------
-- 1) Medicos demo
-- ------------------------------------------------------------

INSERT INTO medicos (
  nombre, apellido_paterno, apellido_materno, cedula_profesional,
  id_especialidad, telefono, correo_electronico, activo
) VALUES
('Medico', 'Demo', 'SIGEH', 'MEDDEMO01',
 (SELECT id_especialidad FROM especialidades WHERE nombre = 'Medicina General'),
 '5550000000', 'medico.demo@sigeh.local', TRUE),
('Elena', 'Rivera', 'Salas', 'CARDIO001',
 (SELECT id_especialidad FROM especialidades WHERE nombre = 'Cardiologia'),
 '5551001001', 'elena.rivera@sigeh.local', TRUE),
('Andres', 'Molina', 'Vega', 'PEDIA0001',
 (SELECT id_especialidad FROM especialidades WHERE nombre = 'Pediatria'),
 '5551001002', 'andres.molina@sigeh.local', TRUE),
('Laura', 'Campos', 'Ortiz', 'TRAUMA001',
 (SELECT id_especialidad FROM especialidades WHERE nombre = 'Traumatologia'),
 '5551001003', 'laura.campos@sigeh.local', TRUE)
ON CONFLICT (cedula_profesional) DO UPDATE
SET nombre = EXCLUDED.nombre,
    apellido_paterno = EXCLUDED.apellido_paterno,
    apellido_materno = EXCLUDED.apellido_materno,
    id_especialidad = EXCLUDED.id_especialidad,
    telefono = EXCLUDED.telefono,
    correo_electronico = EXCLUDED.correo_electronico,
    activo = TRUE;

-- ------------------------------------------------------------
-- 2) Usuarios demo asociados a roles y medicos
-- ------------------------------------------------------------

INSERT INTO usuarios (username, password_hash, id_rol, id_medico, activo, bloqueado, intentos_fallidos)
VALUES
('admin_demo', crypt('Demo12345', gen_salt('bf')),
 (SELECT id_rol FROM roles WHERE nombre = 'ADMIN'), NULL, TRUE, FALSE, 0),
('recepcion_demo', crypt('Demo12345', gen_salt('bf')),
 (SELECT id_rol FROM roles WHERE nombre = 'USUARIO_GENERAL'), NULL, TRUE, FALSE, 0),
('medico_cardio', crypt('Demo12345', gen_salt('bf')),
 (SELECT id_rol FROM roles WHERE nombre = 'MEDICO'),
 (SELECT id_medico FROM medicos WHERE cedula_profesional = 'CARDIO001'), TRUE, FALSE, 0),
('medico_pedia', crypt('Demo12345', gen_salt('bf')),
 (SELECT id_rol FROM roles WHERE nombre = 'MEDICO'),
 (SELECT id_medico FROM medicos WHERE cedula_profesional = 'PEDIA0001'), TRUE, FALSE, 0)
ON CONFLICT (username) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    id_rol = EXCLUDED.id_rol,
    id_medico = EXCLUDED.id_medico,
    activo = TRUE,
    bloqueado = FALSE,
    bloqueado_hasta = NULL,
    intentos_fallidos = 0;

UPDATE usuarios
SET id_medico = (SELECT id_medico FROM medicos WHERE cedula_profesional = 'MEDDEMO01'),
    activo = TRUE,
    bloqueado = FALSE,
    bloqueado_hasta = NULL,
    intentos_fallidos = 0
WHERE username = 'medico';

-- ------------------------------------------------------------
-- 3) Pacientes demo
-- ------------------------------------------------------------

INSERT INTO pacientes (
  nombre, apellido_paterno, apellido_materno, fecha_nacimiento,
  curp, telefono, correo_electronico, id_tipo_sangre, alergias, activo
) VALUES
('Luis', 'Gomez', 'Martinez', '1990-01-01', 'GOML900101HDFRRS01',
 '5552001001', 'luis.gomez@example.com', (SELECT id_tipo_sangre FROM tipos_sangre WHERE nombre = 'O+'), 'Penicilina', TRUE),
('Maria', 'Hernandez', 'Lopez', '1985-04-12', 'HELM850412MDFRPR02',
 '5552001002', 'maria.hernandez@example.com', (SELECT id_tipo_sangre FROM tipos_sangre WHERE nombre = 'A+'), 'Sin alergias conocidas', TRUE),
('Carlos', 'Santos', 'Perez', '1978-09-23', 'SAPC780923HDFNRR03',
 '5552001003', 'carlos.santos@example.com', (SELECT id_tipo_sangre FROM tipos_sangre WHERE nombre = 'B+'), 'Aspirina', TRUE),
('Ana', 'Torres', 'Nava', '1995-11-05', 'TONA951105MDFRVR04',
 '5552001004', 'ana.torres@example.com', (SELECT id_tipo_sangre FROM tipos_sangre WHERE nombre = 'AB+'), NULL, TRUE),
('Jorge', 'Ramirez', 'Diaz', '1969-02-18', 'RADJ690218HDFMZR05',
 '5552001005', 'jorge.ramirez@example.com', (SELECT id_tipo_sangre FROM tipos_sangre WHERE nombre = 'O-'), 'Yodo', TRUE),
('Sofia', 'Vargas', 'Cruz', '2012-06-20', 'VACS120620MDFRRF06',
 '5552001006', 'sofia.vargas@example.com', (SELECT id_tipo_sangre FROM tipos_sangre WHERE nombre = 'A-'), 'Lactosa', TRUE),
('Roberto', 'Mendoza', 'Reyes', '1988-12-09', 'MERR881209HDFNYB07',
 '5552001007', 'roberto.mendoza@example.com', (SELECT id_tipo_sangre FROM tipos_sangre WHERE nombre = 'B-'), NULL, TRUE),
('Patricia', 'Flores', 'Aguilar', '2000-03-14', 'FOAP000314MDFLGT08',
 '5552001008', 'patricia.flores@example.com', (SELECT id_tipo_sangre FROM tipos_sangre WHERE nombre = 'AB-'), 'Mariscos', TRUE)
ON CONFLICT (curp) DO UPDATE
SET nombre = EXCLUDED.nombre,
    apellido_paterno = EXCLUDED.apellido_paterno,
    apellido_materno = EXCLUDED.apellido_materno,
    telefono = EXCLUDED.telefono,
    correo_electronico = EXCLUDED.correo_electronico,
    id_tipo_sangre = EXCLUDED.id_tipo_sangre,
    alergias = EXCLUDED.alergias,
    activo = TRUE;

-- ------------------------------------------------------------
-- 4) Expedientes con antecedentes
-- ------------------------------------------------------------

INSERT INTO expedientes (
  id_paciente, antecedentes_heredo, antecedentes_personales, antecedentes_quirurgicos, activo
)
SELECT p.id_paciente,
       'Antecedentes familiares registrados para seguimiento clinico.',
       CASE p.curp
         WHEN 'GOML900101HDFRRS01' THEN 'Hipertension controlada. Alergia a penicilina.'
         WHEN 'HELM850412MDFRPR02' THEN 'Migraña ocasional. Sin tratamientos permanentes.'
         WHEN 'SAPC780923HDFNRR03' THEN 'Diabetes mellitus tipo 2 en tratamiento.'
         WHEN 'TONA951105MDFRVR04' THEN 'Sin antecedentes personales relevantes.'
         WHEN 'RADJ690218HDFMZR05' THEN 'Cardiopatia isquemica en vigilancia.'
         WHEN 'VACS120620MDFRRF06' THEN 'Asma infantil intermitente.'
         WHEN 'MERR881209HDFNYB07' THEN 'Lesion deportiva previa en rodilla derecha.'
         ELSE 'Antecedentes en valoracion.'
       END,
       CASE p.curp
         WHEN 'MERR881209HDFNYB07' THEN 'Artroscopia de rodilla en 2021.'
         ELSE 'Niega cirugias previas.'
       END,
       TRUE
FROM pacientes p
WHERE p.curp IN (
  'GOML900101HDFRRS01', 'HELM850412MDFRPR02', 'SAPC780923HDFNRR03', 'TONA951105MDFRVR04',
  'RADJ690218HDFMZR05', 'VACS120620MDFRRF06', 'MERR881209HDFNYB07', 'FOAP000314MDFLGT08'
)
ON CONFLICT (id_paciente) DO UPDATE
SET antecedentes_heredo = EXCLUDED.antecedentes_heredo,
    antecedentes_personales = EXCLUDED.antecedentes_personales,
    antecedentes_quirurgicos = EXCLUDED.antecedentes_quirurgicos,
    activo = TRUE;

-- ------------------------------------------------------------
-- 5) Agenda de consultas
-- Incluye agenda de hoy para usuario `medico` y consultas historicas
-- para que el expediente clinico tenga contenido visible.
-- ------------------------------------------------------------

INSERT INTO consultas (id_paciente, id_medico, id_estado, fecha_hora, motivo, diagnostico, notas)
VALUES
((SELECT id_paciente FROM pacientes WHERE curp = 'GOML900101HDFRRS01'),
 (SELECT id_medico FROM medicos WHERE cedula_profesional = 'MEDDEMO01'),
 (SELECT id_estado FROM estados_consulta WHERE nombre = 'Programada'),
 CURRENT_DATE + TIME '09:00', 'Revision por dolor de garganta', NULL, NULL),
((SELECT id_paciente FROM pacientes WHERE curp = 'HELM850412MDFRPR02'),
 (SELECT id_medico FROM medicos WHERE cedula_profesional = 'MEDDEMO01'),
 (SELECT id_estado FROM estados_consulta WHERE nombre = 'Programada'),
 CURRENT_DATE + TIME '10:30', 'Control de cefalea recurrente', NULL, NULL),
((SELECT id_paciente FROM pacientes WHERE curp = 'SAPC780923HDFNRR03'),
 (SELECT id_medico FROM medicos WHERE cedula_profesional = 'MEDDEMO01'),
 (SELECT id_estado FROM estados_consulta WHERE nombre = 'En atencion'),
 CURRENT_DATE + TIME '12:00', 'Seguimiento de glucosa', NULL, NULL),
((SELECT id_paciente FROM pacientes WHERE curp = 'TONA951105MDFRVR04'),
 (SELECT id_medico FROM medicos WHERE cedula_profesional = 'MEDDEMO01'),
 (SELECT id_estado FROM estados_consulta WHERE nombre = 'Atendida'),
 CURRENT_DATE - INTERVAL '1 day' + TIME '11:00', 'Dolor abdominal', 'Gastroenteritis leve',
 '{"sintomas":"Dolor abdominal y nausea","peso":"62","talla":"165","temperatura":"37.2","presion_arterial":"110/70","frecuencia_cardiaca":"78","notas":"Se indica hidratacion y vigilancia."}'),
((SELECT id_paciente FROM pacientes WHERE curp = 'RADJ690218HDFMZR05'),
 (SELECT id_medico FROM medicos WHERE cedula_profesional = 'CARDIO001'),
 (SELECT id_estado FROM estados_consulta WHERE nombre = 'Programada'),
 CURRENT_DATE + TIME '13:00', 'Valoracion cardiologica', NULL, NULL),
((SELECT id_paciente FROM pacientes WHERE curp = 'VACS120620MDFRRF06'),
 (SELECT id_medico FROM medicos WHERE cedula_profesional = 'PEDIA0001'),
 (SELECT id_estado FROM estados_consulta WHERE nombre = 'Programada'),
 CURRENT_DATE + TIME '16:00', 'Tos persistente', NULL, NULL),
((SELECT id_paciente FROM pacientes WHERE curp = 'MERR881209HDFNYB07'),
 (SELECT id_medico FROM medicos WHERE cedula_profesional = 'TRAUMA001'),
 (SELECT id_estado FROM estados_consulta WHERE nombre = 'Atendida'),
 CURRENT_DATE - INTERVAL '2 days' + TIME '15:00', 'Dolor de rodilla derecha', 'Esguince grado I',
 '{"sintomas":"Dolor al apoyar","peso":"80","talla":"176","temperatura":"36.8","presion_arterial":"120/80","frecuencia_cardiaca":"72","notas":"Reposo relativo y antiinflamatorio."}'),
((SELECT id_paciente FROM pacientes WHERE curp = 'FOAP000314MDFLGT08'),
 (SELECT id_medico FROM medicos WHERE cedula_profesional = 'MEDDEMO01'),
 (SELECT id_estado FROM estados_consulta WHERE nombre = 'Atendida'),
 CURRENT_DATE - INTERVAL '7 days' + TIME '09:30', 'Dermatitis por contacto', 'Dermatitis alergica leve',
 '{"sintomas":"Prurito y eritema","peso":"58","talla":"162","temperatura":"36.5","presion_arterial":"112/72","frecuencia_cardiaca":"76","notas":"Evitar desencadenante probable."}')
ON CONFLICT (id_medico, fecha_hora) DO UPDATE
SET id_paciente = EXCLUDED.id_paciente,
    id_estado = EXCLUDED.id_estado,
    motivo = EXCLUDED.motivo,
    diagnostico = EXCLUDED.diagnostico,
    notas = EXCLUDED.notas;

-- ------------------------------------------------------------
-- 6) Hospitalizaciones activas y cerradas
-- ------------------------------------------------------------

INSERT INTO hospitalizaciones (
  id_paciente, id_medico, cama, fecha_ingreso, fecha_alta,
  diagnostico_ingreso, diagnostico_egreso, activo
)
VALUES
((SELECT id_paciente FROM pacientes WHERE curp = 'SAPC780923HDFNRR03'),
 (SELECT id_medico FROM medicos WHERE cedula_profesional = 'MEDDEMO01'),
 'A-102', NOW() - INTERVAL '2 days', NULL,
 'Descontrol glucemico con vigilancia hospitalaria', NULL, TRUE),
((SELECT id_paciente FROM pacientes WHERE curp = 'RADJ690218HDFMZR05'),
 (SELECT id_medico FROM medicos WHERE cedula_profesional = 'CARDIO001'),
 'C-210', NOW() - INTERVAL '1 day', NULL,
 'Dolor toracico en observacion', NULL, TRUE),
((SELECT id_paciente FROM pacientes WHERE curp = 'MERR881209HDFNYB07'),
 (SELECT id_medico FROM medicos WHERE cedula_profesional = 'TRAUMA001'),
 'B-014', NOW() - INTERVAL '8 days', NOW() - INTERVAL '5 days',
 'Lesion de rodilla derecha', 'Alta por mejoria clinica', FALSE)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- 7) Recetas y detalle
-- ------------------------------------------------------------

WITH consulta_base AS (
  SELECT c.id_consulta, c.id_medico
  FROM consultas c
  JOIN pacientes p ON p.id_paciente = c.id_paciente
  WHERE p.curp = 'TONA951105MDFRVR04'
    AND DATE(c.fecha_hora) = CURRENT_DATE - INTERVAL '1 day'
), receta_insert AS (
  INSERT INTO recetas (id_consulta, id_medico, fecha_emision, dispensada, observaciones)
  SELECT cb.id_consulta, cb.id_medico, CURRENT_DATE - INTERVAL '1 day' + TIME '11:25', TRUE,
         'Tratamiento sintomatico por 3 dias.'
  FROM consulta_base cb
  WHERE NOT EXISTS (
    SELECT 1 FROM recetas r
    WHERE r.id_consulta = cb.id_consulta
      AND r.observaciones = 'Tratamiento sintomatico por 3 dias.'
  )
  RETURNING id_receta
), receta_obj AS (
  SELECT id_receta FROM receta_insert
  UNION
  SELECT r.id_receta
  FROM recetas r
  JOIN consulta_base cb ON cb.id_consulta = r.id_consulta
  WHERE r.observaciones = 'Tratamiento sintomatico por 3 dias.'
  LIMIT 1
)
INSERT INTO detalle_receta (
  id_receta, id_medicamento, dosis, unidad_dosis, frecuencia, duracion_dias, indicaciones
)
SELECT ro.id_receta, m.id_medicamento, '500', 'mg', 'Cada 8 horas', 3, 'Tomar despues de alimentos'
FROM receta_obj ro
JOIN medicamentos m ON m.nombre_generico = 'Paracetamol'
WHERE NOT EXISTS (
  SELECT 1 FROM detalle_receta dr
  WHERE dr.id_receta = ro.id_receta
    AND dr.id_medicamento = m.id_medicamento
);

WITH consulta_base AS (
  SELECT c.id_consulta, c.id_medico
  FROM consultas c
  JOIN pacientes p ON p.id_paciente = c.id_paciente
  WHERE p.curp = 'FOAP000314MDFLGT08'
    AND DATE(c.fecha_hora) = CURRENT_DATE - INTERVAL '7 days'
), receta_insert AS (
  INSERT INTO recetas (id_consulta, id_medico, fecha_emision, dispensada, observaciones)
  SELECT cb.id_consulta, cb.id_medico, CURRENT_DATE - INTERVAL '7 days' + TIME '09:50', FALSE,
         'Antihistaminico por dermatitis alergica.'
  FROM consulta_base cb
  WHERE NOT EXISTS (
    SELECT 1 FROM recetas r
    WHERE r.id_consulta = cb.id_consulta
      AND r.observaciones = 'Antihistaminico por dermatitis alergica.'
  )
  RETURNING id_receta
), receta_obj AS (
  SELECT id_receta FROM receta_insert
  UNION
  SELECT r.id_receta
  FROM recetas r
  JOIN consulta_base cb ON cb.id_consulta = r.id_consulta
  WHERE r.observaciones = 'Antihistaminico por dermatitis alergica.'
  LIMIT 1
)
INSERT INTO detalle_receta (
  id_receta, id_medicamento, dosis, unidad_dosis, frecuencia, duracion_dias, indicaciones
)
SELECT ro.id_receta, m.id_medicamento, '10', 'mg', 'Cada 24 horas', 5, 'Tomar por la noche'
FROM receta_obj ro
JOIN medicamentos m ON m.nombre_generico = 'Loratadina'
WHERE NOT EXISTS (
  SELECT 1 FROM detalle_receta dr
  WHERE dr.id_receta = ro.id_receta
    AND dr.id_medicamento = m.id_medicamento
);

-- ------------------------------------------------------------
-- 8) Estudios de laboratorio
-- ------------------------------------------------------------

INSERT INTO estudios_laboratorio (
  id_consulta, id_laboratorio, id_medico, fecha_solicitud, fecha_resultado,
  resultado, observaciones, estado
)
SELECT c.id_consulta,
       (SELECT id_laboratorio FROM laboratorios WHERE nombre = 'Glucosa'),
       c.id_medico,
       CURRENT_DATE + TIME '12:10',
       NULL,
       NULL,
       'Control de glucosa por descompensacion.',
       'Solicitado'
FROM consultas c
JOIN pacientes p ON p.id_paciente = c.id_paciente
WHERE p.curp = 'SAPC780923HDFNRR03'
  AND DATE(c.fecha_hora) = CURRENT_DATE
  AND NOT EXISTS (
    SELECT 1 FROM estudios_laboratorio el
    WHERE el.id_consulta = c.id_consulta
      AND el.id_laboratorio = (SELECT id_laboratorio FROM laboratorios WHERE nombre = 'Glucosa')
  );

INSERT INTO estudios_laboratorio (
  id_consulta, id_laboratorio, id_medico, fecha_solicitud, fecha_resultado,
  resultado, observaciones, estado
)
SELECT c.id_consulta,
       (SELECT id_laboratorio FROM laboratorios WHERE nombre = 'Biometria hematica'),
       c.id_medico,
       CURRENT_DATE - INTERVAL '1 day' + TIME '11:15',
       CURRENT_DATE - INTERVAL '1 day' + TIME '14:30',
       'Sin datos de alarma. Leucocitos dentro de rango.',
       'Estudio solicitado por dolor abdominal.',
       'Completado'
FROM consultas c
JOIN pacientes p ON p.id_paciente = c.id_paciente
WHERE p.curp = 'TONA951105MDFRVR04'
  AND DATE(c.fecha_hora) = CURRENT_DATE - INTERVAL '1 day'
  AND NOT EXISTS (
    SELECT 1 FROM estudios_laboratorio el
    WHERE el.id_consulta = c.id_consulta
      AND el.id_laboratorio = (SELECT id_laboratorio FROM laboratorios WHERE nombre = 'Biometria hematica')
  );

-- ------------------------------------------------------------
-- 9) Facturacion y pagos demo
-- ------------------------------------------------------------

INSERT INTO facturas (
  id_paciente, folio, fecha_emision, subtotal, iva, total, estado, fecha_pago
)
VALUES
((SELECT id_paciente FROM pacientes WHERE curp = 'TONA951105MDFRVR04'),
 'FAC-DEMO-0001', CURRENT_DATE - INTERVAL '1 day' + TIME '12:00',
 650.00, 104.00, 754.00, 'Pagada', CURRENT_DATE - INTERVAL '1 day' + TIME '12:05'),
((SELECT id_paciente FROM pacientes WHERE curp = 'FOAP000314MDFLGT08'),
 'FAC-DEMO-0002', CURRENT_DATE - INTERVAL '7 days' + TIME '10:10',
 500.00, 80.00, 580.00, 'Pagada', CURRENT_DATE - INTERVAL '7 days' + TIME '10:15'),
((SELECT id_paciente FROM pacientes WHERE curp = 'SAPC780923HDFNRR03'),
 'FAC-DEMO-0003', CURRENT_DATE + TIME '12:30',
 850.00, 136.00, 986.00, 'Pendiente', NULL)
ON CONFLICT (folio) DO UPDATE
SET subtotal = EXCLUDED.subtotal,
    iva = EXCLUDED.iva,
    total = EXCLUDED.total,
    estado = EXCLUDED.estado,
    fecha_pago = EXCLUDED.fecha_pago;

INSERT INTO pagos (id_factura, metodo_pago, monto, fecha_pago, referencia, id_usuario)
SELECT f.id_factura, 'Tarjeta de Credito', f.total, f.fecha_pago, 'PAY-DEMO-0001',
       (SELECT id_usuario FROM usuarios WHERE username = 'recepcion_demo')
FROM facturas f
WHERE f.folio = 'FAC-DEMO-0001'
  AND NOT EXISTS (SELECT 1 FROM pagos p WHERE p.referencia = 'PAY-DEMO-0001');

INSERT INTO pagos (id_factura, metodo_pago, monto, fecha_pago, referencia, id_usuario)
SELECT f.id_factura, 'Efectivo', f.total, f.fecha_pago, 'PAY-DEMO-0002',
       (SELECT id_usuario FROM usuarios WHERE username = 'recepcion_demo')
FROM facturas f
WHERE f.folio = 'FAC-DEMO-0002'
  AND NOT EXISTS (SELECT 1 FROM pagos p WHERE p.referencia = 'PAY-DEMO-0002');

-- ------------------------------------------------------------
-- 10) Bitacora y respaldos demo
-- ------------------------------------------------------------

INSERT INTO bitacora_accesos (
  id_usuario, username_intento, fecha_hora, ip_origen, tipo_evento, exito, descripcion
)
SELECT id_usuario, username, NOW() - INTERVAL '30 minutes', '127.0.0.1', 'LOGIN_OK', TRUE,
       'Acceso demo generado por seed_demo_data.sql'
FROM usuarios
WHERE username IN ('admin_demo', 'recepcion_demo', 'medico', 'medico_cardio')
  AND NOT EXISTS (
    SELECT 1 FROM bitacora_accesos b
    WHERE b.username_intento = usuarios.username
      AND b.descripcion = 'Acceso demo generado por seed_demo_data.sql'
  );

INSERT INTO respaldos_realizados (
  tipo_respaldo, fecha_inicio, fecha_fin, tamanio_mb, ruta_archivo, estado, id_usuario
)
SELECT 'completo', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour 55 minutes',
       12.50, './backups/sigeh_demo_completo.sql', 'Exitoso',
       (SELECT id_usuario FROM usuarios WHERE username = 'admin_demo')
WHERE NOT EXISTS (
  SELECT 1 FROM respaldos_realizados
  WHERE ruta_archivo = './backups/sigeh_demo_completo.sql'
);

COMMIT;

-- ============================================================
-- Validacion sugerida despues de ejecutar:
--
-- SELECT username, id_medico FROM usuarios ORDER BY id_usuario;
-- SELECT count(*) FROM pacientes;
-- SELECT count(*) FROM consultas WHERE DATE(fecha_hora) = CURRENT_DATE;
-- SELECT count(*) FROM hospitalizaciones WHERE fecha_alta IS NULL;
-- ============================================================
