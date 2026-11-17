// Error con el estado HTTP que debe devolver la API (400, 401, 403, 404, 409).
class ErrorApi extends Error {
  constructor(estado, mensaje, detalles) {
    super(mensaje);
    this.estado = estado;
    this.detalles = detalles;
  }
}

module.exports = ErrorApi;
