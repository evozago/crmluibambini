import { createClient } from '@supabase/supabase-js';

// Inicializa o cliente Supabase com as variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

// Cria e exporta o cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);

// Função para buscar os dados de última compra
export async function fetchUltimaCompra() {
  try {
    const { data, error } = await supabase
      .from('ultima_compra')
      .select('*')
      .order('dias_desde_ultima_compra', { ascending: true });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao buscar dados de última compra:', error);
    return [];
  }
}

// Função para buscar os dados de vendas
export async function fetchVendas() {
  try {
    const { data, error } = await supabase
      .from('vendas')
      .select('*')
      .order('data', { ascending: false });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao buscar dados de vendas:', error);
    return [];
  }
}

// Função para buscar os dados de clientes
export async function fetchClientes() {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*');
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao buscar dados de clientes:', error);
    return [];
  }
}

// Função para buscar os dados de um cliente específico
export async function fetchClienteById(clienteId) {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', clienteId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Erro ao buscar cliente com ID ${clienteId}:`, error);
    return null;
  }
}

// Função para buscar as vendas de um cliente específico
export async function fetchVendasByClienteId(clienteId) {
  try {
    const { data, error } = await supabase
      .from('vendas')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('data', { ascending: false });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Erro ao buscar vendas do cliente com ID ${clienteId}:`, error);
    return [];
  }
}

// Função para buscar clientes por categoria de tempo
export async function fetchClientesByCategoriaTempo(categoria) {
  try {
    const { data, error } = await supabase
      .from('ultima_compra')
      .select('*')
      .eq('categoria_tempo', categoria);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Erro ao buscar clientes da categoria ${categoria}:`, error);
    return [];
  }
}

// Função para buscar estatísticas de tempo desde última compra
export async function fetchEstatisticasTempo() {
  try {
    // Busca todos os registros de última compra
    const { data, error } = await supabase
      .from('ultima_compra')
      .select('categoria_tempo, dias_desde_ultima_compra');
    
    if (error) throw error;
    
    // Calcula estatísticas
    const estatisticas = {
      total_clientes: data.length,
      media_dias: data.reduce((acc, curr) => acc + (curr.dias_desde_ultima_compra || 0), 0) / data.length,
      distribuicao_por_categoria: {}
    };
    
    // Calcula distribuição por categoria
    data.forEach(item => {
      const categoria = item.categoria_tempo;
      if (!estatisticas.distribuicao_por_categoria[categoria]) {
        estatisticas.distribuicao_por_categoria[categoria] = 0;
      }
      estatisticas.distribuicao_por_categoria[categoria]++;
    });
    
    return estatisticas;
  } catch (error) {
    console.error('Erro ao calcular estatísticas:', error);
    return {
      total_clientes: 0,
      media_dias: 0,
      distribuicao_por_categoria: {}
    };
  }
}
