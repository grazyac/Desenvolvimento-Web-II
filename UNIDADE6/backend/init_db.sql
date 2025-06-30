CREATE TABLE IF NOT EXISTS filmes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  genero TEXT NOT NULL,
  nota REAL NOT NULL CHECK (nota >= 0 AND nota <= 10)
);

-- Dados iniciais para teste (opcional)
INSERT INTO filmes (titulo, genero, nota) VALUES 
  ('O Poderoso Chefão', 'Drama', 9.2),
  ('Interestelar', 'Ficção Científica', 8.6),
  ('Parasita', 'Suspense', 8.5);