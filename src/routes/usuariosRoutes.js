const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const {
  listUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deleteUsuario
} = require('../controllers/usuariosController');

const router = express.Router();
const usersRateLimit = require('express-rate-limit');

const userMutationLimiter = usersRateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false
});

router.get('/', auth, authorize(['ADMIN']), listUsuarios);
router.get('/:id', auth, authorize(['ADMIN']), getUsuarioById);
router.post('/', auth, authorize(['ADMIN']), userMutationLimiter, createUsuario);
router.put('/:id', auth, authorize(['ADMIN']), userMutationLimiter, updateUsuario);
router.delete('/:id', auth, authorize(['ADMIN']), userMutationLimiter, deleteUsuario);

module.exports = router;
