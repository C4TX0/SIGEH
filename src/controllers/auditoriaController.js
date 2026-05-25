const { queryWithRole } = require('../config/db');
const fs = require('fs');
const path = require('path');
const { createDatabaseBackup } = require('../services/backupService');

async function getAccesos(req, res) {
  try {
    const result = await queryWithRole(
      req.user.dbRole,
      `SELECT b.id_bitacora,
              COALESCE(u.username, b.username_intento) AS username,
              b.username_intento,
              b.fecha_hora,
              b.ip_origen,
              b.tipo_evento,
              b.exito,
              b.descripcion
       FROM bitacora_accesos b
       LEFT JOIN usuarios u ON u.id_usuario = b.id_usuario
       ORDER BY b.fecha_hora DESC
       LIMIT 200`
    );

    return res.status(200).json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: 'Error al consultar bitacora' });
  }
}

async function getCambios(req, res) {
  try {
    const result = await queryWithRole(
      req.user.dbRole,
      `SELECT id_auditoria, tabla_afectada, id_registro, campo_modificado,
              valor_anterior, valor_nuevo, id_usuario, fecha_hora, operacion
       FROM auditoria_cambios
       ORDER BY fecha_hora DESC
       LIMIT 200`
    );

    return res.status(200).json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: 'Error al consultar auditoria de cambios' });
  }
}

async function getRespaldos(req, res) {
  try {
    const result = await queryWithRole(
      req.user.dbRole,
      `SELECT id_respaldo, tipo_respaldo, fecha_inicio, fecha_fin,
              tamanio_mb, ruta_archivo, estado, id_usuario
       FROM respaldos_realizados
       ORDER BY fecha_inicio DESC
       LIMIT 200`
    );

    const rows = result.rows.map((row) => {
      const ruta = row.ruta_archivo || '';
      const rutaNormalizada = path.isAbsolute(ruta)
        ? ruta
        : path.resolve(process.cwd(), ruta);
      const archivo_existe = Boolean(ruta) && fs.existsSync(rutaNormalizada);
      const tamano_archivo_mb_real = archivo_existe
        ? Number((fs.statSync(rutaNormalizada).size / (1024 * 1024)).toFixed(2))
        : null;

      return {
        ...row,
        archivo_existe,
        tamano_archivo_mb_real
      };
    });

    return res.status(200).json(rows);
  } catch (err) {
    return res.status(500).json({ message: 'Error al consultar respaldos' });
  }
}

async function createRespaldo(req, res) {
  const { tipo_respaldo, directorio, ruta_archivo } = req.body || {};
  const tipo = (tipo_respaldo || 'completo').toLowerCase();
  const inicio = new Date();

  if (tipo !== 'completo') {
    return res.status(400).json({
      message: 'Solo se soporta respaldo completo en esta version'
    });
  }

  try {
    const backup = await createDatabaseBackup({
      backupType: tipo,
      outputDir: directorio || ruta_archivo || null
    });

    const result = await queryWithRole(
      req.user.dbRole,
      `INSERT INTO respaldos_realizados (
         tipo_respaldo, fecha_inicio, fecha_fin,
         tamanio_mb, ruta_archivo, estado, id_usuario
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id_respaldo, ruta_archivo, tamanio_mb, estado, fecha_inicio, fecha_fin`,
      [
        backup.backupType,
        backup.startAt,
        backup.endAt,
        backup.sizeMb,
        backup.filePath,
        'Exitoso',
        req.user.id
      ]
    );

    return res.status(201).json({
      id_respaldo: result.rows[0].id_respaldo,
      ruta_archivo: result.rows[0].ruta_archivo,
      tamanio_mb: result.rows[0].tamanio_mb,
      estado: result.rows[0].estado,
      fecha_inicio: result.rows[0].fecha_inicio,
      fecha_fin: result.rows[0].fecha_fin
    });
  } catch (err) {
    console.error('createRespaldo error:', {
      message: err.message,
      code: err.code,
      stderr: err.stderr
    });

    try {
      await queryWithRole(
        req.user.dbRole,
        `INSERT INTO respaldos_realizados (
           tipo_respaldo, fecha_inicio, fecha_fin,
           tamanio_mb, ruta_archivo, estado, id_usuario
         ) VALUES ($1, $2, $3, NULL, $4, 'Fallido', $5)`,
        [tipo, inicio, new Date(), directorio || ruta_archivo || 'N/A', req.user.id]
      );
    } catch (logErr) {
      // no-op: preserve original error response
    }

    return res.status(500).json({
      message: 'Error al generar respaldo',
      detail: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}

module.exports = {
  getAccesos,
  getCambios,
  getRespaldos,
  createRespaldo
};
