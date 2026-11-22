const express = require('express');
const router = express.Router();
const citasController = require('../controllers/citas.controller');
const { autenticar, permitirRoles } = require('../middlewares/auth.middleware');

// Todas las rutas de citas exigen un JWT válido.
router.use(autenticar);

router.get('/', citasController.listar);
router.post('/', citasController.crear);
router.get('/:id', citasController.obtener);
router.patch('/:id/estado', citasController.cambiarEstado);
router.patch('/:id/propuesta', permitirRoles('Administrador', 'Recepcionista'), citasController.proponerHorario);
router.post('/:id/aceptar-propuesta', citasController.aceptarPropuesta);
router.delete('/:id', permitirRoles('Administrador'), citasController.eliminar);

module.exports = router;
