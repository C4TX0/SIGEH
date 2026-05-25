#!/usr/bin/env node
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/db');

const EXCLUDED_TABLES = new Set([
  'auditoria_cambios',
  'respaldos_realizados',
  'bitacora_accesos'
]);

function getArg(name) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : null;
}

function formatTimestamp(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}_${hh}${min}${ss}`;
}

function resolveOutputDir(value) {
  const candidate = value && String(value).trim()
    ? String(value).trim()
    : (process.env.BACKUP_DIR || path.join(process.cwd(), 'backups'));
  return path.resolve(candidate, 'deltas');
}

function safeTableName(value) {
  return String(value || '').trim().replace(/[^a-zA-Z0-9_]/g, '');
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
  const byUsername = await pool.query('SELECT id_usuario FROM usuarios WHERE username = $1 LIMIT 1', [username]);
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

async function getBaselineTimestamp(mode) {
  if (mode === 'diferencial') {
    const result = await pool.query(
      `SELECT MAX(fecha_fin) AS baseline_at
       FROM respaldos_realizados
       WHERE estado = 'Exitoso'
         AND tipo_respaldo = 'completo'`
    );

    return result.rows[0].baseline_at;
  }

  const result = await pool.query(
    `SELECT MAX(fecha_fin) AS baseline_at
     FROM respaldos_realizados
     WHERE estado = 'Exitoso'`
  );

  return result.rows[0].baseline_at;
}

async function getAffectedTables(since) {
  const result = await pool.query(
    `SELECT
       tabla_afectada,
       COUNT(*)::int AS cambios,
       MAX(fecha_hora) AS ultima_modificacion,
       ARRAY_REMOVE(ARRAY_AGG(DISTINCT operacion), NULL) AS operaciones
     FROM auditoria_cambios
     WHERE fecha_hora > $1
       AND tabla_afectada <> ALL($2::text[])
     GROUP BY tabla_afectada
     ORDER BY tabla_afectada`,
    [since, Array.from(EXCLUDED_TABLES)]
  );

  return result.rows.map((row) => ({
    tabla_afectada: row.tabla_afectada,
    cambios: Number(row.cambios || 0),
    ultima_modificacion: row.ultima_modificacion,
    operaciones: row.operaciones || []
  }));
}

async function main() {
  const mode = (getArg('mode') || 'diferencial').toLowerCase();
  if (!['diferencial', 'incremental'].includes(mode)) {
    throw new Error('El modo debe ser diferencial o incremental');
  }

  const baselineAt = await getBaselineTimestamp(mode);
  if (!baselineAt) {
    throw new Error(`No existe un respaldo base exitoso para modo ${mode}`);
  }

  const affectedTables = await getAffectedTables(baselineAt);
  const generatedAt = new Date();
  const outputDir = resolveOutputDir(getArg('dir'));
  fs.mkdirSync(outputDir, { recursive: true });

  const databaseName = process.env.PGDATABASE || 'sigeh_db';
  const fileName = `${databaseName}_${mode}_${formatTimestamp(generatedAt)}.json`;
  const filePath = path.join(outputDir, fileName);

  const manifest = {
    ok: true,
    mode,
    database: databaseName,
    baseline_at: baselineAt,
    generated_at: generatedAt.toISOString(),
    strategy: 'logical_delta_manifest_based_on_audit_trail',
    excluded_tables: Array.from(EXCLUDED_TABLES),
    total_tables: affectedTables.length,
    affected_tables: affectedTables
  };

  fs.writeFileSync(filePath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  const sizeBytes = fs.statSync(filePath).size;
  const sizeMb = Number((sizeBytes / (1024 * 1024)).toFixed(2));
  const userId = await resolveBackupUserId();

  const insert = await pool.query(
    `INSERT INTO respaldos_realizados (
       tipo_respaldo, fecha_inicio, fecha_fin,
       tamanio_mb, ruta_archivo, estado, id_usuario
     ) VALUES ($1, $2, $3, $4, $5, 'Exitoso', $6)
     RETURNING id_respaldo`,
    [mode, baselineAt, generatedAt, sizeMb, filePath, userId]
  );

  console.log(JSON.stringify({
    ok: true,
    id_respaldo: insert.rows[0].id_respaldo,
    archivo: filePath,
    size_mb: sizeMb,
    baseline_at: baselineAt,
    affected_tables: affectedTables.length,
    mode
  }, null, 2));
}

main()
  .catch((error) => {
    console.error('Delta backup report failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
