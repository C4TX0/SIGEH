#!/usr/bin/env node
require('dotenv').config();

const { restoreDatabaseBackup } = require('../src/services/backupService');

function getArg(name) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : null;
}

async function main() {
  const filePath = getArg('file') || process.env.RESTORE_FILE;
  const targetDb = getArg('db') || process.env.RESTORE_DB;

  if (!filePath) {
    console.error('Uso: node scripts/restore-db.js --file=/ruta/al/backup.sql [--db=sigeh_db_test]');
    process.exit(1);
  }

  try {
    const result = await restoreDatabaseBackup({
      filePath,
      targetDatabase: targetDb
    });

    console.log(JSON.stringify({
      ok: true,
      archivo: result.filePath,
      base_objetivo: result.targetDatabase,
      inicio: result.startAt,
      fin: result.endAt
    }, null, 2));
  } catch (error) {
    console.error('Restore failed:', error.message);
    process.exitCode = 1;
  }
}

main();
