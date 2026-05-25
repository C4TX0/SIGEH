const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const {
  getResumenMedico,
  getAgendaHoy,
  atenderConsulta,
  crearReceta,
  surtirReceta,
  solicitarEstudio,
  listarHospitalizaciones,
  registrarHospitalizacion,
  altaHospitalizacion
} = require('../controllers/medicoOperativoController');

const router = express.Router();

router.get('/resumen', auth, authorize(['MEDICO']), getResumenMedico);
router.get('/agenda', auth, authorize(['MEDICO']), getAgendaHoy);
router.patch('/consultas/:id/atender', auth, authorize(['MEDICO']), atenderConsulta);
router.post('/consultas/:id/recetas', auth, authorize(['MEDICO']), crearReceta);
router.patch('/recetas/:id/surtir', auth, authorize(['ADMIN']), surtirReceta);
router.post('/consultas/:id/estudios', auth, authorize(['MEDICO']), solicitarEstudio);
router.get('/hospitalizaciones', auth, authorize(['MEDICO']), listarHospitalizaciones);
router.post('/hospitalizaciones', auth, authorize(['MEDICO']), registrarHospitalizacion);
router.patch('/hospitalizaciones/:id/alta', auth, authorize(['MEDICO']), altaHospitalizacion);

module.exports = router;
