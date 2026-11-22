// Servicio de autenticación: reglas del registro y del inicio de sesión.
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const usuariosRepository = require('../repositories/usuarios.repository');
const ErrorApi = require('../utils/ErrorApi');
const { validarUsuario, correoValido, claveValida } = require('../utils/validaciones');

const RONDAS_HASH = 10;
const ROL_INICIAL = 'Dueño de mascota';

function limpiar(datos) {
  return {
    run: String(datos.run || '').trim().toUpperCase(),
    nombre: String(datos.nombre || '').trim(),
    apellidos: String(datos.apellidos || '').trim(),
    correo: String(datos.correo || '').trim().toLowerCase(),
    fechaNacimiento: datos.fechaNacimiento || null,
    region: String(datos.region || '').trim(),
    comuna: String(datos.comuna || '').trim(),
    direccion: String(datos.direccion || '').trim(),
  };
}

async function registrar(datos) {
  const errores = validarUsuario(datos);
  if (Object.keys(errores).length > 0) throw new ErrorApi(400, 'Datos inválidos', errores);

  const usuario = limpiar(datos);
  const existente = await usuariosRepository.buscarPorCorreoConHash(usuario.correo);
  if (existente) throw new ErrorApi(409, 'Ya existe una cuenta con ese correo');

  // El rol lo asigna el servidor: aunque el cliente envíe "rol", se ignora.
  const claveHash = await bcrypt.hash(datos.clave, RONDAS_HASH);
  return usuariosRepository.crear({ ...usuario, claveHash, rol: ROL_INICIAL });
}

async function iniciarSesion(correo, clave) {
  if (!correoValido(correo) || !claveValida(clave)) throw new ErrorApi(400, 'Correo o contraseña con formato inválido');

  const usuario = await usuariosRepository.buscarPorCorreoConHash(correo.trim());
  // Mismo mensaje si el correo no existe, la clave no coincide o la cuenta está desactivada.
  const claveCorrecta = usuario ? await bcrypt.compare(clave, usuario.clave_hash) : false;
  if (!usuario || !claveCorrecta || !usuario.activo) throw new ErrorApi(401, 'Credenciales incorrectas');

  const accessToken = jwt.sign({ rol: usuario.rol }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    subject: String(usuario.id),
    expiresIn: process.env.JWT_EXPIRA || '1h',
    issuer: process.env.JWT_EMISOR,
    audience: process.env.JWT_DESTINATARIO,
  });
  return { accessToken, tipo: 'Bearer', expiraEn: process.env.JWT_EXPIRA || '1h' };
}

module.exports = { registrar, iniciarSesion, limpiar, RONDAS_HASH };
