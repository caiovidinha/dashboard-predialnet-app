import { numero, dataCurta, rotular } from '@/lib/formato';

// Componentes de apresentação do dashboard. Todos são Server Components —
// nenhum precisa de estado, então nenhum precisa ir para o navegador.

export function Kpi({ rotulo, valor, nota }) {
  return (
    <div className="kpi">
      <div className="kpi-rotulo">{rotulo}</div>
      <div className="kpi-valor">{valor}</div>
      {nota ? <div className="kpi-nota">{nota}</div> : null}
    </div>
  );
}

export function Secao({ titulo, nota, children }) {
  return (
    <section className="secao">
      <div className="secao-topo">
        <h2 className="secao-titulo">{titulo}</h2>
        {nota ? <span className="secao-nota">{nota}</span> : null}
      </div>
      <div className="secao-corpo">{children}</div>
    </section>
  );
}

export function Metrica({ rotulo, valor }) {
  return (
    <div>
      <div className="metrica-rotulo">{rotulo}</div>
      <div className="metrica-valor">{valor}</div>
    </div>
  );
}

export function Indisponivel({ motivo }) {
  return (
    <div className="indisponivel">
      <div>Dados indisponíveis</div>
      {motivo ? <div style={{ fontSize: 12 }}>{motivo}</div> : null}
    </div>
  );
}

// Lista de barras horizontais. A escala é relativa ao maior valor do próprio
// grupo — o que interessa aqui é a proporção entre as fatias, não o absoluto.
export function Barras({ dados, tom, formatar = numero, vazio = 'Sem dados no período.' }) {
  if (!dados?.length) return <div className="vazio">{vazio}</div>;

  const maior = Math.max(...dados.map((d) => d.valor), 1);

  return (
    <div className="barras" data-tom={tom}>
      {dados.map((d) => (
        <div className="barra-linha" key={d.rotulo}>
          <div className="barra-topo">
            <span className="barra-rotulo">{rotular(d.rotulo)}</span>
            <span className="barra-valor">{formatar(d.valor)}{d.extra ? ` · ${d.extra}` : ''}</span>
          </div>
          <div className="barra-trilho">
            <div className="barra-preenchida" style={{ width: `${(d.valor / maior) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Tabela({ colunas, linhas, vazio = 'Sem dados no período.' }) {
  if (!linhas?.length) return <div className="vazio">{vazio}</div>;

  return (
    <table className="tabela">
      <thead>
        <tr>
          {colunas.map((c) => (
            <th key={c.chave} className={c.num ? 'num' : undefined}>{c.titulo}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {linhas.map((linha, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <tr key={linha.id ?? i}>
            {colunas.map((c) => (
              <td key={c.chave} className={c.num ? 'num' : undefined}>
                {c.render ? c.render(linha) : linha[c.chave]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Gráfico de área em SVG puro. Uma biblioteca de charts aqui custaria centenas
// de kB para desenhar uma linha — e como a página é server-rendered, o SVG já
// chega pronto no HTML.
export function GraficoSerie({ dados, altura = 132 }) {
  const pontos = (dados ?? []).filter((d) => d && d.dia);

  if (pontos.length < 2) {
    return <div className="grafico-vazio">Ainda não há pontos suficientes para o gráfico.</div>;
  }

  const largura = 1000; // viewBox; o SVG escala para a largura do container
  const topo = 8;
  const base = altura - 8;
  const maior = Math.max(...pontos.map((p) => p.total), 1);
  const passo = largura / (pontos.length - 1);

  const coordenadas = pontos.map((p, i) => ({
    x: i * passo,
    y: base - (p.total / maior) * (base - topo),
  }));

  const linha = coordenadas.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const area = `${linha} L${largura},${base} L0,${base} Z`;

  return (
    <>
      <svg
        className="grafico"
        viewBox={`0 0 ${largura} ${altura}`}
        preserveAspectRatio="none"
        height={altura}
        role="img"
        aria-label={`Série de ${pontos.length} dias, máximo de ${maior}`}
      >
        <defs>
          <linearGradient id="degradeSerie" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9c0004" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#9c0004" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#degradeSerie)" />
        <path
          d={linha}
          fill="none"
          stroke="#9c0004"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="grafico-eixo">
        <span>{dataCurta(pontos[0].dia)}</span>
        <span>pico de {numero(maior)}</span>
        <span>{dataCurta(pontos[pontos.length - 1].dia)}</span>
      </div>
    </>
  );
}
