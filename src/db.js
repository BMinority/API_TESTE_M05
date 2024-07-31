const { Pool } = require('pg');

const pool = new Pool({
    user: 'seu_usuario',
    host: 'localhost',
    database: 'pdv',
    password: 'sua_senha',
    port: 5432,
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};
