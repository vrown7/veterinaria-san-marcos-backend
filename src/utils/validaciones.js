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
  if (viene('region') && !textoValido(datos.region, 100)) errores.region = 'La región es obligatoria.';
  if (viene('comuna') && !textoValido(datos.comuna, 100)) errores.comuna = 'La comuna es obligatoria.';
  if (viene('direccion') && !textoValido(datos.direccion, 300)) errores.direccion = 'La dirección es obligatoria (máximo 300 caracteres).';
  return errores;
}

module.exports = { validarUsuario, correoValido, claveValida };
