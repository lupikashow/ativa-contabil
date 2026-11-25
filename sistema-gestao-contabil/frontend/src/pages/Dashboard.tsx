import React, { useState, useEffect, useMemo } from 'react';

type PeriodicidadeRecorrencia = 'MENSAL' | 'QUINZENAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';

interface RegistroAuditoria {
  id: string;
  dataHora: string;
  acao: 'CRIAÇÃO' | 'CRIAÇÃO EM LOTE' | 'EDIÇÃO' | 'CONCLUSÃO' | 'ALTERAÇÃO DE STATUS' | 'EXCLUSÃO' | 'SESSÃO';
  usuario: string;
  detalhes: string;
}

interface LoteRegistrado {
  idLote: string;
  tipoObrigacao: 'EVENTUAL' | 'RECORRENTE';
  periodicidade?: PeriodicidadeRecorrencia;
  titulo: string;
  descricao: string;
  dataVencimento: string;
  datasGeradas?: string[];
  diaBaseVencimento: string;
  departamento: string;
  colaboradorId: string;
  colaboradorNome: string;
  status: string;
  empresaIds: string[];
  criadoEm: string;
}

interface DashboardProps {
  onLogout?: () => void;
  loginRoute?: string;
}

const LABELS_PERIODICIDADE: Record<PeriodicidadeRecorrencia, string> = {
  MENSAL: 'Mensal',
  QUINZENAL: 'Quinzenal',
  TRIMESTRAL: 'Trimestral',
  SEMESTRAL: 'Semestral',
  ANUAL: 'Anual'
};

export default function Dashboard({ onLogout, loginRoute = '/' }: DashboardProps) {
  const [abaAtiva, setAbaAtiva] = useState<
    'inicio' | 'colaboradores' | 'empresas' | 'rotinas' | 'matriz' | 'auditoria' | 'lote'
  >('inicio');

  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [rotinas, setRotinas] = useState<any[]>([]);
  const [notasExternasPorRotina, setNotasExternasPorRotina] = useState<Record<string, string>>({});
  const [lotesCriados, setLotesCriados] = useState<LoteRegistrado[]>([]);
  const [logsAuditoria, setLogsAuditoria] = useState<RegistroAuditoria[]>([]);

  // Edição de Lote
  const [editandoLoteId, setEditandoLoteId] = useState<string | null>(null);

  // Estados de Edição
  const [editandoEmpresaId, setEditandoEmpresaId] = useState<number | string | null>(null);
  const [editandoColabId, setEditandoColabId] = useState<number | string | null>(null);
  const [editandoRotinaId, setEditandoRotinaId] = useState<number | string | null>(null);

  // Estados de Filtros (Cronograma)
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const [filtroColaborador, setFiltroColaborador] = useState('');
  const [apenasComBloqueio, setApenasComBloqueio] = useState(false);
  const [buscaEmpresa, setBuscaEmpresa] = useState('');

  // Estados de Filtro da Matriz de Competência
  const mesAtualPadrao = new Date().toISOString().slice(0, 7);
  const [competenciaMatriz, setCompetenciaMatriz] = useState(mesAtualPadrao);
  const [filtroMatrizColaborador, setFiltroMatrizColaborador] = useState('');
  const [filtroMatrizEmpresa, setFiltroMatrizEmpresa] = useState('');
  const [filtroMatrizStatus, setFiltroMatrizStatus] = useState('');

  // Formulários
  const [novoColaborador, setNovoColaborador] = useState({ nome: '', email: '', senha: '', perfil: 'COLABORADOR' });
  const [novaEmpresa, setNovaEmpresa] = useState({ nome: '', cnpj: '', tipo: 'MEI', responsavel: '' });
  const [novaRotina, setNovaRotina] = useState({
    titulo: '',
    descricao: '',
    anotacaoBloqueio: '',
    dataVencimento: '',
    empresaId: '',
    colaboradorId: '',
    status: 'Pendente'
  });

  // Estados da Atribuição em Lote (Tarefa Eventual x Rotina Recorrente)
  const [loteForm, setLoteForm] = useState({
    tipoObrigacao: 'EVENTUAL' as 'EVENTUAL' | 'RECORRENTE',
    periodicidade: 'MENSAL' as PeriodicidadeRecorrencia,
    titulo: '',
    descricao: '',
    dataVencimento: '',
    diaBaseVencimento: '20',
    departamento: 'Fiscal',
    colaboradorId: '',
    status: 'Pendente'
  });
  const [empresasSelecionadasLote, setEmpresasSelecionadasLote] = useState<string[]>([]);
  const [enviandoLote, setEnviandoLote] = useState(false);

  const apiBase = 'http://localhost:3000';
  const atorAtual = 'Administrador (Gestor)';

  // --- HELPERS PARA RESOLVER IDs E NOMES DE COLABORADOR / EMPRESA / BLOQUEIOS ---
  const normalizarTexto = (valor?: unknown): string =>
    String(valor ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  const extrairTextoNota = (valor: unknown, profundidade = 0): string => {
    if (!valor || profundidade > 4) return '';
    if (typeof valor === 'string' || typeof valor === 'number') {
      return String(valor).trim();
    }
    if (Array.isArray(valor)) {
      return valor
        .map((item) => extrairTextoNota(item, profundidade + 1))
        .filter(Boolean)
        .join(' | ');
    }
    if (typeof valor === 'object') {
      const obj = valor as Record<string, unknown>;
      const chavesPrioritarias = [
        'anotacaoBloqueio',
        'anotacao_bloqueio',
        'motivoBloqueio',
        'motivo_bloqueio',
        'observacaoColaborador',
        'observacao_colaborador',
        'notaColaborador',
        'nota_colaborador',
        'anotacaoColaborador',
        'anotacao_colaborador',
        'texto',
        'conteudo',
        'anotacao',
        'nota',
        'observacao',
        'obs',
        'justificativa',
        'pendencia',
        'motivo',
        'descricao',
        'mensagem',
        'comentario'
      ];

      for (const chave of chavesPrioritarias) {
        if (chave in obj && obj[chave] !== undefined && obj[chave] !== null && obj[chave] !== '') {
          const texto = extrairTextoNota(obj[chave], profundidade + 1);
          if (texto) return texto;
        }
      }
    }
    return '';
  };

  const buscarCampoNotaEmObjeto = (obj: any, profundidade = 0): string => {
    if (!obj || typeof obj !== 'object' || profundidade > 3) return '';

    const chavesAlvo = [
      'anotacaoBloqueio',
      'anotacao_bloqueio',
      'motivoBloqueio',
      'motivo_bloqueio',
      'bloqueio',
      'observacaoColaborador',
      'observacao_colaborador',
      'notaColaborador',
      'nota_colaborador',
      'anotacaoColaborador',
      'anotacao_colaborador',
      'nota',
      'notas',
      'anotacao',
      'anotacoes',
      'justificativa',
      'pendencia',
      'motivoPendencia',
      'observacao',
      'observacoes',
      'obs',
      'comentario',
      'comentarios',
      'historicoNotas',
      'historico_notas'
    ];

    for (const chave of chavesAlvo) {
      if (chave in obj) {
        const extraido = extrairTextoNota(obj[chave], profundidade + 1);
        if (extraido) return extraido;
      }
    }

    const subObjetos = ['rotina', 'tarefa', 'obrigacao', 'dados', 'detalhes', 'item'];
    for (const sub of subObjetos) {
      if (sub in obj && obj[sub] && typeof obj[sub] === 'object') {
        const extraido = buscarCampoNotaEmObjeto(obj[sub], profundidade + 1);
        if (extraido) return extraido;
      }
    }

    return '';
  };

  const getRotinaIdUnico = (rot: any): string =>
    (rot?.idRotina ?? rot?.id_rotina ?? rot?.id ?? rot?.id_tarefa ?? rot?.rotinaId ?? rot?.rotina_id ?? '').toString();

  const obterAnotacaoBloqueio = (rotina: any): string => {
    if (!rotina || typeof rotina !== 'object') return '';
    const direto = buscarCampoNotaEmObjeto(rotina);
    if (direto) return direto;

    const idRot = getRotinaIdUnico(rotina);
    if (idRot && notasExternasPorRotina[idRot]) {
      return notasExternasPorRotina[idRot];
    }

    return '';
  };

  const carregarNotasComplementares = async (rotinasCarregadas: any[]) => {
    const mapa: Record<string, string> = {};
    const endpointsPossiveis = ['notas', 'bloqueios', 'observacoes'];

    const idsRotinas = new Map<string, string>();
    for (const r of rotinasCarregadas) {
      const id = getRotinaIdUnico(r);
      if (id) idsRotinas.set(id, id);
    }

    for (const ep of endpointsPossiveis) {
      try {
        const res = await fetch(`${apiBase}/${ep}`);
        if (!res.ok) continue;
        const data = await res.json();
        const lista = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];

        for (const item of lista) {
          if (!item || typeof item !== 'object') continue;
          const refId = (
            item.rotinaId ??
            item.rotina_id ??
            item.idRotina ??
            item.id_rotina ??
            item.tarefaId ??
            item.tarefa_id ??
            item.id_tarefa ??
            item.rotina?.idRotina ??
            item.rotina?.id ??
            ''
          ).toString();

          const textoNota =
            extrairTextoNota(item) ||
            String(
              item.texto ??
                item.conteudo ??
                item.nota ??
                item.anotacao ??
                item.observacao ??
                item.motivo ??
                item.descricao ??
                ''
            ).trim();

          if (refId && textoNota) {
            mapa[refId] = mapa[refId] ? `${mapa[refId]} | ${textoNota}` : textoNota;
          }
        }
      } catch {
        // Endpoint opcional não existente na API atual — ignora sem erro
      }
    }

    for (const rotId of idsRotinas.keys()) {
      if (mapa[rotId]) continue;
      try {
        const res = await fetch(`${apiBase}/rotinas/${rotId}/notas`);
        if (!res.ok) continue;
        const data = await res.json();
        const texto = extrairTextoNota(data);
        if (texto) mapa[rotId] = texto;
      } catch {
        // Ignora caso subrota não exista
      }
    }

    setNotasExternasPorRotina(mapa);
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const registrarAuditoria = (acao: RegistroAuditoria['acao'], detalhes: string) => {
    const novoLog: RegistroAuditoria = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      dataHora: new Date().toLocaleString('pt-BR'),
      acao,
      usuario: atorAtual,
      detalhes
    };
    setLogsAuditoria((prev) => [novoLog, ...prev]);
  };

  const encerrarSessao = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      localStorage.removeItem('sessao');
      localStorage.removeItem('perfil');
      sessionStorage.clear();
    } catch (e) {
      console.error('Erro ao limpar sessão:', e);
    }

    registrarAuditoria('SESSÃO', 'Sessão encerrada pelo Administrador.');

    if (typeof onLogout === 'function') {
      onLogout();
      return;
    }

    const destino = loginRoute || '/';
    if (window.location.pathname !== destino) {
      window.location.assign(destino);
    } else {
      window.location.reload();
    }
  };

  const carregarDados = async () => {
    try {
      const resColab = await fetch(`${apiBase}/usuarios`);
      if (resColab.ok) setColaboradores(await resColab.json());

      const resEmp = await fetch(`${apiBase}/empresas`);
      if (resEmp.ok) setEmpresas(await resEmp.json());

      const resRot = await fetch(`${apiBase}/rotinas`);
      if (resRot.ok) {
        const listaRotinas = await resRot.json();
        const arrayRotinas = Array.isArray(listaRotinas) ? listaRotinas : [];
        setRotinas(arrayRotinas);
        await carregarNotasComplementares(arrayRotinas);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    }
  };

  const formatarDataISO = (ano: number, mes1a12: number, dia: number): string => {
    const dataRef = new Date(ano, mes1a12 - 1, 1);
    const ultimoDiaDoMes = new Date(dataRef.getFullYear(), dataRef.getMonth() + 1, 0).getDate();
    const diaAjustado = Math.min(ultimoDiaDoMes, Math.max(1, dia));
    const y = String(dataRef.getFullYear()).padStart(4, '0');
    const m = String(dataRef.getMonth() + 1).padStart(2, '0');
    const d = String(diaAjustado).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const gerarDatasRecorrencia = (
    competencia: string,
    diaBaseRaw: string,
    periodicidade: PeriodicidadeRecorrencia
  ): string[] => {
    const match = competencia.match(/^(\d{4})-(\d{2})$/);
    const baseAtual = match
      ? { ano: parseInt(match[1], 10), mes: parseInt(match[2], 10) }
      : { ano: new Date().getFullYear(), mes: new Date().getMonth() + 1 };

    const diaBase = Math.min(31, Math.max(1, parseInt(diaBaseRaw, 10) || 1));

    if (periodicidade === 'QUINZENAL') {
      const data1 = formatarDataISO(baseAtual.ano, baseAtual.mes, diaBase);
      const dia2Raw = diaBase + 15;
      const ultimoDiaMes = new Date(baseAtual.ano, baseAtual.mes, 0).getDate();
      const data2 =
        dia2Raw <= ultimoDiaMes
          ? formatarDataISO(baseAtual.ano, baseAtual.mes, dia2Raw)
          : formatarDataISO(baseAtual.ano, baseAtual.mes + 1, dia2Raw - ultimoDiaMes);
      return data1 === data2 ? [data1] : [data1, data2];
    }

    const passoMeses =
      periodicidade === 'MENSAL'
        ? 1
        : periodicidade === 'TRIMESTRAL'
        ? 3
        : periodicidade === 'SEMESTRAL'
        ? 6
        : 12;

    const totalMeses = baseAtual.ano * 12 + (baseAtual.mes - 1) + passoMeses;
    const anoAlvo = Math.floor(totalMeses / 12);
    const mesAlvo = (totalMeses % 12) + 1;

    return [formatarDataISO(anoAlvo, mesAlvo, diaBase)];
  };

  const getColabId = (col: any): string =>
    (col?.idUsuario ?? col?.id_usuario ?? col?.idColaborador ?? col?.id_colaborador ?? col?.id ?? '').toString();

  const getRotinaColabId = (r: any): string =>
    (
      r?.responsavel?.idUsuario ??
      r?.responsavel?.id_usuario ??
      r?.responsavel?.id ??
      r?.colaborador?.idUsuario ??
      r?.colaborador?.id_usuario ??
      r?.colaborador?.id ??
      r?.usuario?.idUsuario ??
      r?.usuario?.id ??
      r?.idResponsavel ??
      r?.id_responsavel ??
      r?.colaboradorId ??
      r?.colaborador_id ??
      r?.usuarioId ??
      r?.id_usuario ??
      ''
    ).toString();

  const getRotinaColabNome = (r: any): string =>
    (
      r?.responsavel?.nome ??
      r?.colaborador?.nome ??
      r?.usuario?.nome ??
      r?.responsavelNome ??
      r?.nomeColaborador ??
      r?.colaboradorNome ??
      ''
    )
      .toString()
      .trim();

  const rotinaPertenceAoColaborador = (rotina: any, filtroColabId: string): boolean => {
    if (!filtroColabId) return true;
    if (filtroColabId === '__SEM_RESPONSAVEL__') {
      const id = getRotinaColabId(rotina);
      const nome = normalizarTexto(getRotinaColabNome(rotina));
      return !id && (!nome || nome === 'n/d' || nome === 'sem responsavel');
    }

    const rId = getRotinaColabId(rotina);
    if (rId && rId === filtroColabId) return true;

    const colabObj = colaboradores.find((c: any) => getColabId(c) === filtroColabId);
    const colabNomeNorm = normalizarTexto(colabObj?.nome);
    const rNomeNorm = normalizarTexto(getRotinaColabNome(rotina));
    return Boolean(colabNomeNorm && rNomeNorm && colabNomeNorm === rNomeNorm);
  };

  const getEmpId = (emp: any): string =>
    (emp?.idEmpresa ?? emp?.id_empresa ?? emp?.id ?? '').toString();

  const getRotinaEmpId = (r: any): string =>
    (
      r?.empresa?.idEmpresa ??
      r?.empresa?.id_empresa ??
      r?.empresa?.id ??
      r?.empresaId ??
      r?.empresa_id ??
      r?.id_empresa ??
      ''
    ).toString();

  const isStatusConcluido = (status?: string) =>
    status === 'Concluída' || status === 'Concluído' || status === 'Concluida' || status === 'Concluido';

  const rotinasSemResponsavel = rotinas.filter((r: any) => {
    const id = getRotinaColabId(r);
    const nome = getRotinaColabNome(r).toLowerCase();
    return !id && (!nome || nome === 'n/d' || nome === 'sem responsável' || nome === 'sem responsavel');
  });

  const rotinasComBloqueio = useMemo(
    () => rotinas.filter((r: any) => Boolean(obterAnotacaoBloqueio(r))),
    [rotinas, notasExternasPorRotina]
  );

  // --- MÉTRICAS DO DASHBOARD DO GESTOR ---
  const hojeStr = new Date().toISOString().slice(0, 10);

  const totalRotinas = rotinas.length;
  const concluidasCount = rotinas.filter((r: any) => isStatusConcluido(r.status)).length;
  const rotinasEmAbertoCount = rotinas.filter((r: any) => !isStatusConcluido(r.status)).length;
  const emAndamentoCount = rotinas.filter((r: any) => r.status === 'Em Andamento').length;
  const atrasadasCount = rotinas.filter((r: any) => {
    const venc = r.dataVencimentoCalculada || r.dataVencimento || r.vencimento || '';
    const isConcluida = isStatusConcluido(r.status);
    return r.status === 'Atrasado' || (!isConcluida && venc && venc < hojeStr);
  }).length;
  const pendentesCount = Math.max(0, totalRotinas - concluidasCount - emAndamentoCount - atrasadasCount);

  const taxaPontualidade = totalRotinas > 0 ? Math.round((concluidasCount / totalRotinas) * 100) : 0;

  const colaboradoresFiltradosPainel = colaboradores.filter(
    (col: any) => col.email !== 'lucassteilmanndasilva@gmail.com'
  );

  const cargaPorColaborador = colaboradoresFiltradosPainel.map((col: any) => {
    const colId = getColabId(col);
    const colNomeLower = (col.nome || '').toString().trim().toLowerCase();

    const tarefasCol = rotinas.filter((r: any) => {
      const respId = getRotinaColabId(r);
      const respNome = getRotinaColabNome(r).toLowerCase();
      const matchId = Boolean(colId) && respId === colId;
      const matchNome = Boolean(colNomeLower) && respNome === colNomeLower;
      return matchId || matchNome;
    });

    const feitas = tarefasCol.filter((r: any) => isStatusConcluido(r.status)).length;
    const atrasos = tarefasCol.filter((r: any) => {
      const venc = r.dataVencimentoCalculada || r.dataVencimento || r.vencimento || '';
      const isConcluida = isStatusConcluido(r.status);
      return r.status === 'Atrasado' || (!isConcluida && venc && venc < hojeStr);
    }).length;
    const bloqueiosCol = tarefasCol.filter((r: any) => Boolean(obterAnotacaoBloqueio(r))).length;
    const abertas = tarefasCol.length - feitas;

    return {
      id: colId || col.nome,
      nome: col.nome,
      total: tarefasCol.length,
      abertas,
      feitas,
      atrasos,
      bloqueios: bloqueiosCol
    };
  });

  const rotinasCriticas = rotinas.filter((r: any) => {
    const venc = r.dataVencimentoCalculada || r.dataVencimento || r.vencimento || '';
    const isConcluida = isStatusConcluido(r.status);
    return !isConcluida && venc && venc <= hojeStr;
  });

  // --- DADOS DA MATRIZ DE ENTREGAS POR COMPETÊNCIA (COM FILTRO POR COLABORADOR) ---
  const rotinasDaCompetencia = useMemo(() => {
    return rotinas.filter((rot: any) => {
      const bateCompetencia = rot.competencia
        ? rot.competencia === competenciaMatriz
        : (rot.dataVencimentoCalculada || rot.dataVencimento || rot.vencimento || '').startsWith(
            competenciaMatriz
          );
      if (!bateCompetencia) return false;

      if (!rotinaPertenceAoColaborador(rot, filtroMatrizColaborador)) return false;

      if (filtroMatrizStatus) {
        const venc = rot.dataVencimentoCalculada || rot.dataVencimento || rot.vencimento || '';
        const st = rot.status || 'Pendente';
        const isConcluida = isStatusConcluido(st);
        const isAtrasada = st === 'Atrasado' || (!isConcluida && venc && venc < hojeStr);
        const statusEfetivo = isConcluida
          ? 'Concluída'
          : isAtrasada
          ? 'Atrasado'
          : st === 'Em Andamento'
          ? 'Em Andamento'
          : 'Pendente';
        if (statusEfetivo !== filtroMatrizStatus) return false;
      }

      return true;
    });
  }, [rotinas, competenciaMatriz, filtroMatrizColaborador, filtroMatrizStatus, colaboradores, hojeStr]);

  const colunasObrigacoes: string[] = useMemo(() => {
    return Array.from(
      new Set(
        rotinasDaCompetencia.map((r: any) =>
          (r.titulo || r.nome || r.rotinaNome || r.tarefaNome || 'Obrigação').trim()
        )
      )
    );
  }, [rotinasDaCompetencia]);

  const empresasVisiveisMatriz = useMemo(() => {
    return empresas.filter((emp: any) => {
      const empId = getEmpId(emp);
      if (filtroMatrizEmpresa && empId !== filtroMatrizEmpresa) return false;

      if (filtroMatrizColaborador) {
        return rotinasDaCompetencia.some((r: any) => getRotinaEmpId(r) === empId);
      }

      return true;
    });
  }, [empresas, filtroMatrizEmpresa, filtroMatrizColaborador, rotinasDaCompetencia, colaboradores]);

  const obterStatusCelulaMatriz = (empresa: any, nomeObrigacao: string) => {
    const empId = getEmpId(empresa);
    const tarefaEncontrada: any = rotinasDaCompetencia.find((r: any) => {
      const rEmpId = getRotinaEmpId(r);
      const rTitulo = (r.titulo || r.nome || r.rotinaNome || r.tarefaNome || '').trim().toLowerCase();
      return rEmpId === empId && rTitulo === nomeObrigacao.trim().toLowerCase();
    });

    if (!tarefaEncontrada) {
      return { label: 'N/A', className: 'badge-neutral', tarefa: null };
    }

    const venc = tarefaEncontrada.dataVencimentoCalculada || tarefaEncontrada.dataVencimento || tarefaEncontrada.vencimento || '';
    const st = tarefaEncontrada.status || 'Pendente';
    const isConcluida = isStatusConcluido(st);
    const isAtrasada = st === 'Atrasado' || (!isConcluida && venc && venc < hojeStr);

    if (isConcluida) return { label: 'Concluído', className: 'badge-success', tarefa: tarefaEncontrada };
    if (isAtrasada) return { label: 'Atrasado', className: 'badge-danger', tarefa: tarefaEncontrada };
    if (st === 'Em Andamento') return { label: 'Em Andamento', className: 'badge-warning', tarefa: tarefaEncontrada };
    return { label: 'Pendente', className: 'badge-pending', tarefa: tarefaEncontrada };
  };

  const alternarStatusRapidoMatriz = async (tarefa: any) => {
    if (!tarefa) return;
    const id = getRotinaIdUnico(tarefa);
    const atual = tarefa.status || 'Pendente';
    const proximoStatus =
      atual === 'Pendente' ? 'Em Andamento' : atual === 'Em Andamento' ? 'Concluída' : 'Pendente';

    try {
      const colabIdVal = getRotinaColabId(tarefa);
      const notaAtual = obterAnotacaoBloqueio(tarefa);
      const payload = {
        titulo: tarefa.titulo || tarefa.nome || tarefa.rotinaNome || tarefa.tarefaNome || 'Obrigação',
        descricao: tarefa.descricao || tarefa.obs || tarefa.observacao || '',
        anotacaoBloqueio: notaAtual,
        observacaoColaborador: notaAtual,
        nota: notaAtual,
        dataVencimento: tarefa.dataVencimentoCalculada || tarefa.dataVencimento || tarefa.vencimento || '',
        empresaId: getRotinaEmpId(tarefa),
        colaboradorId: colabIdVal ? colabIdVal : null,
        status: proximoStatus
      };

      const res = await fetch(`${apiBase}/rotinas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        registrarAuditoria(
          proximoStatus === 'Concluída' ? 'CONCLUSÃO' : 'ALTERAÇÃO DE STATUS',
          `Matriz: "${payload.titulo}" alterado de "${atual}" para "${proximoStatus}".`
        );
        await carregarDados();
      } else {
        setRotinas((prev: any[]) =>
          prev.map((r) => (getRotinaIdUnico(r) === id ? { ...r, status: proximoStatus } : r))
        );
      }
    } catch (err) {
      console.error('Erro ao atualizar status pela matriz:', err);
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
        const erroMsg = await res.text();
        alert(`Erro ao salvar empresa: ${erroMsg}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const editarEmpresa = (emp: any) => {
    setEditandoEmpresaId(emp.idEmpresa || emp.id);
    setNovaEmpresa({
      nome: emp.nome || emp.razaoSocial || '',
      cnpj: emp.cnpj || '',
      tipo: emp.regimeTributario || emp.tipo || 'MEI',
      responsavel: emp.responsavel || ''
    });
  };

  const excluirEmpresa = async (id: number | string) => {
    if (!id) return alert('Erro: ID da empresa não encontrado.');
    if (!confirm('Tem certeza que deseja excluir esta empresa?')) return;
    try {
      const res = await fetch(`${apiBase}/empresas/${id}`, { method: 'DELETE' });
      if (res.ok) {
        carregarDados();
      } else {
        alert(`Erro ao excluir empresa: ${await res.text()}`);
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao excluir empresa.');
    }
  };

  const empresasFiltradasLista = empresas.filter((emp: any) => {
    const termo = buscaEmpresa.toLowerCase();
    const nome = (emp.nome || emp.razaoSocial || '').toLowerCase();
    const cnpj = (emp.cnpj || '').toLowerCase();
    return nome.includes(termo) || cnpj.includes(termo);
  });

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
        alert(`Erro ao salvar colaborador: ${await res.text()}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const editarColaborador = (col: any) => {
    setEditandoColabId(col.idUsuario || col.id);
    setNovoColaborador({ nome: col.nome, email: col.email, senha: '', perfil: col.perfil || 'COLABORADOR' });
  };

  const excluirColaborador = async (id: number | string) => {
    if (!id) return alert('Erro: ID do colaborador não encontrado.');
    if (!confirm('Tem certeza que deseja excluir este colaborador?')) return;
    try {
      const res = await fetch(`${apiBase}/usuarios/${id}`, { method: 'DELETE' });
      if (res.ok) {
        carregarDados();
      } else {
        alert(`Erro ao excluir colaborador: ${await res.text()}`);
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao excluir colaborador.');
    }
  };

  // --- ROTINAS FISCAIS ---
  const salvarRotina = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdicao = Boolean(editandoRotinaId);
      const rotinaAnterior: any = isEdicao
        ? rotinas.find((r: any) => getRotinaIdUnico(r) === String(editandoRotinaId))
        : null;

      const notaLimpa = novaRotina.anotacaoBloqueio.trim();
      const payload = {
        ...novaRotina,
        anotacaoBloqueio: notaLimpa,
        observacaoColaborador: notaLimpa,
        nota: notaLimpa,
        colaboradorId: novaRotina.colaboradorId ? novaRotina.colaboradorId : null
      };

      const url = isEdicao ? `${apiBase}/rotinas/${editandoRotinaId}` : `${apiBase}/rotinas`;
      const method = isEdicao ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const empObj: any = empresas.find((emp: any) => getEmpId(emp) === novaRotina.empresaId?.toString());
        const nomeEmp = empObj?.nome || empObj?.razaoSocial || 'Empresa';
        const colabObj: any = colaboradores.find(
          (c: any) => getColabId(c) === novaRotina.colaboradorId?.toString()
        );
        const infoResp = colabObj?.nome ? `Responsável: ${colabObj.nome}` : 'Tarefa avulsa (sem responsável)';

        if (!isEdicao) {
          registrarAuditoria(
            'CRIAÇÃO',
            `Rotina "${novaRotina.titulo}" cadastrada para ${nomeEmp} (${infoResp}, Venc.: ${novaRotina.dataVencimento}, Status: ${novaRotina.status}).`
          );
        } else {
          const statusAnterior = rotinaAnterior?.status || 'Pendente';
          const virouConcluida = isStatusConcluido(novaRotina.status) && !isStatusConcluido(statusAnterior);

          if (virouConcluida) {
            registrarAuditoria('CONCLUSÃO', `Rotina "${novaRotina.titulo}" (${nomeEmp}) marcada como Concluída.`);
          } else if (rotinaAnterior && rotinaAnterior.status !== novaRotina.status) {
            registrarAuditoria(
              'ALTERAÇÃO DE STATUS',
              `Rotina "${novaRotina.titulo}" (${nomeEmp}): status alterado de "${statusAnterior}" para "${novaRotina.status}".`
            );
          } else {
            registrarAuditoria(
              'EDIÇÃO',
              `Rotina "${novaRotina.titulo}" (${nomeEmp}) atualizada (${infoResp}, Venc.: ${novaRotina.dataVencimento}, Status: ${novaRotina.status}${
                notaLimpa ? `, Bloqueio/Nota: "${notaLimpa}"` : ''
              }).`
            );
          }
        }

        setNovaRotina({
          titulo: '',
          descricao: '',
          anotacaoBloqueio: '',
          dataVencimento: '',
          empresaId: '',
          colaboradorId: '',
          status: 'Pendente'
        });
        setEditandoRotinaId(null);
        carregarDados();
        alert(isEdicao ? 'Rotina atualizada com sucesso!' : 'Rotina cadastrada com sucesso!');
      } else {
        alert(`Erro ao salvar rotina fiscal: ${await res.text()}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const editarRotina = (rot: any) => {
    const id = getRotinaIdUnico(rot);
    setEditandoRotinaId(id);
    setAbaAtiva('rotinas');

    setNovaRotina({
      titulo: rot.titulo || rot.nome || rot.rotinaNome || rot.tarefaNome || '',
      descricao: rot.descricao || '',
      anotacaoBloqueio: obterAnotacaoBloqueio(rot),
      dataVencimento: rot.dataVencimentoCalculada || rot.dataVencimento || rot.vencimento || '',
      status: rot.status || 'Pendente',
      empresaId: getRotinaEmpId(rot),
      colaboradorId: getRotinaColabId(rot)
    });
  };

  const excluirRotina = async (id: number | string) => {
    if (!id) return alert('Erro: ID da rotina não encontrado.');
    if (!confirm('Tem certeza que deseja excluir esta rotina?')) return;
    try {
      const rotinaAlvo: any = rotinas.find((r: any) => getRotinaIdUnico(r) === String(id));
      const tituloAlvo = rotinaAlvo?.titulo || rotinaAlvo?.nome || `ID ${id}`;

      const res = await fetch(`${apiBase}/rotinas/${id}`, { method: 'DELETE' });
      if (res.ok) {
        registrarAuditoria('EXCLUSÃO', `Rotina "${tituloAlvo}" removida do sistema.`);
        carregarDados();
      } else {
        alert(`Erro ao excluir rotina: ${await res.text()}`);
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao excluir rotina.');
    }
  };

  // --- ATRIBUIÇÃO EM LOTE (CRIAR, EDITAR E EXCLUIR) ---
  const alternarEmpresaLote = (empId: string) => {
    setEmpresasSelecionadasLote((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const selecionarTodasEmpresasLote = () => {
    const todosIds = empresas.map((emp: any) => getEmpId(emp)).filter(Boolean);
    setEmpresasSelecionadasLote(todosIds);
  };

  const selecionarPorRegimeLote = (regime: string) => {
    const idsFiltrados = empresas
      .filter((emp: any) => (emp.regimeTributario || emp.tipo || '').toLowerCase() === regime.toLowerCase())
      .map((emp: any) => getEmpId(emp))
      .filter(Boolean);
    setEmpresasSelecionadasLote(idsFiltrados);
  };

  const iniciarEdicaoLote = (lote: LoteRegistrado) => {
    setEditandoLoteId(lote.idLote);
    setLoteForm({
      tipoObrigacao: lote.tipoObrigacao,
      periodicidade: lote.periodicidade || 'MENSAL',
      titulo: lote.titulo,
      descricao: lote.descricao,
      dataVencimento: lote.dataVencimento,
      diaBaseVencimento: lote.diaBaseVencimento,
      departamento: lote.departamento,
      colaboradorId: lote.colaboradorId,
      status: lote.status
    });
    setEmpresasSelecionadasLote(lote.empresaIds);
  };

  const cancelarEdicaoLote = () => {
    setEditandoLoteId(null);
    setLoteForm({
      tipoObrigacao: 'EVENTUAL',
      periodicidade: 'MENSAL',
      titulo: '',
      descricao: '',
      dataVencimento: '',
      diaBaseVencimento: '20',
      departamento: 'Fiscal',
      colaboradorId: '',
      status: 'Pendente'
    });
    setEmpresasSelecionadasLote([]);
  };

  const excluirLoteRegistrado = async (lote: LoteRegistrado) => {
    if (!confirm(`Deseja excluir o lote "${lote.titulo}" e remover as rotinas associadas a ele?`)) return;

    const rotinasDoLote = rotinas.filter(
      (r: any) => (r.titulo || r.nome) === lote.titulo && lote.empresaIds.includes(getRotinaEmpId(r))
    );

    for (const rot of rotinasDoLote) {
      const rotId = getRotinaIdUnico(rot);
      if (rotId) {
        try {
          await fetch(`${apiBase}/rotinas/${rotId}`, { method: 'DELETE' });
        } catch (err) {
          console.error(err);
        }
      }
    }
    await carregarDados();

    setLotesCriados((prev) => prev.filter((item) => item.idLote !== lote.idLote));
    if (editandoLoteId === lote.idLote) cancelarEdicaoLote();
    registrarAuditoria('EXCLUSÃO', `Lote "${lote.titulo}" (${lote.empresaIds.length} empresa(s)) removido.`);
  };

  const executarAtribuicaoEmLote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (empresasSelecionadasLote.length === 0) {
      alert('Selecione pelo menos uma empresa cliente para atribuir o lote.');
      return;
    }

    const colabObj: any = colaboradores.find((c: any) => getColabId(c) === loteForm.colaboradorId.toString());
    const nomeColab = loteForm.colaboradorId ? colabObj?.nome || 'Colaborador' : 'Sem responsável (Avulsa)';
    const colabPayload = loteForm.colaboradorId ? loteForm.colaboradorId : null;

    if (loteForm.tipoObrigacao === 'RECORRENTE') {
      const diaNum = parseInt(loteForm.diaBaseVencimento, 10);
      if (isNaN(diaNum) || diaNum < 1 || diaNum > 31) {
        alert('Informe um dia base válido entre 1 e 31.');
        return;
      }
    } else if (!loteForm.dataVencimento) {
      alert('Informe a data de vencimento da tarefa eventual.');
      return;
    }

    const datasRecorrencia =
      loteForm.tipoObrigacao === 'RECORRENTE'
        ? gerarDatasRecorrencia(competenciaMatriz, loteForm.diaBaseVencimento, loteForm.periodicidade)
        : [loteForm.dataVencimento];

    const vencimentoPrincipal = datasRecorrencia[0];
    const labelPeriodicidade = LABELS_PERIODICIDADE[loteForm.periodicidade];

    const descricaoFinal =
      loteForm.tipoObrigacao === 'RECORRENTE'
        ? loteForm.descricao ||
          `Recorrência ${labelPeriodicidade} • ${loteForm.departamento} • Base ${competenciaMatriz} (Dia ${loteForm.diaBaseVencimento})`
        : loteForm.descricao;

    if (editandoLoteId) {
      const loteAnterior = lotesCriados.find((l) => l.idLote === editandoLoteId);
      setEnviandoLote(true);

      try {
        const rotinasVinculadas = rotinas.filter((r: any) => {
          const matchTitulo = loteAnterior ? (r.titulo || r.nome) === loteAnterior.titulo : false;
          const vencRot = r.dataVencimentoCalculada || r.dataVencimento || r.vencimento || '';
          const datasAnteriores = loteAnterior?.datasGeradas?.length
            ? loteAnterior.datasGeradas
            : loteAnterior?.dataVencimento
            ? [loteAnterior.dataVencimento]
            : [];
          const matchVenc = datasAnteriores.length > 0 ? datasAnteriores.includes(vencRot) : true;
          return matchTitulo && matchVenc;
        });

        for (const rot of rotinasVinculadas) {
          const rotId = getRotinaIdUnico(rot);
          const vencAtual = rot.dataVencimentoCalculada || rot.dataVencimento || rot.vencimento || vencimentoPrincipal;
          if (rotId) {
            await fetch(`${apiBase}/rotinas/${rotId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                titulo: loteForm.titulo,
                descricao: descricaoFinal,
                dataVencimento: datasRecorrencia.includes(vencAtual) ? vencAtual : vencimentoPrincipal,
                empresaId: getRotinaEmpId(rot),
                colaboradorId: colabPayload,
                status: loteForm.status
              })
            });
          }
        }

        const idsAntigos = loteAnterior?.empresaIds || [];
        const novasEmpresas = empresasSelecionadasLote.filter((id) => !idsAntigos.includes(id));
        for (const empId of novasEmpresas) {
          for (const dataItem of datasRecorrencia) {
            await fetch(`${apiBase}/rotinas`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                titulo: loteForm.titulo,
                descricao: descricaoFinal,
                dataVencimento: dataItem,
                empresaId: empId,
                colaboradorId: colabPayload,
                status: loteForm.status
              })
            });
          }
        }

        await carregarDados();

        setLotesCriados((prev) =>
          prev.map((item) =>
            item.idLote === editandoLoteId
              ? {
                  ...item,
                  tipoObrigacao: loteForm.tipoObrigacao,
                  periodicidade: loteForm.periodicidade,
                  titulo: loteForm.titulo,
                  descricao: descricaoFinal,
                  dataVencimento: vencimentoPrincipal,
                  datasGeradas: datasRecorrencia,
                  diaBaseVencimento: loteForm.diaBaseVencimento,
                  departamento: loteForm.departamento,
                  colaboradorId: loteForm.colaboradorId,
                  colaboradorNome: nomeColab,
                  status: loteForm.status,
                  empresaIds: empresasSelecionadasLote
                }
              : item
          )
        );

        registrarAuditoria(
          'EDIÇÃO',
          `Lote "${loteForm.titulo}" atualizado para ${empresasSelecionadasLote.length} empresa(s) (${nomeColab}).`
        );
        cancelarEdicaoLote();
        alert('Atribuição em lote atualizada com sucesso!');
      } catch (err) {
        console.error(err);
        alert('Erro ao atualizar lote.');
      } finally {
        setEnviandoLote(false);
      }
      return;
    }

    setEnviandoLote(true);
    let criadasComSucesso = 0;
    let falhas = 0;

    try {
      for (const empId of empresasSelecionadasLote) {
        for (const dataItem of datasRecorrencia) {
          const res = await fetch(`${apiBase}/rotinas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              titulo: loteForm.titulo,
              descricao: descricaoFinal,
              dataVencimento: dataItem,
              empresaId: empId,
              colaboradorId: colabPayload,
              status: loteForm.status
            })
          });

          if (res.ok) criadasComSucesso++;
          else falhas++;
        }
      }

      if (criadasComSucesso > 0) {
        const novoLote: LoteRegistrado = {
          idLote: `lote-${Date.now()}`,
          tipoObrigacao: loteForm.tipoObrigacao,
          periodicidade: loteForm.periodicidade,
          titulo: loteForm.titulo,
          descricao: descricaoFinal,
          dataVencimento: vencimentoPrincipal,
          datasGeradas: datasRecorrencia,
          diaBaseVencimento: loteForm.diaBaseVencimento,
          departamento: loteForm.departamento,
          colaboradorId: loteForm.colaboradorId,
          colaboradorNome: nomeColab,
          status: loteForm.status,
          empresaIds: [...empresasSelecionadasLote],
          criadoEm: new Date().toLocaleString('pt-BR')
        };
        setLotesCriados((prev) => [novoLote, ...prev]);

        registrarAuditoria(
          'CRIAÇÃO EM LOTE',
          loteForm.tipoObrigacao === 'RECORRENTE'
            ? `Rotina recorrente (${labelPeriodicidade}) "${loteForm.titulo}" gerou ${criadasComSucesso} obrigação(ões) para ${empresasSelecionadasLote.length} empresa(s) (${nomeColab}, Venc.: ${datasRecorrencia.join(', ')}).`
            : `Tarefa eventual "${loteForm.titulo}" gerada para ${criadasComSucesso} empresa(s) (${nomeColab}, Venc.: ${vencimentoPrincipal}).`
        );
      }

      await carregarDados();
      cancelarEdicaoLote();
      alert(
        falhas === 0
          ? `Atribuição em lote concluída! ${criadasComSucesso} rotina(s) criada(s) com sucesso.`
          : `Lote finalizado: ${criadasComSucesso} criada(s) e ${falhas} falha(s).`
      );
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao processar atribuição em lote.');
    } finally {
      setEnviandoLote(false);
    }
  };

  // --- FILTROS DE ROTINAS ---
  const rotinasFiltradas = rotinas.filter((rot: any) => {
    const matchStatus = filtroStatus ? rot.status === filtroStatus : true;
    const matchEmpresa = filtroEmpresa ? getRotinaEmpId(rot) === filtroEmpresa : true;
    const matchColab =
      filtroColaborador === '__SEM_RESPONSAVEL__'
        ? !getRotinaColabId(rot) && !getRotinaColabNome(rot)
        : filtroColaborador
        ? getRotinaColabId(rot) === filtroColaborador
        : true;
    const matchBloqueio = apenasComBloqueio ? Boolean(obterAnotacaoBloqueio(rot)) : true;
    return matchStatus && matchEmpresa && matchColab && matchBloqueio;
  });

  const rotinasFiltradasEmAbertoCount = rotinasFiltradas.filter((r: any) => !isStatusConcluido(r.status)).length;

  const infoAba: Record<typeof abaAtiva, { titulo: string; subtitulo: string; grupo: string }> = {
    inicio: {
      grupo: 'Visão Executiva',
      titulo: 'Dashboard Operacional & KPIs',
      subtitulo: 'Monitoramento em tempo real de entregas fiscais, gargalos, bloqueios e produtividade.'
    },
    matriz: {
      grupo: 'Operação Fiscal',
      titulo: 'Matriz de Entregas por Competência',
      subtitulo: 'Acompanhamento de obrigações por empresa, colaborador e competência selecionada.'
    },
    rotinas: {
      grupo: 'Operação Fiscal',
      titulo: 'Cronograma de Rotinas Fiscais',
      subtitulo: 'Gestão individual de prazos, responsáveis, bloqueios registrados e status de execução.'
    },
    lote: {
      grupo: 'Operação Fiscal',
      titulo: 'Atribuição e Geração em Lote',
      subtitulo: 'Crie, edite ou remova rotinas recorrentes e tarefas eventuais para múltiplas empresas.'
    },
    empresas: {
      grupo: 'Cadastros & Governança',
      titulo: 'Carteira de Empresas Clientes',
      subtitulo: 'Base cadastral de pessoas jurídicas, CNPJ e enquadramento tributário.'
    },
    colaboradores: {
      grupo: 'Cadastros & Governança',
      titulo: 'Equipe & Colaboradores',
      subtitulo: 'Gestão de colaboradores contábeis, fiscais e distribuição de responsabilidades.'
    },
    auditoria: {
      grupo: 'Cadastros & Governança',
      titulo: 'Trilha de Auditoria Imutável',
      subtitulo: 'Histórico cronológico inviolável de movimentações, conclusões e exclusões.'
    }
  };

  const getBadgeStatus = (status: string) => {
    if (isStatusConcluido(status)) return 'badge-success';
    if (status === 'Em Andamento') return 'badge-warning';
    if (status === 'Atrasado') return 'badge-danger';
    return 'badge-pending';
  };

  return (
    <div className="erp-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

        :root {
          --bg-canvas: #090d16;
          --bg-sidebar: #0d1320;
          --bg-surface: #111827;
          --bg-surface-elevated: #161f32;
          --bg-input: #0b111e;
          --border-subtle: rgba(148, 163, 184, 0.14);
          --border-strong: rgba(148, 163, 184, 0.26);
          --accent-primary: #2563eb;
          --accent-hover: #1d4ed8;
          --accent-cyan: #38bdf8;
          --text-primary: #f8fafc;
          --text-secondary: #94a3b8;
          --text-muted: #64748b;
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: var(--bg-canvas);
          color: var(--text-primary);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        .erp-shell {
          display: flex;
          min-height: 100vh;
          background: radial-gradient(circle at top right, rgba(37, 99, 235, 0.08), transparent 42%), var(--bg-canvas);
        }

        .erp-sidebar {
          width: 272px;
          background: var(--bg-sidebar);
          border-right: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 24px 16px;
          position: sticky;
          top: 0;
          height: 100vh;
          flex-shrink: 0;
        }

        .brand-box {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 4px 10px 22px 10px;
          border-bottom: 1px solid var(--border-subtle);
          margin-bottom: 20px;
        }

        .brand-logo {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 16px;
          color: #fff;
          box-shadow: 0 6px 18px rgba(37, 99, 235, 0.35);
        }

        .brand-title {
          font-size: 16px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #f8fafc;
          margin: 0;
        }

        .brand-sub {
          font-size: 11px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-weight: 600;
        }

        .nav-section-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          padding: 12px 12px 6px 12px;
        }

        .nav-item {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid transparent;
          background: transparent;
          color: var(--text-secondary);
          font-size: 13.5px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.16s ease;
          margin-bottom: 2px;
          text-align: left;
        }

        .nav-item:hover {
          background: rgba(148, 163, 184, 0.08);
          color: #f8fafc;
        }

        .nav-item.active {
          background: linear-gradient(90deg, rgba(37, 99, 235, 0.22) 0%, rgba(37, 99, 235, 0.06) 100%);
          border-color: rgba(59, 130, 246, 0.35);
          color: #ffffff;
          font-weight: 600;
        }

        .nav-pill {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          padding: 2px 7px;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.12);
          color: var(--text-secondary);
        }

        .nav-item.active .nav-pill {
          background: rgba(59, 130, 246, 0.3);
          color: #93c5fd;
        }

        .sidebar-footer {
          border-top: 1px solid var(--border-subtle);
          padding-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .user-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid var(--border-subtle);
          border-radius: 10px;
        }

        .user-avatar {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          background: #1e293b;
          border: 1px solid var(--border-strong);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 13px;
          color: var(--accent-cyan);
        }

        .btn-logout {
          width: 100%;
          padding: 9px 12px;
          border-radius: 8px;
          border: 1px solid rgba(239, 68, 68, 0.3);
          background: rgba(239, 68, 68, 0.1);
          color: #fca5a5;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.16s ease;
        }

        .btn-logout:hover {
          background: rgba(239, 68, 68, 0.22);
          color: #fff;
        }

        .erp-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .erp-topbar {
          background: rgba(13, 19, 32, 0.85);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border-subtle);
          padding: 20px 36px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          position: sticky;
          top: 0;
          z-index: 20;
        }

        .breadcrumb {
          font-size: 11.5px;
          color: var(--accent-cyan);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 4px;
        }

        .page-title {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.02em;
          margin: 0;
          color: #f8fafc;
        }

        .page-subtitle {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 4px 0 0 0;
        }

        .topbar-status {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          padding: 8px 14px;
          border-radius: 999px;
          font-size: 12px;
          color: var(--text-secondary);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 8px #22c55e;
        }

        .erp-content {
          padding: 32px 36px;
          max-width: 1520px;
          width: 100%;
        }

        .erp-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: 14px;
          padding: 24px;
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.55);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 16px;
          margin-bottom: 20px;
          border-bottom: 1px solid var(--border-subtle);
          gap: 12px;
          flex-wrap: wrap;
        }

        .card-title {
          font-size: 15.5px;
          font-weight: 600;
          color: #f1f5f9;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-label {
          font-size: 12px;
          font-weight: 600;
          color: #cbd5e1;
          letter-spacing: 0.01em;
        }

        .erp-input, .erp-select {
          width: 100%;
          padding: 10px 13px;
          background: var(--bg-input);
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          color: #f8fafc;
          font-size: 13.5px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.16s ease, box-shadow 0.16s ease;
        }

        .erp-input:focus, .erp-select:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.18);
        }

        .erp-input::placeholder {
          color: #475569;
        }

        .btn-primary {
          width: 100%;
          padding: 11px 16px;
          background: linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%);
          border: 1px solid rgba(96, 165, 250, 0.3);
          border-radius: 8px;
          color: #ffffff;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.16s ease;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
        }

        .btn-primary:hover:not(:disabled) {
          background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
          transform: translateY(-1px);
        }

        .btn-primary:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .btn-secondary {
          padding: 7px 12px;
          background: var(--bg-surface-elevated);
          border: 1px solid var(--border-strong);
          border-radius: 7px;
          color: #e2e8f0;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-secondary:hover {
          background: #1e293b;
          border-color: #64748b;
        }

        .btn-edit {
          padding: 6px 11px;
          background: rgba(59, 130, 246, 0.14);
          border: 1px solid rgba(59, 130, 246, 0.35);
          border-radius: 6px;
          color: #93c5fd;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-edit:hover {
          background: rgba(59, 130, 246, 0.28);
          color: #fff;
        }

        .btn-danger {
          padding: 6px 11px;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.32);
          border-radius: 6px;
          color: #fca5a5;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-danger:hover {
          background: rgba(239, 68, 68, 0.25);
          color: #fff;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 0.01em;
        }

        .badge-success {
          background: rgba(34, 197, 94, 0.14);
          color: #4ade80;
          border: 1px solid rgba(34, 197, 94, 0.32);
        }

        .badge-warning {
          background: rgba(245, 158, 11, 0.14);
          color: #fbbf24;
          border: 1px solid rgba(245, 158, 11, 0.32);
        }

        .badge-danger {
          background: rgba(239, 68, 68, 0.14);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.32);
        }

        .badge-pending {
          background: rgba(56, 189, 248, 0.12);
          color: #7dd3fc;
          border: 1px solid rgba(56, 189, 248, 0.28);
        }

        .badge-neutral {
          background: rgba(148, 163, 184, 0.07);
          color: #64748b;
          border: 1px solid rgba(148, 163, 184, 0.16);
        }

        .mono {
          font-family: 'JetBrains Mono', monospace;
        }

        .erp-table-wrap {
          overflow-x: auto;
          border: 1px solid var(--border-subtle);
          border-radius: 12px;
          background: var(--bg-input);
        }

        .erp-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          text-align: left;
        }

        .erp-table th {
          background: #0d1424;
          color: #94a3b8;
          font-weight: 600;
          font-size: 11.5px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 14px 16px;
          border-bottom: 1px solid var(--border-subtle);
        }

        .erp-table td {
          padding: 14px 16px;
          border-bottom: 1px solid var(--border-subtle);
          color: #e2e8f0;
          vertical-align: middle;
        }

        .erp-table tr:last-child td {
          border-bottom: none;
        }

        .erp-table tbody tr:hover {
          background: rgba(30, 41, 59, 0.38);
        }

        .matriz-status-btn {
          cursor: pointer;
          transition: transform 0.12s ease, filter 0.12s ease;
        }

        .matriz-status-btn:hover {
          transform: translateY(-1px);
          filter: brightness(1.12);
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
        }

        .kpi-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: 14px;
          padding: 20px 22px;
          position: relative;
          overflow: hidden;
        }

        .kpi-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background: var(--kpi-accent, #3b82f6);
        }

        .kpi-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .kpi-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 28px;
          font-weight: 700;
          margin: 8px 0 4px 0;
          color: #f8fafc;
        }

        .kpi-foot {
          font-size: 12px;
          color: var(--text-muted);
        }

        .entity-item {
          background: var(--bg-input);
          border: 1px solid var(--border-subtle);
          border-radius: 10px;
          padding: 14px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          transition: border-color 0.15s ease;
        }

        .entity-item:hover {
          border-color: var(--border-strong);
        }

        .bloqueio-alerta-box {
          margin-top: 6px;
          padding: 7px 11px;
          border-radius: 8px;
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.3);
          color: #fde68a;
          font-size: 12px;
        }

        @media (max-width: 1120px) {
          .kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .grid-split {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* BARRA LATERAL ESTRUTURADA */}
      <aside className="erp-sidebar">
        <div>
          <div className="brand-box">
            <div className="brand-logo">AC</div>
            <div>
              <h2 className="brand-title">Ativa Contábil</h2>
              <span className="brand-sub">Gestão Fiscal & Workflow</span>
            </div>
          </div>

          <div className="nav-section-label">Visão Executiva</div>
          <button onClick={() => setAbaAtiva('inicio')} className={`nav-item ${abaAtiva === 'inicio' ? 'active' : ''}`}>
            <span>📊 Dashboard Gerencial</span>
            {rotinasComBloqueio.length > 0 ? (
              <span
                className="nav-pill"
                style={{ background: 'rgba(245, 158, 11, 0.22)', color: '#fbbf24' }}
                title="Rotinas com bloqueio ou observação do colaborador"
              >
                {rotinasComBloqueio.length} nota(s)
              </span>
            ) : (
              rotinasSemResponsavel.length > 0 && (
                <span
                  className="nav-pill"
                  style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}
                  title="Tarefas sem responsável"
                >
                  {rotinasSemResponsavel.length} avulsa(s)
                </span>
              )
            )}
          </button>

          <div className="nav-section-label">Operação Fiscal</div>
          <button onClick={() => setAbaAtiva('matriz')} className={`nav-item ${abaAtiva === 'matriz' ? 'active' : ''}`}>
            <span>📋 Matriz de Entregas</span>
          </button>
          <button onClick={() => setAbaAtiva('rotinas')} className={`nav-item ${abaAtiva === 'rotinas' ? 'active' : ''}`}>
            <span>📅 Rotinas Fiscais</span>
            <span className="nav-pill" title="Rotinas em aberto">
              {rotinasEmAbertoCount}
            </span>
          </button>
          <button onClick={() => setAbaAtiva('lote')} className={`nav-item ${abaAtiva === 'lote' ? 'active' : ''}`}>
            <span>📦 Atribuição em Lote</span>
            {lotesCriados.length > 0 && <span className="nav-pill">{lotesCriados.length}</span>}
          </button>

          <div className="nav-section-label">Cadastros & Governança</div>
          <button
            onClick={() => setAbaAtiva('empresas')}
            className={`nav-item ${abaAtiva === 'empresas' ? 'active' : ''}`}
          >
            <span>🏢 Empresas Clientes</span>
            <span className="nav-pill">{empresas.length}</span>
          </button>
          <button
            onClick={() => setAbaAtiva('colaboradores')}
            className={`nav-item ${abaAtiva === 'colaboradores' ? 'active' : ''}`}
          >
            <span>👥 Colaboradores</span>
            <span className="nav-pill">{colaboradoresFiltradosPainel.length}</span>
          </button>
          <button
            onClick={() => setAbaAtiva('auditoria')}
            className={`nav-item ${abaAtiva === 'auditoria' ? 'active' : ''}`}
          >
            <span>🛡️ Trilha de Auditoria</span>
            <span className="nav-pill">{logsAuditoria.length}</span>
          </button>
        </div>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">AD</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>Administrador</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Sócio / Gestor Contábil</div>
            </div>
          </div>
          <button type="button" onClick={encerrarSessao} className="btn-logout">
            Encerrar Sessão
          </button>
        </div>
      </aside>

      {/* ÁREA DE CONTEÚDO PRINCIPAL */}
      <main className="erp-main">
        <header className="erp-topbar">
          <div>
            <div className="breadcrumb">Ativa Contábil / {infoAba[abaAtiva].grupo}</div>
            <h1 className="page-title">{infoAba[abaAtiva].titulo}</h1>
            <p className="page-subtitle">{infoAba[abaAtiva].subtitulo}</p>
          </div>

          <div className="topbar-status">
            <span className="status-dot" />
            <span>
              Competência Ativa: <strong className="mono" style={{ color: '#f8fafc' }}>{competenciaMatriz}</strong>
            </span>
          </div>
        </header>

        <div className="erp-content">
          {/* 1. DASHBOARD EXECUTIVO (ABA INÍCIO) */}
          {abaAtiva === 'inicio' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {rotinasComBloqueio.length > 0 && (
                <div
                  style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    borderRadius: '14px',
                    padding: '18px 22px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span className="badge badge-warning">🚧 Bloqueios & Observações da Equipe</span>
                      <strong style={{ fontSize: '14.5px', color: '#fde68a' }}>
                        {rotinasComBloqueio.length} rotina(s) possuem anotação de bloqueio ou pendência registrada
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setApenasComBloqueio(true);
                        setAbaAtiva('rotinas');
                      }}
                      className="btn-secondary"
                    >
                      Ver no Cronograma →
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {rotinasComBloqueio.slice(0, 5).map((rot: any, idx: number) => {
                      const nota = obterAnotacaoBloqueio(rot);
                      const nomeColab = getRotinaColabNome(rot) || 'Colaborador';
                      return (
                        <div
                          key={idx}
                          style={{
                            background: 'rgba(11, 17, 30, 0.8)',
                            border: '1px solid rgba(245, 158, 11, 0.22)',
                            borderRadius: '9px',
                            padding: '10px 14px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '12px',
                            flexWrap: 'wrap'
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: '13.5px', color: '#f8fafc' }}>
                              {rot.titulo || rot.nome || 'Rotina Fiscal'}
                            </strong>
                            <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '10px' }}>
                              🏢 {rot.empresa?.nome || rot.empresa?.razaoSocial || 'Empresa'} • 👤 {nomeColab}
                            </span>
                            <div style={{ fontSize: '12.5px', color: '#fbbf24', marginTop: '3px' }}>
                              🚧 {nota}
                            </div>
                          </div>
                          <button type="button" onClick={() => editarRotina(rot)} className="btn-edit">
                            Tratar / Editar
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {rotinasSemResponsavel.length > 0 && (
                <div
                  style={{
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.28)',
                    borderRadius: '14px',
                    padding: '18px 22px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span className="badge badge-warning">⚠️ Tarefas Sem Responsável</span>
                      <strong style={{ fontSize: '14.5px', color: '#fde68a' }}>
                        Existem {rotinasSemResponsavel.length} tarefa(s) avulsa(s) aguardando atribuição de colaborador
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFiltroColaborador('__SEM_RESPONSAVEL__');
                        setAbaAtiva('rotinas');
                      }}
                      className="btn-secondary"
                    >
                      Filtrar no Cronograma →
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {rotinasSemResponsavel.map((rot: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          background: 'rgba(11, 17, 30, 0.8)',
                          border: '1px solid rgba(245, 158, 11, 0.22)',
                          borderRadius: '9px',
                          padding: '10px 14px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '12px',
                          flexWrap: 'wrap'
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: '13.5px', color: '#f8fafc' }}>
                            {rot.titulo || rot.nome || 'Rotina Fiscal'}
                          </strong>
                          <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '10px' }}>
                            🏢 {rot.empresa?.nome || rot.empresa?.razaoSocial || 'Empresa não vinculada'} •{' '}
                            <span className="mono">
                              Venc.: {rot.dataVencimentoCalculada || rot.dataVencimento || rot.vencimento || 'N/D'}
                            </span>
                          </span>
                        </div>
                        <button type="button" onClick={() => editarRotina(rot)} className="btn-edit">
                          Atribuir Responsável
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="kpi-grid">
                <div className="kpi-card" style={{ '--kpi-accent': '#38bdf8' } as React.CSSProperties}>
                  <div className="kpi-label">Obrigações em Aberto</div>
                  <div className="kpi-value">{rotinasEmAbertoCount}</div>
                  <div className="kpi-foot">
                    {totalRotinas} mapeadas • {rotinasSemResponsavel.length} sem responsável
                  </div>
                </div>

                <div className="kpi-card" style={{ '--kpi-accent': '#22c55e' } as React.CSSProperties}>
                  <div className="kpi-label">Taxa de Entrega</div>
                  <div className="kpi-value" style={{ color: '#4ade80' }}>
                    {taxaPontualidade}%
                  </div>
                  <div className="kpi-foot">
                    {concluidasCount} concluídas • {emAndamentoCount} em execução • {pendentesCount} pendentes
                  </div>
                </div>

                <div className="kpi-card" style={{ '--kpi-accent': '#ef4444' } as React.CSSProperties}>
                  <div className="kpi-label">Pendências Críticas</div>
                  <div className="kpi-value" style={{ color: atrasadasCount > 0 ? '#f87171' : '#f8fafc' }}>
                    {atrasadasCount}
                  </div>
                  <div className="kpi-foot">Obrigações vencidas ou em atraso</div>
                </div>

                <div className="kpi-card" style={{ '--kpi-accent': '#f59e0b' } as React.CSSProperties}>
                  <div className="kpi-label">Bloqueios / Notas</div>
                  <div className="kpi-value" style={{ color: rotinasComBloqueio.length > 0 ? '#fbbf24' : '#f8fafc' }}>
                    {rotinasComBloqueio.length}
                  </div>
                  <div className="kpi-foot">Anotações registradas pela equipe</div>
                </div>
              </div>

              <div
                className="grid-split"
                style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: '24px', alignItems: 'start' }}
              >
                <div className="erp-card">
                  <div className="card-header">
                    <h3 className="card-title">Produtividade & Distribuição de Carga</h3>
                    <button onClick={() => setAbaAtiva('rotinas')} className="btn-secondary">
                      Abrir Cronograma →
                    </button>
                  </div>

                  {cargaPorColaborador.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: '13.5px' }}>
                      Nenhum colaborador cadastrado para exibição de produtividade.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {cargaPorColaborador.map((item) => {
                        const pctConcluido = item.total > 0 ? Math.round((item.feitas / item.total) * 100) : 0;
                        return (
                          <div key={item.id} className="entity-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '8px',
                                flexWrap: 'wrap'
                              }}
                            >
                              <strong style={{ fontSize: '14px' }}>{item.nome}</strong>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <span className="badge badge-warning">{item.abertas} abertas</span>
                                <span className="badge badge-success">{item.feitas} concluídas</span>
                                {item.bloqueios > 0 && (
                                  <span className="badge badge-warning">{item.bloqueios} bloqueio(s)</span>
                                )}
                                {item.atrasos > 0 && <span className="badge badge-danger">{item.atrasos} atraso(s)</span>}
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                              <div
                                style={{
                                  flex: 1,
                                  height: '7px',
                                  background: '#1e293b',
                                  borderRadius: '999px',
                                  overflow: 'hidden'
                                }}
                              >
                                <div
                                  style={{
                                    width: `${pctConcluido}%`,
                                    height: '100%',
                                    background: item.atrasos > 0 ? '#f59e0b' : '#22c55e',
                                    transition: 'width 0.3s ease'
                                  }}
                                />
                              </div>
                              <span className="mono" style={{ fontSize: '12px', color: '#94a3b8' }}>
                                {pctConcluido}% ({item.feitas}/{item.total})
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="erp-card">
                  <div className="card-header">
                    <h3 className="card-title">Alertas de Vencimento & Risco</h3>
                    <span className={`badge ${rotinasCriticas.length > 0 ? 'badge-danger' : 'badge-success'}`}>
                      {rotinasCriticas.length} alerta(s)
                    </span>
                  </div>

                  {rotinasCriticas.length === 0 ? (
                    <div
                      style={{
                        background: 'var(--bg-input)',
                        padding: '18px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-subtle)',
                        color: '#94a3b8',
                        fontSize: '13.5px'
                      }}
                    >
                      Nenhuma obrigação vencida ou com prazo crítico para hoje.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {rotinasCriticas.slice(0, 6).map((rot: any, idx: number) => {
                        const nota = obterAnotacaoBloqueio(rot);
                        return (
                          <div
                            key={idx}
                            style={{
                              background: 'rgba(239, 68, 68, 0.08)',
                              border: '1px solid rgba(239, 68, 68, 0.28)',
                              borderRadius: '10px',
                              padding: '12px 14px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '10px'
                            }}
                          >
                            <div>
                              <strong style={{ color: '#fca5a5', fontSize: '13.5px' }}>
                                {rot.titulo || rot.nome || 'Rotina Fiscal'}
                              </strong>
                              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                                {rot.empresa?.nome || rot.empresa?.razaoSocial || 'Empresa não vinculada'}
                              </div>
                              {nota && (
                                <div style={{ fontSize: '11.5px', color: '#fbbf24', marginTop: '3px' }}>
                                  🚧 {nota}
                                </div>
                              )}
                            </div>
                            <span className="badge badge-danger mono">
                              {rot.dataVencimentoCalculada || rot.dataVencimento || rot.vencimento}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. EMPRESAS CLIENTES */}
          {abaAtiva === 'empresas' && (
            <div
              className="grid-split"
              style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: '28px', alignItems: 'start' }}
            >
              <div className="erp-card">
                <div className="card-header">
                  <h3 className="card-title">
                    {editandoEmpresaId ? 'Editar Empresa Cliente' : 'Cadastrar Empresa Cliente'}
                  </h3>
                </div>

                <form onSubmit={salvarEmpresa} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Razão Social / Nome Empresarial *</label>
                    <input
                      type="text"
                      placeholder="Ex: Comercial Silva Ltda"
                      value={novaEmpresa.nome}
                      onChange={(e) => setNovaEmpresa({ ...novaEmpresa, nome: e.target.value })}
                      className="erp-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">CNPJ *</label>
                    <input
                      type="text"
                      placeholder="00.000.000/0001-00"
                      value={novaEmpresa.cnpj}
                      onChange={(e) => setNovaEmpresa({ ...novaEmpresa, cnpj: e.target.value })}
                      className="erp-input mono"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Enquadramento / Regime Tributário</label>
                    <select
                      value={novaEmpresa.tipo}
                      onChange={(e) => setNovaEmpresa({ ...novaEmpresa, tipo: e.target.value })}
                      className="erp-select"
                    >
                      <option value="MEI">MEI — Microempreendedor Individual</option>
                      <option value="ME">ME — Microempresa (Simples Nacional)</option>
                      <option value="EPP">EPP — Empresa de Pequeno Porte</option>
                      <option value="Lucro Presumido">Lucro Presumido</option>
                      <option value="Lucro Real">Lucro Real</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Sócio / Contato Responsável</label>
                    <input
                      type="text"
                      placeholder="Nome do administrador da empresa"
                      value={novaEmpresa.responsavel}
                      onChange={(e) => setNovaEmpresa({ ...novaEmpresa, responsavel: e.target.value })}
                      className="erp-input"
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                    <button type="submit" className="btn-primary">
                      {editandoEmpresaId ? 'Salvar Alterações' : 'Cadastrar Empresa'}
                    </button>
                    {editandoEmpresaId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditandoEmpresaId(null);
                          setNovaEmpresa({ nome: '', cnpj: '', tipo: 'MEI', responsavel: '' });
                        }}
                        className="btn-secondary"
                        style={{ width: '100%', padding: '10px' }}
                      >
                        Cancelar Edição
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="erp-card">
                <div className="card-header">
                  <h3 className="card-title">Carteira Ativa ({empresasFiltradasLista.length})</h3>
                  <input
                    type="text"
                    placeholder="Buscar por Razão Social ou CNPJ..."
                    value={buscaEmpresa}
                    onChange={(e) => setBuscaEmpresa(e.target.value)}
                    className="erp-input"
                    style={{ width: '270px', padding: '8px 12px' }}
                  />
                </div>

                {empresasFiltradasLista.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '13.5px' }}>Nenhuma empresa encontrada na carteira.</p>
                ) : (
                  <div className="erp-table-wrap">
                    <table className="erp-table">
                      <thead>
                        <tr>
                          <th>Razão Social</th>
                          <th>CNPJ</th>
                          <th>Regime</th>
                          <th style={{ textAlign: 'right' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {empresasFiltradasLista.map((emp: any, i: number) => (
                          <tr key={i}>
                            <td>
                              <strong>{emp.nome || emp.razaoSocial}</strong>
                              {emp.responsavel && (
                                <div style={{ fontSize: '11.5px', color: '#64748b' }}>Contato: {emp.responsavel}</div>
                              )}
                            </td>
                            <td className="mono" style={{ color: '#94a3b8' }}>
                              {emp.cnpj}
                            </td>
                            <td>
                              <span className="badge badge-pending">{emp.regimeTributario || emp.tipo}</span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '8px' }}>
                                <button onClick={() => editarEmpresa(emp)} className="btn-edit">
                                  Editar
                                </button>
                                <button
                                  onClick={() => excluirEmpresa(emp.idEmpresa || emp.id)}
                                  className="btn-danger"
                                >
                                  Excluir
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. COLABORADORES */}
          {abaAtiva === 'colaboradores' && (
            <div
              className="grid-split"
              style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: '28px', alignItems: 'start' }}
            >
              <div className="erp-card">
                <div className="card-header">
                  <h3 className="card-title">{editandoColabId ? 'Editar Colaborador' : 'Cadastrar Colaborador'}</h3>
                </div>

                <form onSubmit={salvarColaborador} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Nome Completo *</label>
                    <input
                      type="text"
                      placeholder="Ex: Mariana Costa"
                      value={novoColaborador.nome}
                      onChange={(e) => setNovoColaborador({ ...novoColaborador, nome: e.target.value })}
                      className="erp-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">E-mail Corporativo *</label>
                    <input
                      type="email"
                      placeholder="mariana@ativacontabil.com.br"
                      value={novoColaborador.email}
                      onChange={(e) => setNovoColaborador({ ...novoColaborador, email: e.target.value })}
                      className="erp-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Senha de Acesso {editandoColabId ? '(deixe em branco para manter)' : '*'}
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={novoColaborador.senha}
                      onChange={(e) => setNovoColaborador({ ...novoColaborador, senha: e.target.value })}
                      className="erp-input"
                      required={!editandoColabId}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                    <button type="submit" className="btn-primary">
                      {editandoColabId ? 'Atualizar Colaborador' : 'Cadastrar Colaborador'}
                    </button>
                    {editandoColabId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditandoColabId(null);
                          setNovoColaborador({ nome: '', email: '', senha: '', perfil: 'COLABORADOR' });
                        }}
                        className="btn-secondary"
                        style={{ width: '100%', padding: '10px' }}
                      >
                        Cancelar Edição
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="erp-card">
                <div className="card-header">
                  <h3 className="card-title">Equipe Técnica ({colaboradoresFiltradosPainel.length})</h3>
                </div>

                {colaboradoresFiltradosPainel.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '13.5px' }}>Nenhum colaborador registado.</p>
                ) : (
                  <div className="erp-table-wrap">
                    <table className="erp-table">
                      <thead>
                        <tr>
                          <th>Colaborador</th>
                          <th>E-mail</th>
                          <th>Perfil</th>
                          <th style={{ textAlign: 'right' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {colaboradoresFiltradosPainel.map((col: any, i: number) => (
                          <tr key={i}>
                            <td>
                              <strong>{col.nome}</strong>
                            </td>
                            <td style={{ color: '#94a3b8' }}>{col.email}</td>
                            <td>
                              <span className="badge badge-pending">{col.perfilAcesso || col.perfil}</span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '8px' }}>
                                <button onClick={() => editarColaborador(col)} className="btn-edit">
                                  Editar
                                </button>
                                <button
                                  onClick={() => excluirColaborador(col.idUsuario || col.id)}
                                  className="btn-danger"
                                >
                                  Excluir
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. ROTINAS FISCAIS */}
          {abaAtiva === 'rotinas' && (
            <div
              className="grid-split"
              style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: '28px', alignItems: 'start' }}
            >
              <div className="erp-card">
                <div className="card-header">
                  <h3 className="card-title">{editandoRotinaId ? 'Editar Obrigação Fiscal' : 'Lançar Nova Obrigação'}</h3>
                </div>

                <form onSubmit={salvarRotina} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div className="form-group">
                    <label className="form-label">Título da Obrigação *</label>
                    <input
                      type="text"
                      placeholder="Ex: Apuração ICMS / Guia DAS"
                      value={novaRotina.titulo}
                      onChange={(e) => setNovaRotina({ ...novaRotina, titulo: e.target.value })}
                      className="erp-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Instruções / Observações</label>
                    <input
                      type="text"
                      placeholder="Detalhes operacionais ou competência"
                      value={novaRotina.descricao}
                      onChange={(e) => setNovaRotina({ ...novaRotina, descricao: e.target.value })}
                      className="erp-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Bloqueio / Pendência do Colaborador</label>
                    <input
                      type="text"
                      placeholder="Ex: Aguardando envio de XML ou resolução do gestor"
                      value={novaRotina.anotacaoBloqueio}
                      onChange={(e) => setNovaRotina({ ...novaRotina, anotacaoBloqueio: e.target.value })}
                      className="erp-input"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Data de Vencimento *</label>
                      <input
                        type="date"
                        value={novaRotina.dataVencimento}
                        onChange={(e) => setNovaRotina({ ...novaRotina, dataVencimento: e.target.value })}
                        className="erp-input"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <select
                        value={novaRotina.status}
                        onChange={(e) => setNovaRotina({ ...novaRotina, status: e.target.value })}
                        className="erp-select"
                      >
                        <option value="Pendente">Pendente</option>
                        <option value="Em Andamento">Em Andamento</option>
                        <option value="Concluída">Concluída</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Empresa Cliente *</label>
                    <select
                      value={novaRotina.empresaId}
                      onChange={(e) => setNovaRotina({ ...novaRotina, empresaId: e.target.value })}
                      className="erp-select"
                      required
                    >
                      <option value="">Selecione a empresa...</option>
                      {empresas.map((emp: any) => (
                        <option key={getEmpId(emp)} value={getEmpId(emp)}>
                          {emp.nome || emp.razaoSocial} ({emp.cnpj})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Colaborador Responsável (opcional — deixe vazio p/ avulsa)</label>
                    <select
                      value={novaRotina.colaboradorId}
                      onChange={(e) => setNovaRotina({ ...novaRotina, colaboradorId: e.target.value })}
                      className="erp-select"
                    >
                      <option value="">Sem responsável (Tarefa avulsa)</option>
                      {colaboradores.map((col: any) => (
                        <option key={getColabId(col)} value={getColabId(col)}>
                          {col.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                    <button type="submit" className="btn-primary">
                      {editandoRotinaId ? 'Atualizar Obrigação' : 'Lançar Obrigação'}
                    </button>
                    {editandoRotinaId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditandoRotinaId(null);
                          setNovaRotina({
                            titulo: '',
                            descricao: '',
                            anotacaoBloqueio: '',
                            dataVencimento: '',
                            empresaId: '',
                            colaboradorId: '',
                            status: 'Pendente'
                          });
                        }}
                        className="btn-secondary"
                        style={{ width: '100%', padding: '10px' }}
                      >
                        Cancelar Edição
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="erp-card">
                <div className="card-header">
                  <h3 className="card-title">
                    Cronograma Operacional ({rotinasFiltradasEmAbertoCount} em aberto)
                  </h3>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setApenasComBloqueio((prev) => !prev)}
                      className={apenasComBloqueio ? 'btn-edit' : 'btn-secondary'}
                    >
                      {apenasComBloqueio
                        ? '🚧 Mostrando só com bloqueio/nota'
                        : `🚧 Com bloqueio/nota (${rotinasComBloqueio.length})`}
                    </button>
                    {filtroColaborador === '__SEM_RESPONSAVEL__' && (
                      <button type="button" onClick={() => setFiltroColaborador('')} className="btn-secondary">
                        Limpar filtro de avulsas
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
                  <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="erp-select">
                    <option value="">Todos os Status</option>
                    <option value="Pendente">Pendente</option>
                    <option value="Em Andamento">Em Andamento</option>
                    <option value="Concluída">Concluída</option>
                  </select>

                  <select value={filtroEmpresa} onChange={(e) => setFiltroEmpresa(e.target.value)} className="erp-select">
                    <option value="">Todas as Empresas</option>
                    {empresas.map((emp: any) => (
                      <option key={getEmpId(emp)} value={getEmpId(emp)}>
                        {emp.nome || emp.razaoSocial}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filtroColaborador}
                    onChange={(e) => setFiltroColaborador(e.target.value)}
                    className="erp-select"
                  >
                    <option value="">Todos os Responsáveis</option>
                    <option value="__SEM_RESPONSAVEL__">⚠️ Sem responsável (Avulsas)</option>
                    {colaboradores.map((col: any) => (
                      <option key={getColabId(col)} value={getColabId(col)}>
                        {col.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {rotinasFiltradas.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '13.5px' }}>Nenhuma rotina encontrada para os filtros aplicados.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {rotinasFiltradas.map((rot: any, i: number) => {
                      const tituloExibido = rot.titulo || rot.nome || rot.rotinaNome || rot.tarefaNome || 'Rotina Fiscal';
                      const descricaoExibida = rot.descricao || '';
                      const notaBloqueio = obterAnotacaoBloqueio(rot);
                      const venc = rot.dataVencimentoCalculada || rot.dataVencimento || rot.vencimento || 'Não definida';
                      const nomeResp =
                        rot.responsavel?.nome || rot.colaborador?.nome || rot.usuario?.nome || getRotinaColabNome(rot);
                      const semResp = !nomeResp;

                      return (
                        <div key={i} className="entity-item">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                              <strong style={{ fontSize: '14.5px', color: '#f8fafc' }}>{tituloExibido}</strong>
                              <span className={`badge ${getBadgeStatus(rot.status || 'Pendente')}`}>
                                {rot.status || 'Pendente'}
                              </span>
                              {notaBloqueio && <span className="badge badge-warning">🚧 Bloqueio/Nota</span>}
                              {semResp && <span className="badge badge-warning">Sem responsável</span>}
                            </div>

                            {descricaoExibida && (
                              <span style={{ fontSize: '12.5px', color: '#94a3b8' }}>{descricaoExibida}</span>
                            )}

                            {notaBloqueio && (
                              <div className="bloqueio-alerta-box">
                                <strong>Observação do colaborador:</strong> {notaBloqueio}
                              </div>
                            )}

                            <div
                              style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '14px',
                                fontSize: '12px',
                                color: '#94a3b8',
                                marginTop: '2px'
                              }}
                            >
                              <span>
                                🏢{' '}
                                <strong style={{ color: '#cbd5e1' }}>
                                  {rot.empresa?.nome || rot.empresa?.razaoSocial || 'N/D'}
                                </strong>
                              </span>
                              <span>
                                👤{' '}
                                <strong style={{ color: semResp ? '#fbbf24' : '#cbd5e1' }}>
                                  {semResp ? 'Sem responsável (Avulsa)' : nomeResp}
                                </strong>
                              </span>
                              <span className="mono">⏰ Venc.: {venc}</span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                            <button onClick={() => editarRotina(rot)} className="btn-edit">
                              Editar
                            </button>
                            <button
                              onClick={() => excluirRotina(getRotinaIdUnico(rot))}
                              className="btn-danger"
                            >
                              Excluir
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. MATRIZ DE ENTREGAS POR COMPETÊNCIA */}
          {abaAtiva === 'matriz' && (
            <div className="erp-card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Controle de Entregas por Competência</h3>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                    Clique em um status na tabela para alternar rapidamente entre Pendente, Em Andamento e Concluído.
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span className="badge badge-success">Concluído</span>
                    <span className="badge badge-warning">Em Andamento</span>
                    <span className="badge badge-pending">Pendente</span>
                    <span className="badge badge-danger">Atrasado</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>COMPETÊNCIA:</span>
                    <input
                      type="month"
                      value={competenciaMatriz}
                      onChange={(e) => setCompetenciaMatriz(e.target.value)}
                      className="erp-input mono"
                      style={{ width: '175px', padding: '7px 11px' }}
                    />
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '10px',
                  marginBottom: '20px'
                }}
              >
                <select
                  value={filtroMatrizColaborador}
                  onChange={(e) => setFiltroMatrizColaborador(e.target.value)}
                  className="erp-select"
                >
                  <option value="">Todos os Colaboradores</option>
                  <option value="__SEM_RESPONSAVEL__">⚠️ Sem responsável (Avulsas)</option>
                  {colaboradoresFiltradosPainel.map((col: any) => (
                    <option key={getColabId(col)} value={getColabId(col)}>
                      {col.nome}
                    </option>
                  ))}
                </select>

                <select
                  value={filtroMatrizEmpresa}
                  onChange={(e) => setFiltroMatrizEmpresa(e.target.value)}
                  className="erp-select"
                >
                  <option value="">Todas as Empresas</option>
                  {empresas.map((emp: any) => (
                    <option key={getEmpId(emp)} value={getEmpId(emp)}>
                      {emp.nome || emp.razaoSocial}
                    </option>
                  ))}
                </select>

                <select
                  value={filtroMatrizStatus}
                  onChange={(e) => setFiltroMatrizStatus(e.target.value)}
                  className="erp-select"
                >
                  <option value="">Todos os Status</option>
                  <option value="Pendente">Pendente</option>
                  <option value="Em Andamento">Em Andamento</option>
                  <option value="Concluída">Concluída</option>
                  <option value="Atrasado">Atrasado</option>
                </select>

                {(filtroMatrizColaborador || filtroMatrizEmpresa || filtroMatrizStatus) && (
                  <button
                    type="button"
                    onClick={() => {
                      setFiltroMatrizColaborador('');
                      setFiltroMatrizEmpresa('');
                      setFiltroMatrizStatus('');
                    }}
                    className="btn-secondary"
                  >
                    Limpar Filtros da Matriz
                  </button>
                )}
              </div>

              {empresasVisiveisMatriz.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '13.5px' }}>
                  Nenhuma empresa encontrada para os filtros selecionados na matriz.
                </p>
              ) : colunasObrigacoes.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '13.5px' }}>
                  Nenhuma obrigação registrada para a competência <strong className="mono">{competenciaMatriz}</strong>{' '}
                  com os filtros atuais.
                </p>
              ) : (
                <div className="erp-table-wrap">
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th style={{ minWidth: '250px' }}>Empresa Cliente</th>
                        <th style={{ minWidth: '140px' }}>Progresso</th>
                        {colunasObrigacoes.map((obrigacao, idx) => (
                          <th key={idx} style={{ textAlign: 'center', minWidth: '165px' }}>
                            {obrigacao}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {empresasVisiveisMatriz.map((emp: any, rIdx: number) => {
                        const celulas = colunasObrigacoes.map((obrigacao) => obterStatusCelulaMatriz(emp, obrigacao));
                        const aplicaveis = celulas.filter((c) => c.tarefa !== null);
                        const concluidasEmp = aplicaveis.filter((c) => c.label === 'Concluído').length;
                        const pctEmp =
                          aplicaveis.length > 0 ? Math.round((concluidasEmp / aplicaveis.length) * 100) : 0;

                        return (
                          <tr key={rIdx}>
                            <td>
                              <strong>{emp.nome || emp.razaoSocial}</strong>
                              <div className="mono" style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                {emp.cnpj} • {emp.regimeTributario || emp.tipo}
                              </div>
                            </td>
                            <td>
                              {aplicaveis.length === 0 ? (
                                <span style={{ fontSize: '12px', color: '#64748b' }}>Sem tarefas</span>
                              ) : (
                                <div>
                                  <div className="mono" style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0' }}>
                                    {concluidasEmp}/{aplicaveis.length} ({pctEmp}%)
                                  </div>
                                  <div
                                    style={{
                                      width: '100px',
                                      height: '5px',
                                      background: '#1e293b',
                                      borderRadius: '999px',
                                      marginTop: '5px',
                                      overflow: 'hidden'
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: `${pctEmp}%`,
                                        height: '100%',
                                        background: pctEmp === 100 ? '#22c55e' : '#3b82f6'
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </td>
                            {celulas.map((celula, cIdx) => {
                              const notaCelula = celula.tarefa ? obterAnotacaoBloqueio(celula.tarefa) : '';
                              return (
                                <td key={cIdx} style={{ textAlign: 'center' }}>
                                  {celula.tarefa ? (
                                    <button
                                      type="button"
                                      onClick={() => alternarStatusRapidoMatriz(celula.tarefa)}
                                      className={`badge ${celula.className} matriz-status-btn`}
                                      title={`Vencimento: ${
                                        celula.tarefa.dataVencimentoCalculada ||
                                        celula.tarefa.dataVencimento ||
                                        celula.tarefa.vencimento ||
                                        '-'
                                      }${notaCelula ? ` • Nota: ${notaCelula}` : ''} — Clique para alterar status`}
                                    >
                                      {celula.label}
                                      {notaCelula ? ' 🚧' : ''}
                                    </button>
                                  ) : (
                                    <span className={`badge ${celula.className}`}>N/A</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 6. TRILHA DE AUDITORIA IMUTÁVEL */}
          {abaAtiva === 'auditoria' && (
            <div className="erp-card">
              <div className="card-header">
                <h3 className="card-title">Log Cronológico de Governança</h3>
                <span className="badge badge-pending mono">{logsAuditoria.length} registro(s)</span>
              </div>

              {logsAuditoria.length === 0 ? (
                <div
                  style={{
                    background: 'var(--bg-input)',
                    padding: '20px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)',
                    color: '#94a3b8',
                    fontSize: '13.5px'
                  }}
                >
                  Nenhuma movimentação registrada ainda. Toda criação, edição, conclusão ou exclusão de rotina é gravada
                  automaticamente aqui.
                </div>
              ) : (
                <div className="erp-table-wrap">
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th style={{ width: '175px' }}>Data / Hora</th>
                        <th style={{ width: '170px' }}>Evento</th>
                        <th>Descrição da Operação</th>
                        <th style={{ width: '190px' }}>Responsável</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logsAuditoria.map((log) => {
                        const badgeClass =
                          log.acao === 'CONCLUSÃO'
                            ? 'badge-success'
                            : log.acao === 'EXCLUSÃO'
                            ? 'badge-danger'
                            : log.acao === 'CRIAÇÃO' || log.acao === 'CRIAÇÃO EM LOTE'
                            ? 'badge-pending'
                            : 'badge-warning';

                        return (
                          <tr key={log.id}>
                            <td className="mono" style={{ fontSize: '12px', color: '#94a3b8' }}>
                              {log.dataHora}
                            </td>
                            <td>
                              <span className={`badge ${badgeClass}`}>{log.acao}</span>
                            </td>
                            <td>{log.detalhes}</td>
                            <td style={{ color: '#cbd5e1', fontWeight: 500 }}>{log.usuario}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 7. ATRIBUIÇÃO EM LOTE (TAREFA EVENTUAL OU ROTINA RECORRENTE) */}
          {abaAtiva === 'lote' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div
                className="grid-split"
                style={{ display: 'grid', gridTemplateColumns: '440px 1fr', gap: '28px', alignItems: 'start' }}
              >
                <div className="erp-card">
                  <div className="card-header">
                    <h3 className="card-title">
                      {editandoLoteId ? 'Editar Atribuição em Lote' : 'Configuração do Lote'}
                    </h3>
                    {editandoLoteId && <span className="badge badge-warning">Editando Lote</span>}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
                    <button
                      type="button"
                      onClick={() => setLoteForm({ ...loteForm, tipoObrigacao: 'EVENTUAL' })}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border:
                          loteForm.tipoObrigacao === 'EVENTUAL'
                            ? '1px solid #3b82f6'
                            : '1px solid var(--border-subtle)',
                        background:
                          loteForm.tipoObrigacao === 'EVENTUAL' ? 'rgba(37, 99, 235, 0.18)' : 'var(--bg-input)',
                        color: '#f8fafc',
                        fontWeight: 600,
                        fontSize: '12.5px',
                        cursor: 'pointer'
                      }}
                    >
                      📌 Tarefa Eventual
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoteForm({ ...loteForm, tipoObrigacao: 'RECORRENTE' })}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border:
                          loteForm.tipoObrigacao === 'RECORRENTE'
                            ? '1px solid #3b82f6'
                            : '1px solid var(--border-subtle)',
                        background:
                          loteForm.tipoObrigacao === 'RECORRENTE' ? 'rgba(37, 99, 235, 0.18)' : 'var(--bg-input)',
                        color: '#f8fafc',
                        fontWeight: 600,
                        fontSize: '12.5px',
                        cursor: 'pointer'
                      }}
                    >
                      🔄 Rotina Recorrente
                    </button>
                  </div>

                  <form onSubmit={executarAtribuicaoEmLote} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div className="form-group">
                      <label className="form-label">
                        {loteForm.tipoObrigacao === 'RECORRENTE'
                          ? 'Nome da Rotina Recorrente *'
                          : 'Título da Tarefa Eventual *'}
                      </label>
                      <input
                        type="text"
                        placeholder={
                          loteForm.tipoObrigacao === 'RECORRENTE'
                            ? 'Ex: Guia DAS Simples Nacional'
                            : 'Ex: Declaração de Imposto de Renda'
                        }
                        value={loteForm.titulo}
                        onChange={(e) => setLoteForm({ ...loteForm, titulo: e.target.value })}
                        className="erp-input"
                        required
                      />
                    </div>

                    {loteForm.tipoObrigacao === 'EVENTUAL' ? (
                      <>
                        <div className="form-group">
                          <label className="form-label">Instruções / Escopo (opcional)</label>
                          <input
                            type="text"
                            placeholder="Observações aplicáveis a todo o lote"
                            value={loteForm.descricao}
                            onChange={(e) => setLoteForm({ ...loteForm, descricao: e.target.value })}
                            className="erp-input"
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div className="form-group">
                            <label className="form-label">Data de Vencimento *</label>
                            <input
                              type="date"
                              value={loteForm.dataVencimento}
                              onChange={(e) => setLoteForm({ ...loteForm, dataVencimento: e.target.value })}
                              className="erp-input"
                              required
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">Status</label>
                            <select
                              value={loteForm.status}
                              onChange={(e) => setLoteForm({ ...loteForm, status: e.target.value })}
                              className="erp-select"
                            >
                              <option value="Pendente">Pendente</option>
                              <option value="Em Andamento">Em Andamento</option>
                              <option value="Concluída">Concluída</option>
                            </select>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div className="form-group">
                            <label className="form-label">Recorrência *</label>
                            <select
                              value={loteForm.periodicidade}
                              onChange={(e) =>
                                setLoteForm({
                                  ...loteForm,
                                  periodicidade: e.target.value as PeriodicidadeRecorrencia
                                })
                              }
                              className="erp-select"
                            >
                              <option value="MENSAL">Mensal</option>
                              <option value="QUINZENAL">Quinzenal</option>
                              <option value="TRIMESTRAL">Trimestral</option>
                              <option value="SEMESTRAL">Semestral</option>
                              <option value="ANUAL">Anual</option>
                            </select>
                          </div>

                          <div className="form-group">
                            <label className="form-label">Dia Base (1 a 31) *</label>
                            <input
                              type="number"
                              min="1"
                              max="31"
                              placeholder="Ex: 20"
                              value={loteForm.diaBaseVencimento}
                              onChange={(e) => setLoteForm({ ...loteForm, diaBaseVencimento: e.target.value })}
                              className="erp-input mono"
                              required
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Departamento</label>
                          <select
                            value={loteForm.departamento}
                            onChange={(e) => setLoteForm({ ...loteForm, departamento: e.target.value })}
                            className="erp-select"
                          >
                            <option value="Fiscal">Fiscal</option>
                            <option value="Contábil">Contábil</option>
                            <option value="Pessoal">Pessoal</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Observação da Rotina Recorrente (opcional)</label>
                          <input
                            type="text"
                            placeholder={`${LABELS_PERIODICIDADE[loteForm.periodicidade]} • Base ${competenciaMatriz}`}
                            value={loteForm.descricao}
                            onChange={(e) => setLoteForm({ ...loteForm, descricao: e.target.value })}
                            className="erp-input"
                          />
                        </div>
                      </>
                    )}

                    <div className="form-group">
                      <label className="form-label">Colaborador Responsável (opcional — deixe vazio p/ avulsa)</label>
                      <select
                        value={loteForm.colaboradorId}
                        onChange={(e) => setLoteForm({ ...loteForm, colaboradorId: e.target.value })}
                        className="erp-select"
                      >
                        <option value="">Sem responsável (Tarefa avulsa)</option>
                        {colaboradores.map((col: any) => (
                          <option key={getColabId(col)} value={getColabId(col)}>
                            {col.nome}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button type="submit" disabled={enviandoLote} className="btn-primary">
                        {enviandoLote
                          ? 'Processando Lote...'
                          : editandoLoteId
                          ? `Salvar Alterações do Lote (${empresasSelecionadasLote.length})`
                          : loteForm.tipoObrigacao === 'RECORRENTE'
                          ? `Gerar ${LABELS_PERIODICIDADE[loteForm.periodicidade]} (${empresasSelecionadasLote.length})`
                          : `Gerar Tarefa Eventual (${empresasSelecionadasLote.length})`}
                      </button>

                      {editandoLoteId && (
                        <button
                          type="button"
                          onClick={cancelarEdicaoLote}
                          className="btn-secondary"
                          style={{ width: '100%', padding: '10px' }}
                        >
                          Cancelar Edição do Lote
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                <div className="erp-card">
                  <div className="card-header">
                    <h3 className="card-title">
                      Carteira Alvo ({empresasSelecionadasLote.length}/{empresas.length} selecionadas)
                    </h3>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button type="button" onClick={selecionarTodasEmpresasLote} className="btn-secondary">
                        Todas
                      </button>
                      <button type="button" onClick={() => selecionarPorRegimeLote('MEI')} className="btn-secondary">
                        Só MEI
                      </button>
                      <button
                        type="button"
                        onClick={() => selecionarPorRegimeLote('Simples Nacional')}
                        className="btn-secondary"
                      >
                        Simples
                      </button>
                      <button type="button" onClick={() => setEmpresasSelecionadasLote([])} className="btn-danger">
                        Limpar
                      </button>
                    </div>
                  </div>

                  {empresas.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: '13.5px' }}>Nenhuma empresa cliente cadastrada.</p>
                  ) : (
                    <div
                      style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '460px', overflowY: 'auto' }}
                    >
                      {empresas.map((emp: any) => {
                        const empId = getEmpId(emp);
                        const marcada = empresasSelecionadasLote.includes(empId);
                        return (
                          <label
                            key={empId}
                            style={{
                              background: marcada ? 'rgba(37, 99, 235, 0.14)' : 'var(--bg-input)',
                              padding: '13px 15px',
                              borderRadius: '10px',
                              border: marcada ? '1px solid #3b82f6' : '1px solid var(--border-subtle)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <input
                                type="checkbox"
                                checked={marcada}
                                onChange={() => alternarEmpresaLote(empId)}
                                style={{ width: '16px', height: '16px', accentColor: '#2563eb', cursor: 'pointer' }}
                              />
                              <div>
                                <strong style={{ fontSize: '13.5px', color: '#f8fafc' }}>
                                  {emp.nome || emp.razaoSocial}
                                </strong>
                                <div className="mono" style={{ fontSize: '11.5px', color: '#64748b' }}>
                                  CNPJ: {emp.cnpj}
                                </div>
                              </div>
                            </div>

                            <span className="badge badge-pending">{emp.regimeTributario || emp.tipo}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="erp-card">
                <div className="card-header">
                  <h3 className="card-title">Lotes Gerados ({lotesCriados.length})</h3>
                </div>

                {lotesCriados.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '13.5px' }}>
                    Nenhum lote gerado nesta sessão ainda. Ao gerar um lote acima, você poderá editá-lo ou excluí-lo aqui.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {lotesCriados.map((lote) => {
                      const listaDatas = lote.datasGeradas?.length ? lote.datasGeradas.join(', ') : lote.dataVencimento;
                      return (
                        <div key={lote.idLote} className="entity-item">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                              <strong style={{ fontSize: '14px', color: '#f8fafc' }}>{lote.titulo}</strong>
                              <span className="badge badge-pending">
                                {lote.tipoObrigacao === 'RECORRENTE'
                                  ? `${LABELS_PERIODICIDADE[lote.periodicidade || 'MENSAL']} • Dia ${lote.diaBaseVencimento} (${listaDatas})`
                                  : `Eventual • ${lote.dataVencimento}`}
                              </span>
                              <span className={`badge ${getBadgeStatus(lote.status)}`}>{lote.status}</span>
                              {!lote.colaboradorId && <span className="badge badge-warning">Sem responsável</span>}
                            </div>
                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                              🏢 <strong style={{ color: '#cbd5e1' }}>{lote.empresaIds.length} empresa(s)</strong> • 👤{' '}
                              <strong style={{ color: lote.colaboradorId ? '#cbd5e1' : '#fbbf24' }}>
                                {lote.colaboradorNome}
                              </strong>{' '}
                              • Criado em <span className="mono">{lote.criadoEm}</span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                            <button type="button" onClick={() => iniciarEdicaoLote(lote)} className="btn-edit">
                              Editar
                            </button>
                            <button type="button" onClick={() => excluirLoteRegistrado(lote)} className="btn-danger">
                              Excluir
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}