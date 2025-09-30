# CRM Lui Bambini

Sistema de CRM para análise de tempo desde a última compra de clientes, permitindo personalização de mensagens baseada no tempo de inatividade.

## Estrutura do Projeto

```
crmluibambini/
├── data/                   # Diretório para armazenar dados
│   ├── vendas.xlsx         # Planilha de vendas
│   └── pessoas.xlsx        # Planilha de clientes
├── src/
│   ├── data/               # Scripts para processamento de dados
│   │   ├── process_data.py # Script para processar e integrar dados
│   │   └── supabase_config.py # Configuração do Supabase
│   ├── analysis/           # Scripts para análise de dados
│   │   ├── ultima_compra.py # Cálculo de tempo desde última compra
│   │   └── mensagens_personalizadas.py # Geração de mensagens personalizadas
│   └── webapp/             # Aplicação web para visualização dos dados
├── webapp/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── lib/            # Utilitários e configurações
│   │   └── ...
│   └── ...
└── README.md               # Este arquivo
```

## Funcionalidades

- **Processamento de Dados**: Integração de planilhas de vendas e clientes
- **Cálculo de Tempo desde Última Compra**: Análise do período de inatividade de cada cliente
- **Segmentação de Clientes**: Categorização de clientes com base no tempo desde a última compra
- **Mensagens Personalizadas**: Geração de modelos de mensagens adaptados para cada segmento
- **Dashboard Interativo**: Visualização e filtro de dados de clientes e suas compras
- **Estatísticas**: Gráficos e métricas sobre o comportamento de compra dos clientes

## Requisitos

- Python 3.6+
- Node.js 14+
- Supabase (banco de dados)

## Configuração

1. **Configuração do ambiente**:

   ```bash
   # Instalar dependências Python
   pip install pandas numpy supabase python-dotenv

   # Instalar dependências do frontend
   cd webapp
   pnpm install
   ```

2. **Configuração do Supabase**:

   Crie um arquivo `.env` na raiz do projeto e no diretório `webapp` com as seguintes variáveis:

   ```
   SUPABASE_URL=sua_url_do_supabase
   SUPABASE_KEY=sua_chave_do_supabase
   ```

   No diretório `webapp`, use:

   ```
   VITE_SUPABASE_URL=sua_url_do_supabase
   VITE_SUPABASE_KEY=sua_chave_do_supabase
   ```

## Uso

1. **Processamento de dados**:

   ```bash
   cd crmluibambini
   python src/data/process_data.py
   ```

2. **Análise de tempo desde última compra**:

   ```bash
   python src/analysis/ultima_compra.py
   ```

3. **Geração de mensagens personalizadas**:

   ```bash
   python src/analysis/mensagens_personalizadas.py
   ```

4. **Execução do frontend**:

   ```bash
   cd webapp
   pnpm run dev
   ```

## Estrutura do Banco de Dados

O sistema utiliza três tabelas principais no Supabase:

1. **clientes**: Armazena informações dos clientes
   - id, third_id, nome, cpf, telefones, data_cadastro, credito_loja

2. **vendas**: Armazena informações das vendas
   - id, data, movimentacao, qtde_produtos, total, cliente_id, vendedor, telefone, custo_da_venda, lucro_da_venda

3. **ultima_compra**: Armazena informações sobre a última compra de cada cliente
   - id, cliente_id, cliente_nome, cliente_cpf, data_ultima_compra, dias_desde_ultima_compra, categoria_tempo, total_ultima_compra

## Categorias de Tempo

Os clientes são categorizados com base no tempo desde a última compra:

- **Últimos 30 dias**: Clientes ativos recentes
- **31-60 dias**: Clientes ativos
- **61-90 dias**: Clientes em risco de inatividade
- **91-180 dias**: Clientes em risco elevado
- **181-365 dias**: Clientes inativos
- **Mais de 365 dias**: Clientes perdidos
