const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');
const app = express();

// Configurações
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));

// Configuração da sessão
app.use(session({
  secret: 'segredoMuitoSecreto',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // true se estiver usando HTTPS
}));

// Conexão com o banco de dados
const db = new sqlite3.Database('./banco.db', (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
  } else {
    console.log('Conectado ao banco de dados SQLite');
    criarTabelas();
  }
});

// Criar tabelas se não existirem
function criarTabelas() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      senha TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('entrada', 'saida')),
      valor REAL NOT NULL CHECK(valor > 0),
      categoria TEXT NOT NULL,
      descricao TEXT,
      data TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);
}

// Middleware para verificar autenticação
function verificarAutenticacao(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Não autorizado' });
  }
}

// Rotas de autenticação
app.post('/api/registrar', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    const hashSenha = await bcrypt.hash(senha, 10);
    
    db.run(
      'INSERT INTO users (nome, email, senha) VALUES (?, ?, ?)',
      [nome, email, hashSenha],
      function(err) {
        if (err) {
          return res.status(400).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/login', (req, res) => {
  const { email, senha } = req.body;
  
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }
    
    const senhaCorreta = await bcrypt.compare(senha, user.senha);
    if (!senhaCorreta) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }
    
    req.session.userId = user.id;
    res.json({ id: user.id, nome: user.nome, email: user.email });
  });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao fazer logout' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logout realizado com sucesso' });
  });
});

// Rotas de transações (protegidas)
app.get('/api/transacoes', verificarAutenticacao, (req, res) => {
  db.all(
    'SELECT * FROM transactions WHERE user_id = ? ORDER BY data DESC',
    [req.session.userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

app.post('/api/transacoes', verificarAutenticacao, (req, res) => {
  const { tipo, valor, categoria, descricao, data } = req.body;
  
  db.run(
    'INSERT INTO transactions (user_id, tipo, valor, categoria, descricao, data) VALUES (?, ?, ?, ?, ?, ?)',
    [req.session.userId, tipo, valor, categoria, descricao, data],
    function(err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      res.status(201).json({ id: this.lastID });
    }
  );
});

app.put('/api/transacoes/:id', verificarAutenticacao, (req, res) => {
  const { tipo, valor, categoria, descricao, data } = req.body;
  const { id } = req.params;
  
  db.run(
    'UPDATE transactions SET tipo = ?, valor = ?, categoria = ?, descricao = ?, data = ? WHERE id = ? AND user_id = ?',
    [tipo, valor, categoria, descricao, data, id, req.session.userId],
    function(err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Transação não encontrada' });
      }
      res.json({ message: 'Transação atualizada com sucesso' });
    }
  );
});

app.delete('/api/transacoes/:id', verificarAutenticacao, (req, res) => {
  const { id } = req.params;
  
  db.run(
    'DELETE FROM transactions WHERE id = ? AND user_id = ?',
    [id, req.session.userId],
    function(err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Transação não encontrada' });
      }
      res.json({ message: 'Transação excluída com sucesso' });
    }
  );
});

app.get('/api/resumo', verificarAutenticacao, (req, res) => {
  db.get(
    `SELECT 
      SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END) as totalEntradas,
      SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END) as totalSaidas
     FROM transactions WHERE user_id = ?`,
    [req.session.userId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({
        totalEntradas: row.totalEntradas || 0,
        totalSaidas: row.totalSaidas || 0,
        saldo: (row.totalEntradas || 0) - (row.totalSaidas || 0)
      });
    }
  );
});

// Rota para servir o frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.get('/dashboard', verificarAutenticacao, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});