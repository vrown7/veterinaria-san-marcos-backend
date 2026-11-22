// Especificación OpenAPI de la API. Swagger UI la muestra en /api/docs.
// Debe mantenerse igual al comportamiento real de las rutas.

const usuarioEjemplo = {
  id: 2,
  run: '111111111',
  nombre: 'Ana',
  apellidos: 'Pérez Soto',
  correo: 'ana@gmail.com',
  rol: 'Dueño de mascota',
  region: "Región del Libertador Gral. Bernardo O'Higgins",
  comuna: 'Rancagua',
  direccion: 'Los Aromos 455',
  fechaNacimiento: '1998-04-12',
  activo: true,
  creadoEn: '2026-11-16T22:00:00.000Z',
};

// Respuesta de error con un ejemplo propio: cada código muestra su mensaje real.
// En los 400 el ejemplo incluye "detalles" (un mensaje por campo inválido).
const error = (descripcion, detalles, mensaje) => ({
  description: descripcion,
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/Error' },
      example: detalles ? { error: 'Datos inválidos', detalles } : { error: mensaje ?? descripcion },
    },
  },
});

const usuarioOk = (descripcion) => ({
  description: descripcion,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Usuario' } } },
});

const parametroId = { name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } };

const servicioOk = (descripcion) => ({
  description: descripcion,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Servicio' } } },
});

const citaOk = (descripcion) => ({
  description: descripcion,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Cita' } } },
});
const conToken = [{ bearerAuth: [] }];

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'API Veterinaria San Marcos',
    version: '1.0.0',
    description: 'Backend del proyecto semestral DSY1104. Usuarios, autenticación con JWT y roles, catálogo de servicios y citas.',
  },
  servers: [{ url: '/api/v1' }],
  tags: [{ name: 'Autenticación' }, { name: 'Usuarios' }, { name: 'Catálogo' }, { name: 'Citas' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Usuario: {
        type: 'object',
        description: 'Nunca incluye la contraseña ni su hash.',
        properties: {
          id: { type: 'integer' },
          run: { type: 'string' },
          nombre: { type: 'string' },
          apellidos: { type: 'string' },
          correo: { type: 'string' },
          rol: { type: 'string', enum: ['Administrador', 'Recepcionista', 'Dueño de mascota'] },
          region: { type: 'string' },
          comuna: { type: 'string' },
          direccion: { type: 'string' },
          fechaNacimiento: { type: 'string', format: 'date', nullable: true },
          activo: { type: 'boolean' },
          creadoEn: { type: 'string', format: 'date-time' },
        },
        example: usuarioEjemplo,
      },
      Registro: {
        type: 'object',
        required: ['run', 'nombre', 'apellidos', 'correo', 'clave', 'region', 'comuna', 'direccion'],
        properties: {
          run: { type: 'string', description: 'Sin puntos ni guion, con dígito verificador.' },
          nombre: { type: 'string', maxLength: 50 },
          apellidos: { type: 'string', maxLength: 100 },
          correo: { type: 'string', description: 'Solo @duoc.cl, @profesor.duoc.cl o @gmail.com.' },
          clave: { type: 'string', minLength: 4, maxLength: 10 },
          fechaNacimiento: { type: 'string', format: 'date', description: 'Opcional.' },
          region: { type: 'string' },
          comuna: { type: 'string' },
          direccion: { type: 'string', maxLength: 300 },
        },
        example: {
          run: '111111111',
          nombre: 'Ana',
          apellidos: 'Pérez Soto',
          correo: 'ana@gmail.com',
          clave: 'ana123',
          region: "Región del Libertador Gral. Bernardo O'Higgins",
          comuna: 'Rancagua',
          direccion: 'Los Aromos 455',
        },
      },
      NuevoUsuario: {
        description: 'Alta hecha por el Administrador: los mismos campos del registro más el rol.',
        allOf: [
          { $ref: '#/components/schemas/Registro' },
          {
            type: 'object',
            required: ['rol'],
            properties: { rol: { type: 'string', enum: ['Administrador', 'Recepcionista', 'Dueño de mascota'] } },
          },
        ],
        example: {
          run: '111111111',
          nombre: 'Paula',
          apellidos: 'Contreras Vidal',
          correo: 'recepcion@duoc.cl',
          clave: 'recep123',
          rol: 'Recepcionista',
          region: "Región del Libertador Gral. Bernardo O'Higgins",
          comuna: 'Machalí',
          direccion: 'Los Aromos 455',
        },
      },
      Login: {
        type: 'object',
        required: ['correo', 'clave'],
        properties: { correo: { type: 'string' }, clave: { type: 'string' } },
        example: { correo: 'ana@gmail.com', clave: 'ana123' },
      },
      Sesion: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
          tipo: { type: 'string', example: 'Bearer' },
          expiraEn: { type: 'string', example: '1h' },
        },
      },
      ModificarUsuario: {
        type: 'object',
        description: 'Solo se envían los campos que cambian. Si "clave" viene vacía se mantiene la actual. "rol" solo lo puede enviar el Administrador.',
        properties: {
          run: { type: 'string' },
          nombre: { type: 'string' },
          apellidos: { type: 'string' },
          correo: { type: 'string' },
          clave: { type: 'string', minLength: 4, maxLength: 10 },
          region: { type: 'string' },
          comuna: { type: 'string' },
          direccion: { type: 'string' },
          rol: { type: 'string', enum: ['Administrador', 'Recepcionista', 'Dueño de mascota'] },
        },
        example: { direccion: 'Av. Cachapoal 90' },
      },
      Servicio: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          codigo: { type: 'string', example: 'SV001' },
          categoria: { type: 'string' },
          nombre: { type: 'string' },
          especie: { type: 'string' },
          duracion: { type: 'string' },
          precio: { type: 'integer' },
          descuento: { type: 'integer', description: 'Porcentaje de 0 a 90.' },
          stock: { type: 'integer', description: 'Cupos disponibles.' },
          stockCritico: { type: 'integer' },
          observaciones: { type: 'string' },
          descripcion: { type: 'string' },
          imagen: { type: 'string' },
        },
        example: {
          id: 1,
          codigo: 'SV001',
          categoria: 'Consultas',
          nombre: 'Consulta general',
          especie: 'Perro / Gato',
          duracion: '30 min',
          precio: 15000,
          descuento: 0,
          stock: 20,
          stockCritico: 5,
          observaciones: '',
          descripcion: 'Revisión general del estado de salud de tu mascota.',
          imagen: '/img/consulta-general.jpg',
        },
      },
      ServicioEntrada: {
        type: 'object',
        description: 'Al crear son obligatorios codigo, categoria, nombre, especie, duracion, precio y stock. Al modificar se envían solo los campos que cambian.',
        properties: {
          codigo: { type: 'string', description: '2 letras y 3 números.' },
          categoria: { type: 'string' },
          nombre: { type: 'string', maxLength: 100 },
          especie: { type: 'string' },
          duracion: { type: 'string' },
          precio: { type: 'integer', minimum: 1 },
          descuento: { type: 'integer', minimum: 0, maximum: 90 },
          stock: { type: 'integer', minimum: 0 },
          stockCritico: { type: 'integer', minimum: 0 },
          observaciones: { type: 'string', maxLength: 200 },
          descripcion: { type: 'string', maxLength: 500 },
          imagen: { type: 'string' },
        },
        example: {
          codigo: 'PE001',
          categoria: 'Peluquería',
          nombre: 'Baño y corte',
          especie: 'Perro',
          duracion: '60 min',
          precio: 18000,
          stock: 8,
          stockCritico: 2,
        },
      },
      Cita: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          numero: { type: 'string', example: 'SOL-00001' },
          usuarioId: { type: 'integer', description: 'Dueño que pidió la cita.' },
          estado: { type: 'string', enum: ['Pendiente', 'Confirmada', 'Reprogramada', 'Cancelada'] },
          nombre: { type: 'string' },
          apellidos: { type: 'string' },
          correo: { type: 'string' },
          telefono: { type: 'string' },
          mascota: { type: 'string' },
          especie: { type: 'string' },
          fecha: { type: 'string', format: 'date' },
          hora: { type: 'string', example: '10:00' },
          comentario: { type: 'string' },
          total: { type: 'integer' },
          propuesta: {
            type: 'object',
            nullable: true,
            properties: { fecha: { type: 'string', format: 'date' }, hora: { type: 'string' } },
          },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                servicioId: { type: 'integer' },
                nombre: { type: 'string' },
                precioUnitario: { type: 'integer' },
                cantidad: { type: 'integer' },
              },
            },
          },
          fechaCreacion: { type: 'string', format: 'date-time' },
        },
      },
      NuevaCita: {
        type: 'object',
        description: 'El precio y el total los calcula el servidor con el catálogo.',
        required: ['nombre', 'apellidos', 'correo', 'telefono', 'mascota', 'especie', 'fecha', 'hora', 'items'],
        properties: {
          nombre: { type: 'string' },
          apellidos: { type: 'string' },
          correo: { type: 'string' },
          telefono: { type: 'string', description: '9 dígitos, empieza con 9.' },
          mascota: { type: 'string' },
          especie: { type: 'string', enum: ['Perro', 'Gato', 'Conejo', 'Ave', 'Otro'] },
          fecha: { type: 'string', format: 'date', description: 'Desde mañana, de lunes a sábado.' },
          hora: { type: 'string', description: 'De 09:00 a 12:30 y de 15:00 a 18:30, cada 30 minutos.' },
          comentario: { type: 'string', maxLength: 500 },
          items: {
            type: 'array',
            items: {
              type: 'object',
              required: ['servicioId', 'cantidad'],
              properties: {
                servicioId: { type: 'integer' },
                cantidad: { type: 'integer', minimum: 1 },
                fueraDeHorario: { type: 'boolean', description: 'Solo para la consulta de urgencia (recargo de $10.000).' },
              },
            },
          },
        },
        example: {
          nombre: 'Ana',
          apellidos: 'Pérez Soto',
          correo: 'ana@gmail.com',
          telefono: '912345678',
          mascota: 'Toby',
          especie: 'Perro',
          fecha: '2026-12-01',
          hora: '10:00',
          comentario: 'Viene por su vacuna anual.',
          items: [{ servicioId: 4, cantidad: 1 }],
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          detalles: { type: 'object', description: 'Un mensaje por cada campo inválido (solo en 400).' },
        },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['Autenticación'],
        summary: 'Registrar un usuario',
        description: 'Crea la cuenta con el rol "Dueño de mascota". El rol lo asigna el servidor.',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Registro' } } } },
        responses: {
          201: usuarioOk('Usuario creado'),
          400: error('Datos inválidos', { correo: 'Usa un correo @duoc.cl, @profesor.duoc.cl o @gmail.com.' }),
          409: error('Ya existe una cuenta con ese correo'),
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Autenticación'],
        summary: 'Iniciar sesión',
        description: 'Comprueba el hash de la contraseña y entrega un JWT con vigencia.',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Login' } } } },
        responses: {
          200: { description: 'Sesión iniciada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Sesion' } } } },
          400: error('Correo o contraseña con formato inválido', null, 'Correo o contraseña con formato inválido'),
          401: error('Credenciales incorrectas (mismo mensaje si el correo no existe)', null, 'Credenciales incorrectas'),
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Autenticación'],
        summary: 'Datos del usuario autenticado',
        security: conToken,
        responses: { 200: usuarioOk('Perfil del usuario del token'), 401: error('Token ausente, inválido o vencido', null, 'Token inválido o vencido') },
      },
    },
    '/usuarios': {
      get: {
        tags: ['Usuarios'],
        summary: 'Listar usuarios (solo Administrador)',
        security: conToken,
        responses: {
          200: {
            description: 'Lista de usuarios',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Usuario' } } } },
          },
          401: error('Token ausente, inválido o vencido', null, 'Token inválido o vencido'),
          403: error('Rol insuficiente', null, 'No tienes permiso para esta acción'),
        },
      },
      post: {
        tags: ['Usuarios'],
        summary: 'Crear un usuario con su rol (solo Administrador)',
        security: conToken,
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/NuevoUsuario' } } } },
        responses: {
          201: usuarioOk('Usuario creado'),
          400: error('Datos inválidos', { correo: 'Usa un correo @duoc.cl, @profesor.duoc.cl o @gmail.com.' }),
          401: error('Token ausente, inválido o vencido', null, 'Token inválido o vencido'),
          403: error('Rol insuficiente', null, 'No tienes permiso para esta acción'),
          409: error('Ya existe una cuenta con ese correo'),
        },
      },
    },
    '/usuarios/{id}': {
      get: {
        tags: ['Usuarios'],
        summary: 'Ver un usuario (Administrador o el dueño de la cuenta)',
        security: conToken,
        parameters: [parametroId],
        responses: {
          200: usuarioOk('Usuario'),
          401: error('Token ausente, inválido o vencido', null, 'Token inválido o vencido'),
          403: error('La cuenta es de otra persona', null, 'No tienes permiso para ver este usuario'),
          404: error('Usuario no encontrado'),
        },
      },
      put: {
        tags: ['Usuarios'],
        summary: 'Modificar un usuario (Administrador o el dueño de la cuenta)',
        security: conToken,
        parameters: [parametroId],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ModificarUsuario' } } } },
        responses: {
          200: usuarioOk('Usuario modificado'),
          400: error('Datos inválidos', { correo: 'Usa un correo @duoc.cl, @profesor.duoc.cl o @gmail.com.' }),
          401: error('Token ausente, inválido o vencido', null, 'Token inválido o vencido'),
          403: error('La cuenta es de otra persona o se intentó cambiar el rol sin ser Administrador', null, 'Solo el Administrador puede cambiar el rol'),
          404: error('Usuario no encontrado'),
          409: error('Ya existe una cuenta con ese correo'),
        },
      },
      delete: {
        tags: ['Usuarios'],
        summary: 'Desactivar un usuario (solo Administrador)',
        description: 'No borra el registro: lo deja inactivo y ya no puede iniciar sesión.',
        security: conToken,
        parameters: [parametroId],
        responses: {
          204: { description: 'Usuario desactivado' },
          401: error('Token ausente, inválido o vencido', null, 'Token inválido o vencido'),
          403: error('Rol insuficiente', null, 'No tienes permiso para esta acción'),
          404: error('Usuario no encontrado'),
          409: error('No puedes desactivar tu propia cuenta'),
        },
      },
    },
    '/servicios': {
      get: {
        tags: ['Catálogo'],
        summary: 'Listar el catálogo de servicios (público)',
        responses: {
          200: {
            description: 'Lista de servicios',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Servicio' } } } },
          },
        },
      },
      post: {
        tags: ['Catálogo'],
        summary: 'Crear un servicio (solo Administrador)',
        security: conToken,
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ServicioEntrada' } } } },
        responses: {
          201: servicioOk('Servicio creado'),
          400: error('Datos inválidos', { codigo: 'El código debe tener 2 letras y 3 números (ej. SV006).' }),
          401: error('Token ausente, inválido o vencido', null, 'Token inválido o vencido'),
          403: error('Rol insuficiente', null, 'No tienes permiso para esta acción'),
          409: error('Ya existe un servicio con ese código'),
        },
      },
    },
    '/servicios/{id}': {
      get: {
        tags: ['Catálogo'],
        summary: 'Ver un servicio (público)',
        parameters: [parametroId],
        responses: { 200: servicioOk('Servicio'), 404: error('Servicio no encontrado') },
      },
      put: {
        tags: ['Catálogo'],
        summary: 'Modificar un servicio (solo Administrador)',
        security: conToken,
        parameters: [parametroId],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ServicioEntrada' } } } },
        responses: {
          200: servicioOk('Servicio modificado'),
          400: error('Datos inválidos', { codigo: 'El código debe tener 2 letras y 3 números (ej. SV006).' }),
          401: error('Token ausente, inválido o vencido', null, 'Token inválido o vencido'),
          403: error('Rol insuficiente', null, 'No tienes permiso para esta acción'),
          404: error('Servicio no encontrado'),
          409: error('Ya existe un servicio con ese código'),
        },
      },
      delete: {
        tags: ['Catálogo'],
        summary: 'Eliminar un servicio (solo Administrador)',
        security: conToken,
        parameters: [parametroId],
        responses: {
          204: { description: 'Servicio eliminado' },
          401: error('Token ausente, inválido o vencido', null, 'Token inválido o vencido'),
          403: error('Rol insuficiente', null, 'No tienes permiso para esta acción'),
          404: error('Servicio no encontrado'),
          409: error('El servicio ya está en citas y no se puede eliminar', null, 'No se puede eliminar: el servicio ya está en citas. Puedes dejarlo sin cupos.'),
        },
      },
    },
    '/citas': {
      get: {
        tags: ['Citas'],
        summary: 'Listar citas (el dueño ve solo las suyas; el personal ve todas)',
        security: conToken,
        responses: {
          200: {
            description: 'Lista de citas',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Cita' } } } },
          },
          401: error('Token ausente, inválido o vencido', null, 'Token inválido o vencido'),
        },
      },
      post: {
        tags: ['Citas'],
        summary: 'Solicitar una cita (usuario con sesión)',
        description: 'La cita queda "Pendiente" a nombre del usuario del token y descuenta cupos del catálogo.',
        security: conToken,
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/NuevaCita' } } } },
        responses: {
          201: citaOk('Cita creada'),
          400: error('Datos inválidos', { fecha: 'La cita debe ser desde mañana en adelante.' }),
          401: error('Token ausente, inválido o vencido', null, 'Token inválido o vencido'),
          409: error('No quedan cupos suficientes para un servicio', null, 'No quedan cupos suficientes para "Consulta general".'),
        },
      },
    },
    '/citas/{id}': {
      get: {
        tags: ['Citas'],
        summary: 'Ver el detalle de una cita (personal o el dueño de la cita)',
        security: conToken,
        parameters: [parametroId],
        responses: {
          200: citaOk('Cita'),
          401: error('Token ausente, inválido o vencido', null, 'Token inválido o vencido'),
          403: error('La cita es de otra persona', null, 'No tienes permiso para ver esta cita'),
          404: error('Cita no encontrada'),
        },
      },
      delete: {
        tags: ['Citas'],
        summary: 'Eliminar una cita (solo Administrador)',
        description: 'Si la cita no estaba cancelada, devuelve sus cupos al catálogo.',
        security: conToken,
        parameters: [parametroId],
        responses: {
          204: { description: 'Cita eliminada' },
          401: error('Token ausente, inválido o vencido', null, 'Token inválido o vencido'),
          403: error('Rol insuficiente', null, 'No tienes permiso para esta acción'),
          404: error('Cita no encontrada'),
        },
      },
    },
    '/citas/{id}/estado': {
      patch: {
        tags: ['Citas'],
        summary: 'Cambiar el estado de una cita',
        description:
          'El personal puede confirmar o cancelar. El dueño solo puede cancelar su propia cita. ' +
          'REGLA DE NEGOCIO: no se confirma una cita en un horario que ya tiene otra cita confirmada (409). ' +
          'Al cancelar se devuelven los cupos.',
        security: conToken,
        parameters: [parametroId],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['estado'], properties: { estado: { type: 'string', enum: ['Confirmada', 'Cancelada'] } } },
              example: { estado: 'Confirmada' },
            },
          },
        },
        responses: {
          200: citaOk('Estado cambiado'),
          400: error('Estado no válido', { estado: 'El estado debe ser Confirmada o Cancelada.' }),
          401: error('Token ausente, inválido o vencido', null, 'Token inválido o vencido'),
          403: error('La cita es de otra persona, o el dueño intentó confirmar', null, 'Solo la recepción puede confirmar citas'),
          404: error('Cita no encontrada'),
          409: error('Horario ya ocupado, o la cita ya está en ese estado o cancelada', null, 'Ese horario ya tiene una cita confirmada. Propón otro horario.'),
        },
      },
    },
    '/citas/{id}/propuesta': {
      patch: {
        tags: ['Citas'],
        summary: 'Proponer otro horario (Administrador o Recepcionista)',
        description: 'La cita queda "Reprogramada" hasta que el dueño acepte. El horario propuesto no puede estar ocupado (409).',
        security: conToken,
        parameters: [parametroId],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['fecha', 'hora'], properties: { fecha: { type: 'string', format: 'date' }, hora: { type: 'string' } } },
              example: { fecha: '2026-12-01', hora: '10:30' },
            },
          },
        },
        responses: {
          200: citaOk('Horario propuesto'),
          400: error('Fecha u hora inválida', { hora: 'Selecciona un horario.' }),
          401: error('Token ausente, inválido o vencido', null, 'Token inválido o vencido'),
          403: error('Rol insuficiente', null, 'No tienes permiso para esta acción'),
          404: error('Cita no encontrada'),
          409: error('Horario ya ocupado o cita cancelada', null, 'Ese horario ya tiene una cita confirmada. Propón otro horario.'),
        },
      },
    },
    '/citas/{id}/aceptar-propuesta': {
      post: {
        tags: ['Citas'],
        summary: 'Aceptar el horario propuesto (dueño de la cita)',
        description: 'La cita pasa al horario propuesto y queda "Confirmada", si ese horario sigue libre.',
        security: conToken,
        parameters: [parametroId],
        responses: {
          200: citaOk('Cita confirmada en el horario nuevo'),
          401: error('Token ausente, inválido o vencido', null, 'Token inválido o vencido'),
          403: error('La cita es de otra persona', null, 'No tienes permiso para ver esta cita'),
          404: error('Cita no encontrada'),
          409: error('La cita no tiene propuesta o el horario ya está ocupado', null, 'La cita no tiene un horario propuesto'),
        },
      },
    },
  },
};
