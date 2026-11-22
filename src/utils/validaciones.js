// Validaciones del servidor. Son las mismas reglas del frontend:
// el frontend ayuda al usuario y el backend vuelve a comprobar.

function calcularDigitoVerificador(cuerpoRun) {
  let suma = 0;
  let multiplo = 2;
  for (let i = cuerpoRun.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpoRun[i], 10) * multiplo;
    multiplo = multiplo < 7 ? multiplo + 1 : 2;
  }
  const resto = 11 - (suma % 11);
  if (resto === 11) return '0';
  if (resto === 10) return 'K';
  return String(resto);
}

function runValido(valor) {
  const run = String(valor || '').trim().toUpperCase();
  if (!/^[0-9]+[0-9K]$/.test(run)) return false;
  if (run.length < 7 || run.length > 9) return false;
  return calcularDigitoVerificador(run.slice(0, -1)) === run.slice(-1);
}

function correoValido(valor) {
  const correo = String(valor || '').trim();
  return correo.length <= 100 && /^[^\s@]+@(duoc\.cl|profesor\.duoc\.cl|gmail\.com)$/i.test(correo);
}

function claveValida(valor) {
  return typeof valor === 'string' && valor.length >= 4 && valor.length <= 10;
}

// Fecha de nacimiento opcional: si viene, debe ser una fecha real, no futura y desde 1900.
function fechaNacimientoValida(valor) {
  if (valor === undefined || valor === null || valor === '') return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(valor))) return false;
  const fecha = new Date(`${valor}T00:00:00`);
  return !Number.isNaN(fecha.getTime()) && fecha <= new Date() && fecha >= new Date('1900-01-01T00:00:00');
}

function textoValido(valor, maximo) {
  const texto = String(valor || '').trim();
  return texto.length > 0 && texto.length <= maximo;
}

// Devuelve un objeto con un mensaje por cada campo con error ({} = todo válido).
// Con "parcial" solo se revisan los campos que vienen (para modificar un usuario).
function validarUsuario(datos, parcial = false) {
  const errores = {};
  const viene = (campo) => !parcial || datos[campo] !== undefined;

  if (viene('run') && !runValido(datos.run)) errores.run = 'RUN inválido (sin puntos ni guion).';
  if (viene('nombre') && !textoValido(datos.nombre, 50)) errores.nombre = 'El nombre es obligatorio (máximo 50 caracteres).';
  if (viene('apellidos') && !textoValido(datos.apellidos, 100)) errores.apellidos = 'Los apellidos son obligatorios (máximo 100 caracteres).';
  if (viene('correo') && !correoValido(datos.correo)) errores.correo = 'Usa un correo @duoc.cl, @profesor.duoc.cl o @gmail.com.';
  if (viene('clave') && !claveValida(datos.clave)) errores.clave = 'La contraseña debe tener entre 4 y 10 caracteres.';
  if (!fechaNacimientoValida(datos.fechaNacimiento)) errores.fechaNacimiento = 'Fecha de nacimiento inválida.';
  if (viene('region') && !textoValido(datos.region, 100)) errores.region = 'La región es obligatoria.';
  if (viene('comuna') && !textoValido(datos.comuna, 100)) errores.comuna = 'La comuna es obligatoria.';
  if (viene('direccion') && !textoValido(datos.direccion, 300)) errores.direccion = 'La dirección es obligatoria (máximo 300 caracteres).';
  return errores;
}

// ---------- Catálogo ----------

const esEntero = (valor) => valor !== '' && valor !== null && Number.isInteger(Number(valor));

// Mismas reglas del formulario de servicio del frontend.
function validarServicio(datos, parcial = false) {
  const errores = {};
  const viene = (campo) => !parcial || datos[campo] !== undefined;

  if (viene('codigo') && !/^[A-Z]{2}\d{3}$/.test(String(datos.codigo || '').trim().toUpperCase())) {
    errores.codigo = 'El código debe tener 2 letras y 3 números (ej. SV006).';
  }
  if (viene('nombre') && !textoValido(datos.nombre, 100)) errores.nombre = 'El nombre es obligatorio (máximo 100 caracteres).';
  if (viene('categoria') && !textoValido(datos.categoria, 50)) errores.categoria = 'La categoría es obligatoria.';
  if (viene('especie') && !textoValido(datos.especie, 50)) errores.especie = 'Indica la especie (ej. Perro / Gato).';
  if (viene('duracion') && !textoValido(datos.duracion, 20)) errores.duracion = 'Indica la duración (ej. 30 min).';
  if (viene('precio') && !(esEntero(datos.precio) && Number(datos.precio) > 0)) {
    errores.precio = 'El precio debe ser un número entero mayor a 0.';
  }
  if (viene('descuento') && datos.descuento !== undefined && !(esEntero(datos.descuento) && Number(datos.descuento) >= 0 && Number(datos.descuento) <= 90)) {
    errores.descuento = 'El descuento debe ser un número entre 0 y 90.';
  }
  if (viene('stock') && !(esEntero(datos.stock) && Number(datos.stock) >= 0)) {
    errores.stock = 'Los cupos deben ser un número entero mayor o igual a 0.';
  }
  if (viene('stockCritico') && datos.stockCritico !== undefined && !(esEntero(datos.stockCritico) && Number(datos.stockCritico) >= 0)) {
    errores.stockCritico = 'El mínimo crítico debe ser un número entero mayor o igual a 0.';
  }
  if (datos.descripcion !== undefined && String(datos.descripcion).length > 500) {
    errores.descripcion = 'La descripción no puede superar los 500 caracteres.';
  }
  if (datos.observaciones !== undefined && String(datos.observaciones).length > 200) {
    errores.observaciones = 'Las observaciones no pueden superar los 200 caracteres.';
  }
  return errores;
}

// ---------- Citas ----------

// Horario de atención: lunes a sábado, cada 30 minutos (igual que el frontend).
const HORARIOS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
];
const ESPECIES = ['Perro', 'Gato', 'Conejo', 'Ave', 'Otro'];

// Fecha "AAAA-MM-DD" desde mañana en adelante y que no sea domingo.
function errorFechaCita(fecha) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(fecha || ''))) return 'Selecciona una fecha válida.';
  const dia = new Date(`${fecha}T00:00:00`);
  if (Number.isNaN(dia.getTime())) return 'Selecciona una fecha válida.';
  const manana = new Date();
  manana.setHours(0, 0, 0, 0);
  manana.setDate(manana.getDate() + 1);
  if (dia < manana) return 'La cita debe ser desde mañana en adelante.';
  if (dia.getDay() === 0) return 'Los domingos la clínica no atiende.';
  return '';
}

function validarCita(datos) {
  const errores = {};
  if (!textoValido(datos.nombre, 50)) errores.nombre = 'El nombre es obligatorio.';
  if (!textoValido(datos.apellidos, 100)) errores.apellidos = 'Los apellidos son obligatorios.';
  if (!correoValido(datos.correo)) errores.correo = 'Usa un correo @duoc.cl, @profesor.duoc.cl o @gmail.com.';
  if (!/^9\d{8}$/.test(String(datos.telefono || '').trim())) errores.telefono = 'Ingresa un celular de 9 dígitos que empiece con 9.';
  if (!textoValido(datos.mascota, 50)) errores.mascota = 'Indica el nombre de tu mascota.';
  if (!ESPECIES.includes(datos.especie)) errores.especie = 'Selecciona la especie.';
  const errorFecha = errorFechaCita(datos.fecha);
  if (errorFecha) errores.fecha = errorFecha;
  if (!HORARIOS.includes(datos.hora)) errores.hora = 'Selecciona un horario.';
  if (datos.comentario !== undefined && String(datos.comentario).length > 500) {
    errores.comentario = 'El comentario no puede superar los 500 caracteres.';
  }
  const items = Array.isArray(datos.items) ? datos.items : [];
  if (items.length === 0 || items.some((i) => !Number.isInteger(Number(i.servicioId)) || !(Number.isInteger(i.cantidad) && i.cantidad > 0))) {
    errores.items = 'La solicitud debe tener al menos un servicio con cantidad mayor a 0.';
  }
  return errores;
}

// Valida fecha y hora de una propuesta de cambio de horario.
function validarHorario(fecha, hora) {
  const errores = {};
  const errorFecha = errorFechaCita(fecha);
  if (errorFecha) errores.fecha = errorFecha;
  if (!HORARIOS.includes(hora)) errores.hora = 'Selecciona un horario.';
  return errores;
}

module.exports = { validarUsuario, correoValido, claveValida, validarServicio, validarCita, validarHorario };
