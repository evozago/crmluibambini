#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script para processar e integrar dados de vendas e clientes.
Este script lê as planilhas de vendas e clientes, processa os dados
e armazena no Supabase para análise de tempo desde a última compra.
"""

import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import re
from supabase_config import supabase, criar_tabelas

def limpar_telefone(telefone):
    """
    Limpa o número de telefone removendo caracteres não numéricos.
    
    Args:
        telefone: Número de telefone como string
        
    Returns:
        String contendo apenas os dígitos do telefone ou None se for inválido
    """
    if pd.isna(telefone) or telefone == '':
        return None
    
    # Converte para string caso seja número
    telefone = str(telefone)
    
    # Remove todos os caracteres não numéricos
    telefone_limpo = re.sub(r'[^0-9]', '', telefone)
    
    # Verifica se o telefone tem pelo menos 8 dígitos
    if len(telefone_limpo) < 8:
        return None
        
    return telefone_limpo

def converter_data_excel(data_excel):
    """
    Converte data do formato Excel para datetime.
    
    Args:
        data_excel: Data no formato numérico do Excel
        
    Returns:
        Objeto datetime correspondente
    """
    if pd.isna(data_excel):
        return None
    
    # Data base do Excel (1900-01-01) menos 2 dias devido a um bug do Excel
    data_base = datetime(1900, 1, 1) - timedelta(days=2)
    
    # Converte o número de dias para uma data
    return data_base + timedelta(days=float(data_excel))

def carregar_dados_vendas(caminho_arquivo):
    """
    Carrega e processa os dados da planilha de vendas.
    
    Args:
        caminho_arquivo: Caminho para o arquivo de vendas
        
    Returns:
        DataFrame pandas com os dados de vendas processados
    """
    print(f"Carregando dados de vendas de {caminho_arquivo}...")
    
    # Carrega a planilha de vendas
    df_vendas = pd.read_excel(caminho_arquivo)
    
    # Seleciona apenas as colunas relevantes
    colunas_relevantes = ['data', 'movimentacao', 'qtde_produtos', 'total', 
                         'cliente', 'vendedor', 'telefone', 'custo_da_venda', 'lucro_da_venda']
    
    # Verifica se todas as colunas existem
    colunas_existentes = [col for col in colunas_relevantes if col in df_vendas.columns]
    df_vendas = df_vendas[colunas_existentes]
    
    # Converte a coluna de data
    if 'data' in df_vendas.columns:
        df_vendas['data'] = df_vendas['data'].apply(converter_data_excel)
    
    # Limpa a coluna de telefone
    if 'telefone' in df_vendas.columns:
        df_vendas['telefone_limpo'] = df_vendas['telefone'].apply(limpar_telefone)
    
    print(f"Dados de vendas carregados: {len(df_vendas)} registros")
    return df_vendas

def carregar_dados_clientes(caminho_arquivo):
    """
    Carrega e processa os dados da planilha de clientes.
    
    Args:
        caminho_arquivo: Caminho para o arquivo de clientes
        
    Returns:
        DataFrame pandas com os dados de clientes processados
    """
    print(f"Carregando dados de clientes de {caminho_arquivo}...")
    
    # Carrega a planilha de clientes
    df_clientes = pd.read_excel(caminho_arquivo)
    
    # Seleciona apenas as colunas relevantes
    colunas_relevantes = ['third_id', 'nome', 'cpf', 'telefone_1', 'telefone_2', 
                         'telefone_3', 'data_cadastro', 'credito_loja']
    
    # Verifica se todas as colunas existem
    colunas_existentes = [col for col in colunas_relevantes if col in df_clientes.columns]
    df_clientes = df_clientes[colunas_existentes]
    
    # Limpa as colunas de telefone
    for col in ['telefone_1', 'telefone_2', 'telefone_3']:
        if col in df_clientes.columns:
            df_clientes[f'{col}_limpo'] = df_clientes[col].apply(limpar_telefone)
    
    # Converte a coluna de data de cadastro se existir
    if 'data_cadastro' in df_clientes.columns:
        df_clientes['data_cadastro'] = pd.to_datetime(df_clientes['data_cadastro'], errors='coerce')
    
    print(f"Dados de clientes carregados: {len(df_clientes)} registros")
    return df_clientes

def integrar_dados(df_vendas, df_clientes):
    """
    Integra os dados de vendas e clientes usando o telefone como chave.
    
    Args:
        df_vendas: DataFrame com dados de vendas
        df_clientes: DataFrame com dados de clientes
        
    Returns:
        DataFrame pandas com os dados integrados
    """
    print("Integrando dados de vendas e clientes...")
    
    # Cria um dicionário para mapear telefones para informações de clientes
    mapa_telefone_cliente = {}
    
    # Para cada cliente, adiciona todos os telefones ao mapa
    for _, cliente in df_clientes.iterrows():
        info_cliente = {
            'third_id': cliente.get('third_id', None),
            'nome_completo': cliente.get('nome', None),
            'cpf': cliente.get('cpf', None),
            'data_cadastro': cliente.get('data_cadastro', None),
            'credito_loja': cliente.get('credito_loja', 0)
        }
        
        # Adiciona cada telefone ao mapa
        for col in ['telefone_1_limpo', 'telefone_2_limpo', 'telefone_3_limpo']:
            if col in cliente and not pd.isna(cliente[col]) and cliente[col] is not None:
                mapa_telefone_cliente[cliente[col]] = info_cliente
    
    # Função para encontrar informações do cliente pelo telefone
    def encontrar_cliente(telefone_limpo):
        if pd.isna(telefone_limpo) or telefone_limpo is None:
            return None, None, None, None, None
        
        if telefone_limpo in mapa_telefone_cliente:
            cliente = mapa_telefone_cliente[telefone_limpo]
            return (
                cliente['third_id'],
                cliente['nome_completo'],
                cliente['cpf'],
                cliente['data_cadastro'],
                cliente['credito_loja']
            )
        return None, None, None, None, None
    
    # Aplica a função para cada venda
    df_vendas[['cliente_id', 'cliente_nome_completo', 'cliente_cpf', 
              'cliente_data_cadastro', 'cliente_credito_loja']] = pd.DataFrame(
        df_vendas['telefone_limpo'].apply(encontrar_cliente).tolist(),
        index=df_vendas.index
    )
    
    print("Dados integrados com sucesso")
    return df_vendas

def calcular_ultima_compra(df_integrado):
    """
    Calcula a data da última compra para cada cliente.
    
    Args:
        df_integrado: DataFrame com dados integrados de vendas e clientes
        
    Returns:
        DataFrame pandas com informações de última compra por cliente
    """
    print("Calculando informações de última compra por cliente...")
    
    # Ordena o DataFrame por cliente e data
    df_ordenado = df_integrado.sort_values(['cliente_cpf', 'data'], ascending=[True, False])
    
    # Obtém a data atual
    data_atual = datetime.now()
    
    # Agrupa por cliente e pega a primeira linha (última compra)
    df_ultima_compra = df_ordenado.groupby('cliente_cpf', as_index=False).first()
    
    # Calcula o tempo desde a última compra
    df_ultima_compra['dias_desde_ultima_compra'] = df_ultima_compra['data'].apply(
        lambda x: (data_atual - x).days if pd.notna(x) else None
    )
    
    # Calcula a categoria de tempo desde a última compra
    def categorizar_tempo(dias):
        if pd.isna(dias):
            return "Sem compras"
        elif dias <= 30:
            return "Últimos 30 dias"
        elif dias <= 60:
            return "31-60 dias"
        elif dias <= 90:
            return "61-90 dias"
        elif dias <= 180:
            return "91-180 dias"
        elif dias <= 365:
            return "181-365 dias"
        else:
            return "Mais de 365 dias"
    
    df_ultima_compra['categoria_tempo'] = df_ultima_compra['dias_desde_ultima_compra'].apply(categorizar_tempo)
    
    print("Cálculo de última compra concluído")
    return df_ultima_compra

def salvar_no_supabase(df_clientes, df_vendas, df_ultima_compra):
    """
    Salva os dados processados no Supabase.
    
    Args:
        df_clientes: DataFrame com dados de clientes
        df_vendas: DataFrame com dados de vendas integrados
        df_ultima_compra: DataFrame com informações de última compra
        
    Returns:
        bool: True se os dados foram salvos com sucesso, False caso contrário
    """
    print("Salvando dados no Supabase...")
    
    try:
        # Garante que as tabelas existem
        criar_tabelas()
        
        # Limpa as tabelas existentes
        supabase.table('ultima_compra').delete().neq('id', 0).execute()
        supabase.table('vendas').delete().neq('id', 0).execute()
        supabase.table('clientes').delete().neq('id', 0).execute()
        
        # Prepara os dados de clientes para inserção
        clientes_para_inserir = []
        for _, cliente in df_clientes.iterrows():
            if pd.notna(cliente.get('cpf')):
                clientes_para_inserir.append({
                    'third_id': str(cliente.get('third_id', '')) if pd.notna(cliente.get('third_id')) else None,
                    'nome': str(cliente.get('nome', '')),
                    'cpf': str(cliente.get('cpf', '')),
                    'telefone_1': str(cliente.get('telefone_1', '')) if pd.notna(cliente.get('telefone_1')) else None,
                    'telefone_2': str(cliente.get('telefone_2', '')) if pd.notna(cliente.get('telefone_2')) else None,
                    'telefone_3': str(cliente.get('telefone_3', '')) if pd.notna(cliente.get('telefone_3')) else None,
                    'data_cadastro': cliente.get('data_cadastro').isoformat() if pd.notna(cliente.get('data_cadastro')) else None,
                    'credito_loja': float(cliente.get('credito_loja', 0)) if pd.notna(cliente.get('credito_loja')) else 0
                })
        
        # Insere os clientes em lotes para evitar problemas de tamanho de payload
        lote_tamanho = 100
        for i in range(0, len(clientes_para_inserir), lote_tamanho):
            lote = clientes_para_inserir[i:i+lote_tamanho]
            supabase.table('clientes').insert(lote).execute()
            print(f"Inseridos {len(lote)} clientes (lote {i//lote_tamanho + 1})")
        
        # Obtém o mapeamento de CPF para ID do cliente no Supabase
        response = supabase.table('clientes').select('id, cpf').execute()
        mapa_cpf_id = {item['cpf']: item['id'] for item in response.data}
        
        # Prepara os dados de vendas para inserção
        vendas_para_inserir = []
        for _, venda in df_vendas.iterrows():
            if pd.notna(venda.get('data')) and pd.notna(venda.get('cliente_cpf')):
                cliente_id = mapa_cpf_id.get(str(venda.get('cliente_cpf')))
                if cliente_id:
                    vendas_para_inserir.append({
                        'data': venda.get('data').isoformat(),
                        'movimentacao': str(venda.get('movimentacao', '')) if pd.notna(venda.get('movimentacao')) else None,
                        'qtde_produtos': int(venda.get('qtde_produtos', 0)) if pd.notna(venda.get('qtde_produtos')) else 0,
                        'total': float(venda.get('total', 0)) if pd.notna(venda.get('total')) else 0,
                        'cliente_id': cliente_id,
                        'cliente_nome': str(venda.get('cliente', '')) if pd.notna(venda.get('cliente')) else None,
                        'vendedor': str(venda.get('vendedor', '')) if pd.notna(venda.get('vendedor')) else None,
                        'telefone': str(venda.get('telefone', '')) if pd.notna(venda.get('telefone')) else None,
                        'custo_da_venda': float(venda.get('custo_da_venda', 0)) if pd.notna(venda.get('custo_da_venda')) else 0,
                        'lucro_da_venda': float(venda.get('lucro_da_venda', 0)) if pd.notna(venda.get('lucro_da_venda')) else 0
                    })
        
        # Insere as vendas em lotes
        for i in range(0, len(vendas_para_inserir), lote_tamanho):
            lote = vendas_para_inserir[i:i+lote_tamanho]
            supabase.table('vendas').insert(lote).execute()
            print(f"Inseridas {len(lote)} vendas (lote {i//lote_tamanho + 1})")
        
        # Prepara os dados de última compra para inserção
        ultima_compra_para_inserir = []
        for _, compra in df_ultima_compra.iterrows():
            if pd.notna(compra.get('cliente_cpf')):
                cliente_id = mapa_cpf_id.get(str(compra.get('cliente_cpf')))
                if cliente_id:
                    ultima_compra_para_inserir.append({
                        'cliente_id': cliente_id,
                        'cliente_nome': str(compra.get('cliente_nome_completo', '')) if pd.notna(compra.get('cliente_nome_completo')) else str(compra.get('cliente', '')),
                        'cliente_cpf': str(compra.get('cliente_cpf', '')),
                        'data_ultima_compra': compra.get('data').isoformat() if pd.notna(compra.get('data')) else None,
                        'dias_desde_ultima_compra': int(compra.get('dias_desde_ultima_compra', 0)) if pd.notna(compra.get('dias_desde_ultima_compra')) else None,
                        'categoria_tempo': str(compra.get('categoria_tempo', '')),
                        'total_ultima_compra': float(compra.get('total', 0)) if pd.notna(compra.get('total')) else 0
                    })
        
        # Insere os dados de última compra em lotes
        for i in range(0, len(ultima_compra_para_inserir), lote_tamanho):
            lote = ultima_compra_para_inserir[i:i+lote_tamanho]
            supabase.table('ultima_compra').insert(lote).execute()
            print(f"Inseridos {len(lote)} registros de última compra (lote {i//lote_tamanho + 1})")
        
        print("Dados salvos no Supabase com sucesso")
        return True
    
    except Exception as e:
        print(f"Erro ao salvar dados no Supabase: {e}")
        return False

def processar_dados():
    """
    Função principal para processar todos os dados.
    
    Returns:
        Tuple contendo (df_integrado, df_ultima_compra)
    """
    # Define os caminhos dos arquivos
    diretorio_base = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    caminho_vendas = os.path.join(diretorio_base, 'data', 'vendas.xlsx')
    caminho_clientes = os.path.join(diretorio_base, 'data', 'pessoas.xlsx')
    
    # Carrega os dados
    df_vendas = carregar_dados_vendas(caminho_vendas)
    df_clientes = carregar_dados_clientes(caminho_clientes)
    
    # Integra os dados
    df_integrado = integrar_dados(df_vendas, df_clientes)
    
    # Calcula informações de última compra
    df_ultima_compra = calcular_ultima_compra(df_integrado)
    
    # Salva os dados no Supabase
    salvar_no_supabase(df_clientes, df_integrado, df_ultima_compra)
    
    # Salva os DataFrames processados localmente também
    caminho_saida_integrado = os.path.join(diretorio_base, 'data', 'dados_integrados.csv')
    caminho_saida_ultima_compra = os.path.join(diretorio_base, 'data', 'ultima_compra.csv')
    
    df_integrado.to_csv(caminho_saida_integrado, index=False, encoding='utf-8-sig')
    df_ultima_compra.to_csv(caminho_saida_ultima_compra, index=False, encoding='utf-8-sig')
    
    print(f"Dados processados salvos localmente em {caminho_saida_integrado} e {caminho_saida_ultima_compra}")
    
    return df_integrado, df_ultima_compra

if __name__ == "__main__":
    processar_dados()
