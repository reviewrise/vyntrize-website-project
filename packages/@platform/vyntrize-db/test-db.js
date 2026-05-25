/* eslint-disable */
require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.VYNTRIZE_DATABASE_URL });
pool.query('SELECT NOW()')
  .then(r => console.log(r.rows))
  .catch(console.error)
  .finally(() => pool.end());
