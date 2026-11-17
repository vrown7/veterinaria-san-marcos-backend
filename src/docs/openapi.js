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
  activo: true,
  creado_en: '2026-11-16T22:00:00.000Z',
};

const error = (descripcion) => ({
  description: descripcion,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
});

const usuarioOk = (descripcion) => ({
  description: descripcion,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Usuario' } } },
});

const parametroId = { name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } };
const conToken = [{ bearerAuth: [] }];

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'API Veterinaria San Marcos',
    version: '1.0.0',
    description: 'Backend del proyecto semestral DSY1104. Usuarios, autenticación con JWT y roles.',
  },
  servers: [{ url: '/api/v1' }],
  tags: [{ name: 'Autenticación' }, { name: 'Usuarios' }],
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
          activo: { type: 'boolean' },
          creado_en: { type: 'string', format: 'date-time' },
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
        description: 'Solo se envían los campos que cambian. "rol" solo lo puede enviar el Administrador.',
        properties: {
          nombre: { type: 'string' },
          apellidos: { type: 'string' },
          clave: { type: 'string', minLength: 4, maxLength: 10 },
          region: { type: 'string' },
          comuna: { type: 'string' },
          direccion: { type: 'string' },
          rol: { type: 'string', enum: ['Administrador', 'Recepcionista', 'Dueño de mascota'] },
        },
        example: { direccion: 'Av. Cachapoal 90' },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          detalles: { type: 'object', description: 'Un mensaje por cada campo inválido (solo en 400).' },
        },
        example: { error: 'Datos inválidos', detalles: { correo: 'Usa un correo @duoc.cl, @profesor.duoc.cl o @gmail.com.' } },
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
          400: error('Datos inválidos'),
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
          400: error('Correo o contraseña con formato inválido'),
          401: error('Credenciales incorrectas (mensaje genérico)'),
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Autenticación'],
        summary: 'Datos del usuario autenticado',
        security: conToken,
        responses: { 200: usuarioOk('Perfil del usuario del token'), 401: error('Token ausente, inválido o vencido') },
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
          401: error('Token ausente, inválido o vencido'),
          403: error('Rol insuficiente'),
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
          401: error('Token ausente, inválido o vencido'),
          403: error('La cuenta es de otra persona'),
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
          400: error('Datos inválidos'),
          401: error('Token ausente, inválido o vencido'),
          403: error('La cuenta es de otra persona o se intentó cambiar el rol sin ser Administrador'),
          404: error('Usuario no encontrado'),
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
          401: error('Token ausente, inválido o vencido'),
          403: error('Rol insuficiente'),
          404: error('Usuario no encontrado'),
          409: error('No puedes desactivar tu propia cuenta'),
        },
      },
    },
  },
};
