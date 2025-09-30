import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { UltimaCompra } from '@/components/UltimaCompra';
import { Mensagens } from '@/components/Mensagens';
import { Estatisticas } from '@/components/Estatisticas';
import './App.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<UltimaCompra />} />
          <Route path="/clientes" element={<div className="p-4">Página de Clientes em desenvolvimento</div>} />
          <Route path="/vendas" element={<div className="p-4">Página de Vendas em desenvolvimento</div>} />
          <Route path="/estatisticas" element={<Estatisticas />} />
          <Route path="/mensagens" element={<Mensagens />} />
          <Route path="/configuracoes" element={<div className="p-4">Página de Configurações em desenvolvimento</div>} />
          <Route path="*" element={<div className="p-4">Página não encontrada</div>} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
