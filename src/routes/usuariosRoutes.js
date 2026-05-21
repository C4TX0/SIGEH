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

router.get('/', auth, authorize(['ADMIN']), listUsuarios);
router.get('/:id', auth, authorize(['ADMIN']), getUsuarioById);
router.post('/', auth, authorize(['ADMIN']), createUsuario);
router.put('/:id', auth, authorize(['ADMIN']), updateUsuario);
router.delete('/:id', auth, authorize(['ADMIN']), deleteUsuario);

module.exports = router;
