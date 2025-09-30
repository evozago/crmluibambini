import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Users, 
  ShoppingBag, 
  Clock, 
  BarChart3, 
  MessageSquare, 
  Settings, 
  Menu, 
  X 
} from 'lucide-react';

export function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  
  const menuItems = [
    { icon: <Clock className="w-5 h-5" />, label: 'Última Compra', path: '/' },
    { icon: <Users className="w-5 h-5" />, label: 'Clientes', path: '/clientes' },
    { icon: <ShoppingBag className="w-5 h-5" />, label: 'Vendas', path: '/vendas' },
    { icon: <BarChart3 className="w-5 h-5" />, label: 'Estatísticas', path: '/estatisticas' },
    { icon: <MessageSquare className="w-5 h-5" />, label: 'Mensagens', path: '/mensagens' },
    { icon: <Settings className="w-5 h-5" />, label: 'Configurações', path: '/configuracoes' },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar para telas maiores */}
      <aside className={`bg-sidebar text-sidebar-foreground w-64 fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:relative`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
            <h1 className="text-xl font-bold">CRM Lui Bambini</h1>
            <button onClick={toggleSidebar} className="lg:hidden">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <nav className="flex-1 p-4 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-md transition-colors ${
                  location.pathname === item.path
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
              >
                {item.icon}
                <span className="ml-3">{item.label}</span>
              </Link>
            ))}
          </nav>
          
          <div className="p-4 border-t border-sidebar-border">
            <div className="text-sm text-sidebar-foreground/70">
              <p>© 2025 Lui Bambini</p>
              <p>Versão 1.0.0</p>
            </div>
          </div>
        </div>
      </aside>
      
      {/* Overlay para fechar o sidebar em telas menores */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={toggleSidebar}
        />
      )}
      
      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-background border-b border-border h-16 flex items-center px-4">
          <button onClick={toggleSidebar} className="lg:hidden mr-4">
            <Menu className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-semibold">
            {menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
          </h2>
        </header>
        
        {/* Conteúdo da página */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
