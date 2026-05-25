const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const {
	getAccesos,
	getCambios,
	getRespaldos,
	createRespaldo
} = require('../controllers/auditoriaController');

const router = express.Router();

router.get('/accesos', auth, authorize(['ADMIN']), getAccesos);
router.get('/cambios', auth, authorize(['ADMIN']), getCambios);
router.get('/respaldos', auth, authorize(['ADMIN']), getRespaldos);
router.post('/respaldos', auth, authorize(['ADMIN']), createRespaldo);

module.exports = router;
