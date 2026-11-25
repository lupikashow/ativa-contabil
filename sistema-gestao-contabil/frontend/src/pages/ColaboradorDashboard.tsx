import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

interface ColaboradorDashboardProps {
  loginRoute?: string;
}

type OrdenacaoModo = 'urgencia' | 'vencimento' | 'empresa' | 'status';
type UrgenciaFiltro = 'TODAS' | 'VENCIDAS' | 'PROXIMAS' | 'NO_PRAZO';

const apiBase = 'http://localhost:3000';

const normalizarTexto = (valor?: unknown): string =>
  String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const normalizarStatus = (status?: string): 'Pendente' | 'Em Andamento' | 'Concluída' => {
  if (!status) return 'Pendente';
  const s = normalizarTexto(status);
  if (s === 'concluida' || s === 'concluido') {
    return 'Concluída';
  }
  if (s === 'em andamento' || s === 'emandamento' || s === 'em_andamento') {
    return 'Em Andamento';
  }
  return 'Pendente';
};

const toIsoDateLocal = (date: Date): string => {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
};

const obterInicioSemanaIso = (hojeIso: string): string => {
  const [ano, mes, dia] = hojeIso.split('-').map(Number);
  const data = new Date(ano, (mes || 1) - 1, dia || 1);
  const diaSemana = data.getDay();
  const diffParaSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;
  data.setDate(data.getDate() + diffParaSegunda);
  return toIsoDateLocal(data);
};

const obterDataIsoVencimento = (rotina: any): string => {
  const raw =
    rotina?.dataVencimentoCalculada ||
    rotina?.dataVencimento ||
    rotina?.data_vencimento ||
    rotina?.vencimento ||
    '';
  const match = String(raw).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : '';
};

const obterDataIsoConclusao = (rotina: any): string => {
  const raw =
    rotina?.dataConclusao ||
    rotina?.data_conclusao ||
    rotina?.concluidaEm ||
    rotina?.concluidoEm ||
    rotina?.updatedAt ||
    rotina?.atualizadoEm ||
    '';
  const match = String(raw).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : '';
};

const obterCompetenciaRotina = (rotina: any): string => {
  const direta =
    rotina?.competencia ||
    rotina?.mesCompetencia ||
    rotina?.mes_competencia ||
    rotina?.periodo;

  if (direta) {
    const texto = String(direta).trim();
    const aaaaMm = texto.match(/^(\d{4})-(\d{2})/);
    if (aaaaMm) return `${aaaaMm[1]}-${aaaaMm[2]}`;
    const mmBarraAaaa = texto.match(/^(\d{2})\/(\d{4})$/);
    if (mmBarraAaaa) return `${mmBarraAaaa[2]}-${mmBarraAaaa[1]}`;
  }

  const isoVenc = obterDataIsoVencimento(rotina);
  if (isoVenc) return isoVenc.slice(0, 7);

  return 'Sem competência';
};

const formatarDataVencimento = (rotina: any): string => {
  const raw =
    rotina?.dataVencimentoCalculada ||
    rotina?.dataVencimento ||
    rotina?.data_vencimento ||
    rotina?.vencimento ||
    '';
  if (!raw) return '—';

  const isoMatch = String(raw).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
  }
  return String(raw);
};

const obterIdRotina = (rotina: any): string | number | undefined =>
  rotina?.idRotina ?? rotina?.id_rotina ?? rotina?.id ?? rotina?.id_tarefa;

const obterNomeEmpresa = (rotina: any): string =>
  rotina?.empresa?.nome ||
  rotina?.empresa?.razaoSocial ||
  rotina?.empresa?.razao_social ||
  rotina?.empresaNome ||
  rotina?.nomeEmpresa ||
  'Empresa não informada';

const obterTituloRotina = (rotina: any): string =>
  rotina?.titulo ||
  rotina?.nome ||
  rotina?.rotinaNome ||
  rotina?.tarefaNome ||
  rotina?.obrigacao ||
  'Rotina Fiscal';

const obterDescricaoRotina = (rotina: any): string =>
  String(rotina?.descricao || rotina?.obs || rotina?.observacao || '').trim();

const obterAnotacaoBloqueio = (rotina: any): string =>
  String(
    rotina?.anotacaoBloqueio ??
      rotina?.motivoBloqueio ??
      rotina?.bloqueio ??
      rotina?.observacaoColaborador ??
      ''
  ).trim();

const obterInfoResponsavel = (rotina: any): { id: string; nome: string; email: string } => {
  const respObj =
    rotina?.responsavel && typeof rotina.responsavel === 'object'
      ? rotina.responsavel
      : rotina?.colaborador && typeof rotina.colaborador === 'object'
      ? rotina.colaborador
      : rotina?.usuario && typeof rotina.usuario === 'object'
      ? rotina.usuario
      : null;

  const id = normalizarTexto(
    respObj?.idUsuario ??
      respObj?.id_usuario ??
      respObj?.idColaborador ??
      respObj?.id_colaborador ??
      respObj?.id ??
      rotina?.responsavelId ??
      rotina?.id_responsavel ??
      rotina?.idResponsavel ??
      rotina?.colaboradorId ??
      rotina?.colaborador_id ??
      rotina?.idColaborador ??
      rotina?.id_colaborador ??
      rotina?.usuarioId ??
      rotina?.id_usuario ??
      ''
  );

  const nome = normalizarTexto(
    respObj?.nome ??
      respObj?.name ??
      rotina?.responsavelNome ??
      rotina?.colaboradorNome ??
      rotina?.nomeResponsavel ??
      rotina?.nomeColaborador ??
      (typeof rotina?.responsavel === 'string' ? rotina.responsavel : '') ??
      (typeof rotina?.colaborador === 'string' ? rotina.colaborador : '') ??
      ''
  );

  const email = normalizarTexto(respObj?.email ?? rotina?.responsavelEmail ?? '');

  return { id, nome, email };
};

const classificarUrgencia = (
  status: 'Pendente' | 'Em Andamento' | 'Concluída',
  isoVenc: string,
  hojeIso: string
): 'CONCLUIDA' | 'VENCIDA' | 'PROXIMA' | 'NO_PRAZO' => {
  if (status === 'Concluída') return 'CONCLUIDA';
  if (!isoVenc) return 'NO_PRAZO';
  if (isoVenc < hojeIso) return 'VENCIDA';

  const [ano, mes, dia] = hojeIso.split('-').map(Number);
  const limite = new Date(ano, (mes || 1) - 1, (dia || 1) + 3);
  const limiteIso = toIsoDateLocal(limite);

  if (isoVenc <= limiteIso) return 'PROXIMA';
  return 'NO_PRAZO';
};

export function ColaboradorDashboard({ loginRoute = '/' }: ColaboradorDashboardProps) {
  const navigate = useNavigate();

  const [rotinas, setRotinas] = useState<any[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [salvandoId, setSalvandoId] = useState<string | number | null>(null);
  const [pesquisa, setPesquisa] = useState<string>('');
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
  const [filtroCompetencia, setFiltroCompetencia] = useState<string>('TODAS');
  const [filtroUrgencia, setFiltroUrgencia] = useState<UrgenciaFiltro>('TODAS');
  const [ordenacao, setOrdenacao] = useState<OrdenacaoModo>('urgencia');
  const [concluidasNaSessaoHoje, setConcluidasNaSessaoHoje] = useState<number>(0);
  const [concluidasNaSessaoSemana, setConcluidasNaSessaoSemana] = useState<number>(0);
  const [rascunhosBloqueio, setRascunhosBloqueio] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ tipo: 'info' | 'ok' | 'erro'; texto: string } | null>(null);

  const sessaoInfo = useMemo(() => {
    try {
      const perfil = (localStorage.getItem('perfil') || '').toUpperCase().trim();
      const idStorage = localStorage.getItem('idUsuario') || '';
      const rawUsuario = localStorage.getItem('usuario') || sessionStorage.getItem('usuario');
      const parsedUsuario = rawUsuario ? JSON.parse(rawUsuario) : null;
      const userObj = parsedUsuario?.usuario || parsedUsuario?.user || parsedUsuario || {};

      const idUsuario = normalizarTexto(
        idStorage ||
          userObj?.id ||
          userObj?.idUsuario ||
          userObj?.id_usuario ||
          userObj?.idColaborador ||
          userObj?.id_colaborador ||
          ''
      );

      const nomeUsuario = normalizarTexto(userObj?.nome || userObj?.name || '');
      const emailUsuario = normalizarTexto(userObj?.email || '');

      return {
        perfil: perfil || String(userObj?.perfil || '').toUpperCase().trim(),
        idUsuario,
        nomeUsuario,
        emailUsuario,
        nomeExibicao: userObj?.nome || userObj?.email || ''
      };
    } catch {
      return {
        perfil: '',
        idUsuario: '',
        nomeUsuario: '',
        emailUsuario: '',
        nomeExibicao: ''
      };
    }
  }, []);

  const carregarRotinas = async () => {
    setCarregando(true);
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(`${apiBase}/rotinas`, { headers });
      if (!res.ok) {
        throw new Error(`Falha ao buscar rotinas (${res.status})`);
      }

      const data = await res.json();
      const lista = Array.isArray(data) ? data : data?.rotinas || data?.dados || [];
      setRotinas(lista);

      const iniciais: Record<string, string> = {};
      lista.forEach((r: any, idx: number) => {
        const chave = String(obterIdRotina(r) ?? idx);
        iniciais[chave] = obterAnotacaoBloqueio(r);
      });
      setRascunhosBloqueio(iniciais);
    } catch (err) {
      console.error('Erro ao carregar rotinas do colaborador:', err);
      setFeedback({
        tipo: 'erro',
        texto: 'Não foi possível sincronizar as rotinas com o servidor.'
      });
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarRotinas();
  }, []);

  const persistirAtualizacaoRotina = async (rotinaAtualizada: any, id: string | number | undefined) => {
    if (id === undefined) return true;
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let res = await fetch(`${apiBase}/rotinas/${id}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        status: rotinaAtualizada.status,
        anotacaoBloqueio: rotinaAtualizada.anotacaoBloqueio,
        observacaoColaborador: rotinaAtualizada.observacaoColaborador
      })
    });

    if (!res.ok) {
      res = await fetch(`${apiBase}/rotinas/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(rotinaAtualizada)
      });
    }

    return res.ok;
  };

  const alterarStatusRotina = async (rotina: any, novoStatusRaw: string, chaveLinha: string) => {
    const id = obterIdRotina(rotina);
    const statusAnterior = normalizarStatus(rotina?.status);
    const novoStatus = normalizarStatus(novoStatusRaw);
    const hojeIso = toIsoDateLocal(new Date());
    const anotacaoAtual = (rascunhosBloqueio[chaveLinha] ?? obterAnotacaoBloqueio(rotina)).trim();

    if (statusAnterior !== 'Concluída' && novoStatus === 'Concluída') {
      setConcluidasNaSessaoHoje((prev) => prev + 1);
      setConcluidasNaSessaoSemana((prev) => prev + 1);
    } else if (statusAnterior === 'Concluída' && novoStatus !== 'Concluída') {
      setConcluidasNaSessaoHoje((prev) => Math.max(0, prev - 1));
      setConcluidasNaSessaoSemana((prev) => Math.max(0, prev - 1));
    }

    const rotinaAtualizada = {
      ...rotina,
      status: novoStatus,
      anotacaoBloqueio: anotacaoAtual,
      observacaoColaborador: anotacaoAtual,
      dataConclusao: novoStatus === 'Concluída' ? hojeIso : rotina?.dataConclusao
    };

    setRotinas((prev) =>
      prev.map((item, idx) =>
        String(obterIdRotina(item) ?? idx) === chaveLinha ? rotinaAtualizada : item
      )
    );

    if (id === undefined) return;

    setSalvandoId(id);
    setFeedback(null);

    try {
      const ok = await persistirAtualizacaoRotina(rotinaAtualizada, id);
      if (!ok) {
        throw new Error('Falha ao persistir status');
      }

      setFeedback({
        tipo: 'ok',
        texto: `Rotina "${obterTituloRotina(rotina)}" marcada como "${novoStatus}".`
      });
    } catch (err) {
      console.error('Erro ao salvar status:', err);
      setFeedback({
        tipo: 'info',
        texto: 'Alteração aplicada na tela; verifique a conexão com a API para persistir.'
      });
    } finally {
      setSalvandoId(null);
    }
  };

  const salvarAnotacaoBloqueio = async (rotina: any, chaveLinha: string) => {
    const id = obterIdRotina(rotina);
    const textoNota = (rascunhosBloqueio[chaveLinha] ?? '').trim();

    const rotinaAtualizada = {
      ...rotina,
      anotacaoBloqueio: textoNota,
      observacaoColaborador: textoNota
    };

    setRotinas((prev) =>
      prev.map((item, idx) =>
        String(obterIdRotina(item) ?? idx) === chaveLinha ? rotinaAtualizada : item
      )
    );

    if (id === undefined) return;

    setSalvandoId(id);
    setFeedback(null);

    try {
      const ok = await persistirAtualizacaoRotina(rotinaAtualizada, id);
      if (!ok) {
        throw new Error('Falha ao salvar anotação');
      }

      setFeedback({
        tipo: 'ok',
        texto: textoNota
          ? `Anotação registrada em "${obterTituloRotina(rotina)}" visível ao gestor.`
          : `Anotação removida de "${obterTituloRotina(rotina)}".`
      });
    } catch (err) {
      console.error('Erro ao salvar anotação de bloqueio:', err);
      setFeedback({
        tipo: 'info',
        texto: 'Anotação atualizada na tela; verifique a API para persistir no banco.'
      });
    } finally {
      setSalvandoId(null);
    }
  };

  const encerrarSessao = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('perfil');
      localStorage.removeItem('idUsuario');
      localStorage.removeItem('usuario');
      localStorage.removeItem('user');
      localStorage.removeItem('sessao');
      sessionStorage.clear();
    } catch (err) {
      console.error('Erro ao encerrar sessão:', err);
    }

    navigate(loginRoute || '/', { replace: true });
  };

  const rotinasDoColaborador = useMemo(() => {
    return rotinas.filter((r) => {
      const resp = obterInfoResponsavel(r);
      const bateId = Boolean(sessaoInfo.idUsuario && resp.id && resp.id === sessaoInfo.idUsuario);
      const bateNome = Boolean(
        sessaoInfo.nomeUsuario && resp.nome && resp.nome === sessaoInfo.nomeUsuario
      );
      const bateEmail = Boolean(
        sessaoInfo.emailUsuario && resp.email && resp.email === sessaoInfo.emailUsuario
      );
      return bateId || bateNome || bateEmail;
    });
  }, [rotinas, sessaoInfo]);

  const competenciasDisponiveis = useMemo(() => {
    const setComp = new Set<string>();
    for (const r of rotinasDoColaborador) {
      setComp.add(obterCompetenciaRotina(r));
    }
    return Array.from(setComp).sort((a, b) => b.localeCompare(a));
  }, [rotinasDoColaborador]);

  const resumo = useMemo(() => {
    let pendentes = 0;
    let andamento = 0;
    let concluidas = 0;
    let vencidas = 0;
    let proximas = 0;
    let bloqueadas = 0;
    let concluidasHojeApi = 0;
    let concluidasSemanaApi = 0;

    const hojeIso = toIsoDateLocal(new Date());
    const inicioSemanaIso = obterInicioSemanaIso(hojeIso);

    for (const r of rotinasDoColaborador) {
      const st = normalizarStatus(r?.status);
      const isoVenc = obterDataIsoVencimento(r);
      const urg = classificarUrgencia(st, isoVenc, hojeIso);
      const nota = obterAnotacaoBloqueio(r);

      if (nota) bloqueadas += 1;

      if (st === 'Concluída') {
        concluidas += 1;
        const isoConclusao = obterDataIsoConclusao(r);
        if (isoConclusao) {
          if (isoConclusao === hojeIso) concluidasHojeApi += 1;
          if (isoConclusao >= inicioSemanaIso && isoConclusao <= hojeIso) concluidasSemanaApi += 1;
        }
      } else if (st === 'Em Andamento') {
        andamento += 1;
      } else {
        pendentes += 1;
      }

      if (urg === 'VENCIDA') vencidas += 1;
      if (urg === 'PROXIMA') proximas += 1;
    }

    return {
      total: rotinasDoColaborador.length,
      pendentes,
      andamento,
      concluidas,
      vencidas,
      proximas,
      bloqueadas,
      concluidasHoje: Math.max(concluidasHojeApi, concluidasNaSessaoHoje),
      concluidasSemana: Math.max(concluidasSemanaApi, concluidasNaSessaoSemana)
    };
  }, [rotinasDoColaborador, concluidasNaSessaoHoje, concluidasNaSessaoSemana]);

  const rotinasFiltradasEOrdenadas = useMemo(() => {
    const termo = normalizarTexto(pesquisa);
    const hojeIso = toIsoDateLocal(new Date());

    const listaFiltrada = rotinasDoColaborador.filter((rotina) => {
      const statusAtual = normalizarStatus(rotina?.status);
      const competenciaAtual = obterCompetenciaRotina(rotina);
      const isoVenc = obterDataIsoVencimento(rotina);
      const urg = classificarUrgencia(statusAtual, isoVenc, hojeIso);

      if (filtroStatus !== 'TODOS' && statusAtual !== filtroStatus) return false;
      if (filtroCompetencia !== 'TODAS' && competenciaAtual !== filtroCompetencia) return false;

      if (filtroUrgencia === 'VENCIDAS' && urg !== 'VENCIDA') return false;
      if (filtroUrgencia === 'PROXIMAS' && urg !== 'PROXIMA') return false;
      if (filtroUrgencia === 'NO_PRAZO' && urg !== 'NO_PRAZO') return false;

      if (!termo) return true;

      const empresa = normalizarTexto(obterNomeEmpresa(rotina));
      const titulo = normalizarTexto(obterTituloRotina(rotina));
      const desc = normalizarTexto(obterDescricaoRotina(rotina));
      const comp = normalizarTexto(competenciaAtual);
      const nota = normalizarTexto(obterAnotacaoBloqueio(rotina));
      return (
        empresa.includes(termo) ||
        titulo.includes(termo) ||
        desc.includes(termo) ||
        comp.includes(termo) ||
        nota.includes(termo)
      );
    });

    const pesoUrgencia = (urg: ReturnType<typeof classificarUrgencia>) => {
      if (urg === 'VENCIDA') return 1;
      if (urg === 'PROXIMA') return 2;
      if (urg === 'NO_PRAZO') return 3;
      return 4;
    };

    const pesoStatus = (st: 'Pendente' | 'Em Andamento' | 'Concluída') => {
      if (st === 'Pendente') return 1;
      if (st === 'Em Andamento') return 2;
      return 3;
    };

    return [...listaFiltrada].sort((a, b) => {
      const stA = normalizarStatus(a?.status);
      const stB = normalizarStatus(b?.status);
      const vencA = obterDataIsoVencimento(a) || '9999-12-31';
      const vencB = obterDataIsoVencimento(b) || '9999-12-31';
      const urgA = classificarUrgencia(stA, obterDataIsoVencimento(a), hojeIso);
      const urgB = classificarUrgencia(stB, obterDataIsoVencimento(b), hojeIso);

      if (ordenacao === 'urgencia') {
        const diffUrg = pesoUrgencia(urgA) - pesoUrgencia(urgB);
        if (diffUrg !== 0) return diffUrg;
        return vencA.localeCompare(vencB);
      }

      if (ordenacao === 'vencimento') {
        const diffVenc = vencA.localeCompare(vencB);
        if (diffVenc !== 0) return diffVenc;
        return pesoUrgencia(urgA) - pesoUrgencia(urgB);
      }

      if (ordenacao === 'empresa') {
        return obterNomeEmpresa(a).localeCompare(obterNomeEmpresa(b), 'pt-BR');
      }

      const diffSt = pesoStatus(stA) - pesoStatus(stB);
      if (diffSt !== 0) return diffSt;
      return vencA.localeCompare(vencB);
    });
  }, [rotinasDoColaborador, pesquisa, filtroStatus, filtroCompetencia, filtroUrgencia, ordenacao]);

  const hojeIso = toIsoDateLocal(new Date());
  const temFiltroAtivo = Boolean(
    pesquisa.trim() ||
      filtroStatus !== 'TODOS' ||
      filtroCompetencia !== 'TODAS' ||
      filtroUrgencia !== 'TODAS'
  );

  return (
    <div className="colab-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #090e17;
          color: #f8fafc;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        .colab-shell {
          display: flex;
          min-height: 100vh;
          background: radial-gradient(circle at top right, rgba(37, 99, 235, 0.08), transparent 42%), #090e17;
        }

        .colab-sidebar {
          width: 256px;
          background: #0d1421;
          border-right: 1px solid rgba(148, 163, 184, 0.14);
          padding: 24px 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          flex-shrink: 0;
          position: sticky;
          top: 0;
          height: 100vh;
        }

        .colab-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
          padding: 0 6px 18px 6px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.12);
        }

        .colab-brand-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
        }

        .colab-brand-title {
          margin: 0;
          font-size: 16px;
          line-height: 1.25;
          font-weight: 700;
          color: #f8fafc;
        }

        .colab-brand-sub {
          display: block;
          font-size: 11px;
          color: #64748b;
          margin-top: 2px;
        }

        .colab-nav-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 11px 14px;
          border-radius: 10px;
          border: 1px solid rgba(59, 130, 246, 0.35);
          background: linear-gradient(90deg, rgba(37, 99, 235, 0.25) 0%, rgba(37, 99, 235, 0.1) 100%);
          color: #ffffff;
          font-size: 13.5px;
          font-weight: 600;
          text-align: left;
          cursor: pointer;
        }

        .colab-nav-pill {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 999px;
          background: rgba(59, 130, 246, 0.32);
          color: #bfdbfe;
        }

        .colab-ritmo-box {
          margin-top: 16px;
          background: #111927;
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 12px;
          padding: 14px;
        }

        .colab-ritmo-titulo {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #94a3b8;
          margin-bottom: 10px;
        }

        .colab-ritmo-linha {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12.5px;
          color: #cbd5e1;
          padding: 5px 0;
        }

        .colab-footer-box {
          background: #111927;
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 12px;
          padding: 12px;
        }

        .colab-footer-label {
          font-size: 11.5px;
          color: #94a3b8;
          margin-bottom: 10px;
          word-break: break-word;
          font-weight: 500;
        }

        .colab-logout-btn {
          width: 100%;
          padding: 9px 12px;
          border-radius: 8px;
          border: 1px solid rgba(239, 68, 68, 0.32);
          background: rgba(239, 68, 68, 0.14);
          color: #fca5a5;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .colab-logout-btn:hover {
          background: #ef4444;
          color: #ffffff;
        }

        .colab-main {
          flex: 1;
          padding: 32px 36px;
          min-width: 0;
          max-width: 1520px;
        }

        .colab-header {
          margin-bottom: 22px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 16px;
          flex-wrap: wrap;
        }

        .colab-kicker {
          font-size: 11.5px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #38bdf8;
          margin-bottom: 4px;
        }

        .colab-title {
          margin: 0 0 6px 0;
          font-size: 25px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #f8fafc;
        }

        .colab-subtitle {
          margin: 0;
          font-size: 13.5px;
          color: #94a3b8;
        }

        .colab-header-actions {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .colab-concluidas-badge-box {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #111927;
          border: 1px solid rgba(34, 197, 94, 0.28);
          border-radius: 10px;
          padding: 8px 14px;
          font-size: 12.5px;
          color: #cbd5e1;
        }

        .colab-action-btn {
          padding: 9px 14px;
          border-radius: 9px;
          border: 1px solid rgba(148, 163, 184, 0.22);
          background: #111927;
          color: #e2e8f0;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .colab-action-btn:hover {
          border-color: #60a5fa;
          color: #fff;
        }

        .colab-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 18px;
        }

        .colab-kpi-card {
          background: #111927;
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 12px;
          padding: 16px 18px;
          text-align: left;
          cursor: pointer;
          transition: all 0.15s ease;
          position: relative;
          overflow: hidden;
        }

        .colab-kpi-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background: var(--kpi-cor, #3b82f6);
        }

        .colab-kpi-card:hover {
          border-color: rgba(148, 163, 184, 0.35);
          transform: translateY(-1px);
        }

        .colab-kpi-card.selecionado {
          border-color: #60a5fa;
          box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.2);
        }

        .colab-kpi-label {
          font-size: 11.5px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .colab-kpi-num {
          font-family: 'JetBrains Mono', monospace;
          font-size: 24px;
          font-weight: 700;
          margin-top: 6px;
          color: #f8fafc;
        }

        .colab-urgencia-bar {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 18px;
        }

        .urg-chip {
          padding: 7px 13px;
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, 0.2);
          background: #111927;
          color: #cbd5e1;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .urg-chip:hover {
          border-color: rgba(148, 163, 184, 0.45);
          color: #fff;
        }

        .urg-chip.ativo {
          background: rgba(37, 99, 235, 0.22);
          border-color: #60a5fa;
          color: #fff;
        }

        .colab-panel {
          background: #111927;
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 14px;
          padding: 20px 24px;
          margin-bottom: 22px;
          box-shadow: 0 10px 26px -12px rgba(0, 0, 0, 0.55);
        }

        .colab-toolbar {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .colab-search {
          flex: 1;
          min-width: 220px;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: #0b111e;
          color: #f8fafc;
          font-size: 13.5px;
          outline: none;
          transition: border-color 0.15s ease;
        }

        .colab-search:focus {
          border-color: #3b82f6;
        }

        .colab-search::placeholder {
          color: #64748b;
        }

        .colab-select {
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid rgba(148, 163, 184, 0.22);
          background: #0b111e;
          color: #f8fafc;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          outline: none;
        }

        .colab-select:focus {
          border-color: #3b82f6;
        }

        .colab-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 18px;
          padding-bottom: 14px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.12);
        }

        .colab-section-title {
          margin: 0;
          font-size: 17px;
          font-weight: 700;
          color: #f8fafc;
        }

        .colab-table-wrap {
          overflow-x: auto;
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 12px;
          background: #0b111e;
        }

        .colab-table {
          width: 100%;
          border-collapse: collapse;
        }

        .colab-table th {
          text-align: left;
          padding: 13px 16px;
          font-size: 11.5px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #94a3b8;
          background: #0d1424;
          border-bottom: 1px solid rgba(148, 163, 184, 0.14);
        }

        .colab-table td {
          padding: 15px 16px;
          font-size: 13.5px;
          color: #e2e8f0;
          border-bottom: 1px solid rgba(148, 163, 184, 0.08);
          vertical-align: top;
        }

        .colab-table tr:last-child td {
          border-bottom: none;
        }

        .colab-table tbody tr:hover {
          background: rgba(30, 41, 59, 0.35);
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          padding: 4px 11px;
          border-radius: 999px;
          font-size: 11.5px;
          font-weight: 600;
        }

        .status-concluida {
          background: rgba(34, 197, 94, 0.15);
          color: #4ade80;
          border: 1px solid rgba(34, 197, 94, 0.35);
        }

        .status-andamento {
          background: rgba(245, 158, 11, 0.15);
          color: #fbbf24;
          border: 1px solid rgba(245, 158, 11, 0.35);
        }

        .status-pendente {
          background: rgba(239, 68, 68, 0.15);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.35);
        }

        .urg-badge {
          display: inline-block;
          margin-left: 8px;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 10.5px;
          font-weight: 600;
        }

        .urg-badge.vencida {
          background: rgba(239, 68, 68, 0.16);
          color: #fca5a5;
          border: 1px solid rgba(239, 68, 68, 0.35);
        }

        .urg-badge.proxima {
          background: rgba(245, 158, 11, 0.16);
          color: #fcd34d;
          border: 1px solid rgba(245, 158, 11, 0.35);
        }

        .bloqueio-box {
          display: flex;
          gap: 6px;
          align-items: center;
          min-width: 240px;
        }

        .bloqueio-input {
          flex: 1;
          padding: 7px 10px;
          border-radius: 8px;
          border: 1px solid rgba(148, 163, 184, 0.22);
          background: #111927;
          color: #f8fafc;
          font-size: 12px;
          outline: none;
        }

        .bloqueio-input:focus {
          border-color: #fbbf24;
        }

        .bloqueio-input::placeholder {
          color: #64748b;
        }

        .btn-salvar-nota {
          padding: 7px 10px;
          border-radius: 8px;
          border: 1px solid rgba(251, 191, 36, 0.35);
          background: rgba(245, 158, 11, 0.14);
          color: #fde68a;
          font-size: 11.5px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
        }

        .btn-salvar-nota:hover:not(:disabled) {
          background: rgba(245, 158, 11, 0.28);
          color: #fff;
        }

        .btn-salvar-nota:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .acoes-cell {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .btn-acao-rapida {
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid rgba(34, 197, 94, 0.38);
          background: rgba(34, 197, 94, 0.15);
          color: #86efac;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-acao-rapida:hover:not(:disabled) {
          background: #22c55e;
          color: #052e16;
        }

        .btn-acao-rapida.reabrir {
          border-color: rgba(148, 163, 184, 0.3);
          background: rgba(148, 163, 184, 0.12);
          color: #cbd5e1;
        }

        .btn-acao-rapida.reabrir:hover:not(:disabled) {
          background: rgba(148, 163, 184, 0.25);
          color: #fff;
        }

        .btn-acao-rapida:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .mono {
          font-family: 'JetBrains Mono', monospace;
        }

        .colab-feedback {
          margin-bottom: 18px;
          padding: 11px 16px;
          border-radius: 10px;
          font-size: 13px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .colab-feedback.ok {
          background: rgba(34, 197, 94, 0.12);
          border: 1px solid rgba(34, 197, 94, 0.32);
          color: #86efac;
        }

        .colab-feedback.info {
          background: rgba(37, 99, 235, 0.15);
          border: 1px solid rgba(96, 165, 250, 0.32);
          color: #bfdbfe;
        }

        .colab-feedback.erro {
          background: rgba(239, 68, 68, 0.14);
          border: 1px solid rgba(239, 68, 68, 0.35);
          color: #fca5a5;
        }

        @media (max-width: 980px) {
          .colab-kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .colab-shell {
            flex-direction: column;
          }
          .colab-sidebar {
            width: 100%;
            height: auto;
            position: static;
          }
        }
      `}</style>

      <aside className="colab-sidebar">
        <div>
          <div className="colab-brand">
            <div className="colab-brand-icon">AC</div>
            <div>
              <h2 className="colab-brand-title">Ativa Contábil</h2>
              <span className="colab-brand-sub">Painel do Colaborador</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setFiltroStatus('TODOS');
              setFiltroCompetencia('TODAS');
              setFiltroUrgencia('TODAS');
              setPesquisa('');
            }}
            className="colab-nav-btn"
          >
            <span>📋 Minhas Tarefas</span>
            <span className="colab-nav-pill">{resumo.total}</span>
          </button>

          <div className="colab-ritmo-box">
            <div className="colab-ritmo-titulo">Concluídas no Período</div>
            <div className="colab-ritmo-linha">
              <span>Hoje</span>
              <strong className="mono" style={{ color: '#4ade80' }}>
                {resumo.concluidasHoje}
              </strong>
            </div>
            <div className="colab-ritmo-linha">
              <span>Nesta semana</span>
              <strong className="mono" style={{ color: '#38bdf8' }}>
                {resumo.concluidasSemana}
              </strong>
            </div>
            <div className="colab-ritmo-linha">
              <span>Com bloqueio/nota</span>
              <strong className="mono" style={{ color: '#fbbf24' }}>
                {resumo.bloqueadas}
              </strong>
            </div>
          </div>
        </div>

        <div className="colab-footer-box">
          <div className="colab-footer-label">
            Área Operacional{sessaoInfo.nomeExibicao ? ` • ${sessaoInfo.nomeExibicao}` : ''}
          </div>
          <button type="button" onClick={encerrarSessao} className="colab-logout-btn">
            Encerrar Sessão 🚪
          </button>
        </div>
      </aside>

      <main className="colab-main">
        <header className="colab-header">
          <div>
            <div className="colab-kicker">Ativa Contábil / Área Operacional</div>
            <h1 className="colab-title">Execução de Rotinas Fiscais</h1>
            <p className="colab-subtitle">
              Acompanhe suas obrigações atribuídas, registre bloqueios para o gestor e atualize o status.
            </p>
          </div>

          <div className="colab-header-actions">
            <div className="colab-concluidas-badge-box">
              <span>
                Concluídas hoje: <strong className="mono" style={{ color: '#4ade80' }}>{resumo.concluidasHoje}</strong>
              </span>
              <span>•</span>
              <span>
                Na semana: <strong className="mono" style={{ color: '#38bdf8' }}>{resumo.concluidasSemana}</strong>
              </span>
            </div>

            <button type="button" onClick={carregarRotinas} className="colab-action-btn">
              🔄 Atualizar
            </button>
          </div>
        </header>

        {feedback && (
          <div className={`colab-feedback ${feedback.tipo}`}>
            <span>{feedback.texto}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                fontWeight: 700
              }}
            >
              ✕
            </button>
          </div>
        )}

        <section className="colab-kpi-grid">
          <button
            type="button"
            onClick={() => setFiltroStatus('TODOS')}
            className={`colab-kpi-card ${filtroStatus === 'TODOS' ? 'selecionado' : ''}`}
            style={{ '--kpi-cor': '#38bdf8' } as React.CSSProperties}
          >
            <div className="colab-kpi-label">Minhas Tarefas</div>
            <div className="colab-kpi-num">{resumo.total}</div>
          </button>

          <button
            type="button"
            onClick={() => setFiltroStatus('Pendente')}
            className={`colab-kpi-card ${filtroStatus === 'Pendente' ? 'selecionado' : ''}`}
            style={{ '--kpi-cor': '#ef4444' } as React.CSSProperties}
          >
            <div className="colab-kpi-label">Pendentes</div>
            <div className="colab-kpi-num" style={{ color: '#f87171' }}>
              {resumo.pendentes}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setFiltroStatus('Em Andamento')}
            className={`colab-kpi-card ${filtroStatus === 'Em Andamento' ? 'selecionado' : ''}`}
            style={{ '--kpi-cor': '#f59e0b' } as React.CSSProperties}
          >
            <div className="colab-kpi-label">Em Andamento</div>
            <div className="colab-kpi-num" style={{ color: '#fbbf24' }}>
              {resumo.andamento}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setFiltroStatus('Concluída')}
            className={`colab-kpi-card ${filtroStatus === 'Concluída' ? 'selecionado' : ''}`}
            style={{ '--kpi-cor': '#22c55e' } as React.CSSProperties}
          >
            <div className="colab-kpi-label">Concluídas</div>
            <div className="colab-kpi-num" style={{ color: '#4ade80' }}>
              {resumo.concluidas}
            </div>
          </button>
        </section>

        <div className="colab-urgencia-bar">
          <button
            type="button"
            onClick={() => setFiltroUrgencia('TODAS')}
            className={`urg-chip ${filtroUrgencia === 'TODAS' ? 'ativo' : ''}`}
          >
            Todas as urgências ({resumo.total})
          </button>
          <button
            type="button"
            onClick={() => setFiltroUrgencia('VENCIDAS')}
            className={`urg-chip ${filtroUrgencia === 'VENCIDAS' ? 'ativo' : ''}`}
          >
            🔴 Vencidas ({resumo.vencidas})
          </button>
          <button
            type="button"
            onClick={() => setFiltroUrgencia('PROXIMAS')}
            className={`urg-chip ${filtroUrgencia === 'PROXIMAS' ? 'ativo' : ''}`}
          >
            🟡 Vencem hoje / próx. 3 dias ({resumo.proximas})
          </button>
          <button
            type="button"
            onClick={() => setFiltroUrgencia('NO_PRAZO')}
            className={`urg-chip ${filtroUrgencia === 'NO_PRAZO' ? 'ativo' : ''}`}
          >
            🔵 No prazo
          </button>
        </div>

        <section className="colab-panel">
          <div className="colab-toolbar">
            <input
              type="text"
              placeholder="🔍 Pesquisar por empresa, obrigação, bloqueio ou observação..."
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              className="colab-search"
            />

            <select
              value={filtroCompetencia}
              onChange={(e) => setFiltroCompetencia(e.target.value)}
              className="colab-select"
              title="Filtrar por competência (mês/ano)"
            >
              <option value="TODAS">Todas as competências</option>
              {competenciasDisponiveis.map((comp) => (
                <option key={comp} value={comp}>
                  Competência: {comp}
                </option>
              ))}
            </select>

            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="colab-select"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="Pendente">Pendente</option>
              <option value="Em Andamento">Em Andamento</option>
              <option value="Concluída">Concluída</option>
            </select>

            <select
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value as OrdenacaoModo)}
              className="colab-select"
              title="Ordenar obrigações"
            >
              <option value="urgencia">Ordenar: Urgência inteligente</option>
              <option value="vencimento">Ordenar: Data de vencimento</option>
              <option value="empresa">Ordenar: Empresa (A–Z)</option>
              <option value="status">Ordenar: Status</option>
            </select>

            {temFiltroAtivo && (
              <button
                type="button"
                onClick={() => {
                  setPesquisa('');
                  setFiltroStatus('TODOS');
                  setFiltroCompetencia('TODAS');
                  setFiltroUrgencia('TODAS');
                }}
                className="colab-action-btn"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </section>

        <section className="colab-panel">
          <div className="colab-section-header">
            <h2 className="colab-section-title">
              Lista de Obrigações Atribuídas ({rotinasFiltradasEOrdenadas.length})
            </h2>
            {resumo.vencidas > 0 && (
              <span className="status-pill status-pendente">
                ⚠️ {resumo.vencidas} rotina(s) vencida(s)
              </span>
            )}
          </div>

          {carregando ? (
            <p style={{ color: '#94a3b8', margin: 0 }}>Carregando rotinas...</p>
          ) : rotinasFiltradasEOrdenadas.length === 0 ? (
            <p style={{ color: '#94a3b8', margin: 0 }}>
              Nenhuma obrigação atribuída encontrada para os filtros atuais.
            </p>
          ) : (
            <div className="colab-table-wrap">
              <table className="colab-table">
                <thead>
                  <tr>
                    <th>Empresa Cliente</th>
                    <th>Obrigação / Rotina</th>
                    <th>Competência</th>
                    <th>Vencimento</th>
                    <th>Status Atual</th>
                    <th>Bloqueio / Pendência</th>
                    <th>Ações Operacionais</th>
                  </tr>
                </thead>
                <tbody>
                  {rotinasFiltradasEOrdenadas.map((rotina, index) => {
                    const id = obterIdRotina(rotina);
                    const chaveLinha = String(id ?? index);
                    const statusAtual = normalizarStatus(rotina?.status);
                    const descricao = obterDescricaoRotina(rotina);
                    const competencia = obterCompetenciaRotina(rotina);
                    const isoVenc = obterDataIsoVencimento(rotina);
                    const urg = classificarUrgencia(statusAtual, isoVenc, hojeIso);
                    const notaSalva = obterAnotacaoBloqueio(rotina);
                    const rascunhoAtual = rascunhosBloqueio[chaveLinha] ?? notaSalva;
                    const notaAlterada = rascunhoAtual.trim() !== notaSalva;

                    const classeStatus =
                      statusAtual === 'Concluída'
                        ? 'status-concluida'
                        : statusAtual === 'Em Andamento'
                        ? 'status-andamento'
                        : 'status-pendente';

                    return (
                      <tr key={chaveLinha}>
                        <td style={{ fontWeight: 600, color: '#f8fafc' }}>{obterNomeEmpresa(rotina)}</td>
                        <td>
                          <div style={{ color: '#e2e8f0', fontWeight: 500 }}>{obterTituloRotina(rotina)}</div>
                          {descricao && (
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                              {descricao}
                            </div>
                          )}
                        </td>
                        <td className="mono" style={{ color: '#cbd5e1', fontSize: '12px' }}>
                          {competencia}
                        </td>
                        <td
                          className="mono"
                          style={{
                            color: urg === 'VENCIDA' ? '#fca5a5' : urg === 'PROXIMA' ? '#fcd34d' : '#94a3b8',
                            fontSize: '12.5px'
                          }}
                        >
                          {formatarDataVencimento(rotina)}
                          {urg === 'VENCIDA' && <span className="urg-badge vencida">Vencida</span>}
                          {urg === 'PROXIMA' && <span className="urg-badge proxima">Urgente</span>}
                        </td>
                        <td>
                          <span className={`status-pill ${classeStatus}`}>{statusAtual}</span>
                        </td>
                        <td>
                          <div className="bloqueio-box">
                            <input
                              type="text"
                              placeholder="Ex: Aguardando XML do cliente..."
                              value={rascunhoAtual}
                              onChange={(e) =>
                                setRascunhosBloqueio((prev) => ({
                                  ...prev,
                                  [chaveLinha]: e.target.value
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  salvarAnotacaoBloqueio(rotina, chaveLinha);
                                }
                              }}
                              className="bloqueio-input"
                            />
                            <button
                              type="button"
                              disabled={salvandoId === id || (!notaAlterada && !rascunhoAtual.trim())}
                              onClick={() => salvarAnotacaoBloqueio(rotina, chaveLinha)}
                              className="btn-salvar-nota"
                              title="Salvar anotação para o gestor"
                            >
                              {notaAlterada ? 'Salvar nota' : notaSalva ? 'Salvo' : 'Anotar'}
                            </button>
                          </div>
                          {notaSalva && (
                            <div style={{ fontSize: '11.5px', color: '#fbbf24', marginTop: '4px' }}>
                              🚧 Nota ativa: {notaSalva}
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="acoes-cell">
                            {statusAtual !== 'Concluída' ? (
                              <button
                                type="button"
                                disabled={salvandoId === id}
                                onClick={() => alterarStatusRotina(rotina, 'Concluída', chaveLinha)}
                                className="btn-acao-rapida"
                                title="Marcar obrigação como concluída rapidamente"
                              >
                                ✓ Concluir
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={salvandoId === id}
                                onClick={() => alterarStatusRotina(rotina, 'Em Andamento', chaveLinha)}
                                className="btn-acao-rapida reabrir"
                                title="Mover de volta para Em Andamento"
                              >
                                ↩ Reabrir
                              </button>
                            )}

                            <select
                              value={statusAtual}
                              disabled={salvandoId === id}
                              onChange={(e) => alterarStatusRotina(rotina, e.target.value, chaveLinha)}
                              className="colab-select"
                              style={{ minWidth: '138px', padding: '7px 10px' }}
                            >
                              <option value="Pendente">Pendente</option>
                              <option value="Em Andamento">Em Andamento</option>
                              <option value="Concluída">Concluída</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default ColaboradorDashboard;