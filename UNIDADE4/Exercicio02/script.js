const express = require('express');
const app = express();
const PORT = 3000;

// Rota /produto que responde conforme o id recebido
app.get('/produto', (req, res) => {
    const id = req.query.id;

    if (id === '1') {
        // Responde com JSON para o produto 1
        res.json({ 
            nome: "Mouse", 
            preco: 100 
        });
    } else if (id === '2') {
        // Responde com JSON para o produto 2
        res.json({ 
            nome: "Teclado", 
            preco: 200 
        });
    } else {
        // Responde com status 404 e mensagem para outros casos
        res.status(404).send('Produto não encontrado');
    }
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
