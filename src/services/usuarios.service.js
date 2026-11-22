// Servicio de usuarios: reglas para listar, modificar y desactivar.
const bcrypt = require('bcrypt');
const usuariosRepository = require('../repositories/usuarios.repository');
const ErrorApi = require('../utils/ErrorApi');
const { validarUsuario } = require('../utils/validaciones');
const { RONDAS_HASH, limpiar } = require('./auth.service');

const ROLES = ['Administrador', 'Recepcionista', 'Dueño de mascota'];

function esAdmin(solicitante) {
  return solicitante.rol === 'Administrador';
}

function listar() {
  return usuariosRepository.listar();
}

// Alta hecha por el Administrador: a diferencia del registro, él elige el rol.
async function crear(datos) {
  const errores = validarUsuario(datos);
  if (!ROLES.includes(datos.rol)) errores.rol = 'Rol no válido.';
  if (Object.keys(errores).length > 0) throw new ErrorApi(400, 'Datos inválidos', errores);

  const usuario = limpiar(datos);
  if (await usuariosRepository.buscarPorCorreoConHash(usuario.correo)) {
    throw new ErrorApi(409, 'Ya existe una cuenta con ese correo');
  }
  const claveHash = await bcrypt.hash(datos.clave, RONDAS_HASH);
  return usuariosRepository.crear({ ...usuario, claveHash, rol: datos.rol });
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

  // En edición la clave es opcional: si viene vacía se mantiene la anterior.
  if (datos.clave === '') delete datos.clave;
  const errores = validarUsuario(datos, true);
  if (Object.keys(errores).length > 0) throw new ErrorApi(400, 'Datos inválidos', errores);

  const existente = await usuariosRepository.buscarPorId(id);
  if (!existente) throw new ErrorApi(404, 'Usuario no encontrado');

  // El correo no se puede repetir con el de otra cuenta.
  const correo = datos.correo !== undefined ? String(datos.correo).trim().toLowerCase() : undefined;
  if (correo && correo !== existente.correo) {
    const otro = await usuariosRepository.buscarPorCorreoConHash(correo);
    if (otro) throw new ErrorApi(409, 'Ya existe una cuenta con ese correo');
  }
  const run = datos.run !== undefined ? String(datos.run).trim().toUpperCase() : undefined;

  const claveHash = datos.clave ? await bcrypt.hash(datos.clave, RONDAS_HASH) : undefined;
  return usuariosRepository.actualizar(id, { ...datos, run, correo, claveHash });
}

async function desactivar(id, solicitante) {
  if (solicitante.id === id) throw new ErrorApi(409, 'No puedes desactivar tu propia cuenta');
  const existente = await usuariosRepository.buscarPorId(id);
  if (!existente) throw new ErrorApi(404, 'Usuario no encontrado');
  await usuariosRepository.desactivar(id);
}

module.exports = { listar, crear, obtener, modificar, desactivar };
