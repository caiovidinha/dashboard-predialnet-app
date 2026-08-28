import { buscarPainel, indisponivel } from '@/lib/api';
import {
  numero, porcento, mbps, ms, dataHora, distribuir,
} from '@/lib/formato';
import {
  Kpi, Secao, Metrica, Barras, GraficoSerie, Indisponivel,
} from '@/components/ui';

const PERIODOS = [
  { dias: 7, rotulo: '7 dias' },
  { dias: 30, rotulo: '30 dias' },
  { dias: 90, rotulo: '90 dias' },
  { dias: 365, rotulo: '12 meses' },
];

function SeletorPeriodo({ atual }) {
  return (
    <nav className="periodos">
      {PERIODOS.map((p) => (
        <a key={p.dias} href={`/?dias=${p.dias}`} className="periodo" data-ativo={p.dias === atual}>
          {p.rotulo}
        </a>
      ))}
    </nav>
  );
}

export default async function Painel({ searchParams }) {
  // No Next 15 searchParams é assíncrono.
  const params = await searchParams;
  const pedido = Number.parseInt(params?.dias, 10);
  const dias = PERIODOS.some((p) => p.dias === pedido) ? pedido : 30;

  const painel = await buscarPainel(dias);
  const { overview, usuarios, notificacoes, speedtest, upgrades } = painel;

  // Prefere o detalhe (mesmo número, e ainda traz a série); cai no overview se
  // aquele domínio específico falhou.
  const geral = overview.ok ? overview.dados : null;
  const u = usuarios.ok ? usuarios.dados : geral?.usuarios;
  const n = notificacoes.ok ? notificacoes.dados : geral?.notificacoes;
  const s = speedtest.ok ? speedtest.dados : geral?.speedtest;

  // O funil do Trello pode vir marcado como indisponível dentro de um 200 —
  // ali a API respondeu, quem não respondeu foi o Trello.
  const upgradesBruto = upgrades.ok ? upgrades.dados : geral?.upgrades;
  const g = indisponivel(upgradesBruto) ? null : upgradesBruto;

  const tudoFora = !overview.ok && !usuarios.ok && !speedtest.ok;

  return (
    <>
      <header className="cabecalho">
        <div className="cabecalho-interno">
          <div className="marca">
            {/* 1920x480 no arquivo — a proporção 4:1 é declarada aqui para o
                navegador reservar o espaço antes de baixar a imagem. */}
            <img
              src="/logo.png"
              alt="Predialnet"
              className="marca-logo"
              width={96}
              height={24}
            />
            <span className="marca-divisor" aria-hidden="true" />
            <span className="marca-sub">Painel</span>
          </div>
          <SeletorPeriodo atual={dias} />
        </div>
      </header>

      <main className="pagina">
        {tudoFora ? (
          <div className="aviso">
            <strong>Não foi possível falar com a API.</strong>{' '}
            {overview.erro}
            <br />
            Confira <code>API_URL</code> e <code>ADMIN_TOKEN</code> no <code>.env</code>.
          </div>
        ) : null}

        {/* ── Indicadores de topo ─────────────────────────── */}
        <div className="grade-kpi">
          <Kpi
            rotulo="Usuários"
            valor={numero(u?.total)}
            nota={u ? <><strong>+{numero(u.novos_periodo)}</strong> no período</> : null}
          />
          <Kpi
            rotulo="Com push ativo"
            valor={numero(u?.com_push)}
            nota={u ? `${numero(u.dispositivos)} dispositivos` : null}
          />
          <Kpi
            rotulo="Testes de velocidade"
            valor={numero(s?.testes)}
            nota={s ? `${mbps(s.download_medio)} em média` : null}
          />
          <Kpi
            rotulo="Notificações"
            valor={numero(n?.enviadas)}
            nota={n ? `${porcento(n.taxa_leitura)} de leitura` : null}
          />
          <Kpi
            rotulo="Upgrades convertidos"
            valor={numero(g?.convertidos)}
            nota={g ? <><strong>{porcento(g.taxa_conversao)}</strong> de conversão</> : null}
          />
        </div>

        {/* ── Upgrade de planos ───────────────────────────── */}
        <Secao
          titulo="Upgrade de planos"
          nota={g ? `${numero(g.total)} leads no board` : null}
        >
          {!g ? (
            <Indisponivel motivo={upgrades.erro ?? 'O board do Trello não respondeu.'} />
          ) : (
            <>
              <div className="metricas" style={{ marginBottom: 22 }}>
                <Metrica rotulo="Convertidos" valor={numero(g.convertidos)} />
                <Metrica rotulo="Não convertidos" valor={numero(g.nao_convertidos)} />
                <Metrica rotulo="Em andamento" valor={numero(g.em_andamento)} />
                <Metrica rotulo="Taxa de conversão" valor={porcento(g.taxa_conversao)} />
                <Metrica rotulo="Novos no período" valor={numero(g.novos_periodo)} />
              </div>

              <div className="par">
                <div>
                  <div className="metrica-rotulo" style={{ marginBottom: 10 }}>
                    Etapas do funil
                  </div>
                  {/* Na ordem do board, não por tamanho: a sequência das colunas
                      é a informação — ver onde o lead empaca importa mais que
                      saber qual coluna é a maior. */}
                  <Barras
                    dados={g.funil.map((l) => ({ rotulo: l.lista, valor: l.cartoes }))}
                  />
                </div>
                <div>
                  <div className="metrica-rotulo" style={{ marginBottom: 8 }}>
                    Novos leads por dia
                  </div>
                  <GraficoSerie dados={g.serie_novos} altura={110} />
                </div>
              </div>

              <p className="vazio" style={{ marginTop: 14 }}>
                A taxa considera apenas leads já decididos ({numero(g.convertidos)} convertidos
                de {numero(g.convertidos + g.nao_convertidos)}). Os {numero(g.em_andamento)} em
                andamento ficam de fora até virarem um ou outro.
              </p>
            </>
          )}
        </Secao>

        {/* ── Usuários ────────────────────────────────────── */}
        <Secao
          titulo="Base de usuários"
          nota={u?.sem_data_conhecida
            ? `${numero(u.sem_data_conhecida)} sem data de cadastro registrada`
            : null}
        >
          {!u ? <Indisponivel motivo={usuarios.erro} /> : (
            <div className="par">
              <div>
                <GraficoSerie dados={u.serie_cadastros} />
              </div>
              <div className="metricas">
                <Metrica rotulo="Total" valor={numero(u.total)} />
                <Metrica rotulo="Novos no período" valor={numero(u.novos_periodo)} />
                <Metrica rotulo="Com fatura aberta" valor={numero(u.com_fatura_aberta)} />
                <Metrica rotulo="Dispositivos" valor={numero(u.dispositivos)} />
              </div>
            </div>
          )}

          {/* O histórico anterior à coluna createdAt não existe — dizer isso é
              mais útil que deixar o gráfico parecer que a base nasceu ontem. */}
          {u?.sem_data_conhecida > 0 ? (
            <p className="vazio" style={{ marginTop: 14 }}>
              O gráfico cobre apenas cadastros feitos depois que a data de registro passou a
              ser gravada. Os {numero(u.sem_data_conhecida)} usuários anteriores entram no
              total, mas não na série.
            </p>
          ) : null}

          {u?.cobertura?.por_cidade?.length ? (
            <div style={{ marginTop: 22 }}>
              <div className="metrica-rotulo" style={{ marginBottom: 10 }}>
                Clientes por cidade ({numero(u.cobertura.enderecos_conhecidos)} endereços conhecidos)
              </div>
              <Barras
                dados={u.cobertura.por_cidade.slice(0, 8).map((x) => ({
                  rotulo: x.cidade, valor: x.clientes,
                }))}
              />
            </div>
          ) : null}
        </Secao>

        {/* ── Speedtest ───────────────────────────────────── */}
        <Secao titulo="Qualidade de conexão" nota="médias apenas de testes concluídos">
          {!s ? <Indisponivel motivo={speedtest.erro} /> : (
            <>
              <div className="metricas" style={{ marginBottom: 22 }}>
                <Metrica rotulo="Download médio" valor={mbps(s.download_medio)} />
                <Metrica rotulo="Upload médio" valor={mbps(s.upload_medio)} />
                <Metrica rotulo="Ping médio" valor={ms(s.ping_medio)} />
                <Metrica rotulo="Jitter médio" valor={ms(s.jitter_medio)} />
                <Metrica rotulo="Testes" valor={numero(s.testes)} />
              </div>

              <div className="colunas">
                <div>
                  <div className="metrica-rotulo" style={{ marginBottom: 10 }}>Por plataforma</div>
                  <Barras
                    dados={(s.por_plataforma ?? []).map((x) => ({
                      rotulo: x.platform,
                      valor: x.testes,
                      extra: mbps(x.download_medio),
                    }))}
                  />
                </div>
                <div>
                  <div className="metrica-rotulo" style={{ marginBottom: 10 }}>Por tipo de conexão</div>
                  <Barras
                    dados={(s.por_conexao ?? []).map((x) => ({
                      rotulo: x.connectionType,
                      valor: x.testes,
                      extra: mbps(x.download_medio),
                    }))}
                  />
                </div>
                <div>
                  <div className="metrica-rotulo" style={{ marginBottom: 10 }}>Resultado do teste</div>
                  <Barras dados={distribuir(s.por_status)} tom="fraco" />
                </div>
              </div>

              {s.por_versao_app?.length ? (
                <div style={{ marginTop: 22 }}>
                  <div className="metrica-rotulo" style={{ marginBottom: 10 }}>Versões do app em uso</div>
                  <Barras
                    dados={s.por_versao_app.slice(0, 6).map((x) => ({
                      rotulo: x.versao, valor: x.testes,
                    }))}
                    tom="fraco"
                  />
                </div>
              ) : null}
            </>
          )}
        </Secao>

        {/* ── Notificações ────────────────────────────────── */}
        <Secao titulo="Notificações push">
          {!n ? <Indisponivel motivo={notificacoes.erro} /> : (
            <div className="par">
              <div>
                <GraficoSerie dados={n.serie_envios} altura={110} />
              </div>
              <div className="metricas">
                <Metrica rotulo="Enviadas" valor={numero(n.enviadas)} />
                <Metrica rotulo="Falhas" valor={numero(n.falhas)} />
                <Metrica rotulo="Alcance" valor={numero(n.alcance)} />
                <Metrica rotulo="Taxa de leitura" valor={porcento(n.taxa_leitura)} />
              </div>
            </div>
          )}
        </Secao>

        <footer className="rodape">
          <span>
            {geral?.mensagens_app && !indisponivel(geral.mensagens_app)
              ? `${numero(geral.mensagens_app.ativas)} mensagem(ns) ativa(s) no app · `
              : ''}
            período de {dias} dias
          </span>
          <span>atualizado às {dataHora(new Date().toISOString())}</span>
        </footer>
      </main>
    </>
  );
}
