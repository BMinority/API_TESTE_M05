const express = require('express');
const router = express.Router();
const db = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

//categorias
router.get('/categoria', async (req, res) => {
    try {
        const result = await db.query('select * from categorias');
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao listar categorias.' })
    }
});

//usuarios
router.post('/usuario', async (req, res) => {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Preencha todos os campos' });
    }

    try {
        const hashPassword = await bcrypt.hash(senha, 10);
        const result = await db.query(
            'insert into usuarios (nome, email, senha) values ($1, $2, $3) returning *',
            [nome, email, hashPassword]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            res.status(400).json({ error: 'Email ja cadastrado.' });
        } else {
            res.status(500).json({ error: 'Erro ao cadastrar usuario.' });
        }
    }
});

//login
router.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ error: 'Email e senha são orbigatórios.' });
    }

    try {
        const result = await db.query('select * from usuarios where email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Email ou senha incorretos.' });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(senha, user.senha);

        if (!validPassword) {
            return res.status(400).json({ error: 'Email ou senha incorretos.' })
        }

        const token = jwt.sign({ id: user.id, nome: user.nome, email: user.email }, 'secret', {
            expiresIn: '1h',
        });


        res.status(200).json({ token });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao realizar o login.' });
    }
});

//redefinir senha
router.patch('/usuario/redefinir', async (req, res) => {
    const { email, senha_antiga, senha_nova } = req.body;

    if (!email || !senha_antiga || !senha_nova) {
        return res.status(400).json({ error: 'Preencha todos os campos.' });
    }

    if (senha_antiga === senha_nova) {
        return res.status(400).json({ mensagem: 'A nova senha deve ser diferente da senha antiga.' });
    }

    try {
        const result = await db.query('select * from usuarios where email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(400).json({ mensagem: 'Email ou senha incorretos.' })
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(senha_antiga, user.senha);

        if (!validPassword) {
            return res.status(400).json({ mensage: 'Email ou senha incorretos' });
        }

        const hashNewPassword = await bcrypt.hash(senha_nova, 10);
        await db.query('update usuarios set senha = $1 where email = $2', [hashNewPassword, email]);

        //simulacao de envio de emails
        console.log(`E-mail enviado para ${email}: Sua senha foi alterada com sucesso`);

        res.status(200).json({ mensagem: 'Senha redefinida com sucesso' });
    } catch (error) {
        res.status(500).json({ mensaem: 'Erro ao redefinir senha.' })
    }
});

module.exports = router;