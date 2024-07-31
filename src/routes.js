const express = require('express');
const router = express.Router();
const db = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const nodemailer = require('nodemailer');
const winston = require('winston');

const schema = Joi.object({
    email: Joi.string().email().required(),
    senha_antiga: Joi.string().required(),
    senha_nova: Joi.string().required(),
});


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
/*
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
*/

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
            return res.status(400).json({ mensagem: 'Email ou senha incorretos.' });
        }

        const validPassword = await bcrypt.compare(senha_antiga, user.senha);
        if (!validPassword) {
            return res.status(400).json({ mensagem: 'Email ou senha incorretos' });
        }

        const hashNewPassword = await bcrypt.hash(senha_nova, 10);
        await updatePassword(email, hashNewPassword);

        await sendEmail(email, 'Senha redefinida com sucesso');

        res.status(200).json({ mensagem: 'Senha redefinida com sucesso' });
    } catch (error) {
        winston.error(error);
        res.status(500).json({ error: 'Erro ao redefinir senha' });
    }
});

async function getUserByEmail(email) {
    const result = await db.query('select * from usuarios where email = $1', [email]);
    return result.rows[0];
}

async function updatePassword(email, password) {
    await db.query('update usuarios set senha = $1 where email = $2', [password, email]);
}

async function sendEmail(email, message) {
    const transporter = nodemailer.createTransport({
        host: 'smtp.example.com',
        port: 587,
        secure: false, // or 'STARTTLS'
        auth: {
            user: 'username',
            pass: 'password',
        },
    });

    const mailOptions = {
        from: 'your_email@example.com',
        to: email,
        subject: 'Senha redefinida com sucesso',
        text: message,
    };

    await transporter.sendMail(mailOptions);
}

//cadastrar clientes
router.post('/cliente', async (req, res) => {
    const { nome, email, telefone, endereco } = req.body;

    if (!nome || !email) {
        return res.status(400).json({ error: 'Nome e email são obrigatórios' });
    }

    try {
        const result = await db.query(
            'INSERT INTO clientes (nome, email, telefone, endereco) values ($1, $2, $3, $4) returning *',
            [nome, email, telefone, endereco]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            res.status(400).json({ error: 'Email já cadastrado' });
        } else {
            res.status(500).json({ error: 'Erro ao cadastrar cliente' });
        }
    }
});

//listar clientes
router.get('/cliente', async (req, res) => {
    try {
        const result = await db.query('select * from clientes');
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao listar clientes' });
    }
});

//cadastrar produtos
router.post('/produto', async (req, res) => {
    const { nome, preco, categoria_id } = req.body;

    if (!nome || !preco || !categoria_id) {
        return res.status(400).json({ error: 'Nome, preço e categoria são obrigatórios' });
    }

    try {
        const result = await db.query(
            'INSERT INTO produtos (nome, preco, categoria_id) values ($1, $2, $3) returning *',
            [nome, preco, categoria_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao cadastrar produto' });
    }
});

//listar produtos
router.get('/produto', async (req, res) => {
    try {
        const result = await db.query('select * from produtos');
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao listar produtos' });
    }
});

//cadastrar pedidos
router.post('/pedido', async (req, res) => {
    const { cliente_id, itens } = req.body;

    if (!cliente_id || !itens || !Array.isArray(itens) || itens.length === 0) {
        return res.status(400).json({ error: 'Cliente e itens são obrigatórios' });
    }

    try {
        const client = await db.query('BEGIN');

        const pedidoResult = await db.query(
            'insert into pedidos (cliente_id) values ($1) returning *',
            [cliente_id]
        );
        const pedido = pedidoResult.rows[0];

        for (const item of itens) {
            const { produto_id, quantidade } = item;
            await db.query(
                'insert into itens_pedido (pedido_id, produto_id, quantidade) VALUES ($1, $2, $3)',
                [pedido.id, produto_id, quantidade]
            );
        }

        await db.query('commit');
        res.status(201).json(pedido);
    } catch (err) {
        await db.query('rollback');
        res.status(500).json({ error: 'Erro ao cadastrar pedido' });
    }
});

//listar pedidos
router.get('/pedido', async (req, res) => {
    try {
        const result = await db.query(`
        select p.id, p.data, c.nome AS cliente, json_agg(json_build_object('produto', pr.nome, 'quantidade', i.quantidade)) as itens
        from pedidos p
        join clientes c on p.cliente_id = c.id
        join itens_pedido i on i.pedido_id = p.id
        join produtos pr on i.produto_id = pr.id
        group by p.id, c.nome
      `);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao listar pedidos' });
    }
});

module.exports = router;