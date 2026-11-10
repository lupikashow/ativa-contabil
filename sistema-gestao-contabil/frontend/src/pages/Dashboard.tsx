import React, { useState, useEffect } from 'react';

export default function Dashboard() {
  const [abaAtiva, setAbaAtiva] = useState<'inicio' | 'colaboradores' | 'empresas' | 'rotinas'>('rotinas');
  
  const [colaboradores, setColaboradores] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [rotinas, setRotinas] = useState([]);

  // Estados de Edição
  const [editandoEmpresaId, setEditandoEmpresaId] = useState<number | null>(null);
  const [editandoColabId, setEditandoColabId] = useState<number | null>(null);
  const [editandoRotinaId, setEditandoRotinaId] = useState<number | null>(null);

  // Estados de Filtros para o Cronograma de Rotinas
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const [filtroColaborador, setFiltroColaborador] = useState('');

  // Formulários
  const [novoColaborador, setNovoColaborador] = useState({ nome: '', email: '', senha: '', perfil: 'COLABORADOR' });
  const [novaEmpresa, setNovaEmpresa] = useState({ nome: '', cnpj: '', tipo: 'MEI', responsavel: '' });
  const [novaRotina, setNovaRotina] = useState({ titulo: '', descricao: '', dataVencimento: '', empresaId: '', colaboradorId: '', status: 'Pendente' });

  const apiBase = 'http://localhost:3000';

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const resColab = await fetch(`${apiBase}/usuarios`);
      if (resColab.ok) setColaboradores(await resColab.json());

      const resEmp = await fetch(`${apiBase}/empresas`);
      if (resEmp.ok) setEmpresas(await resEmp.json());

      const resRot = await fetch(`${apiBase}/rotinas`);
      if (resRot.ok) setRotinas(await resRot.json());
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    }
  };

  // --- EMPRESAS ---
  const salvarEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editandoEmpresaId ? `${apiBase}/empresas/${editandoEmpresaId}` : `${apiBase}/empresas`;
      const method = editandoEmpresaId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaEmpresa)
      });

      if (res.ok) {
        setNovaEmpresa({ nome: '', cnpj: '', tipo: 'MEI', responsavel: '' });
        setEditandoEmpresaId(null);
        carregarDados();
        alert(editandoEmpresaId ? 'Empresa atualizada com sucesso!' : 'Empresa cadastrada com sucesso!');
      } else {
        alert('Erro ao salvar empresa.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const editarEmpresa = (emp: any) => {
    setEditandoEmpresaId(emp.idEmpresa || emp.id);
    setNovaEmpresa({ nome: emp.nome, cnpj: emp.cnpj, tipo: emp.tipo || 'MEI', responsavel: emp.responsavel || '' });
  };

  const excluirEmpresa = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta empresa?')) return;
    try {
      const res = await fetch(`${apiBase}/empresas/${id}`, { method: 'DELETE' });
      if (res.ok) carregarDados();
      else alert('Erro ao excluir empresa.');
    } catch (err) { console.error(err); }
  };

  // --- COLABORADORES ---
  const salvarColaborador = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editandoColabId ? `${apiBase}/usuarios/${editandoColabId}` : `${apiBase}/usuarios`;
      const method = editandoColabId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoColaborador)
      });

      if (res.ok) {
        setNovoColaborador({ nome: '', email: '', senha: '', perfil: 'COLABORADOR' });
        setEditandoColabId(null);
        carregarDados();
        alert(editandoColabId ? 'Colaborador atualizado com sucesso!' : 'Colaborador cadastrado com sucesso!');
      } else {
        alert('Erro ao salvar colaborador.');
      }
    } catch (err) { console.error(err); }
  };

  const editarColaborador = (col: any) => {
    setEditandoColabId(col.idUsuario || col.id);
    setNovoColaborador({ nome: col.nome, email: col.email, senha: '', perfil: col.perfil || 'COLABORADOR' });
  };

  const excluirColaborador = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este colaborador?')) return;
    try {
      const res = await fetch(`${apiBase}/usuarios/${id}`, { method: 'DELETE' });
      if (res.ok) carregarDados();
      else alert('Erro ao excluir colaborador.');
    } catch (err) { console.error(err); }
  };

  // --- ROTINAS FISCAIS ---
  const salvarRotina = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editandoRotinaId ? `${apiBase}/rotinas/${editandoRotinaId}` : `${apiBase}/rotinas`;
      const method = editandoRotinaId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaRotina)
      });

      if (res.ok) {
        setNovaRotina({ titulo: '', descricao: '', dataVencimento: '', empresaId: '', colaboradorId: '', status: 'Pendente' });
        setEditandoRotinaId(null);
        carregarDados();
        alert(editandoRotinaId ? 'Rotina atualizada com sucesso!' : 'Rotina cadastrada com sucesso!');
      } else {
        alert('Erro ao salvar rotina fiscal.');
      }
    } catch (err) { console.error(err); }
  };

  const editarRotina = (rot: any) => {
    setEditandoRotinaId(rot.idRotina || rot.id);
    setNovaRotina({
      titulo: rot.titulo,
      descricao: rot.descricao || '',
      dataVencimento: rot.dataVencimento,
      status: rot.status || 'Pendente',
      empresaId: rot.empresa?.idEmpresa || rot.empresaId || '',
      colaboradorId: rot.colaborador?.idUsuario || rot.colaboradorId || ''
    });
  };

  const excluirRotina = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta rotina?')) return;
    try {
      const res = await fetch(`${apiBase}/rotinas/${id}`, { method: 'DELETE' });
      if (res.ok) carregarDados();
      else alert('Erro ao excluir rotina.');
    } catch (err) { console.error(err); }
  };

  // --- FILTROS DE ROTINAS ---
  const rotinasFiltradas = rotinas.filter((rot: any) => {
    const matchStatus = filtroStatus ? rot.status === filtroStatus : true;
    const matchEmpresa = filtroEmpresa ? (rot.empresa?.idEmpresa || rot.empresaId)?.toString() === filtroEmpresa : true;
    const matchColab = filtroColaborador ? (rot.colaborador?.idUsuario || rot.colaboradorId)?.toString() === filtroColaborador : true;
    return matchStatus && matchEmpresa && matchColab;
  });

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box' as const
  };

  const btnStyle = {
    width: '100%',
    padding: '12px',
    background: '#3b82f6',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontWeight: 'bold' as const,
    fontSize: '14px',
    cursor: 'pointer',
    marginTop: '10px'
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a', color: '#f8fafc', fontFamily: 'sans-serif' }}>
      
      {/* BARRA LATERAL */}
      <div style={{ width: '260px', background: '#1e293b', borderRight: '1px solid #334155', display: 'flex', flexDirection: 'column', padding: '24px', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '20px', color: '#38bdf8', marginBottom: '35px', fontWeight: 'bold' }}>Sistema Contábil</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={() => setAbaAtiva('inicio')} style={{ textAlign: 'left', padding: '12px 16px', background: abaAtiva === 'inicio' ? '#3b82f6' : 'transparent', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: '500' }}>📊 Início</button>
            <button onClick={() => setAbaAtiva('colaboradores')} style={{ textAlign: 'left', padding: '12px 16px', background: abaAtiva === 'colaboradores' ? '#3b82f6' : 'transparent', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: '500' }}>👥 Colaboradores</button>
            <button onClick={() => setAbaAtiva('empresas')} style={{ textAlign: 'left', padding: '12px 16px', background: abaAtiva === 'empresas' ? '#3b82f6' : 'transparent', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: '500' }}>🏢 Empresas Clientes</button>
            <button onClick={() => setAbaAtiva('rotinas')} style={{ textAlign: 'left', padding: '12px 16px', background: abaAtiva === 'rotinas' ? '#3b82f6' : 'transparent', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: '500' }}>📅 Rotinas Fiscais</button>
          </div>
        </div>
        <button onClick={() => alert('Sair da conta')} style={{ padding: '12px', background: '#ef4444', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>Sair da Conta</button>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 'bold' }}>Painel do Gestor</h1>
          <span style={{ color: '#94a3b8', fontSize: '14px' }}>Gestor: <strong>Administrador</strong></span>
        </div>

        {/* 1. SECÇÃO DE EMPRESAS */}
        {abaAtiva === 'empresas' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'start' }}>
            <div style={{ background: '#1e293b', padding: '30px', borderRadius: '16px', border: '1px solid #334155' }}>
              <h3 style={{ marginBottom: '20px', fontSize: '18px', color: '#38bdf8' }}>{editandoEmpresaId ? 'Editar Empresa Cliente' : 'Registar Nova Empresa Cliente'}</h3>
              <form onSubmit={salvarEmpresa} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input type="text" placeholder="Razão Social / Nome" value={novaEmpresa.nome} onChange={e => setNovaEmpresa({...novaEmpresa, nome: e.target.value})} style={inputStyle} required />
                <input type="text" placeholder="CNPJ" value={novaEmpresa.cnpj} onChange={e => setNovaEmpresa({...novaEmpresa, cnpj: e.target.value})} style={inputStyle} required />
                <select value={novaEmpresa.tipo} onChange={e => setNovaEmpresa({...novaEmpresa, tipo: e.target.value})} style={inputStyle}>
                  <option value="MEI" style={{ background: '#0f172a' }}>MEI</option>
                  <option value="ME" style={{ background: '#0f172a' }}>ME</option>
                  <option value="EPP" style={{ background: '#0f172a' }}>EPP</option>
                  <option value="Lucro Presumido" style={{ background: '#0f172a' }}>Lucro Presumido</option>
                </select>
                <input type="text" placeholder="Responsável" value={novaEmpresa.responsavel} onChange={e => setNovaEmpresa({...novaEmpresa, responsavel: e.target.value})} style={inputStyle} />
                <button type="submit" style={btnStyle}>{editandoEmpresaId ? 'Atualizar Empresa' : 'Cadastrar Empresa'}</button>
                {editandoEmpresaId && <button type="button" onClick={() => { setEditandoEmpresaId(null); setNovaEmpresa({ nome: '', cnpj: '', tipo: 'MEI', responsavel: '' }); }} style={{ ...btnStyle, background: '#64748b' }}>Cancelar Edição</button>}
              </form>
            </div>

            <div style={{ background: '#1e293b', padding: '30px', borderRadius: '16px', border: '1px solid #334155' }}>
              <h3 style={{ marginBottom: '20px', fontSize: '18px', color: '#38bdf8' }}>Empresas Registadas</h3>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '0', listStyle: 'none' }}>
                {empresas.length === 0 ? <li style={{ color: '#94a3b8' }}>Nenhuma empresa registada.</li> : empresas.map((emp: any, i: number) => (
                  <li key={i} style={{ background: '#0f172a', padding: '15px', borderRadius: '10px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      🏢 <strong>{emp.nome}</strong><br/>
                      <span style={{ fontSize: '13px', color: '#94a3b8' }}>CNPJ: {emp.cnpj} ({emp.tipo})</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => editarEmpresa(emp)} style={{ background: '#3b82f6', border: 'none', padding: '6px 10px', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '12px' }}>Editar</button>
                      <button onClick={() => excluirEmpresa(emp.idEmpresa || emp.id)} style={{ background: '#ef4444', border: 'none', padding: '6px 10px', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '12px' }}>Excluir</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* 2. SECÇÃO DE COLABORADORES */}
        {abaAtiva === 'colaboradores' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'start' }}>
            <div style={{ background: '#1e293b', padding: '30px', borderRadius: '16px', border: '1px solid #334155' }}>
              <h3 style={{ marginBottom: '20px', fontSize: '18px', color: '#38bdf8' }}>{editandoColabId ? 'Editar Colaborador' : 'Registar Novo Colaborador'}</h3>
              <form onSubmit={salvarColaborador} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input type="text" placeholder="Nome Completo" value={novoColaborador.nome} onChange={e => setNovoColaborador({...novoColaborador, nome: e.target.value})} style={inputStyle} required />
                <input type="email" placeholder="E-mail" value={novoColaborador.email} onChange={e => setNovoColaborador({...novoColaborador, email: e.target.value})} style={inputStyle} required />
                <input type="password" placeholder="Palavra-passe" value={novoColaborador.senha} onChange={e => setNovoColaborador({...novoColaborador, senha: e.target.value})} style={inputStyle} required={!editandoColabId} />
                <button type="submit" style={btnStyle}>{editandoColabId ? 'Atualizar Colaborador' : 'Cadastrar Colaborador'}</button>
                {editandoColabId && <button type="button" onClick={() => { setEditandoColabId(null); setNovoColaborador({ nome: '', email: '', senha: '', perfil: 'COLABORADOR' }); }} style={{ ...btnStyle, background: '#64748b' }}>Cancelar Edição</button>}
              </form>
            </div>

            <div style={{ background: '#1e293b', padding: '30px', borderRadius: '16px', border: '1px solid #334155' }}>
              <h3 style={{ marginBottom: '20px', fontSize: '18px', color: '#38bdf8' }}>Equipa Registada</h3>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '0', listStyle: 'none' }}>
                {colaboradores.length === 0 ? <li style={{ color: '#94a3b8' }}>Nenhum colaborador registado.</li> : colaboradores.map((col: any, i: number) => (
                  <li key={i} style={{ background: '#0f172a', padding: '15px', borderRadius: '10px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      👤 <strong>{col.nome}</strong><br/>
                      <span style={{ fontSize: '13px', color: '#94a3b8' }}>{col.email}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => editarColaborador(col)} style={{ background: '#3b82f6', border: 'none', padding: '6px 10px', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '12px' }}>Editar</button>
                      <button onClick={() => excluirColaborador(col.idUsuario || col.id)} style={{ background: '#ef4444', border: 'none', padding: '6px 10px', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '12px' }}>Excluir</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* 3. SECÇÃO DE ROTINAS FISCAIS */}
        {abaAtiva === 'rotinas' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '30px', alignItems: 'start' }}>
            
            {/* Formulário de Criar/Editar Rotina */}
            <div style={{ background: '#1e293b', padding: '30px', borderRadius: '16px', border: '1px solid #334155' }}>
              <h3 style={{ marginBottom: '20px', fontSize: '18px', color: '#38bdf8' }}>{editandoRotinaId ? 'Editar Rotina Fiscal' : 'Adicionar Rotina Fiscal'}</h3>
              <form onSubmit={salvarRotina} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input type="text" placeholder="Título da Rotina" value={novaRotina.titulo} onChange={e => setNovaRotina({...novaRotina, titulo: e.target.value})} style={inputStyle} required />
                <input type="text" placeholder="Descrição" value={novaRotina.descricao} onChange={e => setNovaRotina({...novaRotina, descricao: e.target.value})} style={inputStyle} />
                <input type="date" value={novaRotina.dataVencimento} onChange={e => setNovaRotina({...novaRotina, dataVencimento: e.target.value})} style={inputStyle} required />

                <select value={novaRotina.status} onChange={e => setNovaRotina({...novaRotina, status: e.target.value})} style={inputStyle}>
                  <option value="Pendente" style={{ background: '#0f172a' }}>Pendente</option>
                  <option value="Em Andamento" style={{ background: '#0f172a' }}>Em Andamento</option>
                  <option value="Concluída" style={{ background: '#0f172a' }}>Concluída</option>
                </select>

                <select value={novaRotina.empresaId} onChange={e => setNovaRotina({...novaRotina, empresaId: e.target.value})} style={inputStyle} required>
                  <option value="" style={{ background: '#0f172a' }}>Selecione a Empresa...</option>
                  {empresas.map((emp: any) => (
                    <option key={emp.idEmpresa || emp.id} value={emp.idEmpresa || emp.id} style={{ background: '#0f172a' }}>
                      {emp.nome} — CNPJ: {emp.cnpj}
                    </option>
                  ))}
                </select>

                <select value={novaRotina.colaboradorId} onChange={e => setNovaRotina({...novaRotina, colaboradorId: e.target.value})} style={inputStyle} required>
                  <option value="" style={{ background: '#0f172a' }}>Selecione o Colaborador...</option>
                  {colaboradores.map((col: any) => (
                    <option key={col.idUsuario || col.id} value={col.idUsuario || col.id} style={{ background: '#0f172a' }}>
                      {col.nome}
                    </option>
                  ))}
                </select>

                <button type="submit" style={btnStyle}>{editandoRotinaId ? 'Atualizar Rotina' : 'Adicionar Rotina Fiscal'}</button>
                {editandoRotinaId && <button type="button" onClick={() => { setEditandoRotinaId(null); setNovaRotina({ titulo: '', descricao: '', dataVencimento: '', empresaId: '', colaboradorId: '', status: 'Pendente' }); }} style={{ ...btnStyle, background: '#64748b' }}>Cancelar Edição</button>}
              </form>
            </div>

            {/* Cronograma e Filtros */}
            <div style={{ background: '#1e293b', padding: '30px', borderRadius: '16px', border: '1px solid #334155' }}>
              <h3 style={{ marginBottom: '15px', fontSize: '18px', color: '#38bdf8' }}>Cronograma e Filtros</h3>
              
              {/* Barra de Filtros */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={{ ...inputStyle, padding: '8px' }}>
                  <option value="" style={{ background: '#0f172a' }}>Todos os Status</option>
                  <option value="Pendente" style={{ background: '#0f172a' }}>Pendente</option>
                  <option value="Em Andamento" style={{ background: '#0f172a' }}>Em Andamento</option>
                  <option value="Concluída" style={{ background: '#0f172a' }}>Concluída</option>
                </select>

                <select value={filtroEmpresa} onChange={e => setFiltroEmpresa(e.target.value)} style={{ ...inputStyle, padding: '8px' }}>
                  <option value="" style={{ background: '#0f172a' }}>Todas Empresas</option>
                  {empresas.map((emp: any) => (
                    <option key={emp.idEmpresa || emp.id} value={emp.idEmpresa || emp.id} style={{ background: '#0f172a' }}>{emp.nome}</option>
                  ))}
                </select>

                <select value={filtroColaborador} onChange={e => setFiltroColaborador(e.target.value)} style={{ ...inputStyle, padding: '8px' }}>
                  <option value="" style={{ background: '#0f172a' }}>Todos Colaboradores</option>
                  {colaboradores.map((col: any) => (
                    <option key={col.idUsuario || col.id} value={col.idUsuario || col.id} style={{ background: '#0f172a' }}>{col.nome}</option>
                  ))}
                </select>
              </div>

              {/* Lista Filtrada de Rotinas */}
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '0', listStyle: 'none' }}>
                {rotinasFiltradas.length === 0 ? <li style={{ color: '#94a3b8' }}>Nenhuma rotina encontrada com estes filtros.</li> : rotinasFiltradas.map((rot: any, i: number) => (
                  <li key={i} style={{ background: '#0f172a', padding: '16px', borderRadius: '10px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      📅 <strong>{rot.titulo}</strong><br/>
                      <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                        🏢 Empresa: <strong>{rot.empresa?.nome || 'Não definida'}</strong><br/>
                        👤 Colaborador: <strong>{rot.colaborador?.nome || 'Não atribuído'}</strong><br/>
                        ⏰ Vencimento: {rot.dataVencimento} | Status: <span style={{ color: rot.status === 'Concluída' ? '#4ade80' : rot.status === 'Em Andamento' ? '#38bdf8' : '#facc15', fontWeight: 'bold' }}>{rot.status || 'Pendente'}</span>
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <button onClick={() => editarRotina(rot)} style={{ background: '#3b82f6', border: 'none', padding: '6px 10px', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '12px' }}>Editar</button>
                      <button onClick={() => excluirRotina(rot.idRotina || rot.id)} style={{ background: '#ef4444', border: 'none', padding: '6px 10px', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '12px' }}>Excluir</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        )}

        {abaAtiva === 'inicio' && (
          <div style={{ background: '#1e293b', padding: '30px', borderRadius: '16px', border: '1px solid #334155' }}>
            <h3 style={{ color: '#38bdf8', marginBottom: '15px' }}>Bem-vindo ao Sistema de Gestão Contábil</h3>
            <p style={{ color: '#94a3b8', lineHeight: '1.6' }}>Painel completo atualizado com filtros dinâmicos, gestão de colaboradores e CRUD completo para empresas e rotinas.</p>
          </div>
        )}

      </div>
    </div>
  );
}