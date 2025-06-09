const express = require('express');
const app = express();
const PORT = 3000;

// 1. Rota com parâmetro de rota
app.get('/saudacao/:nome', (req, res) => {
    const nome = req.params.nome;
    res.send(`Olá, ${nome}!`);
});

// 2. Rota com parâmetros de query 
app.get('/soma', (req, res) => {
    const a = parseFloat(req.query.a);
    const b = parseFloat(req.query.b);
    
    if (isNaN(a) || isNaN(b)) {
        return res.status(400).json({ erro: 'Por favor, forneça dois números válidos nos parâmetros a e b' });
    }
    
    const soma = a + b;
    res.json({
        a: a,
        b: b,
        soma: soma
    });
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});