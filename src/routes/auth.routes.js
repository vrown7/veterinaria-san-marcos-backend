const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { autenticar } = require('../middlewares/auth.middleware');

router.post('/register', authController.registrar);
router.post('/login', authController.iniciarSesion);
router.get('/me', autenticar, authController.perfil);

module.exports = router;
