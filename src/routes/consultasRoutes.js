const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { crearConsulta } = require('../controllers/consultasController');

const router = express.Router();

router.post('/', auth, authorize(['ADMIN', 'USUARIO_GENERAL']), crearConsulta);

module.exports = router;
