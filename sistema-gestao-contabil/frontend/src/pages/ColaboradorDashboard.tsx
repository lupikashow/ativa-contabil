import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Rotina {
  idRotina: number;
  nome: string;
  descricao?: string;
  dataVencimento: string;
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO';
  empresa: {
    razaoSocial: string;
  };
}

export const ColaboradorDashboard: React.FC = () => {
  const [rotinas, setRotinas] = useState<Rotina[]>([]);
  const navigate = useNavigate();

  const carregarRotinas = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3000/rotinas', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRotinas(data);
      }
    } catch (err) {
      console.error('Erro ao carregar rotinas do colaborador:', err);
    }
  };

  useEffect(() => {
    carregarRotinas();
  }, []);

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
        carregarRotinas();
      }
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar Restrita do Colaborador */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          📊 <span>Painel</span>Colaborador
        </div>

        <nav className="sidebar-nav">
          <span className="sidebar-link active">
            📋 Minhas Tarefas e Rotinas
          </span>
        </nav>

        <div className="sidebar-user">
          <span className="sidebar-user-name">Área Operacional</span>
          <button 
            onClick={handleLogout}
            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', marginTop: '8px', fontSize: '13px', textAlign: 'left', padding: 0 }}
          >
            Encerrar Sessão 🚪
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal Focado na Operação */}
      <main className="main-content">
        <header className="content-header">
          <div>
            <h1>Painel do Colaborador</h1>
            <p>Gerencie e atualize o andamento das obrigações fiscais atribuídas a si.</p>
          </div>
        </header>

        <div className="card">
          <h3>Rotinas Fiscais Atribuídas</h3>
          <div className="table-container" style={{ marginTop: '16px' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Empresa Cliente</th>
                  <th>Obrigação / Rotina</th>
                  <th>Vencimento</th>
                  <th>Status Atual</th>
                  <th>Ações Operacionais</th>
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