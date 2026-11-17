// Seguridad: valida el JWT y comprueba el rol antes de llegar al controlador.
const jwt = require('jsonwebtoken');
const usuariosRepository = require('../repositories/usuarios.repository');

// 401 si el token falta, fue alterado o venció.
async function autenticar(req, res, next) {
  const cabecera = req.headers.authorization || '';
  const [tipo, token] = cabecera.split(' ');
  if (tipo !== 'Bearer' || !token) return res.status(401).json({ error: 'Token ausente' });

  try {
    const datos = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: process.env.JWT_EMISOR,
      audience: process.env.JWT_DESTINATARIO,
    });
    // El usuario y su rol se leen de la base de datos, no se confía en lo que envía el cliente.
    const usuario = await usuariosRepository.buscarPorId(Number(datos.sub));
    if (!usuario || !usuario.activo) return res.status(401).json({ error: 'Token inválido o vencido' });
    req.usuario = usuario;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError' || error.name === 'NotBeforeError') {
      return res.status(401).json({ error: 'Token inválido o vencido' });
    }
    next(error);
  }
}

// 403 si el usuario autenticado no tiene uno de los roles permitidos.
function permitirRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.usuario.rol)) return res.status(403).json({ error: 'No tienes permiso para esta acción' });
    next();
  };
}

module.exports = { autenticar, permitirRoles };
