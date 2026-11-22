-- Veterinaria San Marcos: catálogo de servicios y citas.

-- Catálogo: servicios veterinarios. "stock" son los cupos disponibles.
CREATE TABLE IF NOT EXISTS servicios (
  id            SERIAL PRIMARY KEY,
  codigo        VARCHAR(5)   NOT NULL UNIQUE,
  categoria     VARCHAR(50)  NOT NULL,
  nombre        VARCHAR(100) NOT NULL,
  especie       VARCHAR(50)  NOT NULL,
  duracion      VARCHAR(20)  NOT NULL,
  precio        INTEGER      NOT NULL CHECK (precio > 0),
  descuento     INTEGER      NOT NULL DEFAULT 0 CHECK (descuento BETWEEN 0 AND 90),
  stock         INTEGER      NOT NULL CHECK (stock >= 0),
  stock_critico INTEGER      NOT NULL DEFAULT 0 CHECK (stock_critico >= 0),
  observaciones VARCHAR(200) NOT NULL DEFAULT '',
  descripcion   VARCHAR(500) NOT NULL DEFAULT '',
  imagen        VARCHAR(200) NOT NULL DEFAULT ''
);

-- Solicitud (flujo principal): la cita que pide un dueño para su mascota.
-- La mascota se guarda como datos de la cita.
CREATE TABLE IF NOT EXISTS citas (
  id              SERIAL PRIMARY KEY,
  usuario_id      INTEGER      NOT NULL REFERENCES usuarios (id),
  estado          VARCHAR(20)  NOT NULL DEFAULT 'Pendiente'
                  CHECK (estado IN ('Pendiente', 'Confirmada', 'Reprogramada', 'Cancelada')),
  nombre          VARCHAR(50)  NOT NULL,
  apellidos       VARCHAR(100) NOT NULL,
  correo          VARCHAR(100) NOT NULL,
  telefono        VARCHAR(9)   NOT NULL,
  mascota         VARCHAR(50)  NOT NULL,
  especie         VARCHAR(20)  NOT NULL,
  fecha           DATE         NOT NULL,
  hora            VARCHAR(5)   NOT NULL,
  comentario      VARCHAR(500) NOT NULL DEFAULT '',
  total           INTEGER      NOT NULL CHECK (total >= 0),
  propuesta_fecha DATE,
  propuesta_hora  VARCHAR(5),
  creado_en       TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Servicios pedidos en cada cita. El precio se copia para que la cita no cambie
-- si después se modifica el catálogo.
CREATE TABLE IF NOT EXISTS cita_items (
  id              SERIAL PRIMARY KEY,
  cita_id         INTEGER      NOT NULL REFERENCES citas (id) ON DELETE CASCADE,
  servicio_id     INTEGER      NOT NULL REFERENCES servicios (id),
  nombre          VARCHAR(130) NOT NULL,
  precio_unitario INTEGER      NOT NULL CHECK (precio_unitario >= 0),
  cantidad        INTEGER      NOT NULL CHECK (cantidad > 0)
);

-- Regla de negocio también en la base: no pueden existir dos citas confirmadas
-- en la misma fecha y hora.
CREATE UNIQUE INDEX IF NOT EXISTS citas_horario_confirmado ON citas (fecha, hora) WHERE estado = 'Confirmada';
