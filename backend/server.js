const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const https = require('https');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const compression = require('compression');
const helmet = require('helmet');
const redis = require('redis');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const SECRET_KEY = process.env.SECRET_KEY || 'segredo1254@!';

// Configuração do Redis
const redisClient = redis.createClient({ url: 'redis://localhost:6379' });
redisClient.on('error', (err) => {
    console.error('Redis Client Error', err);
});
redisClient.connect();

// Conexão com o MongoDB
mongoose.connect('mongodb://localhost:27017/piadas', {
    maxPoolSize: 10,
})
    .then(() => console.log('Conectado ao MongoDB com pool de conexões'))
    .catch((err) => console.error('Erro ao conectar ao MongoDB:', err));

// Configuração de middleware
app.use(cors({ origin: 'http://localhost:3000', optionsSuccessStatus: 200 }));
app.use(bodyParser.json());
app.use(xss());
app.use(compression());
app.use(helmet());

// Limitador de requisições
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, 
});
app.use(limiter);

// Configuração do logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
    ],
});

// Esquema e modelo do usuário
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: String,
});
const User = mongoose.model('User', userSchema);

// Esquema e modelo da piada
const jokeSchema = new mongoose.Schema({
    content: String,
    category: String,
});
const Joke = mongoose.model('Joke', jokeSchema);

// Rota para registrar usuário
app.post('/register', [
    body('username').notEmpty().withMessage('Nome de usuário é obrigatório.'),
    body('password').isLength({ min: 5 }).withMessage('Senha deve ter pelo menos 5 caracteres.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    try {
        const hashedPassword = bcrypt.hashSync(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        res.json({ success: true, message: 'Usuário registrado com sucesso!' });
    } catch (error) {
        logger.error('Erro ao registrar usuário:', error);
        res.status(500).json({ message: 'Erro ao registrar usuário.' });
    }
});

// Rota para login
app.post('/login', [
    body('username').notEmpty().withMessage('Nome de usuário é obrigatório.'),
    body('password').isLength({ min: 5 }).withMessage('Senha deve ter pelo menos 5 caracteres.')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;
    User.findOne({ username })
        .then(user => {
            if (!user || !bcrypt.compareSync(password, user.password)) {
                return res.json({ success: false, message: 'Credenciais inválidas' });
            }
            const token = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: '1h' });
            res.json({ success: true, token });
        })
        .catch(err => {
            logger.error('Erro ao buscar usuário:', err);
            res.status(500).send('Erro no servidor');
        });
});

// Middleware para autenticação
const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(403);

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.sendStatus(403);
        req.userId = decoded.id;
        next();
    });
};

// Rota para piada aleatória
app.get('/piadas', authenticate, (req, res) => {
    Joke.aggregate([{ $sample: { size: 1 } }])
        .then(joke => res.json({ piadas: joke[0].content }))
        .catch(err => {
            logger.error('Erro ao obter piada:', err);
            res.status(500).send('Erro ao obter piada.');
        });
});

// Rota para adicionar piada
app.post('/piadas', authenticate, (req, res) => {
    const { content } = req.body;

    if (!content) return res.status(400).json({ message: 'Conteúdo da piada é necessário.' });

    const newJoke = new Joke({ content });
    newJoke.save()
        .then(() => res.json({ success: true }))
        .catch(err => {
            logger.error('Erro ao adicionar piada:', err);
            res.status(500).send('Erro ao adicionar piada.');
        });
});

// Rota para buscar piadas por categoria ou palavra-chave
app.get('/piadas/busca', authenticate, async (req, res) => {
    const { categoria, keyword } = req.query;

    const cacheKey = `piadas:busca:${categoria || 'all'}:${keyword || 'all'}`;

    try {
        // Verifica o cache
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.json(JSON.parse(cachedData));
        }

        // Se não houver cache, faça a consulta ao banco de dados
        let query = {};
        if (categoria) query.category = categoria;
        if (keyword) query.content = { $regex: keyword, $options: 'i' };

        const jokes = await Joke.find(query);
        const result = { piadas: jokes.map(joke => joke.content) };

        // Armazena no cache com expiração de 10 minutos
        await redisClient.set(cacheKey, JSON.stringify(result), {
            EX: 600
        });

        res.json(result);
    } catch (err) {
        logger.error('Erro ao buscar piadas:', err);
        res.status(500).send('Erro ao buscar piadas.');
    }
});

// Verifique se os arquivos de certificado existem antes de iniciar o servidor HTTPS
const keyPath = 'C:\\Users\\MT\\Desktop\\Projeto 3 - FullStack\\key.pem';
const certPath = 'C:\\Users\\MT\\Desktop\\Projeto 3 - FullStack\\cert.pem';

if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    const options = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
    };

    https.createServer(options, app).listen(PORT, () => {
        console.log(`Servidor rodando em https://localhost:${PORT}`);
    });
} else {
    console.error('Certificados HTTPS não encontrados. Verifique os arquivos key.pem e cert.pem.');
}
