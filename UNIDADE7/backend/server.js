const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET','POST','PUT','DELETE'],
  credentials: true
}));

// Sessões
app.use(session({
  secret: 'um-segredo-forte-mude-isso-em-producao',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // em produção, usar secure: true com HTTPS
}));

const db = new Database('filmes.db', { verbose: console.log });

// Criar tabelas
db.prepare(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    papel TEXT NOT NULL DEFAULT 'user'
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS filmes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    genero TEXT NOT NULL,
    nota REAL NOT NULL CHECK(nota>=0 AND nota<=10)
  )
`).run();

// Middleware de autenticação
function requireAuth(req, res, next) {
  if (!req.session.usuario) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  next();
}

// Middleware de autorização admin
function requireAdmin(req, res, next) {
  if (req.session.usuario.papel !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado: não é admin' });
  }
  next();
}

// 📌 Rotas de usuário
app.post('/register', async (req, res) => {
  const { email, senha, papel } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }
  try {
    const hash = await bcrypt.hash(senha, 10);
    db.prepare('INSERT INTO usuarios (email, senha, papel) VALUES (?, ?, ?)')
      .run(email, hash, papel || 'user');
    res.status(201).json({ message: 'Usuário cadastrado' });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ error: 'Email já cadastrado' });
    } else {
      res.status(500).json({ error: 'Erro ao cadastrar usuário' });
    }
  }
});

app.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }
  const usuario = db.prepare('SELECT id, email, senha, papel FROM usuarios WHERE email = ?')
    .get(email);
  if (!usuario) {
    return res.status(400).json({ error: 'Login inválido' });
  }
  const match = await bcrypt.compare(senha, usuario.senha);
  if (!match) {
    return res.status(400).json({ error: 'Login inválido' });
  }

  req.session.usuario = {
    id: usuario.id,
    email: usuario.email,
    papel: usuario.papel
  };
  res.json({ message: 'Login bem-sucedido' });
});

app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'Erro ao deslogar' });
    res.json({ message: 'Logout bem-sucedido' });
  });
});

// Endpoint para obter perfil
app.get('/perfil', requireAuth, (req, res) => {
  res.json(req.session.usuario);
});

// 🎬 Endpoints de filmes (protegidos)
app.get('/filmes', requireAuth, (req, res) => {
  const filmes = db.prepare('SELECT * FROM filmes').all();
  res.json(filmes);
});

app.get('/filmes/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id);
  const f = db.prepare('SELECT * FROM filmes WHERE id = ?').get(id);
  if (!f) return res.status(404).json({ error: 'Filme não encontrado' });
  res.json(f);
});

app.post('/filmes', requireAuth, (req, res) => {
  const { titulo, genero, nota } = req.body;
  if (!titulo || !genero || nota == null) {
    return res.status(400).json({ error: 'Campos obrigatórios: titulo, genero, nota' });
  }
  if (isNaN(nota) || nota < 0 || nota > 10) {
    return res.status(400).json({ error: 'Nota deve ser 0–10' });
  }
  const info = db.prepare('INSERT INTO filmes (titulo, genero, nota) VALUES (?, ?, ?)')
    .run(titulo, genero, parseFloat(nota));
  const novo = db.prepare('SELECT * FROM filmes WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(novo);
});

app.put('/filmes/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id);
  const original = db.prepare('SELECT * FROM filmes WHERE id = ?').get(id);
  if (!original) return res.status(404).json({ error: 'Filme não encontrado' });

  const { titulo, genero, nota } = req.body;
  const updates = [];
  const vals = [];

  if (titulo) { updates.push('titulo = ?'); vals.push(titulo); }
  if (genero) { updates.push('genero = ?'); vals.push(genero); }
  if (nota != null) {
    if (isNaN(nota) || nota < 0 || nota > 10) {
      return res.status(400).json({ error: 'Nota deve ser 0–10' });
    }
    updates.push('nota = ?');
    vals.push(parseFloat(nota));
  }

  if (!updates.length) {
    return res.status(400).json({ error: 'Nenhum campo para atualizar' });
  }

  vals.push(id);
  db.prepare(`UPDATE filmes SET ${updates.join(', ')} WHERE id = ?`).run(...vals);
  const atualizado = db.prepare('SELECT * FROM filmes WHERE id = ?').get(id);
  res.json(atualizado);
});

// Exclusão apenas por admin
app.delete('/filmes/:id', requireAuth, requireAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  const info = db.prepare('DELETE FROM filmes WHERE id = ?').run(id);
  if (!info.changes) return res.status(404).json({ error: 'Filme não encontrado' });
  res.status(204).send();
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});