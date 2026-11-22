// Acceso a datos de las citas y sus servicios (tablas citas y cita_items).
const pool = require('../config/db');

const COLUMNAS = `c.id, c.usuario_id AS "usuarioId", c.estado, c.nombre, c.apellidos, c.correo, c.telefono,
  c.mascota, c.especie, TO_CHAR(c.fecha, 'YYYY-MM-DD') AS fecha, c.hora, c.comentario, c.total,
  TO_CHAR(c.propuesta_fecha, 'YYYY-MM-DD') AS "propuestaFecha", c.propuesta_hora AS "propuestaHora",
  c.creado_en AS "fechaCreacion"`;

// Número visible de la solicitud: 7 -> "SOL-00007".
const numero = (id) => `SOL-${String(id).padStart(5, '0')}`;

// Junta cada cita con sus servicios y arma el formato que usa el frontend.
async function conItems(citas, cliente = pool) {
  if (citas.length === 0) return [];
  const { rows } = await cliente.query(
    `SELECT cita_id, servicio_id AS "servicioId", nombre, precio_unitario AS "precioUnitario", cantidad
     FROM cita_items WHERE cita_id = ANY($1) ORDER BY id`,
    [citas.map((c) => c.id)],
  );
  return citas.map(({ propuestaFecha, propuestaHora, ...cita }) => ({
    ...cita,
    numero: numero(cita.id),
    propuesta: propuestaFecha ? { fecha: propuestaFecha, hora: propuestaHora } : null,
    items: rows.filter((i) => i.cita_id === cita.id).map(({ cita_id: _cita, ...item }) => item),
  }));
}

// Todas las citas, o solo las de un usuario si se indica usuarioId.
async function listar(usuarioId) {
  const { rows } = usuarioId
    ? await pool.query(`SELECT ${COLUMNAS} FROM citas c WHERE c.usuario_id = $1 ORDER BY c.id DESC`, [usuarioId])
    : await pool.query(`SELECT ${COLUMNAS} FROM citas c ORDER BY c.id DESC`);
  return conItems(rows);
}

async function buscarPorId(id, cliente = pool) {
  const { rows } = await cliente.query(`SELECT ${COLUMNAS} FROM citas c WHERE c.id = $1`, [id]);
  return (await conItems(rows, cliente))[0];
}

// ¿Hay otra cita confirmada en esa fecha y hora? (la regla del 409)
async function horarioOcupado(fecha, hora, idExcluido, cliente = pool) {
  const { rows } = await cliente.query(
    `SELECT id FROM citas WHERE fecha = $1 AND hora = $2 AND estado = 'Confirmada' AND id <> $3`,
    [fecha, hora, idExcluido],
  );
  return rows.length > 0;
}

// Crea la cita y sus ítems dentro de una transacción (cliente con BEGIN ya abierto).
async function crear(cliente, cita, items) {
  const { rows } = await cliente.query(
    `INSERT INTO citas (usuario_id, nombre, apellidos, correo, telefono, mascota, especie, fecha, hora, comentario, total)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING id`,
    [cita.usuarioId, cita.nombre, cita.apellidos, cita.correo, cita.telefono, cita.mascota, cita.especie,
      cita.fecha, cita.hora, cita.comentario, cita.total],
  );
  const citaId = rows[0].id;
  for (const item of items) {
    await cliente.query(
      `INSERT INTO cita_items (cita_id, servicio_id, nombre, precio_unitario, cantidad) VALUES ($1, $2, $3, $4, $5)`,
      [citaId, item.servicioId, item.nombre, item.precioUnitario, item.cantidad],
    );
  }
  return citaId;
}

async function cambiarEstado(id, estado, cliente = pool) {
  await cliente.query('UPDATE citas SET estado = $2, propuesta_fecha = NULL, propuesta_hora = NULL WHERE id = $1', [id, estado]);
}

async function proponerHorario(id, fecha, hora) {
  await pool.query(
    `UPDATE citas SET estado = 'Reprogramada', propuesta_fecha = $2, propuesta_hora = $3 WHERE id = $1`,
    [id, fecha, hora],
  );
}

// El dueño acepta: la propuesta pasa a ser la fecha y hora de la cita, y queda confirmada.
async function aceptarPropuesta(id, cliente = pool) {
  await cliente.query(
    `UPDATE citas SET fecha = propuesta_fecha, hora = propuesta_hora, estado = 'Confirmada',
       propuesta_fecha = NULL, propuesta_hora = NULL
     WHERE id = $1`,
    [id],
  );
}

async function eliminar(id, cliente = pool) {
  await cliente.query('DELETE FROM citas WHERE id = $1', [id]);
}

// ---- Cupos del catálogo (stock) ----

// Lee los servicios pedidos y los bloquea hasta terminar la transacción (FOR UPDATE),
// para que dos solicitudes al mismo tiempo no usen los mismos cupos.
async function serviciosParaCita(cliente, ids) {
  const { rows } = await cliente.query(
    'SELECT id, codigo, nombre, precio, descuento, stock FROM servicios WHERE id = ANY($1) FOR UPDATE',
    [ids],
  );
  return rows;
}

async function sumarCupos(cliente, servicioId, cantidad) {
  await cliente.query('UPDATE servicios SET stock = stock + $2 WHERE id = $1', [servicioId, cantidad]);
}

module.exports = {
  listar, buscarPorId, horarioOcupado, crear, cambiarEstado, proponerHorario, aceptarPropuesta, eliminar,
  serviciosParaCita, sumarCupos,
};
