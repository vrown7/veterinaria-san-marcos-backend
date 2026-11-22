const usuariosService = require('../services/usuarios.service');
const ErrorApi = require('../utils/ErrorApi');

function leerId(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new ErrorApi(400, 'El id debe ser un número entero positivo');
  return id;
}

async function listar(req, res) {
  res.status(200).json(await usuariosService.listar());
}

async function crear(req, res) {
  res.status(201).json(await usuariosService.crear(req.body || {}));
}

async function obtener(req, res) {
  res.status(200).json(await usuariosService.obtener(leerId(req), req.usuario));
}

async function modificar(req, res) {
  res.status(200).json(await usuariosService.modificar(leerId(req), req.body || {}, req.usuario));
}

async function desactivar(req, res) {
  await usuariosService.desactivar(leerId(req), req.usuario);
  res.status(204).send();
}

module.exports = { listar, crear, obtener, modificar, desactivar };
