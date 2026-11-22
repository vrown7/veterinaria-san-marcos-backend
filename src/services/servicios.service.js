// Servicio del catálogo: reglas para crear, modificar y eliminar servicios veterinarios.
const serviciosRepository = require('../repositories/servicios.repository');
const ErrorApi = require('../utils/ErrorApi');
const { validarServicio } = require('../utils/validaciones');

// Deja los datos con el formato que guarda la base (textos sin espacios extra, números enteros).
function limpiar(datos) {
  const texto = (valor) => (valor === undefined ? undefined : String(valor).trim());
  const numero = (valor) => (valor === undefined ? undefined : Number(valor));
  return {
    codigo: datos.codigo === undefined ? undefined : String(datos.codigo).trim().toUpperCase(),
    categoria: texto(datos.categoria),
    nombre: texto(datos.nombre),
    especie: texto(datos.especie),
    duracion: texto(datos.duracion),
    precio: numero(datos.precio),
    descuento: numero(datos.descuento),
    stock: numero(datos.stock),
    stockCritico: numero(datos.stockCritico),
    observaciones: texto(datos.observaciones),
    descripcion: texto(datos.descripcion),
    imagen: texto(datos.imagen),
  };
}

function listar() {
  return serviciosRepository.listar();
}

async function obtener(id) {
  const servicio = await serviciosRepository.buscarPorId(id);
  if (!servicio) throw new ErrorApi(404, 'Servicio no encontrado');
  return servicio;
}

async function crear(datos) {
  const errores = validarServicio(datos);
  if (Object.keys(errores).length > 0) throw new ErrorApi(400, 'Datos inválidos', errores);

  const servicio = limpiar(datos);
  if (await serviciosRepository.buscarPorCodigo(servicio.codigo)) {
    throw new ErrorApi(409, 'Ya existe un servicio con ese código');
  }
  return serviciosRepository.crear({
    ...servicio,
    descuento: servicio.descuento ?? 0,
    stockCritico: servicio.stockCritico ?? 0,
    observaciones: servicio.observaciones ?? '',
    descripcion: servicio.descripcion ?? '',
    imagen: servicio.imagen || '/img/consulta-general.jpg',
  });
}

async function modificar(id, datos) {
  const errores = validarServicio(datos, true);
  if (Object.keys(errores).length > 0) throw new ErrorApi(400, 'Datos inválidos', errores);

  const existente = await obtener(id);
  const cambios = limpiar(datos);
  if (cambios.codigo && cambios.codigo !== existente.codigo && (await serviciosRepository.buscarPorCodigo(cambios.codigo))) {
    throw new ErrorApi(409, 'Ya existe un servicio con ese código');
  }
  return serviciosRepository.actualizar(id, cambios);
}

async function eliminar(id) {
  await obtener(id);
  // Un servicio que ya está en citas no se borra: esas citas perderían su detalle.
  if ((await serviciosRepository.contarCitas(id)) > 0) {
    throw new ErrorApi(409, 'No se puede eliminar: el servicio ya está en citas. Puedes dejarlo sin cupos.');
  }
  await serviciosRepository.eliminar(id);
}

module.exports = { listar, obtener, crear, modificar, eliminar };
