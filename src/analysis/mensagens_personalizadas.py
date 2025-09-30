#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script para gerar mensagens personalizadas com base no tempo desde a última compra.
Este script gera modelos de mensagens para diferentes segmentos de clientes.
"""

import os
import sys
import pandas as pd
import json
from datetime import datetime

# Adiciona o diretório pai ao path para importar módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from data.supabase_config import supabase

def obter_segmentos_clientes():
    """
    Obtém os segmentos de clientes do Supabase.
    
    Returns:
        dict: Dicionário com DataFrames para cada segmento
    """
    try:
        # Obtém todos os clientes com última compra
        response = supabase.table('ultima_compra').select('*').execute()
        
        if not response.data:
            print("Nenhum dado de última compra encontrado no Supabase.")
            return {}
        
        # Converte para DataFrame
        df_ultima_compra = pd.DataFrame(response.data)
        
        # Converte as colunas de data para datetime
        if 'data_ultima_compra' in df_ultima_compra.columns:
            df_ultima_compra['data_ultima_compra'] = pd.to_datetime(df_ultima_compra['data_ultima_compra'])
        
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
        
        print(f"Segmentos de clientes obtidos com sucesso")
        return segmentos
    
    except Exception as e:
        print(f"Erro ao obter segmentos de clientes: {e}")
        return {}

def gerar_modelos_mensagens():
    """
    Gera modelos de mensagens para cada segmento de clientes.
    
    Returns:
        dict: Dicionário com modelos de mensagens para cada segmento
    """
    # Define os modelos de mensagens para cada segmento
    modelos = {
        'ativos_recentes': {
            'assunto': 'Obrigado pela sua compra recente na Lui Bambini!',
            'mensagem': """
Olá {nome},

Esperamos que esteja aproveitando sua compra recente na Lui Bambini! 

Gostaríamos de agradecer pela sua preferência e confiança em nossos produtos. Sua última compra foi em {data_ultima_compra}.

Temos novidades chegando que podem combinar perfeitamente com o que você adquiriu. Que tal dar uma olhada em nosso catálogo?

Estamos à disposição para qualquer dúvida ou sugestão.

Atenciosamente,
Equipe Lui Bambini
            """
        },
        'ativos': {
            'assunto': 'Sentimos sua falta na Lui Bambini!',
            'mensagem': """
Olá {nome},

Notamos que já faz {dias_desde_ultima_compra} dias desde sua última visita à Lui Bambini.

Sua última compra foi em {data_ultima_compra} e gostaríamos de informar que temos muitas novidades em nosso catálogo que podem ser do seu interesse.

Que tal nos visitar novamente? Estamos com produtos exclusivos que combinam com seu estilo!

Atenciosamente,
Equipe Lui Bambini
            """
        },
        'em_risco': {
            'assunto': 'Estamos com saudades! Volte à Lui Bambini',
            'mensagem': """
Olá {nome},

Sentimos sua falta! Já faz {dias_desde_ultima_compra} dias desde sua última compra na Lui Bambini.

Gostaríamos de convidá-lo(a) a conhecer nossa nova coleção que acabou de chegar. Temos certeza que você vai adorar!

Como cliente especial, preparamos uma surpresa para sua próxima compra. Venha conferir!

Atenciosamente,
Equipe Lui Bambini
            """
        },
        'inativos': {
            'assunto': 'Sentimos sua falta! Oferta especial para você voltar à Lui Bambini',
            'mensagem': """
Olá {nome},

Notamos que faz um bom tempo desde sua última visita à Lui Bambini ({dias_desde_ultima_compra} dias).

Gostaríamos muito de tê-lo(a) de volta! Por isso, preparamos uma oferta especial exclusiva para você.

Na sua próxima compra, apresente este e-mail e ganhe 10% de desconto em qualquer produto da loja.

Estamos ansiosos para revê-lo(a)!

Atenciosamente,
Equipe Lui Bambini
            """
        },
        'perdidos': {
            'assunto': 'Queremos reconquistar você! Oferta exclusiva da Lui Bambini',
            'mensagem': """
Olá {nome},

Faz mais de um ano desde sua última compra na Lui Bambini e gostaríamos muito de reconquistar você como cliente!

Nosso catálogo está completamente renovado e temos certeza que você vai se surpreender com nossas novidades.

Como um gesto especial, oferecemos 15% de desconto na sua próxima compra. Basta mencionar este e-mail.

Ficaremos muito felizes em recebê-lo(a) novamente!

Atenciosamente,
Equipe Lui Bambini
            """
        }
    }
    
    return modelos

def gerar_mensagens_personalizadas():
    """
    Gera mensagens personalizadas para cada cliente com base no segmento.
    
    Returns:
        dict: Dicionário com mensagens personalizadas por segmento
    """
    try:
        # Obtém os segmentos de clientes
        segmentos = obter_segmentos_clientes()
        
        if not segmentos:
            print("Não foi possível obter os segmentos de clientes.")
            return {}
        
        # Obtém os modelos de mensagens
        modelos = gerar_modelos_mensagens()
        
        # Dicionário para armazenar as mensagens personalizadas
        mensagens_personalizadas = {}
        
        # Para cada segmento, gera mensagens personalizadas
        for nome_segmento, df_segmento in segmentos.items():
            mensagens_segmento = []
            
            for _, cliente in df_segmento.iterrows():
                # Formata a data da última compra
                data_formatada = cliente['data_ultima_compra'].strftime('%d/%m/%Y') if pd.notna(cliente['data_ultima_compra']) else 'data não disponível'
                
                # Personaliza a mensagem
                mensagem = modelos[nome_segmento]['mensagem'].format(
                    nome=cliente['cliente_nome'].split()[0] if pd.notna(cliente['cliente_nome']) else 'Cliente',
                    data_ultima_compra=data_formatada,
                    dias_desde_ultima_compra=int(cliente['dias_desde_ultima_compra']) if pd.notna(cliente['dias_desde_ultima_compra']) else 'alguns'
                )
                
                # Adiciona à lista de mensagens do segmento
                mensagens_segmento.append({
                    'cliente_id': cliente['cliente_id'],
                    'cliente_nome': cliente['cliente_nome'],
                    'cliente_cpf': cliente['cliente_cpf'],
                    'dias_desde_ultima_compra': int(cliente['dias_desde_ultima_compra']) if pd.notna(cliente['dias_desde_ultima_compra']) else None,
                    'assunto': modelos[nome_segmento]['assunto'],
                    'mensagem': mensagem
                })
            
            mensagens_personalizadas[nome_segmento] = mensagens_segmento
        
        # Salva as mensagens em arquivos JSON
        diretorio_base = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        
        for nome_segmento, mensagens in mensagens_personalizadas.items():
            # Limita a 10 exemplos para não gerar arquivos muito grandes
            exemplos = mensagens[:10]
            
            caminho_saida = os.path.join(diretorio_base, 'data', f'mensagens_{nome_segmento}.json')
            
            with open(caminho_saida, 'w', encoding='utf-8') as f:
                json.dump(exemplos, f, ensure_ascii=False, indent=4)
            
            print(f"Mensagens para segmento {nome_segmento} ({len(mensagens)} clientes, 10 exemplos) salvas em {caminho_saida}")
        
        return mensagens_personalizadas
    
    except Exception as e:
        print(f"Erro ao gerar mensagens personalizadas: {e}")
        return {}

if __name__ == "__main__":
    gerar_mensagens_personalizadas()
