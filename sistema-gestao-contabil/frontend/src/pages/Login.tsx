import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [tipoSelecionado, setTipoSelecionado] = useState<'GESTOR' | 'COLABORADOR'>('GESTOR');
  const [erro, setErro] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    try {
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          senha,
          tipo: tipoSelecionado
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'E-mail ou senha incorretos.');
      }

      const usuario = data.usuario || data.user || {};
      const idUsuario = usuario.id ?? usuario.idUsuario ?? usuario.id_usuario ?? '';

      localStorage.setItem('token', data.access_token || data.token || '');
      localStorage.setItem('perfil', tipoSelecionado);
      localStorage.setItem('idUsuario', String(idUsuario));
      localStorage.setItem(
        'usuario',
        JSON.stringify({
          ...usuario,
          id: idUsuario,
          perfil: tipoSelecionado
        })
      );

      if (tipoSelecionado === 'COLABORADOR') {
        navigate('/colaborador', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      setErro(err.message || 'Falha de conexão com o servidor.');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-brand-side">
        <h1>Sistema Contábil</h1>
        <p>Plataforma de gestão integrada para escritórios contábeis.</p>
      </div>

      <div className="auth-form-side">
        <div className="auth-card">
          <h2>Acessar o Sistema</h2>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button
              type="button"
              onClick={() => {
                setTipoSelecionado('GESTOR');
                setErro(null);
              }}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer',
                backgroundColor: tipoSelecionado === 'GESTOR' ? '#3b82f6' : '#1e293b',
                color: tipoSelecionado === 'GESTOR' ? '#ffffff' : '#94a3b8'
              }}
            >
              👨‍💼 Gestor
            </button>
            <button
              type="button"
              onClick={() => {
                setTipoSelecionado('COLABORADOR');
                setErro(null);
              }}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer',
                backgroundColor: tipoSelecionado === 'COLABORADOR' ? '#3b82f6' : '#1e293b',
                color: tipoSelecionado === 'COLABORADOR' ? '#ffffff' : '#94a3b8'
              }}
            >
              👩‍💻 Colaborador
            </button>
          </div>

          {erro && (
            <div style={{ color: '#ef4444', marginBottom: '15px', fontSize: '13px', fontWeight: 'bold' }}>
              {erro}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label>E-MAIL CORPORATIVO</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>SENHA DE ACESSO</label>
              <input
                type="password"
                className="form-control"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#3b82f6',
                color: '#fff',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Entrar como {tipoSelecionado === 'GESTOR' ? 'Gestor' : 'Colaborador'}
            </button>
          </form>

          {tipoSelecionado === 'GESTOR' && (
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <Link to="/cadastro-gestor" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 'bold' }}>
                Não tem uma conta? Cadastrar como Gestor
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};