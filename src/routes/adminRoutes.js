const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { queryWithRole } = require('../config/db');

const router = express.Router();

router.get('/resumen', auth, authorize(['ADMIN']), async (req, res) => {
  try {
    const [
      usuarios,
      pacientes,
      medicos,
      consultasHoy,
      facturasPendientes,
      accesos,
      cambios,
      ultimoRespaldo
    ] = await Promise.all([
      queryWithRole(
        req.user.dbRole,
        `SELECT
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE activo = TRUE)::int AS activos,
           COUNT(*) FILTER (WHERE bloqueado = TRUE)::int AS bloqueados
         FROM usuarios`
      ),
      queryWithRole(
        req.user.dbRole,
        `SELECT
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE DATE(fecha_registro) = CURRENT_DATE)::int AS nuevos_hoy
         FROM pacientes`
      ),
      queryWithRole(
        req.user.dbRole,
        `SELECT
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE activo = TRUE)::int AS activos
         FROM medicos`
      ),
      queryWithRole(
        req.user.dbRole,
        `SELECT
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE ec.nombre = 'Programada')::int AS programadas,
           COUNT(*) FILTER (WHERE ec.nombre = 'Atendida')::int AS atendidas
         FROM consultas c
         JOIN estados_consulta ec ON ec.id_estado = c.id_estado
         WHERE DATE(c.fecha_hora) = CURRENT_DATE`
      ),
      queryWithRole(
        req.user.dbRole,
        `SELECT COUNT(*)::int AS total,
                COALESCE(SUM(total), 0)::numeric(10,2) AS monto
         FROM facturas
         WHERE estado = 'Pendiente'`
      ),
      queryWithRole(
        req.user.dbRole,
        `SELECT
           COUNT(*) FILTER (WHERE exito = TRUE)::int AS exitosos_24h,
           COUNT(*) FILTER (WHERE exito = FALSE)::int AS fallidos_24h
         FROM bitacora_accesos
         WHERE fecha_hora >= NOW() - INTERVAL '24 hours'`
      ),
      queryWithRole(
        req.user.dbRole,
        `SELECT COUNT(*)::int AS total_hoy
         FROM auditoria_cambios
         WHERE DATE(fecha_hora) = CURRENT_DATE`
      ),
      queryWithRole(
        req.user.dbRole,
        `SELECT id_respaldo, tipo_respaldo, fecha_inicio, fecha_fin, estado, ruta_archivo
         FROM respaldos_realizados
         ORDER BY fecha_inicio DESC
         LIMIT 1`
      )
    ]);

    return res.status(200).json({
      usuarios: usuarios.rows[0],
      pacientes: pacientes.rows[0],
      medicos: medicos.rows[0],
      consultas_hoy: consultasHoy.rows[0],
      facturas_pendientes: facturasPendientes.rows[0],
      accesos_24h: accesos.rows[0],
      cambios_hoy: cambios.rows[0],
      ultimo_respaldo: ultimoRespaldo.rows[0] || null
    });
  } catch (err) {
    console.error('admin resumen error:', {
      message: err.message,
      code: err.code,
      detail: err.detail
    });
    return res.status(500).json({ message: 'Error al consultar resumen administrativo' });
  }
});

module.exports = router;
