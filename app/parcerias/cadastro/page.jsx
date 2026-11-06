import { listarCadastro } from '@/lib/api';
import { dataHora } from '@/lib/formato';
import Cabecalho, { diasDe } from '@/components/Cabecalho';
import FormParceria from './FormParceria';
import LinkParceria from './LinkParceria';
import { alternarAtivo } from './acoes';

export const metadata = { title: 'Influencers — Predialnet' };

export default async function CadastroParcerias({ searchParams }) {
  const params = await searchParams;
  const dias = diasDe(params);
  const lista = await listarCadastro();
  const parcerias = lista.ok ? lista.dados : [];

  const editando = params?.editar ? parcerias.find((p) => p.id === params.editar) : null;
  const nova = params?.nova || null;
  const recemCriada = nova ? parcerias.find((p) => p.slug === nova) : null;
  const ativas = parcerias.filter((p) => p.ativo).length;

  return (
    <>
      <Cabecalho atual="/parcerias/cadastro" dias={dias} semPeriodo />

      <main className="pagina">
        <div className="topo-pagina">
          <div>
            <h1 className="titulo-pagina">Influencers</h1>
            <p className="subtitulo-pagina">
              Cadastre o influencer e copie o link dele. Cada acesso por esse link entra nos números da tela Parcerias.
            </p>
          </div>
        </div>

        {params?.erro ? <div className="aviso">{params.erro}</div> : null}
        {recemCriada ? (
          <div className="novo-link">
            <div className="novo-link-titulo">
              Link de <strong>{recemCriada.nome}</strong> pronto. Escolha o plano, se quiser, e copie:
            </div>
            <LinkParceria slug={recemCriada.slug} destaque />
          </div>
        ) : null}
        {params?.salvo ? <div className="aviso aviso-ok">Alterações salvas.</div> : null}

        <section className="secao">
          <div className="secao-topo">
            <h2 className="secao-titulo">{editando ? `Editar ${editando.nome}` : 'Novo influencer'}</h2>
          </div>
          <div className="secao-corpo">
            {/* key: trocar de "novo" para "editar X" recria o formulário com os valores certos */}
            <FormParceria key={editando?.id || 'novo'} parceria={editando} />
          </div>
        </section>

        <section className="secao">
          <div className="secao-topo">
            <h2 className="secao-titulo">Cadastrados</h2>
            <span className="secao-nota">{ativas} ativo(s) de {parcerias.length}</span>
          </div>
          <div className="secao-corpo">
            {!lista.ok ? (
              <div className="aviso"><strong>Não foi possível carregar o cadastro.</strong> {lista.erro}</div>
            ) : !parcerias.length ? (
              <div className="vazio">Nenhum influencer cadastrado ainda.</div>
            ) : (
              <ul className="lista-parcerias">
                {parcerias.map((p) => (
                  <li key={p.id} className="item-parceria" data-inativo={!p.ativo} data-nova={p.slug === nova}>
                    <div className="item-topo">
                      <div>
                        <div className="item-nome">
                          {p.nome}
                          {!p.ativo ? <span className="etiqueta">inativo</span> : null}
                          {p.slug === nova ? <span className="etiqueta etiqueta-nova">novo</span> : null}
                        </div>
                        <div className="item-sub">
                          {p.instagram ? (
                            <a className="link" href={`https://instagram.com/${p.instagram}`} target="_blank" rel="noopener noreferrer">@{p.instagram}</a>
                          ) : 'sem Instagram'}
                          {p.contato ? <> · {p.contato}</> : null}
                          {' · '}cadastrado em {dataHora(p.createdAt)}
                        </div>
                        {p.observacao ? <div className="item-obs">{p.observacao}</div> : null}
                      </div>
                      <div className="acoes">
                        <a className="botao botao-fraco" href={`/parcerias?parceria=${encodeURIComponent(p.slug)}`}>Ver números</a>
                        <a className="botao botao-fraco" href={`/parcerias/cadastro?editar=${encodeURIComponent(p.id)}`}>Editar</a>
                        <form action={alternarAtivo}>
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="ativo" value={p.ativo ? 'false' : 'true'} />
                          <button type="submit" className="botao botao-fraco">{p.ativo ? 'Desativar' : 'Reativar'}</button>
                        </form>
                      </div>
                    </div>
                    <LinkParceria slug={p.slug} destaque={p.slug === nova} />
                  </li>
                ))}
              </ul>
            )}
            <p className="vazio" style={{ marginTop: 12 }}>
              Desativar só tira o influencer da lista e da tabela quando ele não tem acessos. O link continua funcionando e contando.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
