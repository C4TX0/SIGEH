const express = require('express');
const rateLimit = require('express-rate-limit');
const { login } = require('../controllers/authController');

const router = express.Router();

const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: Number(process.env.AUTH_RATE_LIMIT || 10),
	standardHeaders: true,
	legacyHeaders: false,
	skipSuccessfulRequests: true,
	message: { message: 'Demasiados intentos de acceso, espera antes de volver a intentar' }
});

router.post('/login', loginLimiter, login);

module.exports = router;
