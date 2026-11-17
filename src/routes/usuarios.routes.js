const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuarios.controller');
const { autenticar, permitirRoles } = require('../middlewares/auth.middleware');

// Todas las rutas de usuarios exigen un JWT válido.
router.use(autenticar);

router.get('/', permitirRoles('Administrador'), usuariosController.listar);
router.get('/:id', usuariosController.obtener);
router.put('/:id', usuariosController.modificar);
router.delete('/:id', permitirRoles('Administrador'), usuariosController.desactivar);

module.exports = router;
