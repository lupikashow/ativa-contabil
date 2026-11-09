import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [menuAtivo, setMenuAtivo] = useState<'inicio' | 'colaboradores' | 'empresas' | 'rotinas'>('inicio');

  // Estados para Colaboradores
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [nomeColab, setNomeColab] = useState('');
  const [emailColab, setEmailColab] = useState('');
  const [senhaColab, setSenhaColab] = useState('');
  const [erroColab, setErroColab] = useState<string | null>(null);

  // Estados para Empresas Clientes
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [cnpjEmpresa, setCnpjEmpresa] = useState('');
  const [regimeTributario, setRegimeTributario] = useState('MEI');
  const [responsavelEmpresa, setResponsavelEmpresa] = useState('');
  const [erroEmpresa, setErroEmpresa] = useState<string | null>(null);

  // Estados para Rotinas Fiscais
  const [rotinas, setRotinas] = useState<any[]>([]);
  const [tituloRotina, setTituloRotina] = useState('');
  const [descricaoRotina, setDescricaoRotina] = useState('');
  const [prazoRotina, setPrazoRotina] = useState('');
  const [empresaIdSelecionada, setEmpresaIdSelecionada] = useState('');
  const [colaboradorIdSelecionado, setColaboradorIdSelecionado] = useState('');
  const [erroRotina, setErroRotina] = useState<string | null>(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    const perfil = localStorage.getItem('perfil');
    if (!token || perfil !== 'GESTOR') {
      navigate('/');
      return;
    }
    const nomeSalvo = localStorage.getItem('nomeUsuario');
    if (nomeSalvo) setNomeUsuario(nomeSalvo);

    carregarDados();
  }, [navigate, token]);

  const carregarDados = async () => {
    const currentToken = localStorage.getItem('token');
    try {
      const resColab = await fetch('http://localhost:3000/usuarios', {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      if (resColab.ok) {
        const dados = await resColab.json();
        // Mostra todos os utilizadores que não sejam GESTOR (ou exibe tudo para diagnóstico)
        setColaboradores(dados.filter((u: any) => (u.perfil || '').toUpperCase() !== 'GESTOR'));
      }

      const resEmp = await fetch('http://localhost:3000/empresas', {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      if (resEmp.ok) setEmpresas(await resEmp.json());

      const resRot = await fetch('http://localhost:3000/rotinas', {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      if (resRot.ok) setRotinas(await resRot.json());
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    }
  };

  const handleCriarColaborador = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroColab(null);
    const currentToken = localStorage.getItem('token');

    try {
      const response = await fetch('http://localhost:3000/usuarios', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify({
          nome: nomeColab,
          email: emailColab,
          senha: senhaColab,
          perfil: 'COLABORADOR'
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Erro ao cadastrar colaborador.');

      alert('Colaborador cadastrado com sucesso!');
      setNomeColab('');
      setEmailColab('');
      setSenhaColab('');
      carregarDados();
    } catch (err: any) {
      setErroColab(err.message);
    }
  };

  const handleCriarEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroEmpresa(null);
    const currentToken = localStorage.getItem('token');

    try {
      const response = await fetch('http://localhost:3000/empresas', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify({ 
          nome: nomeEmpresa, 
          cnpj: cnpjEmpresa,
          regime: regimeTributario,
          responsavel: responsavelEmpresa
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Erro ao cadastrar empresa.');

      alert('Empresa cadastrada com sucesso!');
      setNomeEmpresa('');
      setCnpjEmpresa('');
      setResponsavelEmpresa('');
      setRegimeTributario('MEI');
      carregarDados();
    } catch (err: any) {
      setErroEmpresa(err.message || 'Erro ao conectar com o servidor.');
    }
  };

  const handleCriarRotina = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroRotina(null);
    const currentToken = localStorage.getItem('token');

    try {
      const response = await fetch('http://localhost:3000/rotinas', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify({ 
          titulo: tituloRotina, 
          descricao: descricaoRotina,
          prazo: prazoRotina,
          empresaId: empresaIdSelecionada,
          colaboradorId: colaboradorIdSelecionado
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Erro ao criar rotina fiscal.');

      alert('Rotina fiscal criada com sucesso!');
      setTituloRotina('');
      setDescricaoRotina('');
      setPrazoRotina('');
      setEmpresaIdSelecionada('');
      setColaboradorIdSelecionado('');
      carregarDados();
    } catch (err: any) {
      setErroRotina(err.message || 'Erro ao conectar com o servidor.');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0f172a', color: '#fff', fontFamily: 'sans-serif' }}>
      
      {/* MENU LATERAL */}
      <aside style={{ width: '260px', backgroundColor: '#1e293b', padding: '24px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #334155' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '30px', color: '#3b82f6' }}>
          Sistema Contábil
        </h2>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
          <button onClick={() => setMenuAtivo('inicio')} style={btnMenuStyle(menuAtivo === 'inicio')}>📊 Início</button>
          <button onClick={() => setMenuAtivo('colaboradores')} style={btnMenuStyle(menuAtivo === 'colaboradores')}>👥 Colaboradores</button>
          <button onClick={() => setMenuAtivo('empresas')} style={btnMenuStyle(menuAtivo === 'empresas')}>🏢 Empresas Clientes</button>
          <button onClick={() => setMenuAtivo('rotinas')} style={btnMenuStyle(menuAtivo === 'rotinas')}>📋 Rotinas Fiscais</button>
        </nav>

        <button onClick={handleLogout} style={{ padding: '12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: 'auto' }}>
          Sair da Conta
        </button>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1>Painel do Gestor</h1>
          <span style={{ color: '#94a3b8' }}>Gestor: <strong>{nomeUsuario || 'Administrador'}</strong></span>
        </header>

        {/* 1. INÍCIO */}
        {menuAtivo === 'inicio' && (
          <div style={cardStyle()}>
            <h3>Bem-vindo ao Escritório Contábil!</h3>
            <p style={{ color: '#94a3b8', marginTop: '10px' }}>Painel centralizado para controlo de equipa, clientes empresariais e cumprimento de obrigações fiscais.</p>
          </div>
        )}

        {/* 2. COLABORADORES */}
        {menuAtivo === 'colaboradores' && (
          <div style={cardStyle()}>
            <h3>Gestão de Colaboradores</h3>
            {erroColab && <div style={{ color: '#ef4444', marginBottom: '10px', fontWeight: 'bold' }}>{erroColab}</div>}
            
            <form onSubmit={handleCriarColaborador} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px', maxWidth: '400px' }}>
              <input type="text" placeholder="Nome Completo" value={nomeColab} onChange={e => setNomeColab(e.target.value)} required style={inputStyle()} />
              <input type="email" placeholder="E-mail Profissional" value={emailColab} onChange={e => setEmailColab(e.target.value)} required style={inputStyle()} />
              <input type="password" placeholder="Senha Temporária" value={senhaColab} onChange={e => setSenhaColab(e.target.value)} required style={inputStyle()} />
              <button type="submit" style={buttonStyle()}>Cadastrar Colaborador</button>
            </form>

            <h4 style={{ marginTop: '30px' }}>Colaboradores Ativos:</h4>
            <ul style={{ marginTop: '10px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {colaboradores.length === 0 ? 
                <li>Nenhum colaborador registado.</li> : 
                colaboradores.map((c, i) => <li key={i}>👤 <strong>{c.nome || c.email}</strong> (${c.email}) - Perfil: {c.perfil || 'N/A'}</li>)
              }
            </ul>
          </div>
        )}

        {/* 3. EMPRESAS */}
        {menuAtivo === 'empresas' && (
          <div style={cardStyle()}>
            <h3>Gestão de Empresas Clientes</h3>
            {erroEmpresa && <div style={{ color: '#ef4444', marginBottom: '10px', fontWeight: 'bold' }}>{erroEmpresa}</div>}

            <form onSubmit={handleCriarEmpresa} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px', maxWidth: '400px', marginBottom: '20px' }}>
              <input type="text" placeholder="Razão Social / Nome da Empresa" value={nomeEmpresa} onChange={e => setNomeEmpresa(e.target.value)} required style={inputStyle()} />
              <input type="text" placeholder="CNPJ (00.000.000/0001-00)" value={cnpjEmpresa} onChange={e => setCnpjEmpresa(e.target.value)} required style={inputStyle()} />
              
              <select value={regimeTributario} onChange={e => setRegimeTributario(e.target.value)} style={inputStyle()}>
                <option value="MEI">MEI - Microempreendedor Individual</option>
                <option value="SIMPLES NACIONAL">Simples Nacional</option>
                <option value="LUCRO PRESUMIDO">Lucro Presumido</option>
                <option value="LUCRO REAL">Lucro Real</option>
              </select>

              <input type="text" placeholder="Responsável / Contato na Empresa" value={responsavelEmpresa} onChange={e => setResponsavelEmpresa(e.target.value)} style={inputStyle()} />
              <button type="submit" style={buttonStyle()}>Cadastrar Empresa</button>
            </form>

            <h4 style={{ marginTop: '20px' }}>Empresas Clientes Registadas:</h4>
            <ul style={{ marginTop: '10px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {empresas.length === 0 ? <li>Nenhuma empresa registada.</li> : empresas.map((emp, i) => <li key={i}>🏢 <strong>{emp.nome}</strong> — CNPJ: {emp.cnpj} ({emp.regime || 'MEI'})</li>)}
            </ul>
          </div>
        )}

        {/* 4. ROTINAS FISCAIS */}
        {menuAtivo === 'rotinas' && (
          <div style={cardStyle()}>
            <h3>Rotinas Fiscais e Obrigações Acessórias</h3>
            {erroRotina && <div style={{ color: '#ef4444', marginBottom: '10px', fontWeight: 'bold' }}>{erroRotina}</div>}

            <form onSubmit={handleCriarRotina} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px', maxWidth: '400px', marginBottom: '20px' }}>
              <input type="text" placeholder="Título da Rotina (ex: Entrega de DCTF)" value={tituloRotina} onChange={e => setTituloRotina(e.target.value)} required style={inputStyle()} />
              <input type="text" placeholder="Descrição / Observações da Tarefa" value={descricaoRotina} onChange={e => setDescricaoRotina(e.target.value)} style={inputStyle()} />
              <input type="date" value={prazoRotina} onChange={e => setPrazoRotina(e.target.value)} required style={inputStyle()} />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8' }}>EMPRESA CLIENTE:</label>
                <select value={empresaIdSelecionada} onChange={e => setEmpresaIdSelecionada(e.target.value)} required style={inputStyle()}>
                  <option value="">Selecione a Empresa...</option>
                  {empresas.map((emp) => (
                    <option key={emp.idEmpresa || emp.id} value={emp.nome}>
                      {emp.nome} (CNPJ: {emp.cnpj})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8' }}>COLABORADOR RESPONSÁVEL:</label>
                <select value={colaboradorIdSelecionado} onChange={e => setColaboradorIdSelecionado(e.target.value)} required style={inputStyle()}>
                  <option value="">Selecione o Colaborador...</option>
                  {colaboradores.map((colab) => (
                    <option key={colab.idUsuario || colab.id} value={colab.nome || colab.email}>
                      {colab.nome || colab.email} ({colab.email})
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" style={buttonStyle()}>Adicionar Rotina Fiscal</button>
            </form>

            <h4 style={{ marginTop: '20px' }}>Cronograma de Rotinas Ativas:</h4>
            <ul style={{ marginTop: '10px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {rotinas.length === 0 ? 
                <li>Nenhuma rotina registada.</li> : 
                rotinas.map((rot, i) => (
                  <li key={i}>
                    📋 <strong>{rot.titulo}</strong> — Prazo: {rot.prazo} <br />
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      Empresa: {rot.empresa || rot.empresaId || 'N/A'} | Colaborador: {rot.colaborador || rot.colaboradorId || 'N/A'}
                    </span>
                  </li>
                ))
              }
            </ul>
          </div>
        )}
      </main>
    </div>
  );
};

// Estilos auxiliares reutilizáveis
const btnMenuStyle = (ativo: boolean) => ({
  textAlign: 'left' as const, padding: '12px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
  backgroundColor: ativo ? '#3b82f6' : 'transparent',
  color: ativo ? '#fff' : '#94a3b8',
});

const cardStyle = () => ({
  backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155'
});

const inputStyle = () => ({
  padding: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff'
});

const buttonStyle = () => ({
  padding: '10px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
});