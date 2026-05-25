const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ALLOWED_BACKUP_TYPES = new Set(['completo']);

function getDbConfig() {
  return {
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || '5432',
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE
  };
}

function ensureDbConfig(config) {
  if (!config.user || !config.password || !config.database) {
    throw new Error('Configuracion de DB incompleta para backup/restore (PGUSER, PGPASSWORD, PGDATABASE)');
  }
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

function resolveOutputDir(outputDir) {
  const candidate = outputDir && String(outputDir).trim()
    ? String(outputDir).trim()
    : (process.env.BACKUP_DIR || path.join(process.cwd(), 'backups'));

  return path.resolve(candidate);
}

function runBinary(command, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr, code });
        return;
      }

      const err = new Error(`Comando ${command} fallo con codigo ${code}`);
      err.code = code;
      err.stdout = stdout;
      err.stderr = stderr;
      reject(err);
    });
  });
}

async function createDatabaseBackup({ backupType = 'completo', outputDir } = {}) {
  if (!ALLOWED_BACKUP_TYPES.has(backupType)) {
    throw new Error('Solo se soporta respaldo tipo completo en esta version');
  }

  const dbConfig = getDbConfig();
  ensureDbConfig(dbConfig);

  const startAt = new Date();
  const outDir = resolveOutputDir(outputDir);
  fs.mkdirSync(outDir, { recursive: true });

  const timestamp = formatTimestamp(startAt);
  const fileName = `${dbConfig.database}_${backupType}_${timestamp}.sql`;
  const filePath = path.join(outDir, fileName);

  const args = [
    '-h', dbConfig.host,
    '-p', String(dbConfig.port),
    '-U', dbConfig.user,
    '-d', dbConfig.database,
    '-F', 'p',
    '--no-owner',
    '--no-privileges',
    '-f', filePath
  ];

  await runBinary('pg_dump', args, {
    ...process.env,
    PGPASSWORD: dbConfig.password
  });

  const stat = fs.statSync(filePath);
  const endAt = new Date();
  const sizeMb = Number((stat.size / (1024 * 1024)).toFixed(2));

  return {
    backupType,
    filePath,
    fileName,
    startAt,
    endAt,
    bytes: stat.size,
    sizeMb
  };
}

async function restoreDatabaseBackup({ filePath, targetDatabase } = {}) {
  if (!filePath || !String(filePath).trim()) {
    throw new Error('Archivo de respaldo requerido');
  }

  const absolutePath = path.resolve(String(filePath).trim());
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Archivo no encontrado: ${absolutePath}`);
  }

  const dbConfig = getDbConfig();
  ensureDbConfig(dbConfig);

  const database = targetDatabase && String(targetDatabase).trim()
    ? String(targetDatabase).trim()
    : dbConfig.database;

  const ext = path.extname(absolutePath).toLowerCase();
  const startAt = new Date();

  if (ext === '.dump' || ext === '.backup') {
    const restoreArgs = [
      '-h', dbConfig.host,
      '-p', String(dbConfig.port),
      '-U', dbConfig.user,
      '-d', database,
      '--clean',
      '--if-exists',
      absolutePath
    ];

    await runBinary('pg_restore', restoreArgs, {
      ...process.env,
      PGPASSWORD: dbConfig.password
    });
  } else {
    const restoreArgs = [
      '-h', dbConfig.host,
      '-p', String(dbConfig.port),
      '-U', dbConfig.user,
      '-d', database,
      '-v',
      'ON_ERROR_STOP=1',
      '-f',
      absolutePath
    ];

    await runBinary('psql', restoreArgs, {
      ...process.env,
      PGPASSWORD: dbConfig.password
    });
  }

  const endAt = new Date();
  return {
    filePath: absolutePath,
    targetDatabase: database,
    startAt,
    endAt
  };
}

module.exports = {
  ALLOWED_BACKUP_TYPES,
  createDatabaseBackup,
  restoreDatabaseBackup
};
