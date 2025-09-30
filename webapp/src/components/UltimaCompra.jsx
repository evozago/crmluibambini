import { useState, useEffect } from 'react';
import { fetchUltimaCompra } from '@/lib/supabase';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter } from 'lucide-react';

export function UltimaCompra() {
  const [clientes, setClientes] = useState([]);
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchUltimaCompra();
        setClientes(data);
        setFilteredClientes(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  useEffect(() => {
    // Aplica os filtros quando searchTerm ou categoriaFiltro mudam
    let filtered = clientes;
    
    if (searchTerm) {
      filtered = filtered.filter(cliente => 
        cliente.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.cliente_cpf?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (categoriaFiltro) {
      filtered = filtered.filter(cliente => 
        cliente.categoria_tempo === categoriaFiltro
      );
    }
    
    setFilteredClientes(filtered);
  }, [searchTerm, categoriaFiltro, clientes]);
  
  // Função para formatar a data
  const formatarData = (dataString) => {
    if (!dataString) return 'N/A';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  };
  
  // Função para obter a cor do badge com base na categoria
  const getBadgeColor = (categoria) => {
    switch (categoria) {
      case 'Últimos 30 dias':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case '31-60 dias':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case '61-90 dias':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case '91-180 dias':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case '181-365 dias':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'Mais de 365 dias':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tempo desde a Última Compra</CardTitle>
          <CardDescription>
            Analise quanto tempo faz desde a última compra de cada cliente para personalizar suas mensagens.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Buscar por nome ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-muted-foreground" />
              <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as categorias</SelectItem>
                  <SelectItem value="Últimos 30 dias">Últimos 30 dias</SelectItem>
                  <SelectItem value="31-60 dias">31-60 dias</SelectItem>
                  <SelectItem value="61-90 dias">61-90 dias</SelectItem>
                  <SelectItem value="91-180 dias">91-180 dias</SelectItem>
                  <SelectItem value="181-365 dias">181-365 dias</SelectItem>
                  <SelectItem value="Mais de 365 dias">Mais de 365 dias</SelectItem>
                </SelectContent>
              </Select>
              {categoriaFiltro && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setCategoriaFiltro('')}
                >
                  Limpar
                </Button>
              )}
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredClientes.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">Nenhum cliente encontrado com os filtros aplicados.</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Nome do Cliente</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Última Compra</TableHead>
                    <TableHead>Dias Desde Última Compra</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Valor Última Compra</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClientes.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell className="font-medium">{cliente.cliente_nome || 'N/A'}</TableCell>
                      <TableCell>{cliente.cliente_cpf || 'N/A'}</TableCell>
                      <TableCell>{formatarData(cliente.data_ultima_compra)}</TableCell>
                      <TableCell>{cliente.dias_desde_ultima_compra || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge className={getBadgeColor(cliente.categoria_tempo)}>
                          {cliente.categoria_tempo}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {cliente.total_ultima_compra 
                          ? `R$ ${cliente.total_ultima_compra.toFixed(2)}` 
                          : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          <div className="mt-4 text-sm text-muted-foreground">
            Mostrando {filteredClientes.length} de {clientes.length} clientes
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
