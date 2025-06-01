document.addEventListener('DOMContentLoaded', function() {
    const livroInput = document.getElementById('livroInput');
    const buscarBtn = document.getElementById('buscarBtn');
    const resultadoDiv = document.getElementById('resultado');
    
    async function buscarLivros() {
        const termoBusca = livroInput.value.trim();
        
        if (!termoBusca) {
            exibirErro("Por favor, digite um título ou autor.");
            return;
        }
        
        try {
            resultadoDiv.innerHTML = '<p>Buscando livros...</p>';
            
            const resposta = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(termoBusca)}`);
            
            if (!resposta.ok) {
                throw new Error("Erro ao buscar livros. Tente novamente.");
            }
            
            const dados = await resposta.json();
            
            if (dados.numFound === 0) {
                exibirErro("Nenhum livro encontrado. Tente outro termo.");
                return;
            }
            
            exibirLivros(dados.docs.slice(0, 5)); // Limita a 5 resultados
        } catch (erro) {
            exibirErro(erro.message);
        }
    }
    
    function exibirLivros(livros) {
        resultadoDiv.innerHTML = '';
        
        livros.forEach(livro => {
            const capaUrl = livro.cover_i 
                ? `https://covers.openlibrary.org/b/id/${livro.cover_i}-M.jpg` 
                : 'https://via.placeholder.com/120x180?text=Capa+Não+Disponível';
            
            const livroCard = document.createElement('div');
            livroCard.className = 'livro-card';
            
            livroCard.innerHTML = `
                <img class="livro-capa" src="${capaUrl}" alt="${livro.title}">
                <div class="livro-info">
                    <h3 class="livro-titulo">${livro.title}</h3>
                    <p class="livro-autor">${livro.author_name ? livro.author_name.join(', ') : 'Autor desconhecido'}</p>
                    <p class="livro-ano">${livro.first_publish_year || 'Ano não disponível'}</p>
                    <p class="livro-descricao">${livro.first_sentence ? livro.first_sentence[0] : 'Descrição não disponível.'}</p>
                </div>
            `;
            
            resultadoDiv.appendChild(livroCard);
        });
    }
    
    function exibirErro(mensagem) {
        resultadoDiv.innerHTML = `<p class="mensagem-erro">${mensagem}</p>`;
    }
    
    buscarBtn.addEventListener('click', buscarLivros);
    livroInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') buscarLivros();
    });
});

