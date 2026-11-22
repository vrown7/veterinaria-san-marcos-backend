const citasService = require('../services/citas.service');
const ErrorApi = require('../utils/ErrorApi');

function leerId(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new ErrorApi(400, 'El id debe ser un número entero positivo');
  return id;
}

async function listar(req, res) {
  res.status(200).json(await citasService.listar(req.usuario));
}

async function obtener(req, res) {
  res.status(200).json(await citasService.obtener(leerId(req), req.usuario));
}

async function crear(req, res) {
  res.status(201).json(await citasService.crear(req.body || {}, req.usuario));
}

async function cambiarEstado(req, res) {
  const { estado } = req.body || {};
  res.status(200).json(await citasService.cambiarEstado(leerId(req), estado, req.usuario));
}

async function proponerHorario(req, res) {
  const { fecha, hora } = req.body || {};
  res.status(200).json(await citasService.proponerHorario(leerId(req), fecha, hora, req.usuario));
}

async function aceptarPropuesta(req, res) {
  res.status(200).json(await citasService.aceptarPropuesta(leerId(req), req.usuario));
}

async function eliminar(req, res) {
  await citasService.eliminar(leerId(req), req.usuario);
  res.status(204).send();
}

module.exports = { listar, obtener, crear, cambiarEstado, proponerHorario, aceptarPropuesta, eliminar };
