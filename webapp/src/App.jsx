import './App.css';
import { BrowserRouter as Router } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="p-4">
        <h1 className="text-2xl font-bold">CRM Lui Bambini</h1>
        <p className="mt-2">Teste de carregamento com Router</p>
      </div>
    </Router>
  );
}

export default App;
