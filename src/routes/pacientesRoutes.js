const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const {
  createPaciente,
  buscarPacientes,
  getPacientes,
  getPacienteById,
  updatePaciente
} = require('../controllers/pacientesController');

const router = express.Router();

router.post('/', auth, authorize(['ADMIN', 'USUARIO_GENERAL']), createPaciente);
router.get('/', auth, authorize(['ADMIN', 'USUARIO_GENERAL']), getPacientes);
router.get('/buscar', auth, authorize(['ADMIN', 'USUARIO_GENERAL']), buscarPacientes);
router.get('/:id', auth, authorize(['ADMIN', 'USUARIO_GENERAL']), getPacienteById);
router.put('/:id', auth, authorize(['ADMIN', 'USUARIO_GENERAL']), updatePaciente);

module.exports = router;
