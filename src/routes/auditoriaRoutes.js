const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { getAccesos, getCambios } = require('../controllers/auditoriaController');

const router = express.Router();

router.get('/accesos', auth, authorize(['ADMIN']), getAccesos);
router.get('/cambios', auth, authorize(['ADMIN']), getCambios);

module.exports = router;
