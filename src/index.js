const express = require('express');
const app = express();

app.use(express.json());

app.listen(config.portaServidor, () => {
    console.log(`Servidor rodando na porta ${config.portaServidor}`);
});