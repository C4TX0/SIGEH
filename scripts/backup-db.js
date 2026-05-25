#!/usr/bin/env node
require('dotenv').config();

const { pool } = require('../src/config/db');
const { createDatabaseBackup } = require('../src/services/backupService');

function getArg(name) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : null;
}

async function main() {
  const tipo = getArg('tipo') || 'completo';
  const outputDir = getArg('dir') || process.env.BACKUP_DIR || null;
  const userId = await resolveBackupUserId();

  const startAt = new Date();

  try {
    const backup = await createDatabaseBackup({
      backupType: tipo,
      outputDir
    });

    const insert = await pool.query(
      `INSERT INTO respaldos_realizados (
         tipo_respaldo, fecha_inicio, fecha_fin,
         tamanio_mb, ruta_archivo, estado, id_usuario
       ) VALUES ($1, $2, $3, $4, $5, 'Exitoso', $6)
       RETURNING id_respaldo`,
      [
        backup.backupType,
        backup.startAt,
        backup.endAt,
        backup.sizeMb,
        backup.filePath,
        userId
      ]
    );

    console.log(JSON.stringify({
      ok: true,
      id_respaldo: insert.rows[0].id_respaldo,
      archivo: backup.filePath,
      tamanio_mb: backup.sizeMb,
      inicio: backup.startAt,
      fin: backup.endAt
    }, null, 2));
  } catch (error) {
    const endAt = new Date();
    const fallbackPath = outputDir || process.env.BACKUP_DIR || null;

    try {
      await pool.query(
        `INSERT INTO respaldos_realizados (
           tipo_respaldo, fecha_inicio, fecha_fin,
           tamanio_mb, ruta_archivo, estado, id_usuario
         ) VALUES ($1, $2, $3, NULL, $4, 'Fallido', $5)`,
        [tipo, startAt, endAt, fallbackPath || 'N/A', userId]
      );
    } catch (logErr) {
      // If DB logging fails, still report root error.
    }

    console.error('Backup failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

async function resolveBackupUserId() {
  const envUserId = process.env.BACKUP_USER_ID ? Number(process.env.BACKUP_USER_ID) : null;
  if (envUserId && Number.isFinite(envUserId) && envUserId > 0) {
    const existing = await pool.query('SELECT id_usuario FROM usuarios WHERE id_usuario = $1', [envUserId]);
    if (existing.rowCount > 0) {
      return envUserId;
    }
  }

  const username = process.env.BACKUP_USERNAME || 'admin';
  const byUsername = await pool.query(
    'SELECT id_usuario FROM usuarios WHERE username = $1 LIMIT 1',
    [username]
  );
  if (byUsername.rowCount > 0) {
    return byUsername.rows[0].id_usuario;
  }

  const byRole = await pool.query(
    `SELECT u.id_usuario
     FROM usuarios u
     JOIN roles r ON r.id_rol = u.id_rol
     WHERE r.nombre = 'ADMIN'
     ORDER BY u.id_usuario
     LIMIT 1`
  );
  if (byRole.rowCount > 0) {
    return byRole.rows[0].id_usuario;
  }

  throw new Error('No existe usuario para registrar respaldos (define BACKUP_USER_ID o BACKUP_USERNAME)');
}

main();
