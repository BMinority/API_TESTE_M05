import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";

const app = express();
const port = process.env.PORT || 3000;

const smtp = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const configEmail = {
    from: "bugtrakers@gmail.com",
    to: "brunocoelho66@gmail.com",
    subject: "Teste de envio de emails",
    html: "<p>Email recebido com sucesso.</p>"
};

new Promise((resolve, reject) => {
    smtp.sendMail(configEmail, (error, info) => {
        if (error) {
            console.log(error);
            smtp.close();
            return reject(error);
        } else {
            console.log('Email enviado: ' + info.response);
            smtp.close();
            return resolve(info);
        }
    });
});

app.use(express.json());
app.use(cors());

let users = [];

app.get("/", (req, res) => {
    res.send("Hello World");
});

app.get("/users", (req, res) => {
    res.json(users);
});

app.post("/users", (req, res) => {
    const { name, email } = req.body;
    const newUser = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        email,
    };

    users.push(newUser);
    res.json(newUser);
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
