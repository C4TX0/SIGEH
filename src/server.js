require('dotenv').config();
const express = require('express');
const cors = require('cors');

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
const { pool } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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

app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
  res.status(500).json({ message: 'Error interno' });
});

app.listen(PORT, () => {
  console.log(`SIGEH backend en puerto ${PORT}`);
});
