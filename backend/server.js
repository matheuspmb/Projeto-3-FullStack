const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;

const corsOptions = {
    origin: 'http://localhost:3000',
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(bodyParser.json());

// Simulando banco de dados
const users = [
    { id: 1, username: 'admin', password: bcrypt.hashSync('admin123', 10) },
];

const SECRET_KEY = 'segredo1254@!';

// Rota para login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);

    if (user && bcrypt.compareSync(password, user.password)) {
        const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ success: true, token });
    } else {
        res.json({ success: false, message: 'Credenciais inválidas' });
    }
});

// Middleware para autenticação
const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(403); // Acesso negado se o token não for fornecido

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.sendStatus(403); // Acesso negado se o token for inválido
        req.userId = decoded.id;
        next();
    });
};

// Rota para piada aleatória (simulada)
app.get('/piadas', authenticate, (req, res) => {
    // Simulação de uma piada aleatória
    const piadas = [
        "Por que o Chuck Norris não usa relógio? Porque ele decide que horas são.",
        "Chuck Norris pode dividir por zero.",
        "Quando Chuck Norris faz flexões, ele não está levantando seu corpo, está empurrando a Terra para baixo."
    ];
    const piadaAleatoria = piadas[Math.floor(Math.random() * piadas.length)];
    res.json({ piadas: piadaAleatoria });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
