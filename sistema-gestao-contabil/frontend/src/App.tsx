import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { CadastroGestor } from './pages/CadastroGestor';
import Dashboard from './pages/Dashboard';
import { Empresas } from './pages/Empresas';
import { Rotinas } from './pages/Rotinas';
import ColaboradorDashboard from './pages/ColaboradorDashboard';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/cadastro-gestor" element={<CadastroGestor />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/empresas" element={<Empresas />} />
        <Route path="/rotinas" element={<Rotinas />} />
        <Route path="/colaborador" element={<ColaboradorDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}