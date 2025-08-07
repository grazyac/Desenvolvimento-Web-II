# Controle de Finanças Pessoais

Aplicação full stack para controle de finanças pessoais com autenticação de usuários, registro de transações e visualização de relatórios.

## Funcionalidades

- Cadastro e autenticação de usuários
- Registro de entradas e saídas financeiras
- Edição e exclusão de transações
- Filtros por tipo, categoria e período
- Resumo financeiro (entradas, saídas e saldo)
- Gráficos de categorias e por período

## Tecnologias

- **Frontend**: HTML, CSS, JavaScript (DOM, Fetch API, Chart.js)
- **Backend**: Node.js, Express, SQLite
- **Autenticação**: Sessions com express-session
- **Segurança**: Bcrypt para hash de senhas

## Como Executar

1. Certifique-se de ter o Node.js instalado (versão LTS recomendada)
2. Clone este repositório ou faça o download do projeto
3. Abra um terminal na pasta `backend` e execute:
   ```bash
   npm install
   npm start