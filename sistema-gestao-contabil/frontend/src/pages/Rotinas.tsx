import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface Empresa {
  idEmpresa: number;
  razaoSocial: string;
}

interface Rotina {
  idRotina: number;
  nome: string;
  descricao?: string;
  dataVencimento: string;
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO';
  empresa: Empresa;
}

export const Rotinas: React.FC = () => {
  const [rotinas, setRotinas] = useState<Rotina[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    dataVencimento: '',
    idEmpresa: '',
  });
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const perfilUsuario = localStorage.getItem('perfil') || 'COLABORADOR';
  const location = useLocation();

  const carregarDados = async () => {
    const token = localStorage.getItem('token');
    try {
      const [resRotinas, resEmpresas] = await Promise.all([
        fetch('http://localhost:3000/rotinas', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('http://localhost:3000/empresas', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (resRotinas.ok) {
        const dataRotinas = await resRotinas.json();
        setRotinas(dataRotinas);
      }

      if (resEmpresas.ok) {
        const dataEmpresas = await resEmpresas.json();
        setEmpresas(dataEmpresas);
      }
    } catch (err) {
      console.error('Erro ao carregar dados das rotinas:', err);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem(null);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('http://localhost:3000/rotinas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Erro ao cadastrar rotina fiscal.');
      }

      setMensagem({ tipo: 'sucesso', texto: 'Rotina fiscal cadastrada com sucesso!' });
      setFormData({ nome: '', descricao: '', dataVencimento: '', idEmpresa: '' });
      carregarDados();
    } catch (err: any) {
      setMensagem({ tipo: 'erro', texto: err.message || 'Falha de conexão com o servidor.' });
    }
  };

  const alterarStatus = async (idRotina: number, novoStatus: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:3000/rotinas/${idRotina}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: novoStatus }),
      });

      if (res.ok) {
        carregarDados();
      }
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar Lateral */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          📊 <span>Contábil</span>Gestão
        </div>

        <nav className="sidebar-nav">
          <Link to="/dashboard" className={`sidebar-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
            👥 Equipe do Escritório
          </Link>
          <Link to="/empresas" className={`sidebar-link ${location.pathname === '/empresas' ? 'active' : ''}`}>
            🏢 Empresas Clientes
          </Link>
          <Link to="/rotinas" className={`sidebar-link ${location.pathname === '/rotinas' ? 'active' : ''}`}>
            📅 Rotinas Fiscais
          </Link>
        </nav>

        <div className="sidebar-user">
          <span className="sidebar-user-name">Usuário Logado</span>
          <span className="sidebar-user-role">{perfilUsuario}</span>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="main-content">
        <header className="content-header">
          <div>
            <h1>Rotinas Fiscais e Matriz de Fechamento</h1>
            <p>Controlo de obrigações tributárias e prazos das empresas clientes.</p>
          </div>
        </header>

        {/* Formulário de Cadastro de Nova Rotina */}
        <div className="card">
          <h3>Cadastrar Nova Obrigação / Rotina</h3>

          {mensagem && (
            <div className={`alert ${mensagem.tipo === 'sucesso' ? 'alert-success' : 'alert-error'}`}>
              {mensagem.texto}
            </div>
          )}

          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>Empresa Cliente *</label>
              <select
                className="form-control"
                value={formData.idEmpresa}
                onChange={e => setFormData({ ...formData, idEmpresa: e.target.value })}
                required
              >
                <option value="">Selecione a empresa...</option>
                {empresas.map(emp => (
                  <option key={emp.idEmpresa} value={emp.idEmpresa}>
                    {emp.razaoSocial}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Nome da Obrigação / Rotina *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ex: Apuração DAS / Simples Nacional"
                value={formData.nome}
                onChange={e => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Data de Vencimento *</label>
              <input
                type="date"
                className="form-control"
                value={formData.dataVencimento}
                onChange={e => setFormData({ ...formData, dataVencimento: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Descrição / Observações</label>
              <input
                type="text"
                className="form-control"
                placeholder="Detalhes adicionais da obrigação"
                value={formData.descricao}
                onChange={e => setFormData({ ...formData, descricao: e.target.value })}
              />
            </div>

            <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
              <button type="submit" className="btn btn-primary">
                Registar Rotina
              </button>
            </div>
          </form>
        </div>

        {/* Tabela / Matriz de Acompanhamento */}
        <div className="card">
          <h3>Matriz de Acompanhamento de Rotinas ({rotinas.length})</h3>
          <div className="table-container" style={{ marginTop: '16px' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Empresa Cliente</th>
                  <th>Obrigação / Rotina</th>
                  <th>Vencimento</th>
                  <th>Status Atual</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {rotinas.map(rotina => {
                  let badgeColor = '#64748b';
                  if (rotina.status === 'CONCLUIDO') badgeColor = '#10b981';
                  if (rotina.status === 'EM_ANDAMENTO') badgeColor = '#f59e0b';
                  if (rotina.status === 'PENDENTE') badgeColor = '#ef4444';

                  return (
                    <tr key={rotina.idRotina}>
                      <td><strong style={{ color: '#f8fafc' }}>{rotina.empresa?.razaoSocial || 'N/A'}</strong></td>
                      <td>{rotina.nome}</td>
                      <td>{rotina.dataVencimento}</td>
                      <td>
                        <span style={{ backgroundColor: badgeColor, color: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>
                          {rotina.status}
                        </span>
                      </td>
                      <td>
                        <select
                          className="form-control"
                          style={{ padding: '4px 8px', fontSize: '12px', width: 'auto' }}
                          value={rotina.status}
                          onChange={e => alterarStatus(rotina.idRotina, e.target.value)}
                        >
                          <option value="PENDENTE">Pendente</option>
                          <option value="EM_ANDAMENTO">Em Andamento</option>
                          <option value="CONCLUIDO">Concluído</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};