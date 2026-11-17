// Acceso a datos: las únicas funciones que consultan o modifican la tabla usuarios.
// Todas usan consultas parametrizadas ($1, $2...).
const pool = require('../config/db');

// Columnas que se devuelven al cliente (sin el hash de la contraseña).
const COLUMNAS = `u.id, u.run, u.nombre, u.apellidos, u.correo, r.nombre AS rol,
  u.region, u.comuna, u.direccion, u.activo, u.creado_en`;

async function buscarPorCorreoConHash(correo) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS}, u.clave_hash FROM usuarios u JOIN roles r ON r.id = u.rol_id WHERE LOWER(u.correo) = LOWER($1)`,
    [correo],
  );
  return rows[0];
}

async function buscarPorId(id) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS} FROM usuarios u JOIN roles r ON r.id = u.rol_id WHERE u.id = $1`,
    [id],
  );
  return rows[0];
}

async function listar() {
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS} FROM usuarios u JOIN roles r ON r.id = u.rol_id ORDER BY u.id`,
  );
  return rows;
}

async function crear(datos) {
  const { rows } = await pool.query(
    `INSERT INTO usuarios (run, nombre, apellidos, correo, clave_hash, rol_id, region, comuna, direccion)
     VALUES ($1, $2, $3, $4, $5, (SELECT id FROM roles WHERE nombre = $6), $7, $8, $9)
     RETURNING id`,
    [datos.run, datos.nombre, datos.apellidos, datos.correo, datos.claveHash, datos.rol, datos.region, datos.comuna, datos.direccion],
  );
  return buscarPorId(rows[0].id);
}

async function actualizar(id, datos) {
  // COALESCE deja el valor actual cuando el campo no viene.
  await pool.query(
    `UPDATE usuarios SET
       nombre = COALESCE($2, nombre),
       apellidos = COALESCE($3, apellidos),
       region = COALESCE($4, region),
       comuna = COALESCE($5, comuna),
       direccion = COALESCE($6, direccion),
       clave_hash = COALESCE($7, clave_hash),
       rol_id = COALESCE((SELECT id FROM roles WHERE nombre = $8), rol_id)
     WHERE id = $1`,
    [id, datos.nombre, datos.apellidos, datos.region, datos.comuna, datos.direccion, datos.claveHash, datos.rol],
  );
  return buscarPorId(id);
}

async function desactivar(id) {
  await pool.query('UPDATE usuarios SET activo = FALSE WHERE id = $1', [id]);
}

module.exports = { buscarPorCorreoConHash, buscarPorId, listar, crear, actualizar, desactivar };
