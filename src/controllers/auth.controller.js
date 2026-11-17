// Controlador: recibe la solicitud HTTP y devuelve la respuesta con su estado.
const authService = require('../services/auth.service');

async function registrar(req, res) {
  const usuario = await authService.registrar(req.body || {});
  res.status(201).json(usuario);
}

async function iniciarSesion(req, res) {
  const { correo, clave } = req.body || {};
  const sesion = await authService.iniciarSesion(correo, clave);
  res.status(200).json(sesion);
}

// Devuelve el usuario del token validado, nunca un id enviado por el cliente.
function perfil(req, res) {
  res.status(200).json(req.usuario);
}

module.exports = { registrar, iniciarSesion, perfil };
