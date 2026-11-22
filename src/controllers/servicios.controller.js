const serviciosService = require('../services/servicios.service');
const ErrorApi = require('../utils/ErrorApi');

function leerId(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new ErrorApi(400, 'El id debe ser un número entero positivo');
  return id;
}

async function listar(req, res) {
  res.status(200).json(await serviciosService.listar());
}

async function obtener(req, res) {
  res.status(200).json(await serviciosService.obtener(leerId(req)));
}

async function crear(req, res) {
  res.status(201).json(await serviciosService.crear(req.body || {}));
}

async function modificar(req, res) {
  res.status(200).json(await serviciosService.modificar(leerId(req), req.body || {}));
}

async function eliminar(req, res) {
  await serviciosService.eliminar(leerId(req));
  res.status(204).send();
}

module.exports = { listar, obtener, crear, modificar, eliminar };
