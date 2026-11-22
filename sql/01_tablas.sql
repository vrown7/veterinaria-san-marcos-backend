-- Veterinaria San Marcos: roles y usuarios.

CREATE TABLE IF NOT EXISTS roles (
  id     SERIAL PRIMARY KEY,
  nombre VARCHAR(30) NOT NULL UNIQUE
);

INSERT INTO roles (nombre) VALUES
  ('Administrador'),
  ('Recepcionista'),
  ('Dueño de mascota')
ON CONFLICT (nombre) DO NOTHING;

CREATE TABLE IF NOT EXISTS usuarios (
  id         SERIAL PRIMARY KEY,
  run        VARCHAR(9)   NOT NULL,
  nombre     VARCHAR(50)  NOT NULL,
  apellidos  VARCHAR(100) NOT NULL,
  correo     VARCHAR(100) NOT NULL UNIQUE,
  clave_hash VARCHAR(100) NOT NULL,
  rol_id     INTEGER      NOT NULL REFERENCES roles (id),
  region     VARCHAR(100) NOT NULL,
  comuna     VARCHAR(100) NOT NULL,
  direccion  VARCHAR(300) NOT NULL,
  activo     BOOLEAN      NOT NULL DEFAULT TRUE,
  creado_en  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Dato opcional del registro (se agrega aparte para que funcione también en una tabla ya creada).
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE;
