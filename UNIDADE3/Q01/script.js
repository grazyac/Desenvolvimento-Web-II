document.addEventListener('DOMContentLoaded', function() {
    const tarefaInput = document.getElementById('tarefaInput');
    const adicionarBtn = document.getElementById('adicionarBtn');
    const listaTarefas = document.getElementById('listaTarefas');
    
    function adicionarTarefa() {
        const texto = tarefaInput.value.trim();
        
        if (texto === '') {
            alert('Por favor, digite uma tarefa:');
            return;
        }
        
        const novaTarefa = document.createElement('li');
        const textoTarefa = document.createElement('span');
        textoTarefa.textContent = texto;
        
        const removerBtn = document.createElement('button');
        removerBtn.textContent = 'Remover';
        removerBtn.className = 'removerBtn';
        
        removerBtn.addEventListener('click', function() {
            listaTarefas.removeChild(novaTarefa);
        });
        
        novaTarefa.appendChild(textoTarefa);
        novaTarefa.appendChild(removerBtn);
        listaTarefas.appendChild(novaTarefa);
        
        tarefaInput.value = '';
        tarefaInput.focus();
    }
    
    adicionarBtn.addEventListener('click', adicionarTarefa);
    
    tarefaInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            adicionarTarefa();
        }
    });
});
