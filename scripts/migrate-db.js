#!/usr/bin/env node
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { createDatabaseBackup, restoreDatabaseBackup } = require('../src/services/backupService');

function getArg(name) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : null;
}

function tempEnv(target) {
  const snapshot = {
    PGHOST: process.env.PGHOST,
    PGPORT: process.env.PGPORT,
    PGUSER: process.env.PGUSER,
    PGPASSWORD: process.env.PGPASSWORD,
    PGDATABASE: process.env.PGDATABASE
  };

  process.env.PGHOST = target.host || process.env.PGHOST;
  process.env.PGPORT = target.port || process.env.PGPORT;
  process.env.PGUSER = target.user || process.env.PGUSER;
  process.env.PGPASSWORD = target.password || process.env.PGPASSWORD;
  process.env.PGDATABASE = target.database || process.env.PGDATABASE;

  return () => {
    process.env.PGHOST = snapshot.PGHOST;
    process.env.PGPORT = snapshot.PGPORT;
    process.env.PGUSER = snapshot.PGUSER;
    process.env.PGPASSWORD = snapshot.PGPASSWORD;
    process.env.PGDATABASE = snapshot.PGDATABASE;
  };
}

function runCommand(command, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      const error = new Error(`Comando ${command} fallo con codigo ${code}`);
      error.stderr = stderr;
      reject(error);
    });
  });
}

async function main() {
  const target = {
    host: getArg('target-host') || process.env.MIGRATION_TARGET_HOST,
    port: getArg('target-port') || process.env.MIGRATION_TARGET_PORT,
    user: getArg('target-user') || process.env.MIGRATION_TARGET_USER || process.env.PGUSER,
    password: getArg('target-password') || process.env.MIGRATION_TARGET_PASSWORD,
    database: getArg('target-db') || process.env.MIGRATION_TARGET_DB || `${process.env.PGDATABASE || 'sigeh_db'}_migrated`
  };

  if (!target.host || !target.port || !target.user || !target.password || !target.database) {
    throw new Error('Faltan parametros de migracion: target host, port, user, password o db');
  }

  const restoreFile = getArg('file') || getArg('backup-file') || null;
  let backupResult = null;

  if (restoreFile) {
    const absolute = path.resolve(restoreFile);
    if (!fs.existsSync(absolute)) {
      throw new Error(`No existe el archivo de backup indicado: ${absolute}`);
    }
    backupResult = { filePath: absolute };
  } else {
    backupResult = await createDatabaseBackup({ backupType: 'completo' });
  }

  const restoreTarget = tempEnv(target);
  try {
    await runCommand('createdb', [
      '--if-not-exists',
      '-h', target.host,
      '-p', String(target.port),
      '-U', target.user,
      target.database
    ], {
      PGPASSWORD: target.password
    });

    const restored = await restoreDatabaseBackup({
      filePath: backupResult.filePath,
      targetDatabase: target.database
    });

    const reportDir = path.resolve(process.env.BACKUP_DIR || path.join(process.cwd(), 'backups'), 'migrations');
    fs.mkdirSync(reportDir, { recursive: true });
    const reportPath = path.join(reportDir, `migration_${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify({
      ok: true,
      source_file: backupResult.filePath,
      target: {
        host: target.host,
        port: target.port,
        user: target.user,
        database: target.database
      },
      restored_at: restored.endAt,
      report: reportPath
    }, null, 2));

    console.log(JSON.stringify({
      ok: true,
      source_file: backupResult.filePath,
      target_database: target.database,
      report: reportPath,
      restored_at: restored.endAt
    }, null, 2));
  } finally {
    restoreTarget();
  }
}

main().catch((error) => {
  console.error('Migration failed:', error.message);
  process.exitCode = 1;
});
