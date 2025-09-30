#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Configuração do Supabase para o CRM Lui Bambini.
Este script configura a conexão com o Supabase e define as funções
para criar as tabelas necessárias no banco de dados.
"""

import os
from supabase import create_client
from dotenv import load_dotenv

# Carrega variáveis de ambiente do arquivo .env se existir
load_dotenv()

# Obtém as credenciais do Supabase das variáveis de ambiente
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

# Inicializa o cliente Supabase
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def criar_tabelas():
    """
    Cria as tabelas necessárias no Supabase se elas não existirem.
    
    Returns:
        bool: True se as tabelas foram criadas com sucesso, False caso contrário
    """
    try:
        # Verifica se as tabelas já existem
        # Nota: Esta é uma verificação simplificada, em produção seria melhor usar migrations
        try:
            supabase.table('clientes').select('*').limit(1).execute()
            print("Tabela 'clientes' já existe.")
        except Exception:
            print("Criando tabela 'clientes'...")
            # SQL para criar a tabela de clientes
            sql_clientes = """
            CREATE TABLE IF NOT EXISTS clientes (
                id SERIAL PRIMARY KEY,
                third_id TEXT,
                nome TEXT NOT NULL,
                cpf TEXT UNIQUE,
                telefone_1 TEXT,
                telefone_2 TEXT,
                telefone_3 TEXT,
                data_cadastro TIMESTAMP,
                credito_loja NUMERIC DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            """
            supabase.rpc('exec_sql', {'sql': sql_clientes}).execute()
        
        try:
            supabase.table('vendas').select('*').limit(1).execute()
            print("Tabela 'vendas' já existe.")
        except Exception:
            print("Criando tabela 'vendas'...")
            # SQL para criar a tabela de vendas
            sql_vendas = """
            CREATE TABLE IF NOT EXISTS vendas (
                id SERIAL PRIMARY KEY,
                data TIMESTAMP NOT NULL,
                movimentacao TEXT,
                qtde_produtos INTEGER,
                total NUMERIC,
                cliente_id INTEGER REFERENCES clientes(id),
                cliente_nome TEXT,
                vendedor TEXT,
                telefone TEXT,
                custo_da_venda NUMERIC,
                lucro_da_venda NUMERIC,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            """
            supabase.rpc('exec_sql', {'sql': sql_vendas}).execute()
        
        try:
            supabase.table('ultima_compra').select('*').limit(1).execute()
            print("Tabela 'ultima_compra' já existe.")
        except Exception:
            print("Criando tabela 'ultima_compra'...")
            # SQL para criar a tabela de última compra
            sql_ultima_compra = """
            CREATE TABLE IF NOT EXISTS ultima_compra (
                id SERIAL PRIMARY KEY,
                cliente_id INTEGER REFERENCES clientes(id),
                cliente_nome TEXT NOT NULL,
                cliente_cpf TEXT UNIQUE,
                data_ultima_compra TIMESTAMP,
                dias_desde_ultima_compra INTEGER,
                categoria_tempo TEXT,
                total_ultima_compra NUMERIC,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            """
            supabase.rpc('exec_sql', {'sql': sql_ultima_compra}).execute()
        
        return True
    
    except Exception as e:
        print(f"Erro ao criar tabelas: {e}")
        return False

if __name__ == "__main__":
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Erro: SUPABASE_URL e SUPABASE_KEY devem ser definidos como variáveis de ambiente.")
        exit(1)
    
    criar_tabelas()
