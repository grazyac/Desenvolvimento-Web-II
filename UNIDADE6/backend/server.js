const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');

const app = express();
app.use(express.json());

// Configuração do CORS
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

// Conexão com o banco de dados
const db = new Database('filmes.db', { verbose: console.log });

// Criar tabela se não existir (isso roda apenas uma vez)
db.prepare(`
  CREATE TABLE IF NOT EXISTS filmes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    genero TEXT NOT NULL,
    nota REAL NOT NULL CHECK (nota >= 0 AND nota <= 10)
  )
`).run();

// Função para validar nota
function validarNota(nota) {
  return !isNaN(nota) && nota >= 0 && nota <= 10;
}

// Rota raiz
app.get('/', (req, res) => {
  res.send('API de Filmes Favoritos com SQLite - Funcionando!');
});

// Listar todos os filmes
app.get('/filmes', (req, res) => {
  try {
    const filmes = db.prepare('SELECT * FROM filmes').all();
    res.json(filmes);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar filmes' });
  }
});

// Buscar filme por ID
app.get('/filmes/:id', (req, res) => {
  const id = parseInt(req.params.id);
  
  try {
    const filme = db.prepare('SELECT * FROM filmes WHERE id = ?').get(id);
    
    if (!filme) {
      return res.status(404).json({ error: 'Filme não encontrado' });
    }
    
    res.json(filme);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar filme' });
  }
});

// Adicionar novo filme
app.post('/filmes', (req, res) => {
  const { titulo, genero, nota } = req.body;
  
  if (!titulo || !genero || !nota) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }
  
  if (!validarNota(nota)) {
    return res.status(400).json({ error: 'Nota deve ser entre 0 e 10' });
  }
  
  try {
    const stmt = db.prepare('INSERT INTO filmes (titulo, genero, nota) VALUES (?, ?, ?)');
    const info = stmt.run(titulo, genero, parseFloat(nota));
    
    const novoFilme = {
      id: info.lastInsertRowid,
      titulo,
      genero,
      nota: parseFloat(nota)
    };
    
    res.status(201).json(novoFilme);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao adicionar filme' });
  }
});

// Atualizar filme
app.put('/filmes/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { titulo, genero, nota } = req.body;
  
  if (nota && !validarNota(nota)) {
    return res.status(400).json({ error: 'Nota deve ser entre 0 e 10' });
  }
  
  try {
    // Verifica se o filme existe
    const filmeExistente = db.prepare('SELECT * FROM filmes WHERE id = ?').get(id);
    if (!filmeExistente) {
      return res.status(404).json({ error: 'Filme não encontrado' });
    }
    
    // Atualiza apenas os campos fornecidos
    const camposAtualizar = [];
    const valores = [];
    
    if (titulo) {
      camposAtualizar.push('titulo = ?');
      valores.push(titulo);
    }
    
    if (genero) {
      camposAtualizar.push('genero = ?');
      valores.push(genero);
    }
    
    if (nota) {
      camposAtualizar.push('nota = ?');
      valores.push(parseFloat(nota));
    }
    
    if (camposAtualizar.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }
    
    valores.push(id);
    
    const query = `UPDATE filmes SET ${camposAtualizar.join(', ')} WHERE id = ?`;
    db.prepare(query).run(...valores);
    
    // Retorna o filme atualizado
    const filmeAtualizado = db.prepare('SELECT * FROM filmes WHERE id = ?').get(id);
    res.json(filmeAtualizado);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar filme' });
  }
});

// Remover filme
app.delete('/filmes/:id', (req, res) => {
  const id = parseInt(req.params.id);
  
  try {
    const info = db.prepare('DELETE FROM filmes WHERE id = ?').run(id);
    
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Filme não encontrado' });
    }
    
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover filme' });
  }
});

// Fechar conexão com o banco ao encerrar o servidor
process.on('SIGINT', () => {
  db.close();
  process.exit();
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log('Banco de dados SQLite conectado');
});