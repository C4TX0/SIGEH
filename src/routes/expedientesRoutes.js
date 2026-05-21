const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const {
  buscarPacientes,
  getExpedienteCompleto,
  updateAntecedentes
} = require('../controllers/expedientesController');

const router = express.Router();

router.get('/buscar', auth, authorize(['MEDICO', 'USUARIO_GENERAL']), buscarPacientes);
router.get('/:id_paciente', auth, authorize(['MEDICO']), getExpedienteCompleto);
router.put('/:id_expediente', auth, authorize(['MEDICO']), updateAntecedentes);
router.patch('/:id_expediente', auth, authorize(['MEDICO']), updateAntecedentes);

module.exports = router;
