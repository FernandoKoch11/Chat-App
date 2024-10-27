const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const WebSocket = require('ws');
const http = require('http'); // Importa o módulo HTTP

const app = express();
const server = http.createServer(app); // Usa o servidor HTTP para suportar WebSocket
const wss = new WebSocket.Server({ server }); // Inicia o servidor WebSocket

// Middleware para servir os arquivos estáticos do frontend
app.use(express.static(__dirname));
app.use(express.static('public')); // Serve arquivos estáticos da pasta 'public'
app.use(bodyParser.json()); // Middleware para tratar JSON no corpo das requisições

// Armazena os usuários conectados
let connectedUsers = {};

// Configurações do WebSocket
wss.on('connection', (ws) => {
    ws.on('message', (data) => {
        const parsedData = JSON.parse(data);
        if (parsedData.type === 'login') {
            // Identifica o usuário ao conectar
            ws.username = parsedData.username;
            connectedUsers[parsedData.username] = ws;
        } else if (parsedData.type === 'message') {
            // Envia a mensagem a todos os usuários conectados
            const messageData = {
                username: ws.username,
                message: parsedData.message
            };
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(messageData));
                }
            });
        }
    });

    ws.on('close', () => {
        // Remove o usuário desconectado
        if (ws.username) {
            delete connectedUsers[ws.username];
        }
    });
});

// Configuração do banco de dados
const db = new sqlite3.Database('./users.db');

db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS users (username TEXT, password TEXT)");
});

// Rota de cadastro
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
        if (err) {
            return res.json({ message: "Erro ao verificar usuário." });
        }
        if (row) {
            return res.json({ message: "Nome de usuário já existe. Escolha outro." });
        }
        db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, password], (err) => {
            if (err) {
                return res.json({ message: "Erro ao cadastrar usuário." });
            }
            res.json({ message: "Usuário cadastrado com sucesso!" });
        });
    });
});

// Rota de login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
        if (err) {
            return res.json({ message: "Erro ao fazer login." });
        }
        if (row) {
            res.json({ message: "Login bem-sucedido!" });
        } else {
            res.json({ message: "Nome de usuário ou senha incorretos." });
        }
    });
});

// Inicia o servidor HTTP na porta 3000
server.listen(3000, () => {
    console.log("Servidor rodando na porta 3000");
});
