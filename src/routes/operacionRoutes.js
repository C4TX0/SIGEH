const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { queryWithRole } = require('../config/db');

const router = express.Router();

router.get('/resumen', auth, authorize(['ADMIN', 'USUARIO_GENERAL']), async (req, res) => {
  try {
    const [
      pacientes,
      consultasHoy,
      proximasConsultas,
      facturacionHoy,
      facturasPendientes
    ] = await Promise.all([
      queryWithRole(
        req.user.dbRole,
        `SELECT
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE DATE(fecha_registro) = CURRENT_DATE)::int AS nuevos_hoy
         FROM pacientes
         WHERE activo = TRUE`
      ),
      queryWithRole(
        req.user.dbRole,
        `SELECT
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE ec.nombre = 'Programada')::int AS programadas,
           COUNT(*) FILTER (WHERE ec.nombre = 'En atencion')::int AS en_atencion,
           COUNT(*) FILTER (WHERE ec.nombre = 'Atendida')::int AS atendidas
         FROM consultas c
         JOIN estados_consulta ec ON ec.id_estado = c.id_estado
         WHERE DATE(c.fecha_hora) = CURRENT_DATE`
      ),
      queryWithRole(
        req.user.dbRole,
        `SELECT c.id_consulta, c.fecha_hora, c.motivo, ec.nombre AS estado,
                p.id_paciente, p.nombre AS paciente_nombre, p.apellido_paterno AS paciente_apellido,
                m.id_medico, m.nombre AS medico_nombre, m.apellido_paterno AS medico_apellido
         FROM consultas c
         JOIN estados_consulta ec ON ec.id_estado = c.id_estado
         JOIN pacientes p ON p.id_paciente = c.id_paciente
         JOIN medicos m ON m.id_medico = c.id_medico
         WHERE c.fecha_hora >= NOW()
           AND ec.nombre IN ('Programada', 'En atencion', 'Reprogramada')
         ORDER BY c.fecha_hora
         LIMIT 6`
      ),
      queryWithRole(
        req.user.dbRole,
        `SELECT COALESCE(SUM(monto), 0)::numeric(10,2) AS total
         FROM pagos
         WHERE DATE(fecha_pago) = CURRENT_DATE`
      ),
      queryWithRole(
        req.user.dbRole,
        `SELECT COUNT(*)::int AS total,
                COALESCE(SUM(total), 0)::numeric(10,2) AS monto
         FROM facturas
         WHERE estado = 'Pendiente'`
      )
    ]);

    return res.status(200).json({
      pacientes: pacientes.rows[0],
      consultas_hoy: consultasHoy.rows[0],
      proximas_consultas: proximasConsultas.rows,
      facturacion_hoy: facturacionHoy.rows[0],
      facturas_pendientes: facturasPendientes.rows[0]
    });
  } catch (err) {
    console.error('operacion resumen error:', {
      message: err.message,
      code: err.code,
      detail: err.detail
    });
    return res.status(500).json({ message: 'Error al consultar resumen operativo' });
  }
});

module.exports = router;
