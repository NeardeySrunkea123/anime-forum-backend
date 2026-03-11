const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'anime_forum',
  password: '',
  port: 5432,
});

module.exports = pool;
