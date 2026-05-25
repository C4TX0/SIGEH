require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const pacientesRoutes = require('./routes/pacientesRoutes');
const consultasRoutes = require('./routes/consultasRoutes');
const medicosRoutes = require('./routes/medicosRoutes');
const expedientesRoutes = require('./routes/expedientesRoutes');
const reportesRoutes = require('./routes/reportesRoutes');
const catalogosRoutes = require('./routes/catalogosRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const auditoriaRoutes = require('./routes/auditoriaRoutes');
const facturacionRoutes = require('./routes/facturacionRoutes');
const medicoOperativoRoutes = require('./routes/medicoOperativoRoutes');
const infraRoutes = require('./routes/infraRoutes');
const operacionRoutes = require('./routes/operacionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { pool } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || origin === 'null') {
      return callback(null, true);
    }

    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Origen no permitido por CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.API_RATE_LIMIT || 500),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiadas solicitudes, intenta de nuevo mas tarde' }
});

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use('/api', apiLimiter);

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, message: 'DB no conectada' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/consultas', consultasRoutes);
app.use('/api/medicos', medicosRoutes);
app.use('/api/expedientes', expedientesRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/catalogos', catalogosRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/auditoria', auditoriaRoutes);
app.use('/api/facturacion', facturacionRoutes);
app.use('/api/medico', medicoOperativoRoutes);
app.use('/api/infra', infraRoutes);
app.use('/api/operacion', operacionRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
  res.status(500).json({ message: 'Error interno' });
});

app.listen(PORT, () => {
  console.log(`SIGEH backend en puerto ${PORT}`);
});
