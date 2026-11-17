# Veterinaria San Marcos — Backend

API REST del proyecto semestral de DSY1104 Desarrollo Fullstack II (caso Forma A, Veterinaria San Marcos).

- **Integrantes:** Nicolás Ortega, Martín Vásquez, Justin Galleguillos
- **Frontend (React):** https://github.com/vrown7/veterinaria-san-marcos-v2.0
- **Alcance:** usuarios, inicio de sesión con JWT y roles (semana 15). El catálogo de servicios y las citas se agregan en la semana 16.

## Estado del avance

| Operación | Estado | Detalle |
|---|---|---|
| Tabla de usuarios | Listo | Tablas `roles` y `usuarios` creadas en PostgreSQL (Amazon RDS) con `sql/01_tablas.sql`. Los datos siguen ahí al reiniciar el backend y las contraseñas se guardan con hash. |
| Inicio de sesión | Listo | `POST /api/v1/auth/login` busca al usuario en la tabla, comprueba el hash y entrega un JWT. Probado en Swagger contra RDS. |
| Registro (crear usuario) | Listo | `POST /api/v1/auth/register` guarda el usuario con el rol que asigna el servidor. Probado en Swagger contra RDS. |
| Modificar usuario | En avance | `PUT /api/v1/usuarios/{id}` con ruta y lógica iniciadas. Falta probarlo en Swagger contra RDS. |
| Listar usuarios | En avance | `GET /api/v1/usuarios` y `GET /api/v1/usuarios/{id}` con ruta y lógica iniciadas. Falta probarlo en Swagger contra RDS. |
| Eliminar o desactivar usuario | En avance | `DELETE /api/v1/usuarios/{id}` desactiva la cuenta (no borra el registro). Falta probarlo en Swagger contra RDS. |
| Catálogo de servicios | Pendiente | Semana 16. |
| Citas | Pendiente | Semana 16. |
| Conexión del frontend con la API | Pendiente | Semana 15 (login y registro). |

## Decisiones técnicas

- **Node.js con Express, ejecutado en EC2.** Es el mismo lenguaje del frontend y la estructura (servidor, rutas, controladores) es la que trabajamos en la guía 18.
- **PostgreSQL en Amazon RDS**, sin acceso público. El backend se conecta con el paquete `pg` y consultas parametrizadas.
- **bcrypt** para las contraseñas. Es un algoritmo hecho para contraseñas: es lento a propósito y agrega una sal distinta a cada hash, así dos claves iguales no quedan guardadas igual. Usamos un costo de 10. OWASP lo acepta para contraseñas con un costo de 10 o más (recomienda Argon2id como primera opción).
- **jsonwebtoken** para emitir y verificar el JWT.
- **swagger-ui-express** para mostrar la documentación OpenAPI y probar las rutas desde el navegador.

Fuentes: [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), [OWASP REST Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html), [documentación de Swagger](https://swagger.io/docs/).

## Base de datos

Por ahora hay dos tablas:

- `roles`: Administrador, Recepcionista y Dueño de mascota.
- `usuarios`: cada usuario tiene un rol (`rol_id` es clave foránea a `roles`). El correo no se puede repetir. La contraseña se guarda solo como hash (`clave_hash`). Al "eliminar" un usuario se deja `activo = false`, para no perder sus citas más adelante.

Diagrama entidad-relación: pendiente (se sube a Drive junto con las tablas de servicios y citas).

## Organización del backend

| Carpeta | Responsabilidad |
|---|---|
| `src/routes` | Define las rutas HTTP y qué middleware las protege. |
| `src/controllers` | Recibe la solicitud y devuelve la respuesta con su estado HTTP. |
| `src/services` | Reglas del negocio: validar, asignar el rol, revisar permisos. |
| `src/repositories` | Acceso a datos: las consultas SQL a PostgreSQL. |
| `src/middlewares` | Seguridad: valida el JWT (401) y el rol (403). |
| `src/utils` | Validaciones de entrada y errores de la API. |
| `src/docs` | Especificación OpenAPI que muestra Swagger. |
| `sql` y `scripts` | Creación de tablas y del administrador inicial. |

## API

Documentación en Swagger: `http://IP_PUBLICA_EC2:3000/api/docs`. El backend corre en una instancia EC2 de AWS Academy y su IP pública cambia cada vez que se inicia el laboratorio.

| Método y ruta | Quién puede | Pantalla del frontend |
|---|---|---|
| `POST /api/v1/auth/register` | Cualquiera | Registro |
| `POST /api/v1/auth/login` | Cualquiera | Iniciar sesión |
| `GET /api/v1/auth/me` | Usuario con sesión | Sesión del usuario |
| `GET /api/v1/usuarios` | Administrador | Admin: usuarios |
| `GET /api/v1/usuarios/{id}` | Administrador o el dueño de la cuenta | Admin: ver usuario |
| `PUT /api/v1/usuarios/{id}` | Administrador o el dueño de la cuenta | Admin: editar usuario |
| `DELETE /api/v1/usuarios/{id}` | Administrador | Admin: usuarios |

## Seguridad

- El registro siempre crea la cuenta como "Dueño de mascota". Si el cliente envía un rol, se ignora. Solo el Administrador puede cambiar el rol de alguien.
- El login responde "Credenciales incorrectas" tanto si el correo no existe como si la clave está mal.
- El JWT se firma con HS256 y lleva `sub` (id del usuario), `exp` (vence en 1 hora), `iss`, `aud` y el rol. La clave de firma está en el archivo `.env`, que no se sube al repositorio.
- En cada solicitud protegida el backend verifica la firma, la vigencia, el emisor y el destinatario, y vuelve a leer al usuario y su rol desde la base de datos.
- Un usuario que no es Administrador no puede ver ni modificar la cuenta de otra persona cambiando el id en la URL (403).
- Las respuestas nunca incluyen la contraseña ni su hash.

Pendiente: diagrama de secuencia del login, límite de intentos de login y decisión de dónde guardar el token en el frontend.

## Cómo ejecutar

Requisitos: Node.js 18 o superior y una base de datos PostgreSQL.

```bash
npm install
cp .env.example .env      # completar los valores (el .env no se sube)
npm run db:init           # crea las tablas y el administrador inicial
npm start                 # API en el puerto 3000
```

Después se abre `http://localhost:3000/api/docs` para probar las rutas.

## Pruebas realizadas

Probado en Swagger con el backend en EC2 y la base en Amazon RDS (16 de noviembre):

- Registro de un usuario (201), queda guardado con el rol "Dueño de mascota".
- Login con ese usuario (200 con token).
- `GET /api/v1/auth/me` con el token (200).
- Después de reiniciar el backend el login sigue funcionando (los datos persisten).

Probado antes con una base PostgreSQL local:

- Registro correcto (201), correo repetido (409) y datos inválidos (400).
- Login correcto (200 con token), clave incorrecta y correo inexistente (401 con el mismo mensaje).
- Ruta protegida sin token y con token alterado (401).
- Listar usuarios con rol Dueño de mascota (403) y con Administrador (200).
- Ver o modificar la cuenta de otra persona (403), cambiar el propio rol (403).
- Desactivar un usuario (204); después no puede iniciar sesión y su token deja de servir (401).
- Los datos siguen en la base después de reiniciar el backend.

Pendiente: repetir en Swagger contra RDS las pruebas de listar, modificar y desactivar usuarios.

## Próximos pasos

1. Probar en RDS listar, modificar y desactivar usuarios.
2. Conectar el login y el registro del frontend con la API.
3. Diagrama entidad-relación y diagrama de secuencia del login.
4. Catálogo de servicios y citas, con la regla de no confirmar una cita en un horario ya ocupado (409).
