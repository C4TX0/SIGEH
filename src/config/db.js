const { Pool } = require('pg');

const ALLOWED_DB_ROLES = new Set([
  'rol_medico_sigeh',
  'rol_admin_sigeh',
  'rol_usuario_general_sigeh'
]);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.PGHOST,
  port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  max: process.env.PGPOOL_MAX ? Number(process.env.PGPOOL_MAX) : 10,
  idleTimeoutMillis: 30000
});

function parseDbContext(dbRoleContext) {
  if (typeof dbRoleContext === 'string') {
    return {
      role: dbRoleContext,
      userId: null
    };
  }

  if (dbRoleContext && typeof dbRoleContext === 'object') {
    return {
      role: dbRoleContext.role,
      userId: dbRoleContext.userId || null
    };
  }

  return {
    role: null,
    userId: null
  };
}

function requireDbRole(dbRoleContext) {
  const context = parseDbContext(dbRoleContext);

  if (!ALLOWED_DB_ROLES.has(context.role)) {
    throw new Error('Rol de base de datos no permitido');
  }

  return context;
}

async function getClientWithRole(dbRoleContext) {
  const client = await pool.connect();
  const context = requireDbRole(dbRoleContext);

  try {
    await client.query(`SET ROLE ${context.role}`);
    await client.query(
      "SELECT set_config('sigeh.usuario_id', $1, false)",
      [context.userId ? String(context.userId) : '']
    );

    return {
      client,
      release: async () => {
        try {
          await client.query("SELECT set_config('sigeh.usuario_id', '', false)");
          await client.query('RESET ROLE');
        } finally {
          client.release();
        }
      }
    };
  } catch (err) {
    client.release();
    throw err;
  }
}

async function queryWithRole(dbRole, text, params = []) {
  const { client, release } = await getClientWithRole(dbRole);
  try {
    return await client.query(text, params);
  } finally {
    await release();
  }
}

async function withRoleTransaction(dbRole, callback) {
  const { client, release } = await getClientWithRole(dbRole);
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      rollbackErr.message = `Rollback failed: ${rollbackErr.message}`;
      throw rollbackErr;
    }
    throw err;
  } finally {
    await release();
  }
}

module.exports = {
  pool,
  queryWithRole,
  withRoleTransaction
};
