// Crea las tablas (sql/01_tablas.sql) y el administrador inicial.
// El correo y la clave del administrador salen del archivo .env, no del código.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const pool = require('../src/config/db');
const { RONDAS_HASH } = require('../src/services/auth.service');

async function iniciar() {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'sql', '01_tablas.sql'), 'utf8');
  await pool.query(sql);
  console.log('Tablas roles y usuarios listas.');

  const { ADMIN_CORREO, ADMIN_CLAVE } = process.env;
  if (!ADMIN_CORREO || !ADMIN_CLAVE) {
    console.log('Sin ADMIN_CORREO / ADMIN_CLAVE en .env: no se creó el administrador.');
    return;
  }
  const claveHash = await bcrypt.hash(ADMIN_CLAVE, RONDAS_HASH);
  const resultado = await pool.query(
    `INSERT INTO usuarios (run, nombre, apellidos, correo, clave_hash, rol_id, region, comuna, direccion)
     VALUES ($1, $2, $3, $4, $5, (SELECT id FROM roles WHERE nombre = 'Administrador'), $6, $7, $8)
     ON CONFLICT (correo) DO NOTHING`,
    ['123456785', 'Daniela', 'Rojas Fuentes', ADMIN_CORREO.toLowerCase(), claveHash,
      "Región del Libertador Gral. Bernardo O'Higgins", 'Rancagua', "Av. Libertador Bernardo O'Higgins 1234"],
  );
  console.log(resultado.rowCount === 1 ? 'Administrador inicial creado.' : 'El administrador ya existía.');
}

iniciar()
  .catch((error) => {
    console.error('No se pudo iniciar la base de datos:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
