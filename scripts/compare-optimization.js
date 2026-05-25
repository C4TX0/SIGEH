#!/usr/bin/env node
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const DEFAULT_QUERY = `
SELECT id_consulta, fecha_hora, id_medico, id_paciente
FROM consultas
WHERE fecha_hora >= NOW() - INTERVAL '90 days'
ORDER BY fecha_hora DESC
LIMIT 100
`;

function formatTimestamp(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}_${hh}${min}${ss}`;
}

function runPsql(sql) {
  return new Promise((resolve, reject) => {
    const child = spawn('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '-c', sql], {
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim());
        return;
      }

      const error = new Error(`psql fallo con codigo ${code}`);
      error.stderr = stderr;
      reject(error);
    });
  });
}

function parsePlan(raw) {
  const json = JSON.parse(raw);
  const first = Array.isArray(json) ? json[0] : json;
  return {
    planning_time_ms: Number(first['Planning Time'] || 0),
    execution_time_ms: Number(first['Execution Time'] || 0),
    plan_rows: Number(first.Plan['Plan Rows'] || 0),
    node_type: first.Plan['Node Type'] || 'Unknown',
    relation_name: first.Plan['Relation Name'] || null,
    filter: first.Plan.Filter || null,
    index_name: first.Plan['Index Name'] || null
  };
}

async function explain(label, preludeSql, query) {
  const sql = `${preludeSql ? `${preludeSql}; ` : ''}EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`;
  const raw = await runPsql(sql);
  return {
    label,
    ...parsePlan(raw)
  };
}

async function main() {
  const query = (process.argv.find((arg) => arg.startsWith('--query=')) || '').slice('--query='.length) || DEFAULT_QUERY;

  const before = await explain(
    'before',
    'SET enable_indexscan = off; SET enable_bitmapscan = off',
    query
  );

  const after = await explain('after', '', query);

  const improvement = before.execution_time_ms > 0
    ? Number((((before.execution_time_ms - after.execution_time_ms) / before.execution_time_ms) * 100).toFixed(2))
    : null;

  const report = {
    ok: true,
    query,
    measured_at: new Date().toISOString(),
    before,
    after,
    improvement_percent: improvement,
    interpretation: improvement === null
      ? 'No fue posible calcular mejora porcentual'
      : (improvement >= 0 ? 'La optimizacion redujo el tiempo de ejecucion' : 'La planificacion optimizada fue mas lenta en esta ejecucion')
  };

  const outputDir = path.resolve(process.env.BACKUP_DIR || path.join(process.cwd(), 'backups'), 'optimization');
  fs.mkdirSync(outputDir, { recursive: true });
  const stamp = formatTimestamp();
  const jsonPath = path.join(outputDir, `optimization_report_${stamp}.json`);
  const mdPath = path.join(outputDir, `optimization_report_${stamp}.md`);

  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  fs.writeFileSync(mdPath, `# Comparativa de optimizacion\n\n` +
    `- Consulta: ${query.trim()}\n` +
    `- Medido en: ${report.measured_at}\n\n` +
    `| Escenario | Planning ms | Execution ms | Nodo raiz |\n` +
    `|---|---:|---:|---|\n` +
    `| Sin index scan | ${before.planning_time_ms} | ${before.execution_time_ms} | ${before.node_type} |\n` +
    `| Con optimizacion actual | ${after.planning_time_ms} | ${after.execution_time_ms} | ${after.node_type} |\n\n` +
    `Mejora porcentual estimada: ${improvement === null ? 'N/D' : `${improvement}%`}\n`, 'utf8');

  console.log(JSON.stringify({
    ok: true,
    json: jsonPath,
    markdown: mdPath,
    before_execution_ms: before.execution_time_ms,
    after_execution_ms: after.execution_time_ms,
    improvement_percent: improvement
  }, null, 2));
}

main().catch((error) => {
  console.error('Optimization comparison failed:', error.message);
  process.exitCode = 1;
});
