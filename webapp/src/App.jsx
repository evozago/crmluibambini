import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

function App() {
  return (
    <Router>
      <div className="p-4">
        <h1 className="text-2xl font-bold">CRM Lui Bambini</h1>
        <nav className="mt-4">
          <ul className="flex space-x-4">
            <li><a href="/" className="text-blue-500 hover:underline">Início</a></li>
            <li><a href="/estatisticas" className="text-blue-500 hover:underline">Estatísticas</a></li>
            <li><a href="/mensagens" className="text-blue-500 hover:underline">Mensagens</a></li>
          </ul>
        </nav>
        <div className="mt-6">
          <Routes>
            <Route path="/" element={<div>Página Inicial</div>} />
            <Route path="/estatisticas" element={<div>Página de Estatísticas</div>} />
            <Route path="/mensagens" element={<div>Página de Mensagens</div>} />
            <Route path="*" element={<div>Página não encontrada</div>} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
