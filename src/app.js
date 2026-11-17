const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const openapi = require('./docs/openapi');
const authRoutes = require('./routes/auth.routes');
const usuariosRoutes = require('./routes/usuarios.routes');

const app = express();

// Solo el frontend indicado en CORS_ORIGEN puede llamar a la API desde el navegador.
app.use(cors({ origin: process.env.CORS_ORIGEN || 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi));
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/usuarios', usuariosRoutes);

app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// Errores: los que traen "estado" son del negocio; el resto es un error interno.
app.use((error, req, res, next) => {
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la solicitud no es un JSON válido' });
  }
  if (error.estado) {
    return res.status(error.estado).json({ error: error.message, detalles: error.detalles });
  }
  console.error(error.message);
  res.status(500).json({ error: 'Error interno del servidor' });
});

module.exports = app;
