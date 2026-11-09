import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { CadastroGestor } from './pages/CadastroGestor';
import { Dashboard } from './pages/Dashboard';
import { Empresas } from './pages/Empresas';
import { Rotinas } from './pages/Rotinas';
import { ColaboradorDashboard } from './pages/ColaboradorDashboard';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Rotas Públicas */}
        <Route path="/" element={<Login />} />
        <Route path="/cadastro-gestor" element={<CadastroGestor />} />

        {/* Rotas Protegidas do Gestor */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/empresas" element={<Empresas />} />
        <Route path="/rotinas" element={<Rotinas />} />

        {/* Rota Protegida do Colaborador */}
        <Route path="/colaborador" element={<ColaboradorDashboard />} />

        {/* Redirecionamento Padrão */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}