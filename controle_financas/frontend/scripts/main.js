// Variáveis globais
let usuarioLogado = null;
let transacoes = [];
let graficoCategorias = null;
let graficoPeriodo = null;

// Elementos da página de login
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const tabs = document.querySelectorAll('.tab');

// Funções auxiliares
function formatarData(dataStr) {
  const data = new Date(dataStr);
  return data.toLocaleDateString('pt-BR');
}

function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

function mostrarErro(mensagem) {
  alert(mensagem);
}

// Funções de autenticação
async function registrarUsuario(nome, email, senha) {
  try {
    const response = await fetch('/api/registrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, senha })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Erro ao registrar');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
}

async function fazerLogin(email, senha) {
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Erro ao fazer login');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
}

async function fazerLogout() {
  try {
    const response = await fetch('/api/logout', {
      method: 'POST',
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Erro ao fazer logout');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
}

// Funções de transações
async function carregarTransacoes() {
  try {
    const response = await fetch('/api/transacoes', {
      method: 'GET',
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Erro ao carregar transações');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
}

async function adicionarTransacao(transacao) {
  try {
    const response = await fetch('/api/transacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transacao),
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Erro ao adicionar transação');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
}

async function atualizarTransacao(id, transacao) {
  try {
    const response = await fetch(`/api/transacoes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transacao),
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Erro ao atualizar transação');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
}

async function excluirTransacao(id) {
  try {
    const response = await fetch(`/api/transacoes/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Erro ao excluir transação');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
}

async function carregarResumo() {
  try {
    const response = await fetch('/api/resumo', {
      method: 'GET',
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Erro ao carregar resumo');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
}

// Funções da interface
function alternarFormulario(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('form').forEach(f => f.classList.remove('active'));
  
  tab.classList.add('active');
  document.getElementById(`${tab.dataset.tab}Form`).classList.add('active');
}

function atualizarTabelaTransacoes(transacoesFiltradas = transacoes) {
  const tbody = document.getElementById('transacoesBody');
  tbody.innerHTML = '';
  
  transacoesFiltradas.forEach(transacao => {
    const tr = document.createElement('tr');
    
    tr.innerHTML = `
      <td class="${transacao.tipo}">${transacao.tipo === 'entrada' ? 'Entrada' : 'Saída'}</td>
      <td>${formatarMoeda(transacao.valor)}</td>
      <td>${transacao.categoria}</td>
      <td>${transacao.descricao || '-'}</td>
      <td>${formatarData(transacao.data)}</td>
      <td class="acoes">
        <button class="editar" data-id="${transacao.id}">Editar</button>
        <button class="excluir" data-id="${transacao.id}">Excluir</button>
      </td>
    `;
    
    tbody.appendChild(tr);
  });
  
  // Adicionar eventos aos botões
  document.querySelectorAll('.editar').forEach(btn => {
    btn.addEventListener('click', () => editarTransacao(btn.dataset.id));
  });
  
  document.querySelectorAll('.excluir').forEach(btn => {
    btn.addEventListener('click', () => confirmarExclusao(btn.dataset.id));
  });
}

function atualizarResumo() {
  carregarResumo().then(resumo => {
    document.getElementById('totalEntradas').textContent = formatarMoeda(resumo.totalEntradas);
    document.getElementById('totalSaidas').textContent = formatarMoeda(resumo.totalSaidas);
    document.getElementById('saldo').textContent = formatarMoeda(resumo.saldo);
  }).catch(mostrarErro);
}

function atualizarGraficos() {
  // Gráfico de categorias (pizza)
  const categorias = [...new Set(transacoes.map(t => t.categoria))];
  const dadosCategorias = categorias.map(categoria => {
    const total = transacoes
      .filter(t => t.categoria === categoria)
      .reduce((sum, t) => sum + t.valor, 0);
    return total;
  });
  
  const ctxCategorias = document.getElementById('graficoCategorias').getContext('2d');
  
  if (graficoCategorias) {
    graficoCategorias.destroy();
  }
  
  graficoCategorias = new Chart(ctxCategorias, {
    type: 'pie',
    data: {
      labels: categorias,
      datasets: [{
        data: dadosCategorias,
        backgroundColor: [
          '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', 
          '#1abc9c', '#d35400', '#34495e', '#7f8c8d', '#16a085'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Gastos por Categoria'
        }
      }
    }
  });
  
  // Gráfico por período (barras)
  const transacoesPorData = transacoes.reduce((acc, transacao) => {
    const data = transacao.data;
    if (!acc[data]) {
      acc[data] = { entrada: 0, saida: 0 };
    }
    acc[data][transacao.tipo] += transacao.valor;
    return acc;
  }, {});
  
  const datas = Object.keys(transacoesPorData).sort();
  const entradas = datas.map(data => transacoesPorData[data].entrada);
  const saidas = datas.map(data => transacoesPorData[data].saida);
  
  const ctxPeriodo = document.getElementById('graficoPeriodo').getContext('2d');
  
  if (graficoPeriodo) {
    graficoPeriodo.destroy();
  }
  
  graficoPeriodo = new Chart(ctxPeriodo, {
    type: 'bar',
    data: {
      labels: datas.map(formatarData),
      datasets: [
        {
          label: 'Entradas',
          data: entradas,
          backgroundColor: '#2ecc71',
          borderWidth: 1
        },
        {
          label: 'Saídas',
          data: saidas,
          backgroundColor: '#e74c3c',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Entradas e Saídas por Período'
        }
      }
    }
  });
}

function preencherCategorias() {
  const select = document.getElementById('filtroCategoria');
  const categorias = [...new Set(transacoes.map(t => t.categoria))];
  
  select.innerHTML = '<option value="todos">Todas</option>';
  categorias.forEach(categoria => {
    const option = document.createElement('option');
    option.value = categoria;
    option.textContent = categoria;
    select.appendChild(option);
  });
}

function filtrarTransacoes() {
  const tipo = document.getElementById('filtroTipo').value;
  const categoria = document.getElementById('filtroCategoria').value;
  const dataInicio = document.getElementById('filtroDataInicio').value;
  const dataFim = document.getElementById('filtroDataFim').value;
  
  let transacoesFiltradas = [...transacoes];
  
  if (tipo !== 'todos') {
    transacoesFiltradas = transacoesFiltradas.filter(t => t.tipo === tipo);
  }
  
  if (categoria !== 'todos') {
    transacoesFiltradas = transacoesFiltradas.filter(t => t.categoria === categoria);
  }
  
  if (dataInicio) {
    transacoesFiltradas = transacoesFiltradas.filter(t => t.data >= dataInicio);
  }
  
  if (dataFim) {
    transacoesFiltradas = transacoesFiltradas.filter(t => t.data <= dataFim);
  }
  
  atualizarTabelaTransacoes(transacoesFiltradas);
}

function limparFormularioTransacao() {
  document.getElementById('transacaoForm').reset();
  document.getElementById('transacaoData').value = new Date().toISOString().split('T')[0];
}

function editarTransacao(id) {
  const transacao = transacoes.find(t => t.id === parseInt(id));
  if (!transacao) return;
  
  document.getElementById('transacaoTipo').value = transacao.tipo;
  document.getElementById('transacaoValor').value = transacao.valor;
  document.getElementById('transacaoCategoria').value = transacao.categoria;
  document.getElementById('transacaoDescricao').value = transacao.descricao || '';
  document.getElementById('transacaoData').value = transacao.data;
  
  // Alterar o botão para "Atualizar"
  const form = document.getElementById('transacaoForm');
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.textContent = 'Atualizar';
  
  // Remover event listeners antigos
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);
  
  // Adicionar novo event listener
  document.getElementById('transacaoForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const transacaoAtualizada = {
      tipo: document.getElementById('transacaoTipo').value,
      valor: parseFloat(document.getElementById('transacaoValor').value),
      categoria: document.getElementById('transacaoCategoria').value,
      descricao: document.getElementById('transacaoDescricao').value,
      data: document.getElementById('transacaoData').value
    };
    
    atualizarTransacao(id, transacaoAtualizada)
      .then(() => {
        limparFormularioTransacao();
        submitBtn.textContent = 'Adicionar Transação';
        carregarDadosDashboard();
      })
      .catch(mostrarErro);
  });
}

function confirmarExclusao(id) {
  if (confirm('Tem certeza que deseja excluir esta transação?')) {
    excluirTransacao(id)
      .then(() => carregarDadosDashboard())
      .catch(mostrarErro);
  }
}

function carregarDadosDashboard() {
  carregarTransacoes()
    .then(data => {
      transacoes = data;
      atualizarTabelaTransacoes();
      preencherCategorias();
      atualizarResumo();
      atualizarGraficos();
    })
    .catch(mostrarErro);
}

// Event Listeners
if (loginForm && registerForm) {
  // Página de login/registro
  tabs.forEach(tab => {
    tab.addEventListener('click', () => alternarFormulario(tab));
  });
  
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const senha = document.getElementById('loginPassword').value;
    
    fazerLogin(email, senha)
      .then(usuario => {
        usuarioLogado = usuario;
        window.location.href = '/dashboard';
      })
      .catch(mostrarErro);
  });
  
  registerForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const nome = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const senha = document.getElementById('registerPassword').value;
    
    registrarUsuario(nome, email, senha)
      .then(() => {
        alert('Registro realizado com sucesso! Faça login para continuar.');
        document.querySelector('.tab[data-tab="login"]').click();
      })
      .catch(mostrarErro);
  });
} else {
  // Página dashboard
  document.addEventListener('DOMContentLoaded', () => {
    // Verificar se o usuário está logado
    fetch('/api/transacoes', { credentials: 'include' })
      .then(response => {
        if (!response.ok) {
          window.location.href = '/';
        }
        return carregarDadosDashboard();
      })
      .catch(() => window.location.href = '/');
    
    // Configurar data padrão no formulário
    document.getElementById('transacaoData').value = new Date().toISOString().split('T')[0];
    
    // Event listeners
    document.getElementById('transacaoForm').addEventListener('submit', function(e) {
      e.preventDefault();
      
      const transacao = {
        tipo: document.getElementById('transacaoTipo').value,
        valor: parseFloat(document.getElementById('transacaoValor').value),
        categoria: document.getElementById('transacaoCategoria').value,
        descricao: document.getElementById('transacaoDescricao').value,
        data: document.getElementById('transacaoData').value
      };
      
      adicionarTransacao(transacao)
        .then(() => {
          limparFormularioTransacao();
          carregarDadosDashboard();
        })
        .catch(mostrarErro);
    });
    
    document.getElementById('aplicarFiltros').addEventListener('click', filtrarTransacoes);
    
    document.getElementById('logoutBtn').addEventListener('click', () => {
      fazerLogout()
        .then(() => window.location.href = '/')
        .catch(mostrarErro);
    });
  });
}