import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export const CadastroGestor: React.FC = () => {
  const navigate = useNavigate();
  
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  const handleCadastroGestor = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    try {
      const response = await fetch('http://localhost:3000/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          email,
          senha,
          perfil: 'GESTOR'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao criar conta de gestor.');
      }

      alert('Conta de gestor criada com sucesso!');
      navigate('/');
    } catch (err: any) {
      setErro(err.message || 'Falha ao conectar com o servidor.');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-brand-side">
        <h1>Sistema Contábil</h1>
        <p>Registo de Conta de Gestor</p>
      </div>

      <div className="auth-form-side">
        <div className="auth-card">
          <h2>Criar Conta de Gestor</h2>
          
          {erro && <div style={{ color: '#ef4444', marginBottom: '15px', fontWeight: 'bold' }}>{erro}</div>}

          <form onSubmit={handleCadastroGestor} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label>NOME COMPLETO</label>
              <input
                type="text"
                className="form-control"
                value={nome}
                onChange={e => setNome(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>E-MAIL CORPORATIVO</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>SENHA DE ACESSO</label>
              <input
                type="password"
                className="form-control"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
              Cadastrar Gestor
            </button>
          </form>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <Link to="/" style={{ color: '#3b82f6', textDecoration: 'none' }}>
              Já tem uma conta? Fazer login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};