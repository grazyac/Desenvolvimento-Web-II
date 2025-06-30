const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'usuarios.json');

// Inicializa dados
let filmes = [];
let currentId = 1;

// Carrega dados persistentes se existirem
if (fs.existsSync(DATA_FILE)) {
    const data = fs.readFileSync(DATA_FILE);
    filmes = JSON.parse(data);
    currentId = filmes.length > 0 ? Math.max(...filmes.map(f => f.id)) + 1 : 1;
}

// Salva dados no arquivo
function saveData() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(filmes, null, 2));
}

// Middleware para CORS (permite requisições do frontend)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Rotas da API
app.get('/filmes', (req, res) => {
    res.json(filmes);
});

app.get('/filmes/:id', (req, res) => {
    const filme = filmes.find(f => f.id === parseInt(req.params.id));
    if (!filme) return res.status(404).json({ error: 'Filme não encontrado' });
    res.json(filme);
});

app.post('/filmes', (req, res) => {
    const { titulo, genero, nota } = req.body;
    
    if (!titulo || !genero || nota === undefined) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
    
    if (nota < 0 || nota > 10) {
        return res.status(400).json({ error: 'A nota deve ser entre 0 e 10' });
    }

    const novoFilme = {
        id: currentId++,
        titulo,
        genero,
        nota: parseFloat(nota)
    };

    filmes.push(novoFilme);
    saveData();
    res.status(201).json(novoFilme);
});

app.put('/filmes/:id', (req, res) => {
    const filmeIndex = filmes.findIndex(f => f.id === parseInt(req.params.id));
    if (filmeIndex === -1) return res.status(404).json({ error: 'Filme não encontrado' });

    const { titulo, genero, nota } = req.body;
    
    if (nota !== undefined && (nota < 0 || nota > 10)) {
        return res.status(400).json({ error: 'A nota deve ser entre 0 e 10' });
    }

    filmes[filmeIndex] = {
        ...filmes[filmeIndex],
        titulo: titulo || filmes[filmeIndex].titulo,
        genero: genero || filmes[filmeIndex].genero,
        nota: nota !== undefined ? parseFloat(nota) : filmes[filmeIndex].nota
    };

    saveData();
    res.json(filmes[filmeIndex]);
});

app.delete('/filmes/:id', (req, res) => {
    const filmeIndex = filmes.findIndex(f => f.id === parseInt(req.params.id));
    if (filmeIndex === -1) return res.status(404).json({ error: 'Filme não encontrado' });

    const [filmeRemovido] = filmes.splice(filmeIndex, 1);
    saveData();
    res.json(filmeRemovido);
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});