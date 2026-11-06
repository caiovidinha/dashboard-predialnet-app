'use client';

// Seletor de influencer. É um <form method="get"> comum — funciona até sem
// JavaScript (botão "Ver") —, e com JS troca a página assim que escolhe.
// O <select> nativo já filtra pela digitação: com a lista aberta, digitar
// "fu" pula para "Fulana".

export default function FiltroInfluencer({ conhecidas, atual, dias }) {
  const cadastrados = conhecidas.filter((p) => p.cadastrada);
  const avulsos = conhecidas.filter((p) => !p.cadastrada);

  const rotulo = (p) => `${p.nome}${p.instagram ? ` (@${p.instagram})` : ''}${p.ativo ? '' : ' — inativo'}`;

  return (
    <form method="get" action="/parcerias" className="filtro-influencer">
      <input type="hidden" name="dias" value={dias} />
      <label htmlFor="filtro-parceria" className="filtro-rotulo">Influencer</label>
      <select
        id="filtro-parceria"
        name="parceria"
        defaultValue={atual || ''}
        onChange={(e) => e.target.form.requestSubmit()}
        className="filtro-select"
      >
        <option value="">Todos os influencers</option>
        {cadastrados.length ? (
          <optgroup label="Cadastrados">
            {cadastrados.map((p) => <option key={p.slug} value={p.slug}>{rotulo(p)}</option>)}
          </optgroup>
        ) : null}
        {avulsos.length ? (
          <optgroup label="Links sem cadastro">
            {avulsos.map((p) => <option key={p.slug} value={p.slug}>{p.slug}</option>)}
          </optgroup>
        ) : null}
      </select>
      <noscript><button type="submit" className="botao botao-fraco">Ver</button></noscript>
      {atual ? <a href={`/parcerias?dias=${dias}`} className="filtro-limpar">limpar</a> : null}
    </form>
  );
}
