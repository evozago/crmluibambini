import { useState, useEffect } from 'react';
import { fetchEstatisticasTempo, fetchUltimaCompra } from '@/lib/supabase';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

export function Estatisticas() {
  const [estatisticas, setEstatisticas] = useState(null);
  const [dadosClientes, setDadosClientes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Cores para os gráficos
  const COLORS = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
    '#8884d8'
  ];
  
  useEffect(() => {
    const loadData = async () => {
      try {
        const stats = await fetchEstatisticasTempo();
        setEstatisticas(stats);
        
        const clientes = await fetchUltimaCompra();
        setDadosClientes(clientes);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Prepara dados para o gráfico de pizza
  const prepararDadosPizza = () => {
    if (!estatisticas || !estatisticas.distribuicao_por_categoria) return [];
    
    return Object.entries(estatisticas.distribuicao_por_categoria).map(([name, value]) => ({
      name,
      value
    }));
  };
  
  // Prepara dados para o gráfico de barras
  const prepararDadosBarras = () => {
    if (!dadosClientes || dadosClientes.length === 0) return [];
    
    // Agrupa por mês da última compra
    const meses = {};
    dadosClientes.forEach(cliente => {
      if (cliente.data_ultima_compra) {
        const data = new Date(cliente.data_ultima_compra);
        const mesAno = `${data.getMonth() + 1}/${data.getFullYear()}`;
        
        if (!meses[mesAno]) {
          meses[mesAno] = { mes: mesAno, count: 0 };
        }
        meses[mesAno].count++;
      }
    });
    
    // Converte para array e ordena por data
    return Object.values(meses).sort((a, b) => {
      const [mesA, anoA] = a.mes.split('/');
      const [mesB, anoB] = b.mes.split('/');
      return new Date(anoA, mesA - 1) - new Date(anoB, mesB - 1);
    });
  };
  
  // Prepara dados para o gráfico de distribuição de dias
  const prepararDistribuicaoDias = () => {
    if (!dadosClientes || dadosClientes.length === 0) return [];
    
    // Define os intervalos de dias
    const intervalos = [
      { min: 0, max: 30, label: '0-30' },
      { min: 31, max: 60, label: '31-60' },
      { min: 61, max: 90, label: '61-90' },
      { min: 91, max: 180, label: '91-180' },
      { min: 181, max: 365, label: '181-365' },
      { min: 366, max: Infinity, label: '365+' }
    ];
    
    // Inicializa contadores
    const distribuicao = intervalos.map(intervalo => ({
      name: intervalo.label,
      count: 0
    }));
    
    // Conta clientes em cada intervalo
    dadosClientes.forEach(cliente => {
      const dias = cliente.dias_desde_ultima_compra;
      if (dias !== null && dias !== undefined) {
        const intervalo = intervalos.findIndex(
          int => dias >= int.min && dias <= int.max
        );
        if (intervalo !== -1) {
          distribuicao[intervalo].count++;
        }
      }
    });
    
    return distribuicao;
  };
  
  // Formata o tooltip do gráfico de pizza
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="var(--color-foreground)" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={14}
        fontWeight={600}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };
  
  // Calcula estatísticas gerais
  const calcularEstatisticasGerais = () => {
    if (!dadosClientes || dadosClientes.length === 0) return {};
    
    const dias = dadosClientes
      .map(c => c.dias_desde_ultima_compra)
      .filter(d => d !== null && d !== undefined);
    
    if (dias.length === 0) return {};
    
    const media = dias.reduce((acc, curr) => acc + curr, 0) / dias.length;
    const mediana = [...dias].sort((a, b) => a - b)[Math.floor(dias.length / 2)];
    const max = Math.max(...dias);
    const min = Math.min(...dias);
    
    return { media, mediana, max, min };
  };
  
  const estatisticasGerais = calcularEstatisticasGerais();
  const dadosPizza = prepararDadosPizza();
  const dadosBarras = prepararDadosBarras();
  const dadosDistribuicao = prepararDistribuicaoDias();
  
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <span className="animate-pulse">...</span>
              ) : (
                estatisticas?.total_clientes || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Clientes com histórico de compras
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Média de Dias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <span className="animate-pulse">...</span>
              ) : (
                estatisticasGerais.media?.toFixed(0) || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Média de dias desde a última compra
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Mediana de Dias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <span className="animate-pulse">...</span>
              ) : (
                estatisticasGerais.mediana || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Mediana de dias desde a última compra
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cliente Mais Inativo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <span className="animate-pulse">...</span>
              ) : (
                estatisticasGerais.max || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Dias desde a última compra
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Categoria</CardTitle>
            <CardDescription>
              Distribuição de clientes por categoria de tempo desde a última compra
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-80">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dadosPizza}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dadosPizza.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} clientes`, 'Quantidade']} />
                    <Legend formatter={(value) => <span style={{ fontSize: '14px' }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Dias</CardTitle>
            <CardDescription>
              Quantidade de clientes por intervalo de dias desde a última compra
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-80">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dadosDistribuicao}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} clientes`, 'Quantidade']} />
                    <Legend />
                    <Bar dataKey="count" name="Clientes" fill="var(--chart-1)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Últimas Compras</CardTitle>
          <CardDescription>
            Quantidade de clientes cuja última compra foi em cada mês
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-80">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dadosBarras}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} clientes`, 'Quantidade']} />
                  <Legend />
                  <Bar dataKey="count" name="Clientes" fill="var(--chart-2)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
