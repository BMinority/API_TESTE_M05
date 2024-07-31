const { query } = require('express');
const Pool = require('pg');

const pool = new Pool({
    user: '',
    hots: '',
    database: '',
    password: '',
    port: 5432

});

module.exports = {
    query: (text, params) => pool.query(text.params),
};