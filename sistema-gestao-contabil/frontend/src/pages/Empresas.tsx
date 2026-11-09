import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface Empresa {
  idEmpresa: number;
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj: string;
  inscricaoEstadual?: string;
  regimeTributario: string;
  dataVencimentoCert?: string;
  tipoCertificado?: string;
  ativo: boolean;
}

export const Empresas: React.FC = () => {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [formData, setFormData] = useState({
    razaoSocial: '',
    nomeFantasia: '',
    cnpj: '',
    inscricaoEstadual: '',
    regimeTributario: 'SIMPLES_NACIONAL',
    dataVencimentoCert: '',
    tipoCertificado: 'A1',
  });
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const perfilUsuario = localStorage.getItem('perfil') || 'COLABORADOR';
  const location = useLocation();

  const carregarEmpresas = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3000/empresas', {
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
      });

      if (!res.ok) {
        throw new Error('Não foi possível carregar a lista de empresas.');
      }

      const data = await res.json();
      setEmpresas(data);
    } catch (err: any) {
      console.error('Erro ao buscar empresas:', err);
    }
  };

  useEffect(() => {
    carregarEmpresas();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem(null);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('http://localhost:3000/empresas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        const err = Array.isArray(data.message) ? data.message.join(', ') : data.message;
        throw new Error(err || 'Erro ao cadastrar empresa.');
      }

      setMensagem({ tipo: 'sucesso', texto: 'Empresa cadastrada com sucesso!' });
      setFormData({
        razaoSocial: '',
        nomeFantasia: '',
        cnpj: '',
        inscricaoEstadual: '',
        regimeTributario: 'SIMPLES_NACIONAL',
        dataVencimentoCert: '',
        tipoCertificado: 'A1',
      });
      carregarEmpresas();
    } catch (err: any) {
      setMensagem({ tipo: 'erro', texto: err.message || 'Falha de conexão com o servidor.' });
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
            <h1>Empresas Clientes</h1>
            <p>Cadastre e gerencie a cartela de clientes do escritório com alertas de certificados.</p>
          </div>
        </header>

        {/* Form Cadastro de Empresas */}
        <div className="card">
          <h3>Cadastrar Nova Empresa</h3>
          
          {mensagem && (
            <div className={`alert ${mensagem.tipo === 'sucesso' ? 'alert-success' : 'alert-error'}`}>
              {mensagem.texto}
            </div>
          )}

          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>Razão Social *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Razão Social"
                value={formData.razaoSocial}
                onChange={e => setFormData({ ...formData, razaoSocial: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Nome Fantasia</label>
              <input
                type="text"
                className="form-control"
                placeholder="Nome Fantasia"
                value={formData.nomeFantasia}
                onChange={e => setFormData({ ...formData, nomeFantasia: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>CNPJ *</label>
              <input
                type="text"
                className="form-control"
                placeholder="00.000.000/0000-00"
                value={formData.cnpj}
                onChange={e => setFormData({ ...formData, cnpj: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Inscrição Estadual</label>
              <input
                type="text"
                className="form-control"
                placeholder="Inscrição Estadual"
                value={formData.inscricaoEstadual}
                onChange={e => setFormData({ ...formData, inscricaoEstadual: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Regime Tributário *</label>
              <select
                className="form-control"
                value={formData.regimeTributario}
                onChange={e => setFormData({ ...formData, regimeTributario: e.target.value })}
              >
                <option value="SIMPLES_NACIONAL">Simples Nacional</option>
                <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
                <option value="LUCRO_REAL">Lucro Real</option>
                <option value="MEI">MEI</option>
              </select>
            </div>

            <div className="form-group">
              <label>Tipo Certificado</label>
              <select
                className="form-control"
                value={formData.tipoCertificado}
                onChange={e => setFormData({ ...formData, tipoCertificado: e.target.value })}
              >
                <option value="A1">A1 (Arquivo Digital)</option>
                <option value="A3">A3 (Token / Cartão)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Vencimento do Certificado</label>
              <input
                type="date"
                className="form-control"
                value={formData.dataVencimentoCert}
                onChange={e => setFormData({ ...formData, dataVencimentoCert: e.target.value })}
              />
            </div>

            <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
              <button type="submit" className="btn btn-primary">
                Cadastrar Empresa
              </button>
            </div>
          </form>
        </div>

        {/* Tabela de Empresas com Alertas de Certificado */}
        <div className="card">
          <h3>Empresas Cadastradas ({empresas.length})</h3>
          <div className="table-container" style={{ marginTop: '16px' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>CNPJ</th>
                  <th>Razão Social</th>
                  <th>Regime</th>
                  <th>Certificado</th>
                  <th>Vencimento Cert.</th>
                  <th>Status Certificado</th>
                </tr>
              </thead>
              <tbody>
                {empresas.map((emp) => {
                  let statusCert = 'REGULAR';
                  let badgeClass = 'alert-success';

                  if (emp.dataVencimentoCert) {
                    const hoje = new Date();
                    const vencimento = new Date(emp.dataVencimentoCert);
                    const diffDias = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 3600 * 24));

                    if (diffDias < 0) {
                      statusCert = 'VENCIDO';
                      badgeClass = 'alert-error';
                    } else if (diffDias <= 30) {
                      statusCert = `VENCE EM ${diffDias} DIAS`;
                      badgeClass = 'badge-gestor';
                    }
                  }

                  return (
                    <tr key={emp.idEmpresa}>
                      <td>{emp.cnpj}</td>
                      <td><strong style={{ color: '#f8fafc' }}>{emp.razaoSocial}</strong></td>
                      <td>{emp.regimeTributario}</td>
                      <td>{emp.tipoCertificado || '-'}</td>
                      <td>{emp.dataVencimentoCert || 'Não informado'}</td>
                      <td>
                        {emp.dataVencimentoCert ? (
                          <span className={badgeClass} style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px', display: 'inline-block', fontWeight: 'bold' }}>
                            {statusCert}
                          </span>
                        ) : (
                          <span style={{ color: '#64748b', fontSize: '12px' }}>N/A</span>
                        )}
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