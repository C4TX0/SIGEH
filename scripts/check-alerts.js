#!/usr/bin/env node
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { getSystemOverview, getReplicationStatus } = require('../src/services/monitorService');

function asNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
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
  const thresholds = {
    cpu_percent: asNumber(process.env.ALERT_CPU_THRESHOLD, 85),
    memory_percent: asNumber(process.env.ALERT_MEMORY_THRESHOLD, 85),
    waiting_locks: asNumber(process.env.ALERT_WAITING_LOCKS_THRESHOLD, 0),
    slow_queries: asNumber(process.env.ALERT_SLOW_QUERIES_THRESHOLD, 0),
    deadlocks: asNumber(process.env.ALERT_DEADLOCKS_THRESHOLD, 0)
  };

  const [overview, replication] = await Promise.all([
    getSystemOverview(),
    getReplicationStatus()
  ]);

  const alerts = [];

  if (overview.cpu_usage_percent >= thresholds.cpu_percent) {
    alerts.push({
      area: 'cpu',
      severity: 'warning',
      value: overview.cpu_usage_percent,
      threshold: thresholds.cpu_percent,
      message: 'Uso de CPU por encima del umbral configurado'
    });
  }

  if (overview.memory.usage_percent >= thresholds.memory_percent) {
    alerts.push({
      area: 'memory',
      severity: 'warning',
      value: overview.memory.usage_percent,
      threshold: thresholds.memory_percent,
      message: 'Uso de memoria por encima del umbral configurado'
    });
  }

  if (overview.database.waiting_locks > thresholds.waiting_locks) {
    alerts.push({
      area: 'locks',
      severity: 'warning',
      value: overview.database.waiting_locks,
      threshold: thresholds.waiting_locks,
      message: 'Existen locks en espera'
    });
  }

  if (overview.database.long_running_queries && overview.database.long_running_queries.length > thresholds.slow_queries) {
    alerts.push({
      area: 'slow_queries',
      severity: 'warning',
      value: overview.database.long_running_queries.length,
      threshold: thresholds.slow_queries,
      message: 'Se detectaron consultas largas'
    });
  }

  if (overview.database.deadlocks_total > thresholds.deadlocks) {
    alerts.push({
      area: 'deadlocks',
      severity: 'critical',
      value: overview.database.deadlocks_total,
      threshold: thresholds.deadlocks,
      message: 'El acumulado de deadlocks supera el umbral'
    });
  }

  if (!replication.healthy) {
    alerts.push({
      area: 'replication',
      severity: 'critical',
      value: false,
      threshold: true,
      message: 'La standby no aparece saludable'
    });
  }

  const payload = {
    ok: true,
    checked_at: new Date().toISOString(),
    thresholds,
    alerts,
    overview,
    replication
  };

  const outputDir = path.resolve(process.env.BACKUP_DIR || path.join(process.cwd(), 'backups'), 'alerts');
  fs.mkdirSync(outputDir, { recursive: true });
  const jsonPath = path.join(outputDir, `alerts_${formatTimestamp()}.json`);
  const logPath = path.join(outputDir, 'alerts.log');
  fs.writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  fs.appendFileSync(logPath, `${new Date().toISOString()} ${JSON.stringify({ alerts: alerts.length, summary: alerts.map((item) => item.area) })}\n`, 'utf8');

  console.log(JSON.stringify({
    ok: true,
    json: jsonPath,
    alerts: alerts.length,
    areas: alerts.map((item) => item.area)
  }, null, 2));

  if (alerts.length > 0) {
    process.exitCode = 2;
  }
}

main().catch((error) => {
  console.error('Alert check failed:', error.message);
  process.exitCode = 1;
});
