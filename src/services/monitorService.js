const os = require('os');
const fs = require('fs');
const { Pool } = require('pg');
const { pool } = require('../config/db');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readCpuTimes() {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;

  cpus.forEach((cpu) => {
    idle += cpu.times.idle;
    total += cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq;
  });

  return { idle, total };
}

async function getCpuUsagePercent() {
  const start = readCpuTimes();
  await sleep(200);
  const end = readCpuTimes();

  const idleDelta = end.idle - start.idle;
  const totalDelta = end.total - start.total;
  if (totalDelta <= 0) return 0;

  const usage = 100 * (1 - idleDelta / totalDelta);
  return Number(usage.toFixed(2));
}

function getMemoryMetrics() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;

  return {
    total_mb: Number((total / (1024 * 1024)).toFixed(2)),
    free_mb: Number((free / (1024 * 1024)).toFixed(2)),
    used_mb: Number((used / (1024 * 1024)).toFixed(2)),
    usage_percent: Number(((used / total) * 100).toFixed(2))
  };
}

function getDiskMetrics() {
  try {
    const stats = fs.statfsSync(process.cwd());
    const total = stats.blocks * stats.bsize;
    const free = stats.bavail * stats.bsize;
    const used = total - free;

    return {
      total_gb: Number((total / (1024 ** 3)).toFixed(2)),
      free_gb: Number((free / (1024 ** 3)).toFixed(2)),
      used_gb: Number((used / (1024 ** 3)).toFixed(2)),
      usage_percent: total > 0 ? Number(((used / total) * 100).toFixed(2)) : 0
    };
  } catch (err) {
    return { error: 'No se pudo obtener uso de disco' };
  }
}

async function getDbMetrics() {
  const [
    dbSize,
    connByState,
    activeConn,
    waitingLocks,
    deadlocks,
    longQueries,
    backends
  ] = await Promise.all([
    pool.query("SELECT pg_database_size(current_database()) AS bytes, pg_size_pretty(pg_database_size(current_database())) AS pretty"),
    pool.query("SELECT COALESCE(state,'unknown') AS state, count(*) AS total FROM pg_stat_activity GROUP BY COALESCE(state,'unknown') ORDER BY total DESC"),
    pool.query('SELECT count(*) AS total FROM pg_stat_activity'),
    pool.query('SELECT count(*) AS waiting FROM pg_locks WHERE NOT granted'),
    pool.query('SELECT COALESCE(sum(deadlocks),0) AS total FROM pg_stat_database WHERE datname = current_database()'),
    pool.query("SELECT pid, usename, now() - query_start AS duration, state, left(query, 200) AS query FROM pg_stat_activity WHERE state <> 'idle' AND query_start IS NOT NULL AND now() - query_start > interval '5 seconds' ORDER BY query_start ASC LIMIT 20"),
    pool.query("SELECT count(*) AS total FROM pg_stat_activity WHERE backend_type = 'client backend'")
  ]);

  return {
    db_size: dbSize.rows[0],
    total_connections: Number(activeConn.rows[0].total || 0),
    sessions_by_state: connByState.rows,
    waiting_locks: Number(waitingLocks.rows[0].waiting || 0),
    deadlocks_total: Number(deadlocks.rows[0].total || 0),
    long_running_queries: longQueries.rows,
    client_backends: Number(backends.rows[0].total || 0)
  };
}

async function getReplicationStatus() {
  const standbyDb = process.env.STANDBY_DB || 'sigeh_db_standby';

  const primarySnapshot = await pool.query(
    `SELECT
       (SELECT count(*) FROM pacientes) AS pacientes,
       (SELECT count(*) FROM consultas) AS consultas,
       (SELECT count(*) FROM facturas) AS facturas,
       (SELECT max(fecha_creacion) FROM consultas) AS ultima_consulta`
  );

  const cfg = {
    connectionString: process.env.DATABASE_URL,
    host: process.env.PGHOST,
    port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: standbyDb,
    max: 1,
    idleTimeoutMillis: 5000
  };

  const standbyPool = new Pool(cfg);
  try {
    const standbySnapshot = await standbyPool.query(
      `SELECT
         (SELECT count(*) FROM pacientes) AS pacientes,
         (SELECT count(*) FROM consultas) AS consultas,
         (SELECT count(*) FROM facturas) AS facturas,
         (SELECT max(fecha_creacion) FROM consultas) AS ultima_consulta`
    );

    const p = primarySnapshot.rows[0];
    const s = standbySnapshot.rows[0];

    return {
      strategy: 'standby_por_refresco_programado',
      standby_database: standbyDb,
      primary: p,
      standby: s,
      deltas: {
        pacientes: Number(p.pacientes || 0) - Number(s.pacientes || 0),
        consultas: Number(p.consultas || 0) - Number(s.consultas || 0),
        facturas: Number(p.facturas || 0) - Number(s.facturas || 0)
      },
      healthy: Number(p.consultas || 0) >= Number(s.consultas || 0)
    };
  } catch (err) {
    return {
      strategy: 'standby_por_refresco_programado',
      standby_database: standbyDb,
      healthy: false,
      error: err.message
    };
  } finally {
    await standbyPool.end();
  }
}

async function getSystemOverview() {
  const [cpu, db] = await Promise.all([
    getCpuUsagePercent(),
    getDbMetrics()
  ]);

  return {
    timestamp: new Date().toISOString(),
    host: os.hostname(),
    cpu_usage_percent: cpu,
    memory: getMemoryMetrics(),
    disk: getDiskMetrics(),
    database: db
  };
}

module.exports = {
  getSystemOverview,
  getReplicationStatus
};
