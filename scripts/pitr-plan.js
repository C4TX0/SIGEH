#!/usr/bin/env node
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/db');

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

async function main() {
  const targetTime = getArg('target-time') || process.env.PITR_TARGET_TIME;
  if (!targetTime) {
    throw new Error('Debe indicar --target-time=YYYY-MM-DDTHH:MM:SS o definir PITR_TARGET_TIME');
  }

  const fullBackup = await pool.query(
    `SELECT ruta_archivo, fecha_fin
     FROM respaldos_realizados
     WHERE estado = 'Exitoso'
       AND tipo_respaldo = 'completo'
     ORDER BY fecha_fin DESC
     LIMIT 1`
  );

  if (fullBackup.rowCount === 0) {
    throw new Error('No existe un respaldo completo base para PITR');
  }

  const walLevel = await pool.query('SHOW wal_level');
  const archiveMode = await pool.query('SHOW archive_mode');
  const archiveCommand = process.env.PITR_ARCHIVE_COMMAND || 'copy %p C:\pg_wal_archive\\%f';
  const recoveryCommand = process.env.PITR_RECOVERY_COMMAND || 'copy C:\pg_wal_archive\\%f %p';

  const plan = {
    ok: true,
    strategy: 'wal_based_pitr_documented_for_academic_scope',
    base_backup: {
      file: fullBackup.rows[0].ruta_archivo,
      fecha_fin: fullBackup.rows[0].fecha_fin
    },
    target_time: targetTime,
    postgres_settings: {
      wal_level: walLevel.rows[0].wal_level,
      archive_mode: archiveMode.rows[0].archive_mode,
      archive_command: archiveCommand,
      recovery_command: recoveryCommand
    },
    procedure: [
      '1. Detener la instancia de destino.',
      '2. Restaurar el respaldo completo base en el servidor de recuperacion.',
      '3. Activar la restauracion usando el comando de recovery correspondiente.',
      '4. Configurar recovery_target_time con el valor indicado.',
      '5. Iniciar PostgreSQL y validar el estado de los datos en el punto solicitado.',
      '6. Registrar evidencia de la hora recuperada y la diferencia respecto a la base original.'
    ],
    limitations: [
      'La activacion de archive_mode y la ubicacion fisica del archive WAL dependen de la configuracion del servidor PostgreSQL.',
      'El proyecto documenta PITR de forma reproducible para entorno academico; no agrega infraestructura enterprise nueva.'
    ]
  };

  const outputDir = path.resolve(process.env.BACKUP_DIR || path.join(process.cwd(), 'backups'), 'pitr');
  fs.mkdirSync(outputDir, { recursive: true });
  const filePath = path.join(outputDir, `pitr_plan_${formatTimestamp()}.md`);

  const markdown = `# Plan PITR SIGEH\n\n` +
    `- Respaldo base: ${plan.base_backup.file}\n` +
    `- Fecha del respaldo base: ${plan.base_backup.fecha_fin}\n` +
    `- Recovery target time: ${targetTime}\n` +
    `- wal_level: ${plan.postgres_settings.wal_level}\n` +
    `- archive_mode: ${plan.postgres_settings.archive_mode}\n` +
    `- archive_command: ${plan.postgres_settings.archive_command}\n` +
    `- recovery_command: ${plan.postgres_settings.recovery_command}\n\n` +
    `## Procedimiento\n\n` +
    plan.procedure.map((step) => `- ${step}`).join('\n') +
    `\n\n## Limitaciones\n\n` +
    plan.limitations.map((item) => `- ${item}`).join('\n') +
    '\n';

  fs.writeFileSync(filePath, markdown, 'utf8');
  console.log(JSON.stringify({
    ok: true,
    file: filePath,
    target_time: targetTime,
    base_backup: plan.base_backup.file,
    wal_level: plan.postgres_settings.wal_level,
    archive_mode: plan.postgres_settings.archive_mode
  }, null, 2));
}

main()
  .catch((error) => {
    console.error('PITR plan failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
