'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Indisponivel } from './ui';

const AUTO_ATUALIZA_MS = 10_000;

function tentarParsear(linha) {
  try {
    const obj = JSON.parse(linha);
    if (obj && typeof obj === 'object' && (obj.message || obj.level)) return obj;
  } catch {
    // linha não é JSON (ex.: stack trace de exceção não tratada) — mostra crua.
  }
  return null;
}

function LinhaLog({ linha }) {
  const obj = tentarParsear(linha);
  if (!obj) return <div className="log-linha">{linha}</div>;

  const { level, message, timestamp, ...resto } = obj;
  delete resto.dd; // metadata do APM, não interessa aqui
  const extra = Object.keys(resto).length ? ` ${JSON.stringify(resto)}` : '';

  return (
    <div className="log-linha">
      {level ? <span className="log-nivel" data-nivel={level}>{level}</span> : null}
      {timestamp ? <span className="log-timestamp">{timestamp}</span> : null}
      {message}
      {extra}
    </div>
  );
}

export default function PainelLogs({ inicial }) {
  const [arquivos, setArquivos] = useState(inicial.ok ? (inicial.dados.arquivos || []) : []);
  const [erroLista, setErroLista] = useState(inicial.ok ? null : inicial.erro);
  const [arquivoSelecionado, setArquivoSelecionado] = useState(
    () => (inicial.ok && inicial.dados.arquivos?.[0]?.arquivo) || '',
  );
  const [busca, setBusca] = useState('');
  const [linhas, setLinhas] = useState(200);
  const [conteudo, setConteudo] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const [autoAtualizar, setAutoAtualizar] = useState(false);
  const visorRef = useRef(null);

  const carregarConteudo = useCallback(async (arquivo, termo, qtdLinhas) => {
    if (!arquivo) return;
    setCarregando(true);
    try {
      const params = new URLSearchParams({ arquivo, linhas: String(qtdLinhas) });
      if (termo) params.set('busca', termo);
      const res = await fetch(`/api/sistema/logs?${params}`, { cache: 'no-store' });
      const data = await res.json();
      if (!data.ok) throw new Error(data.erro || 'Erro ao buscar o log.');
      setConteudo(data.dados);
      setErro(null);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarConteudo(arquivoSelecionado, busca, linhas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arquivoSelecionado]);

  useEffect(() => {
    if (!autoAtualizar) return undefined;
    const id = setInterval(() => carregarConteudo(arquivoSelecionado, busca, linhas), AUTO_ATUALIZA_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAtualizar, arquivoSelecionado, busca, linhas]);

  if (erroLista) return <Indisponivel motivo={erroLista} />;
  if (!arquivos.length) return <p className="vazio">Nenhum arquivo de log encontrado.</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="barra-filtro">
        <div className="filtro-influencer">
          <span className="filtro-rotulo">Arquivo</span>
          <select
            className="filtro-select"
            value={arquivoSelecionado}
            onChange={(e) => setArquivoSelecionado(e.target.value)}
          >
            {arquivos.map((a) => (
              <option key={a.arquivo} value={a.arquivo}>
                {a.arquivo} ({a.tamanhoMb.toFixed(1)} MB)
              </option>
            ))}
          </select>

          <span className="filtro-rotulo">Buscar</span>
          <input
            className="filtro-select"
            style={{ minWidth: 180 }}
            placeholder="termo no log..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') carregarConteudo(arquivoSelecionado, busca, linhas); }}
          />

          <span className="filtro-rotulo">Linhas</span>
          <select
            className="filtro-select"
            style={{ minWidth: 80 }}
            value={linhas}
            onChange={(e) => setLinhas(Number(e.target.value))}
          >
            {[100, 200, 500, 1000, 2000].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>

          <button
            type="button"
            className="botao botao-fraco"
            onClick={() => carregarConteudo(arquivoSelecionado, busca, linhas)}
            disabled={carregando}
          >
            {carregando ? 'Buscando...' : 'Buscar'}
          </button>

          <label style={{ fontSize: 12, color: 'var(--texto-medio)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={autoAtualizar} onChange={(e) => setAutoAtualizar(e.target.checked)} />
            Atualizar a cada 10s
          </label>
        </div>
      </div>

      {erro ? <div className="aviso">{erro}</div> : null}

      {conteudo ? (
        <>
          <p className="vazio" style={{ margin: 0 }}>
            {conteudo.tamanhoTotalMb.toFixed(1)} MB no total
            {conteudo.truncado ? ' — mostrando só o final do arquivo (últimos ~5 MB), busca não cobre o arquivo inteiro' : ''}
            {' · '}{conteudo.linhas.length} linha(s) encontrada(s)
          </p>
          <div className="log-visor" ref={visorRef}>
            {conteudo.linhas.length === 0 ? (
              <div className="log-linha" style={{ opacity: 0.6 }}>Nenhuma linha encontrada.</div>
            ) : (
              conteudo.linhas.map((linha, i) => <LinhaLog key={i} linha={linha} />) // eslint-disable-line react/no-array-index-key
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
