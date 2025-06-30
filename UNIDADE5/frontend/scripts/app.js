const API_URL = 'http://localhost:3000/filmes';

document.addEventListener('DOMContentLoaded', () => {
    carregarFilmes();
    
    // Event listeners
    document.getElementById('salvar').addEventListener('click', salvarFilme);
    document.getElementById('buscar').addEventListener('click', buscarPorId);
    document.getElementById('listarTodos').addEventListener('click', carregarFilmes);
});

// Carrega todos os filmes
async function carregarFilmes() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Erro ao carregar filmes');
        
        const filmes = await response.json();
        preencherTabela(filmes);
    } catch (error) {
        console.error('Erro:', error);
        mostrarErro('Erro ao carregar filmes. Tente novamente.');
    }
}

// Preenche a tabela com os filmes
function preencherTabela(filmes) {
    const tbody = document.querySelector('#filmesTable tbody');
    tbody.innerHTML = '';
    
    if (filmes.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="5" class="no-data">Nenhum filme cadastrado</td>`;
        tbody.appendChild(tr);
        return;
    }
    
    filmes.forEach(filme => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${filme.id}</td>
            <td>${filme.titulo}</td>
            <td>${filme.genero}</td>
            <td>${filme.nota.toFixed(1)}</td>
            <td class="actions">
                <button onclick="editarFilme(${filme.id})">Editar</button>
                <button onclick="excluirFilme(${filme.id})">Excluir</button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

// Salva um filme novo ou atualiza existente
async function salvarFilme() {
    const idInput = document.getElementById('id');
    const titulo = document.getElementById('titulo').value.trim();
    const genero = document.getElementById('genero').value.trim();
    const nota = parseFloat(document.getElementById('nota').value);
    
    // Validação
    if (!titulo || !genero || isNaN(nota)) {
        mostrarErro('Preencha todos os campos!');
        return;
    }
    
    if (nota < 0 || nota > 10) {
        mostrarErro('A nota deve ser entre 0 e 10');
        return;
    }
    
    const filme = { titulo, genero, nota };
    let url = API_URL;
    let method = 'POST';
    
    // Se tem ID, é atualização
    if (idInput.value) {
        url += `/${idInput.value}`;
        method = 'PUT';
    }
    
    try {
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(filme)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao salvar filme');
        }
        
        const filmeSalvo = await response.json();
        mostrarSucesso(`Filme ${idInput.value ? 'atualizado' : 'adicionado'} com sucesso!`);
        limparFormulario();
        carregarFilmes();
    } catch (error) {
        console.error('Erro:', error);
        mostrarErro(error.message || 'Erro ao salvar filme');
    }
}

// Busca filme por ID
async function buscarPorId() {
    const id = document.getElementById('buscarId').value.trim();
    if (!id) {
        mostrarErro('Digite um ID para buscar');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Filme não encontrado');
        }
        
        const filme = await response.json();
        preencherFormulario(filme);
    } catch (error) {
        console.error('Erro:', error);
        mostrarErro(error.message || 'Erro ao buscar filme');
    }
}

// Exclui filme
async function excluirFilme(id) {
    if (!confirm('Tem certeza que deseja excluir este filme?')) return;
    
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao excluir filme');
        }
        
        mostrarSucesso('Filme excluído com sucesso!');
        carregarFilmes();
    } catch (error) {
        console.error('Erro:', error);
        mostrarErro(error.message || 'Erro ao excluir filme');
    }
}

// Preenche formulário para edição
async function editarFilme(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) throw new Error('Erro ao carregar filme');
        
        const filme = await response.json();
        preencherFormulario(filme);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('Erro:', error);
        mostrarErro('Erro ao carregar filme para edição');
    }
}

// Preenche formulário com dados do filme
function preencherFormulario(filme) {
    document.getElementById('id').value = filme.id;
    document.getElementById('titulo').value = filme.titulo;
    document.getElementById('genero').value = filme.genero;
    document.getElementById('nota').value = filme.nota;
}

// Limpa formulário
function limparFormulario() {
    document.getElementById('id').value = '';
    document.getElementById('titulo').value = '';
    document.getElementById('genero').value = '';
    document.getElementById('nota').value = '';
}

// Mostra mensagem de erro
function mostrarErro(mensagem) {
    alert(`Erro: ${mensagem}`);
}

// Mostra mensagem de sucesso
function mostrarSucesso(mensagem) {
    alert(`Sucesso: ${mensagem}`);
}

// Funções globais para os botões na tabela
window.editarFilme = editarFilme;
window.excluirFilme = excluirFilme;