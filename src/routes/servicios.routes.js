const express = require('express');
const router = express.Router();
const serviciosController = require('../controllers/servicios.controller');
const { autenticar, permitirRoles } = require('../middlewares/auth.middleware');

// El catálogo es público para leer; solo el Administrador lo modifica.
router.get('/', serviciosController.listar);
router.get('/:id', serviciosController.obtener);
router.post('/', autenticar, permitirRoles('Administrador'), serviciosController.crear);
router.put('/:id', autenticar, permitirRoles('Administrador'), serviciosController.modificar);
router.delete('/:id', autenticar, permitirRoles('Administrador'), serviciosController.eliminar);

module.exports = router;
