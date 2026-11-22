// Servicio de citas (flujo principal): crear, listar, ver detalle y cambiar estado,
// con la regla de negocio del caso y los permisos de cada rol.
const pool = require('../config/db');
const citasRepository = require('../repositories/citas.repository');
const ErrorApi = require('../utils/ErrorApi');
const { validarCita, validarHorario } = require('../utils/validaciones');

// Recargo de la consulta de urgencia fuera de horario (igual que en el frontend).
const RECARGO_URGENCIA = 10000;
const CODIGO_URGENCIA = 'SV002';

const esPersonal = (usuario) => usuario.rol === 'Administrador' || usuario.rol === 'Recepcionista';

// Ejecuta varias consultas como una sola: si una falla, se deshacen todas.
async function enTransaccion(trabajo) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const resultado = await trabajo(cliente);
    await cliente.query('COMMIT');
    return resultado;
  } catch (error) {
    await cliente.query('ROLLBACK');
    // El índice único de la base también protege el horario (dos confirmaciones al mismo tiempo).
    if (error.code === '23505') throw new ErrorApi(409, 'Ese horario ya tiene una cita confirmada');
    throw error;
  } finally {
    cliente.release();
  }
}

function asegurarHorarioLibre(ocupado) {
  if (ocupado) throw new ErrorApi(409, 'Ese horario ya tiene una cita confirmada. Propón otro horario.');
}

// El dueño ve solo sus citas; el personal ve todas.
function listar(usuario) {
  return citasRepository.listar(esPersonal(usuario) ? undefined : usuario.id);
}

async function obtener(id, usuario) {
  const cita = await citasRepository.buscarPorId(id);
  if (!cita) throw new ErrorApi(404, 'Cita no encontrada');
  // Cambiar el id en la URL no permite ver la cita de otra persona.
  if (!esPersonal(usuario) && cita.usuarioId !== usuario.id) {
    throw new ErrorApi(403, 'No tienes permiso para ver esta cita');
  }
  return cita;
}

// Crea la cita "Pendiente". Los precios y el total los calcula el servidor con el catálogo,
// y se descuentan los cupos; si no alcanzan, responde 409 y no se guarda nada.
async function crear(datos, usuario) {
  const errores = validarCita(datos);
  if (Object.keys(errores).length > 0) throw new ErrorApi(400, 'Datos inválidos', errores);

  const id = await enTransaccion(async (cliente) => {
    const pedidos = datos.items.map((i) => ({
      servicioId: Number(i.servicioId),
      cantidad: i.cantidad,
      fueraDeHorario: Boolean(i.fueraDeHorario),
    }));
    const servicios = await citasRepository.serviciosParaCita(cliente, pedidos.map((p) => p.servicioId));

    const items = pedidos.map((pedido) => {
      const servicio = servicios.find((s) => s.id === pedido.servicioId);
      if (!servicio) throw new ErrorApi(400, 'Datos inválidos', { items: 'Uno de los servicios no existe.' });
      const conRecargo = pedido.fueraDeHorario && servicio.codigo === CODIGO_URGENCIA;
      const precioConDescuento = Math.round(servicio.precio * (1 - servicio.descuento / 100));
      return {
        servicioId: servicio.id,
        nombre: conRecargo ? `${servicio.nombre} (fuera de horario)` : servicio.nombre,
        precioUnitario: precioConDescuento + (conRecargo ? RECARGO_URGENCIA : 0),
        cantidad: pedido.cantidad,
      };
    });

    // Cupos: se revisa el total pedido de cada servicio antes de descontar.
    for (const servicio of servicios) {
      const pedido = items.filter((i) => i.servicioId === servicio.id).reduce((suma, i) => suma + i.cantidad, 0);
      if (pedido > servicio.stock) throw new ErrorApi(409, `No quedan cupos suficientes para "${servicio.nombre}".`);
      await citasRepository.sumarCupos(cliente, servicio.id, -pedido);
    }

    const total = items.reduce((suma, i) => suma + i.precioUnitario * i.cantidad, 0);
    return citasRepository.crear(
      cliente,
      {
        usuarioId: usuario.id,
        nombre: String(datos.nombre).trim(),
        apellidos: String(datos.apellidos).trim(),
        correo: String(datos.correo).trim().toLowerCase(),
        telefono: String(datos.telefono).trim(),
        mascota: String(datos.mascota).trim(),
        especie: datos.especie,
        fecha: datos.fecha,
        hora: datos.hora,
        comentario: String(datos.comentario || '').trim(),
        total,
      },
      items,
    );
  });
  return citasRepository.buscarPorId(id);
}

// Devuelve los cupos de una cita que se cancela o se elimina.
async function devolverCupos(cliente, cita) {
  for (const item of cita.items) await citasRepository.sumarCupos(cliente, item.servicioId, item.cantidad);
}

async function cambiarEstado(id, estado, usuario) {
  const cita = await obtener(id, usuario);
  if (!['Confirmada', 'Cancelada'].includes(estado)) {
    throw new ErrorApi(400, 'Datos inválidos', { estado: 'El estado debe ser Confirmada o Cancelada.' });
  }
  // El dueño solo puede cancelar su propia cita; confirmar es tarea del personal.
  if (!esPersonal(usuario) && estado !== 'Cancelada') {
    throw new ErrorApi(403, 'Solo la recepción puede confirmar citas');
  }
  if (cita.estado === 'Cancelada') throw new ErrorApi(409, 'La cita ya está cancelada');
  if (cita.estado === estado) throw new ErrorApi(409, `La cita ya está ${estado.toLowerCase()}`);

  await enTransaccion(async (cliente) => {
    if (estado === 'Confirmada') {
      // REGLA DE NEGOCIO: no se confirma una cita en un horario ya ocupado.
      asegurarHorarioLibre(await citasRepository.horarioOcupado(cita.fecha, cita.hora, cita.id, cliente));
    } else {
      await devolverCupos(cliente, cita);
    }
    await citasRepository.cambiarEstado(cita.id, estado, cliente);
  });
  return citasRepository.buscarPorId(id);
}

// La recepción propone otro horario: la cita queda "Reprogramada" hasta que el dueño acepte.
async function proponerHorario(id, fecha, hora, usuario) {
  const cita = await obtener(id, usuario);
  const errores = validarHorario(fecha, hora);
  if (Object.keys(errores).length > 0) throw new ErrorApi(400, 'Datos inválidos', errores);
  if (cita.estado === 'Cancelada') throw new ErrorApi(409, 'La cita ya está cancelada');
  asegurarHorarioLibre(await citasRepository.horarioOcupado(fecha, hora, cita.id));
  await citasRepository.proponerHorario(cita.id, fecha, hora);
  return citasRepository.buscarPorId(id);
}

// El dueño acepta el horario propuesto: la cita queda confirmada en ese horario.
async function aceptarPropuesta(id, usuario) {
  const cita = await obtener(id, usuario);
  if (cita.usuarioId !== usuario.id) throw new ErrorApi(403, 'Solo el dueño de la cita puede aceptar el cambio');
  if (cita.estado !== 'Reprogramada' || !cita.propuesta) throw new ErrorApi(409, 'La cita no tiene un horario propuesto');

  await enTransaccion(async (cliente) => {
    asegurarHorarioLibre(await citasRepository.horarioOcupado(cita.propuesta.fecha, cita.propuesta.hora, cita.id, cliente));
    await citasRepository.aceptarPropuesta(cita.id, cliente);
  });
  return citasRepository.buscarPorId(id);
}

async function eliminar(id, usuario) {
  const cita = await obtener(id, usuario);
  await enTransaccion(async (cliente) => {
    if (cita.estado !== 'Cancelada') await devolverCupos(cliente, cita);
    await citasRepository.eliminar(cita.id, cliente);
  });
}

module.exports = { listar, obtener, crear, cambiarEstado, proponerHorario, aceptarPropuesta, eliminar };
