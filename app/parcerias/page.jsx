import { buscarParcerias } from '@/lib/api';
import { numero, porcento, dataHora } from '@/lib/formato';
import {
  Kpi, Secao, Metrica, Barras, GraficoSerie, Tabela,
} from '@/components/ui';
import Cabecalho, { diasDe } from '@/components/Cabecalho';
import FiltroInfluencer from './FiltroInfluencer';
import LinkParceria from './cadastro/LinkParceria';

export const metadata = { title: 'Parcerias — Predialnet' };

// Funil das parcerias no Assine Já (?parceria=<slug> no link). Cada número
// conta VISITANTES (sessões distintas), não cliques: quem consulta três CEPs
// é uma pessoa que consultou.

const NOMES_DOS_PLANOS = {
  black800: 'Black 800',
  '600mega': '600 Mega',
  '800mega': '800 Mega',
  '1giga': '1 Giga',
  gamer1giga: 'Gamer 1 Giga',
  sem_plano: 'Sem plano (consultor define)',
};

const SLUG = /^[a-z0-9_-]{1,40}$/;

const link = (base, params) => {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''));
  const s = q.toString();
  return s ? `${base}?${s}` : base;
};

export default async function Parcerias({ searchParams }) {
  const params = await searchParams;
  const dias = diasDe(params);
  const parceria = SLUG.test(params?.parceria || '') ? params.parceria : undefined;

  const resposta = await buscarParcerias(dias, parceria);
  const r = resposta.ok ? resposta.dados : null;
  const t = r?.totais;
  const info = r?.parceria_info;
  const comAcesso = r ? r.parcerias.filter((l) => l.visitantes > 0).length : 0;

  const csv = (tipo) => link('/parcerias/csv', { dias, parceria, tipo });

  return (
    <>
      <Cabecalho atual="/parcerias" dias={dias} filtros={{ parceria }} />

      <main className="pagina">
        <div className="topo-pagina">
          <div>
            <h1 className="titulo-pagina">
              Parcerias no Assine Já
              {parceria ? <span className="titulo-filtro"> · {info?.nome || parceria}</span> : null}
            </h1>
            <p className="subtitulo-pagina">
              {info ? (
                <>
                  {info.instagram ? (
                    <a className="link" href={`https://instagram.com/${info.instagram}`} target="_blank" rel="noopener noreferrer">@{info.instagram}</a>
                  ) : null}
                  {info.instagram ? ' · ' : ''}
                  {info.cadastrada ? <>link <code>assineja?parceria={info.slug}</code></> : (
                    <>link sem cadastro · <a className="link" href="/parcerias/cadastro">cadastrar</a></>
                  )}
                </>
              ) : (
                <>Visitantes que chegaram pelo link <code>assineja?parceria=…</code> e o que cada um fez.</>
              )}
            </p>
          </div>
          <div className="acoes">
            <a className="botao" href={csv('diario')}>Baixar planilha (por dia)</a>
            <a className="botao botao-fraco" href={csv('eventos')}>Eventos brutos</a>
          </div>
        </div>

        {!r ? (
          <div className="aviso">
            <strong>Não foi possível carregar as parcerias.</strong> {resposta.erro}
          </div>
        ) : (
          <>
            <div className="barra-filtro">
              <FiltroInfluencer conhecidas={r.parcerias_conhecidas} atual={parceria} dias={dias} />
              <a className="botao botao-fraco" href="/parcerias/cadastro">+ Cadastrar influencer</a>
            </div>

            {info?.cadastrada ? (
              <div style={{ marginBottom: 18 }}>
                <LinkParceria slug={info.slug} />
              </div>
            ) : null}

            <div className="grade-kpi">
              <Kpi
                rotulo="Visitantes"
                valor={numero(t.visitantes)}
                nota={parceria ? `no período de ${dias} dias` : `${numero(comAcesso)} influencer(s) com acesso`}
              />
              <Kpi
                rotulo="Consultaram o CEP"
                valor={numero(t.consultas)}
                nota={<><strong>{porcento(t.taxas.consulta)}</strong> dos visitantes</>}
              />
              <Kpi
                rotulo="Formulários completos"
                valor={numero(t.formularios)}
                nota={<><strong>{porcento(t.taxas.conversao)}</strong> de conversão</>}
              />
              <Kpi
                rotulo="Foram para o WhatsApp"
                valor={numero(t.whatsapp)}
                nota={<><strong>{porcento(t.taxas.whatsapp)}</strong> dos visitantes</>}
              />
              <Kpi rotulo="Atendidos no chat" valor={numero(t.chat)} nota="formulário que caiu no chat de vendas" />
            </div>

            <Secao titulo="Funil" nota="visitantes únicos em cada etapa">
              <div className="par">
                <div>
                  {/* Na ordem do funil, não por tamanho: onde o visitante para é a informação. */}
                  <Barras
                    dados={[
                      { rotulo: 'Abriram o Assine Já', valor: t.visitantes },
                      { rotulo: 'Consultaram o CEP', valor: t.consultas },
                      { rotulo: 'Tinham cobertura', valor: t.com_cobertura, extra: porcento(t.taxas.cobertura) },
                      { rotulo: 'Chegaram aos dados pessoais', valor: t.dados },
                      { rotulo: 'Enviaram o formulário', valor: t.formularios },
                    ]}
                    vazio="Nenhum acesso por parceria no período."
                  />
                </div>
                <div className="metricas">
                  <Metrica rotulo="Sem cobertura" valor={numero(t.sem_cobertura)} />
                  <Metrica rotulo="Cobertura a confirmar" valor={numero(t.cobertura_a_confirmar)} />
                  <Metrica rotulo="WhatsApp" valor={numero(t.whatsapp)} />
                  <Metrica rotulo="Envio falhou" valor={numero(t.envio_falhou)} />
                </div>
              </div>
              <p className="vazio" style={{ marginTop: 14 }}>
                &ldquo;Cobertura a confirmar&rdquo; é quando a consulta não respondeu e o lead seguiu
                mesmo assim, para o consultor conferir. WhatsApp conta o botão da página e o link do
                aviso de sucesso.
              </p>
            </Secao>

            <Secao titulo="Por dia" nota="horário de Brasília">
              <div className="colunas colunas-2">
                <div>
                  <div className="metrica-rotulo" style={{ marginBottom: 8 }}>Visitantes</div>
                  <GraficoSerie dados={r.serie_diaria.map((d) => ({ dia: d.dia, total: d.visitantes }))} altura={110} />
                </div>
                <div>
                  <div className="metrica-rotulo" style={{ marginBottom: 8 }}>Formulários completos</div>
                  <GraficoSerie dados={r.serie_diaria.map((d) => ({ dia: d.dia, total: d.formularios }))} altura={110} />
                </div>
              </div>
            </Secao>

            {!parceria ? (
              <Secao titulo="Por influencer" nota="cadastrados sem acesso aparecem com zero">
                <div className="tabela-rolagem">
                  <Tabela
                    vazio="Nenhuma parceria com acesso no período."
                    colunas={[
                      {
                        chave: 'parceria',
                        titulo: 'Influencer',
                        render: (l) => (
                          <>
                            <a className="link" href={link('/parcerias', { dias, parceria: l.parceria })}>{l.nome || l.parceria}</a>
                            <div className="tabela-sub">
                              {l.instagram ? `@${l.instagram}` : l.parceria}
                              {l.cadastrada === false ? ' · sem cadastro' : ''}
                            </div>
                          </>
                        ),
                      },
                      { chave: 'visitantes', titulo: 'Visitantes', num: true, render: (l) => numero(l.visitantes) },
                      { chave: 'consultas', titulo: 'Consultas', num: true, render: (l) => numero(l.consultas) },
                      { chave: 'com_cobertura', titulo: 'Com cobertura', num: true, render: (l) => numero(l.com_cobertura) },
                      { chave: 'formularios', titulo: 'Formulários', num: true, render: (l) => numero(l.formularios) },
                      { chave: 'conversao', titulo: 'Conversão', num: true, render: (l) => porcento(l.taxas.conversao) },
                      { chave: 'whatsapp', titulo: 'WhatsApp', num: true, render: (l) => numero(l.whatsapp) },
                      { chave: 'ultimo', titulo: 'Último acesso', num: true, render: (l) => dataHora(l.ultimo_evento) },
                    ]}
                    linhas={r.parcerias.map((l) => ({ ...l, id: l.parceria }))}
                  />
                </div>
              </Secao>
            ) : null}

            <Secao titulo="Planos escolhidos" nota="de quem enviou o formulário">
              <Barras
                dados={r.planos.map((p) => ({ rotulo: NOMES_DOS_PLANOS[p.plano] || p.plano, valor: p.total }))}
                tom="fraco"
                vazio="Nenhum formulário enviado no período."
              />
            </Secao>
          </>
        )}

        <footer className="rodape">
          <span>período de {dias} dias</span>
          <span>atualizado às {dataHora(new Date().toISOString())}</span>
        </footer>
      </main>
    </>
  );
}
