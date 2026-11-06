import { headers } from 'next/headers';
import { sair } from '@/app/login/acoes';

// Cabeçalho comum às páginas do painel: marca, navegação entre as telas e o
// seletor de período. O seletor monta o link preservando os outros filtros da
// página (ex.: ?parceria=), para trocar o período não perder a parceria aberta.

export const PERIODOS = [
  { dias: 7, rotulo: '7 dias' },
  { dias: 30, rotulo: '30 dias' },
  { dias: 90, rotulo: '90 dias' },
  { dias: 365, rotulo: '12 meses' },
];

export const diasDe = (params) => {
  const pedido = Number.parseInt(params?.dias, 10);
  return PERIODOS.some((p) => p.dias === pedido) ? pedido : 30;
};

const PAGINAS = [
  { caminho: '/', rotulo: 'App' },
  { caminho: '/parcerias', rotulo: 'Parcerias' },
];

const linkCom = (caminho, params) => {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''));
  const s = q.toString();
  return s ? `${caminho}?${s}` : caminho;
};

export default async function Cabecalho({ atual, dias, filtros = {} }) {
  // Área da sessão, posta pelo middleware. Quem entrou com a senha das
  // parcerias não vê o link do app (e o middleware barra a rota de qualquer jeito).
  const area = (await headers()).get('x-painel-area');
  const paginas = area === 'parcerias' ? PAGINAS.filter((p) => p.caminho === '/parcerias') : PAGINAS;
  const comLogin = area === 'app' || area === 'parcerias';

  return (
    <header className="cabecalho">
      <div className="cabecalho-interno">
        <div className="marca">
          {/* 1920x480 no arquivo — a proporção 4:1 é declarada aqui para o
              navegador reservar o espaço antes de baixar a imagem. */}
          <img src="/logo.png" alt="Predialnet" className="marca-logo" width={96} height={24} />
          <span className="marca-divisor" aria-hidden="true" />
          <nav className="navegacao" aria-label="Telas do painel">
            {paginas.map((p) => (
              <a
                key={p.caminho}
                href={linkCom(p.caminho, { dias })}
                className="navegacao-item"
                data-ativo={p.caminho === atual}
                aria-current={p.caminho === atual ? 'page' : undefined}
              >
                {p.rotulo}
              </a>
            ))}
          </nav>
        </div>
        <div className="cabecalho-acoes">
          <nav className="periodos" aria-label="Período">
            {PERIODOS.map((p) => (
              <a
                key={p.dias}
                href={linkCom(atual, { ...filtros, dias: p.dias })}
                className="periodo"
                data-ativo={p.dias === dias}
              >
                {p.rotulo}
              </a>
            ))}
          </nav>
          {comLogin ? (
            <form action={sair}>
              <button type="submit" className="sair">Sair</button>
            </form>
          ) : null}
        </div>
      </div>
    </header>
  );
}
