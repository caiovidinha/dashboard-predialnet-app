import { NextResponse } from 'next/server';
import {
  AREAS, COOKIE, lerSessao, loginDesligado, podeAbrir,
} from '@/lib/sessao';

// O dashboard guarda o token do operador no servidor e mostra números do
// negócio inteiro. Sem isto, quem descobrir a URL vê tudo.
//
// Duas áreas com senhas separadas (ver lib/sessao.js): quem entra com a senha
// das parcerias só abre /parcerias — o painel do app nem renderiza para ele,
// então os dados do app não saem do servidor. Quem entra com a senha do
// painel vê as duas telas.
//
// A área da sessão segue para as páginas no cabeçalho x-painel-area (o
// cabeçalho usa para esconder o link do app). Ele é sempre sobrescrito aqui:
// o valor que o navegador mandar é descartado.

export async function middleware(requisicao) {
  const { pathname } = requisicao.nextUrl;
  const cabecalhos = new Headers(requisicao.headers);
  cabecalhos.delete('x-painel-area');

  if (loginDesligado()) {
    cabecalhos.set('x-painel-area', 'aberto');
    return NextResponse.next({ request: { headers: cabecalhos } });
  }

  const area = await lerSessao(requisicao.cookies.get(COOKIE)?.value);

  if (pathname === '/login') {
    // já logado: vai direto para a própria área
    if (area) return NextResponse.redirect(new URL(AREAS[area].inicio, requisicao.url));
    return NextResponse.next({ request: { headers: cabecalhos } });
  }

  if (!area) {
    const destino = new URL('/login', requisicao.url);
    if (pathname.startsWith('/parcerias')) destino.searchParams.set('area', 'parcerias');
    return NextResponse.redirect(destino);
  }

  if (!podeAbrir(area, pathname)) {
    return NextResponse.redirect(new URL(AREAS[area].inicio, requisicao.url));
  }

  cabecalhos.set('x-painel-area', area);
  const resposta = NextResponse.next({ request: { headers: cabecalhos } });
  // A tela muda conforme a sessão: nada de cache compartilhado entre áreas.
  resposta.headers.set('Cache-Control', 'private, no-store');
  return resposta;
}

export const config = {
  // Protege as páginas, deixa passar o estático do Next e o logo da tela de
  // login — bloquear o /_next quebraria o CSS da própria tela de login.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png).*)'],
};
