// Acceso a datos del catálogo: las únicas funciones que consultan o modifican la tabla servicios.
const pool = require('../config/db');

const COLUMNAS = `id, codigo, categoria, nombre, especie, duracion, precio, descuento, stock,
  stock_critico AS "stockCritico", observaciones, descripcion, imagen`;

async function listar() {
  const { rows } = await pool.query(`SELECT ${COLUMNAS} FROM servicios ORDER BY id`);
  return rows;
}

async function buscarPorId(id) {
  const { rows } = await pool.query(`SELECT ${COLUMNAS} FROM servicios WHERE id = $1`, [id]);
  return rows[0];
}

async function buscarPorCodigo(codigo) {
  const { rows } = await pool.query(`SELECT ${COLUMNAS} FROM servicios WHERE codigo = $1`, [codigo]);
  return rows[0];
}

async function crear(datos) {
  const { rows } = await pool.query(
    `INSERT INTO servicios (codigo, categoria, nombre, especie, duracion, precio, descuento, stock, stock_critico,
       observaciones, descripcion, imagen)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING id`,
    [datos.codigo, datos.categoria, datos.nombre, datos.especie, datos.duracion, datos.precio, datos.descuento,
      datos.stock, datos.stockCritico, datos.observaciones, datos.descripcion, datos.imagen],
  );
  return buscarPorId(rows[0].id);
}

async function actualizar(id, datos) {
  // COALESCE deja el valor actual cuando el campo no viene.
  await pool.query(
    `UPDATE servicios SET
       codigo = COALESCE($2, codigo),
       categoria = COALESCE($3, categoria),
       nombre = COALESCE($4, nombre),
       especie = COALESCE($5, especie),
       duracion = COALESCE($6, duracion),
       precio = COALESCE($7, precio),
       descuento = COALESCE($8, descuento),
       stock = COALESCE($9, stock),
       stock_critico = COALESCE($10, stock_critico),
       observaciones = COALESCE($11, observaciones),
       descripcion = COALESCE($12, descripcion),
       imagen = COALESCE($13, imagen)
     WHERE id = $1`,
    [id, datos.codigo, datos.categoria, datos.nombre, datos.especie, datos.duracion, datos.precio, datos.descuento,
      datos.stock, datos.stockCritico, datos.observaciones, datos.descripcion, datos.imagen],
  );
  return buscarPorId(id);
}

async function eliminar(id) {
  await pool.query('DELETE FROM servicios WHERE id = $1', [id]);
}

// Cantidad de citas que incluyen el servicio (para no borrar uno que ya se usó).
async function contarCitas(id) {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS total FROM cita_items WHERE servicio_id = $1', [id]);
  return rows[0].total;
}

module.exports = { listar, buscarPorId, buscarPorCodigo, crear, actualizar, eliminar, contarCitas };
