// Servicio de usuarios: reglas para listar, modificar y desactivar.
const bcrypt = require('bcrypt');
const usuariosRepository = require('../repositories/usuarios.repository');
const ErrorApi = require('../utils/ErrorApi');
const { validarUsuario } = require('../utils/validaciones');
const { RONDAS_HASH } = require('./auth.service');

const ROLES = ['Administrador', 'Recepcionista', 'Dueño de mascota'];

function esAdmin(solicitante) {
  return solicitante.rol === 'Administrador';
}

function listar() {
  return usuariosRepository.listar();
}

async function obtener(id, solicitante) {
  // Cambiar el id en la URL no permite ver la cuenta de otra persona.
  if (!esAdmin(solicitante) && solicitante.id !== id) throw new ErrorApi(403, 'No tienes permiso para ver este usuario');
  const usuario = await usuariosRepository.buscarPorId(id);
  if (!usuario) throw new ErrorApi(404, 'Usuario no encontrado');
  return usuario;
}

async function modificar(id, datos, solicitante) {
  if (!esAdmin(solicitante) && solicitante.id !== id) throw new ErrorApi(403, 'No tienes permiso para modificar este usuario');
  // Solo el Administrador puede cambiar el rol.
  if (datos.rol !== undefined && !esAdmin(solicitante)) throw new ErrorApi(403, 'Solo el Administrador puede cambiar el rol');
  if (datos.rol !== undefined && !ROLES.includes(datos.rol)) throw new ErrorApi(400, 'Datos inválidos', { rol: 'Rol no válido.' });

  const errores = validarUsuario(datos, true);
  if (Object.keys(errores).length > 0) throw new ErrorApi(400, 'Datos inválidos', errores);

  const existente = await usuariosRepository.buscarPorId(id);
  if (!existente) throw new ErrorApi(404, 'Usuario no encontrado');

  const claveHash = datos.clave ? await bcrypt.hash(datos.clave, RONDAS_HASH) : undefined;
  return usuariosRepository.actualizar(id, { ...datos, claveHash });
}

async function desactivar(id, solicitante) {
  if (solicitante.id === id) throw new ErrorApi(409, 'No puedes desactivar tu propia cuenta');
  const existente = await usuariosRepository.buscarPorId(id);
  if (!existente) throw new ErrorApi(404, 'Usuario no encontrado');
  await usuariosRepository.desactivar(id);
}

module.exports = { listar, obtener, modificar, desactivar };
