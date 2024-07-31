const express = require('express');
const router = express.Router();
const db = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const nodemailer = require('nodemailer');
const winston = require('winston');

const authenticateToken = require('./MIDDLEWARE/auth');

const schema = Joi.object({
    email: Joi.string().email().required(),
    senha_antiga: Joi.string().required(),
    senha_nova: Joi.string().required(),
});

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true', // ou false se for necessário
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Categorias
router.get('/categoria', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM categorias');
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao listar categorias.' });
    }
});

// Usuários
router.post('/usuario', async (req, res) => {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Preencha todos os campos' });
    }

    try {
        const hashPassword = await bcrypt.hash(senha, 10);
        const result = await db.query(
            'INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING *',
            [nome, email, hashPassword]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            res.status(400).json({ error: 'Email já cadastrado.' });
        } else {
            res.status(500).json({ error: 'Erro ao cadastrar usuário.' });
        }
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    try {
        const result = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Email ou senha incorretos.' });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(senha, user.senha);

        if (!validPassword) {
            return res.status(400).json({ error: 'Email ou senha incorretos.' });
        }

        const token = jwt.sign({ id: user.id, nome: user.nome, email: user.email }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        res.status(200).json({ token });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao realizar o login.' });
    }
});

// Redefinir senha
router.patch('/usuario/redefinir', async (req, res) => {
    try {
        const { error } = await schema.validateAsync(req.body);
        if (error) {
            return res.status(400).json({ error: 'Preencha todos os campos.' });
        }

        const { email, senha_antiga, senha_nova } = req.body;

        if (senha_antiga === senha_nova) {
            return res.status(400).json({ mensagem: 'A nova senha deve ser diferente da senha antiga.' });
        }

        const user = await getUserByEmail(email);
        if (!user) {
            return res.status(400).json({ mensagem: 'Email não encontrado.' });
        }

        const validPassword = await bcrypt.compare(senha_antiga, user.senha);
        if (!validPassword) {
            return res.status(400).json({ mensagem: 'Senha antiga incorreta.' });
        }

        const hashNewPassword = await bcrypt.hash(senha_nova, 10);
        await updatePassword(email, hashNewPassword);

        await sendEmail(email, 'Sua senha foi redefinida com sucesso.');

        res.status(200).json({ mensagem: 'Senha redefinida com sucesso.' });
    } catch (error) {
        winston.error(error);
        res.status(500).json({ error: 'Erro ao redefinir senha.' });
    }
});

async function getUserByEmail(email) {
    const result = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    return result.rows[0];
}

async function updatePassword(email, password) {
    await db.query('UPDATE usuarios SET senha = $1 WHERE email = $2', [password, email]);
}

async function sendEmail(email, message) {
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Senha redefinida com sucesso',
        text: message,
    };

    await transporter.sendMail(mailOptions);
}

// Cadastrar clientes
router.post('/cliente', async (req, res) => {
    const { nome, email, telefone, endereco } = req.body;

    if (!nome || !email) {
        return res.status(400).json({ error: 'Nome e email são obrigatórios.' });
    }

    try {
        const result = await db.query(
            'INSERT INTO clientes (nome, email, telefone, endereco) VALUES ($1, $2, $3, $4) RETURNING *',
            [nome, email, telefone, endereco]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            res.status(400).json({ error: 'Email já cadastrado.' });
        } else {
            res.status(500).json({ error: 'Erro ao cadastrar cliente.' });
        }
    }
});

// Listar clientes
router.get('/cliente', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM clientes');
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao listar clientes.' });
    }
});

// Cadastrar produtos
router.post('/produto', async (req, res) => {
    const { nome, preco, categoria_id } = req.body;

    if (!nome || !preco || !categoria_id) {
        return res.status(400).json({ error: 'Nome, preço e categoria são obrigatórios.' });
    }

    try {
        const result = await db.query(
            'INSERT INTO produtos (nome, preco, categoria_id) VALUES ($1, $2, $3) RETURNING *',
            [nome, preco, categoria_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao cadastrar produto.' });
    }
});

// Listar produtos
router.get('/produto', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM produtos');
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao listar produtos.' });
    }
});

// Pedido
router.post('/pedido', async (req, res) => {
    const { cliente_id, produtos } = req.body;

    if (!cliente_id || !produtos || produtos.length === 0) {
        return res.status(400).json({ error: 'Cliente e produtos são obrigatórios.' });
    }

    const clientExists = await db.query('SELECT * FROM clientes WHERE id = $1', [cliente_id]);
    if (clientExists.rowCount === 0) {
        return res.status(400).json({ error: 'Cliente não encontrado.' });
    }

    try {
        await db.query('BEGIN');

        const result = await db.query(
            'INSERT INTO pedidos (cliente_id) VALUES ($1) RETURNING id',
            [cliente_id]
        );

        const pedidoId = result.rows[0].id;

        for (const produto of produtos) {
            await db.query(
                'INSERT INTO itens_pedido (pedido_id, produto_id, quantidade) VALUES ($1, $2, $3)',
                [pedidoId, produto.id, produto.quantidade]
            );
        }

        await db.query('COMMIT');
        res.status(201).json({ mensagem: 'Pedido criado com sucesso.' });
    } catch (error) {
        await db.query('ROLLBACK');
        res.status(500).json({ error: 'Erro ao criar pedido.' });
    }
});

module.exports = router;
