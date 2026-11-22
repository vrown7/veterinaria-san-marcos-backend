const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const openapi = require('./docs/openapi');
const authRoutes = require('./routes/auth.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const serviciosRoutes = require('./routes/servicios.routes');
const citasRoutes = require('./routes/citas.routes');

const app = express();

// Solo los orígenes del frontend indicados en CORS_ORIGEN (separados por coma)
// pueden llamar a la API desde el navegador.
const origenes = (process.env.CORS_ORIGEN || 'http://localhost:5173').split(',').map((o) => o.trim());
app.use(cors({ origin: origenes }));
app.use(express.json());

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi));
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/usuarios', usuariosRoutes);
app.use('/api/v1/servicios', serviciosRoutes);
app.use('/api/v1/citas', citasRoutes);

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
