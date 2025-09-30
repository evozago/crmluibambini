import { useState, useEffect } from 'react';
import { fetchClientesByCategoriaTempo } from '@/lib/supabase';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Send } from 'lucide-react';

export function Mensagens() {
  const [activeTab, setActiveTab] = useState('ativos_recentes');
  const [clientes, setClientes] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState(null);
  
  const categorias = {
    ativos_recentes: 'Últimos 30 dias',
    ativos: '31-60 dias',
    em_risco: '61-90 dias',
    inativos: '91-180 dias',
    perdidos: 'Mais de 365 dias'
  };
  
  const modelos = {
    ativos_recentes: {
      assunto: 'Obrigado pela sua compra recente na Lui Bambini!',
      mensagem: `Olá {nome},

Esperamos que esteja aproveitando sua compra recente na Lui Bambini! 

Gostaríamos de agradecer pela sua preferência e confiança em nossos produtos. Sua última compra foi em {data_ultima_compra}.

Temos novidades chegando que podem combinar perfeitamente com o que você adquiriu. Que tal dar uma olhada em nosso catálogo?

Estamos à disposição para qualquer dúvida ou sugestão.

Atenciosamente,
Equipe Lui Bambini`
    },
    ativos: {
      assunto: 'Sentimos sua falta na Lui Bambini!',
      mensagem: `Olá {nome},

Notamos que já faz {dias_desde_ultima_compra} dias desde sua última visita à Lui Bambini.

Sua última compra foi em {data_ultima_compra} e gostaríamos de informar que temos muitas novidades em nosso catálogo que podem ser do seu interesse.

Que tal nos visitar novamente? Estamos com produtos exclusivos que combinam com seu estilo!

Atenciosamente,
Equipe Lui Bambini`
    },
    em_risco: {
      assunto: 'Estamos com saudades! Volte à Lui Bambini',
      mensagem: `Olá {nome},

Sentimos sua falta! Já faz {dias_desde_ultima_compra} dias desde sua última compra na Lui Bambini.

Gostaríamos de convidá-lo(a) a conhecer nossa nova coleção que acabou de chegar. Temos certeza que você vai adorar!

Como cliente especial, preparamos uma surpresa para sua próxima compra. Venha conferir!

Atenciosamente,
Equipe Lui Bambini`
    },
    inativos: {
      assunto: 'Sentimos sua falta! Oferta especial para você voltar à Lui Bambini',
      mensagem: `Olá {nome},

Notamos que faz um bom tempo desde sua última visita à Lui Bambini ({dias_desde_ultima_compra} dias).

Gostaríamos muito de tê-lo(a) de volta! Por isso, preparamos uma oferta especial exclusiva para você.

Na sua próxima compra, apresente este e-mail e ganhe 10% de desconto em qualquer produto da loja.

Estamos ansiosos para revê-lo(a)!

Atenciosamente,
Equipe Lui Bambini`
    },
    perdidos: {
      assunto: 'Queremos reconquistar você! Oferta exclusiva da Lui Bambini',
      mensagem: `Olá {nome},

Faz mais de um ano desde sua última compra na Lui Bambini e gostaríamos muito de reconquistar você como cliente!

Nosso catálogo está completamente renovado e temos certeza que você vai se surpreender com nossas novidades.

Como um gesto especial, oferecemos 15% de desconto na sua próxima compra. Basta mencionar este e-mail.

Ficaremos muito felizes em recebê-lo(a) novamente!

Atenciosamente,
Equipe Lui Bambini`
    }
  };
  
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const categoria = categorias[activeTab];
        if (!clientes[activeTab]) {
          const data = await fetchClientesByCategoriaTempo(categoria);
          setClientes(prev => ({ ...prev, [activeTab]: data }));
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [activeTab]);
  
  // Função para formatar a data
  const formatarData = (dataString) => {
    if (!dataString) return 'N/A';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  };
  
  // Função para personalizar a mensagem para um cliente específico
  const personalizarMensagem = (cliente, modelo) => {
    if (!cliente) return modelo;
    
    const primeiroNome = cliente.cliente_nome?.split(' ')[0] || 'Cliente';
    const dataFormatada = formatarData(cliente.data_ultima_compra);
    const dias = cliente.dias_desde_ultima_compra || 'alguns';
    
    return modelo
      .replace(/{nome}/g, primeiroNome)
      .replace(/{data_ultima_compra}/g, dataFormatada)
      .replace(/{dias_desde_ultima_compra}/g, dias);
  };
  
  // Função para copiar texto para a área de transferência
  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
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
          <CardTitle>Mensagens Personalizadas</CardTitle>
          <CardDescription>
            Gere mensagens personalizadas com base no tempo desde a última compra de cada cliente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="ativos_recentes" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-6">
              <TabsTrigger value="ativos_recentes">Ativos Recentes</TabsTrigger>
              <TabsTrigger value="ativos">Ativos</TabsTrigger>
              <TabsTrigger value="em_risco">Em Risco</TabsTrigger>
              <TabsTrigger value="inativos">Inativos</TabsTrigger>
              <TabsTrigger value="perdidos">Perdidos</TabsTrigger>
            </TabsList>
            
            {Object.keys(categorias).map((tab) => (
              <TabsContent key={tab} value={tab} className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Modelo de Mensagem</CardTitle>
                      <Badge className={getBadgeColor(categorias[tab])}>
                        {categorias[tab]}
                      </Badge>
                    </div>
                    <CardDescription>
                      Assunto: {modelos[tab].assunto}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea 
                      value={modelos[tab].mensagem} 
                      readOnly 
                      className="min-h-[200px] font-mono"
                    />
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="text-sm text-muted-foreground">
                      Use {'{nome}'}, {'{data_ultima_compra}'} e {'{dias_desde_ultima_compra}'} como variáveis.
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => copyToClipboard(modelos[tab].mensagem, 'modelo')}
                    >
                      {copiedIndex === 'modelo' ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copiar Modelo
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
                
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Mensagens Personalizadas para Clientes</h3>
                  
                  {isLoading ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : !clientes[tab] || clientes[tab].length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Nenhum cliente encontrado nesta categoria.</p>
                    </div>
                  ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                      {clientes[tab].slice(0, 4).map((cliente, index) => (
                        <Card key={cliente.id}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-base">{cliente.cliente_nome}</CardTitle>
                              <Badge variant="outline">
                                {cliente.dias_desde_ultima_compra} dias
                              </Badge>
                            </div>
                            <CardDescription>
                              Última compra: {formatarData(cliente.data_ultima_compra)}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pb-2">
                            <Textarea 
                              value={personalizarMensagem(cliente, modelos[tab].mensagem)} 
                              readOnly 
                              className="min-h-[150px] text-sm"
                            />
                          </CardContent>
                          <CardFooter className="flex justify-between">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => copyToClipboard(personalizarMensagem(cliente, modelos[tab].mensagem), index)}
                            >
                              {copiedIndex === index ? (
                                <>
                                  <Check className="mr-2 h-4 w-4" />
                                  Copiado
                                </>
                              ) : (
                                <>
                                  <Copy className="mr-2 h-4 w-4" />
                                  Copiar
                                </>
                              )}
                            </Button>
                            <Button size="sm">
                              <Send className="mr-2 h-4 w-4" />
                              Enviar
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                  
                  {clientes[tab] && clientes[tab].length > 4 && (
                    <div className="flex justify-center mt-4">
                      <Button variant="outline">Ver mais clientes</Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
