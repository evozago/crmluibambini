#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script para calcular o tempo desde a última compra de cada cliente.
Este script consulta os dados do Supabase e calcula métricas relacionadas
ao tempo desde a última compra para cada cliente.
"""

import os
import sys
import pandas as pd
from datetime import datetime, timedelta
import json

# Adiciona o diretório pai ao path para importar módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from data.supabase_config import supabase

def obter_dados_ultima_compra():
    """
    Obtém os dados de última compra do Supabase.
    
    Returns:
        DataFrame pandas com os dados de última compra
    """
    try:
        # Consulta a tabela de última compra
        response = supabase.table('ultima_compra').select('*').execute()
        
        if not response.data:
            print("Nenhum dado de última compra encontrado no Supabase.")
            return pd.DataFrame()
        
        # Converte para DataFrame
        df_ultima_compra = pd.DataFrame(response.data)
        
        # Converte as colunas de data para datetime
        if 'data_ultima_compra' in df_ultima_compra.columns:
            df_ultima_compra['data_ultima_compra'] = pd.to_datetime(df_ultima_compra['data_ultima_compra'])
        
        print(f"Dados de última compra obtidos: {len(df_ultima_compra)} registros")
        return df_ultima_compra
    
    except Exception as e:
        print(f"Erro ao obter dados de última compra: {e}")
        return pd.DataFrame()

def atualizar_tempo_desde_ultima_compra():
    """
    Atualiza o tempo desde a última compra para todos os clientes.
    
    Returns:
        DataFrame pandas com os dados atualizados
    """
    try:
        # Obtém os dados de última compra
        df_ultima_compra = obter_dados_ultima_compra()
        
        if df_ultima_compra.empty:
            print("Não há dados para atualizar.")
            return pd.DataFrame()
        
        # Obtém a data atual
        data_atual = datetime.now()
        
        # Calcula o tempo desde a última compra
        df_ultima_compra['dias_desde_ultima_compra'] = df_ultima_compra['data_ultima_compra'].apply(
            lambda x: (data_atual - x).days if pd.notna(x) else None
        )
        
        # Atualiza a categoria de tempo
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
        
        # Atualiza os registros no Supabase
        for _, compra in df_ultima_compra.iterrows():
            supabase.table('ultima_compra').update({
                'dias_desde_ultima_compra': int(compra['dias_desde_ultima_compra']) if pd.notna(compra['dias_desde_ultima_compra']) else None,
                'categoria_tempo': compra['categoria_tempo'],
                'updated_at': datetime.now().isoformat()
            }).eq('id', compra['id']).execute()
        
        print("Tempo desde última compra atualizado com sucesso")
        return df_ultima_compra
    
    except Exception as e:
        print(f"Erro ao atualizar tempo desde última compra: {e}")
        return pd.DataFrame()

def gerar_estatisticas_tempo():
    """
    Gera estatísticas sobre o tempo desde a última compra.
    
    Returns:
        dict: Dicionário com estatísticas
    """
    try:
        # Obtém os dados atualizados
        df_ultima_compra = obter_dados_ultima_compra()
        
        if df_ultima_compra.empty:
            print("Não há dados para gerar estatísticas.")
            return {}
        
        # Calcula estatísticas por categoria de tempo
        stats_categoria = df_ultima_compra['categoria_tempo'].value_counts().to_dict()
        
        # Calcula estatísticas gerais
        stats = {
            'total_clientes': len(df_ultima_compra),
            'media_dias_desde_ultima_compra': df_ultima_compra['dias_desde_ultima_compra'].mean(),
            'mediana_dias_desde_ultima_compra': df_ultima_compra['dias_desde_ultima_compra'].median(),
            'max_dias_desde_ultima_compra': df_ultima_compra['dias_desde_ultima_compra'].max(),
            'min_dias_desde_ultima_compra': df_ultima_compra['dias_desde_ultima_compra'].min(),
            'distribuicao_por_categoria': stats_categoria
        }
        
        # Salva as estatísticas em um arquivo JSON
        diretorio_base = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        caminho_saida = os.path.join(diretorio_base, 'data', 'estatisticas_tempo.json')
        
        with open(caminho_saida, 'w', encoding='utf-8') as f:
            json.dump(stats, f, ensure_ascii=False, indent=4)
        
        print(f"Estatísticas geradas e salvas em {caminho_saida}")
        return stats
    
    except Exception as e:
        print(f"Erro ao gerar estatísticas: {e}")
        return {}

def gerar_lista_clientes_inativos(dias_inatividade=90):
    """
    Gera uma lista de clientes inativos com base no número de dias sem compras.
    
    Args:
        dias_inatividade: Número de dias para considerar um cliente inativo
        
    Returns:
        DataFrame pandas com a lista de clientes inativos
    """
    try:
        # Obtém os dados de última compra
        df_ultima_compra = obter_dados_ultima_compra()
        
        if df_ultima_compra.empty:
            print("Não há dados para gerar lista de clientes inativos.")
            return pd.DataFrame()
        
        # Filtra clientes inativos
        df_inativos = df_ultima_compra[df_ultima_compra['dias_desde_ultima_compra'] > dias_inatividade].copy()
        
        # Ordena por tempo de inatividade (decrescente)
        df_inativos = df_inativos.sort_values('dias_desde_ultima_compra', ascending=False)
        
        # Salva a lista em um arquivo CSV
        diretorio_base = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        caminho_saida = os.path.join(diretorio_base, 'data', f'clientes_inativos_{dias_inatividade}_dias.csv')
        
        df_inativos.to_csv(caminho_saida, index=False, encoding='utf-8-sig')
        
        print(f"Lista de clientes inativos ({len(df_inativos)} registros) salva em {caminho_saida}")
        return df_inativos
    
    except Exception as e:
        print(f"Erro ao gerar lista de clientes inativos: {e}")
        return pd.DataFrame()

def gerar_segmentos_clientes():
    """
    Gera segmentos de clientes com base no tempo desde a última compra.
    
    Returns:
        dict: Dicionário com segmentos de clientes
    """
    try:
        # Obtém os dados de última compra
        df_ultima_compra = obter_dados_ultima_compra()
        
        if df_ultima_compra.empty:
            print("Não há dados para gerar segmentos de clientes.")
            return {}
        
        # Define os segmentos
        segmentos = {
            'ativos_recentes': df_ultima_compra[df_ultima_compra['dias_desde_ultima_compra'] <= 30],
            'ativos': df_ultima_compra[(df_ultima_compra['dias_desde_ultima_compra'] > 30) & 
                                      (df_ultima_compra['dias_desde_ultima_compra'] <= 90)],
            'em_risco': df_ultima_compra[(df_ultima_compra['dias_desde_ultima_compra'] > 90) & 
                                        (df_ultima_compra['dias_desde_ultima_compra'] <= 180)],
            'inativos': df_ultima_compra[(df_ultima_compra['dias_desde_ultima_compra'] > 180) & 
                                        (df_ultima_compra['dias_desde_ultima_compra'] <= 365)],
            'perdidos': df_ultima_compra[df_ultima_compra['dias_desde_ultima_compra'] > 365]
        }
        
        # Salva cada segmento em um arquivo CSV
        diretorio_base = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        
        for nome_segmento, df_segmento in segmentos.items():
            caminho_saida = os.path.join(diretorio_base, 'data', f'segmento_{nome_segmento}.csv')
            df_segmento.to_csv(caminho_saida, index=False, encoding='utf-8-sig')
            print(f"Segmento {nome_segmento} ({len(df_segmento)} clientes) salvo em {caminho_saida}")
        
        # Retorna o número de clientes em cada segmento
        resultado = {nome: len(df) for nome, df in segmentos.items()}
        
        # Salva as estatísticas de segmentos em um arquivo JSON
        caminho_saida_json = os.path.join(diretorio_base, 'data', 'segmentos_clientes.json')
        
        with open(caminho_saida_json, 'w', encoding='utf-8') as f:
            json.dump(resultado, f, ensure_ascii=False, indent=4)
        
        print(f"Estatísticas de segmentos salvas em {caminho_saida_json}")
        return resultado
    
    except Exception as e:
        print(f"Erro ao gerar segmentos de clientes: {e}")
        return {}

if __name__ == "__main__":
    # Atualiza o tempo desde a última compra
    df_atualizado = atualizar_tempo_desde_ultima_compra()
    
    if not df_atualizado.empty:
        # Gera estatísticas
        gerar_estatisticas_tempo()
        
        # Gera lista de clientes inativos (90 dias)
        gerar_lista_clientes_inativos(90)
        
        # Gera segmentos de clientes
        gerar_segmentos_clientes()
