import { NextResponse } from 'next/server';

// O dashboard guarda o token do operador no servidor e mostra números do
// negócio inteiro. Sem isto, quem descobrir a URL vê tudo — o app em si não
// pede nada de quem acessa.
//
// Autenticação básica do HTTP: é pouca coisa, mas resolve o caso real (URL
// vazada, robô de varredura) sem inventar tela de login. Se você for publicar
// numa rede fechada ou atrás de VPN, pode deixar DASHBOARD_SENHA vazio.

const USUARIO = process.env.DASHBOARD_USUARIO || 'predialnet';
const SENHA = process.env.DASHBOARD_SENHA;

// Comparação de tempo constante: com === , o tempo de resposta vaza quantos
// caracteres do começo estavam certos.
function iguais(a, b) {
  if (a.length !== b.length) return false;
  let diferenca = 0;
  for (let i = 0; i < a.length; i += 1) diferenca |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diferenca === 0;
}

export function middleware(requisicao) {
  if (!SENHA) return NextResponse.next();

  const header = requisicao.headers.get('authorization') || '';
  const [esquema, credencial] = header.split(' ');

  if (esquema === 'Basic' && credencial) {
    const [usuario, ...resto] = atob(credencial).split(':');
    const senha = resto.join(':'); // senha com ':' continua válida
    if (iguais(usuario, USUARIO) && iguais(senha, SENHA)) return NextResponse.next();
  }

  return new NextResponse('Acesso restrito.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Painel Predialnet", charset="UTF-8"' },
  });
}

export const config = {
  // Protege as páginas, deixa passar o estático do Next — bloquear o /_next
  // quebraria o CSS da própria tela de erro.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
