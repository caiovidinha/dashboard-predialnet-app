// Sessão do painel: um cookie assinado (HMAC-SHA256) que diz QUAL área a
// pessoa abriu. Roda igual no middleware (edge) e na server action (Node),
// por isso só usa Web Crypto — nada de 'crypto' do Node nem biblioteca.
//
// Duas áreas, duas senhas:
//   app        → DASHBOARD_SENHA  — vê tudo (painel do app e parcerias)
//   parcerias  → PARCERIAS_SENHA  — vê só a tela de parcerias
//
// O cookie é httpOnly: o JavaScript da página não lê, e um cookie forjado
// não passa na assinatura.

export const COOKIE = 'painel_sessao';
export const DURACAO_S = 12 * 60 * 60; // 12 h: um dia de trabalho, sem "lembrar de mim" eterno

export const AREAS = {
  app: { rotulo: 'Painel do app', inicio: '/' },
  parcerias: { rotulo: 'Parcerias', inicio: '/parcerias' },
};

const senhaDa = (area) => (area === 'app' ? process.env.DASHBOARD_SENHA : process.env.PARCERIAS_SENHA) || '';

// Sem nenhuma senha configurada o painel fica aberto (desenvolvimento ou rede
// fechada) — mesmo comportamento de antes.
export const loginDesligado = () => !process.env.DASHBOARD_SENHA && !process.env.PARCERIAS_SENHA;

// SESSAO_SEGREDO é o recomendado. Sem ele, o segredo deriva das próprias
// senhas: trocar uma senha derruba todas as sessões abertas, o que é o
// comportamento certo para quando a senha vazou.
const segredo = () => process.env.SESSAO_SEGREDO
  || `painel:${process.env.DASHBOARD_SENHA || ''}:${process.env.PARCERIAS_SENHA || ''}`;

const codificador = new TextEncoder();

const base64url = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const deBase64url = (texto) => {
  const b64 = texto.replace(/-/g, '+').replace(/_/g, '/');
  return atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
};

async function assinar(texto) {
  const chave = await crypto.subtle.importKey(
    'raw', codificador.encode(segredo()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  return base64url(await crypto.subtle.sign('HMAC', chave, codificador.encode(texto)));
}

// Comparação de tempo constante: com ===, o tempo de resposta vaza quantos
// caracteres do começo estavam certos.
export function iguais(a, b) {
  const x = String(a);
  const y = String(b);
  if (x.length !== y.length) return false;
  let diferenca = 0;
  for (let i = 0; i < x.length; i += 1) diferenca |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diferenca === 0;
}

export function senhaConfere(area, senha) {
  const certa = senhaDa(area);
  if (!AREAS[area] || !certa) return false; // área sem senha configurada não abre
  return iguais(senha || '', certa);
}

export async function criarSessao(area) {
  const corpo = base64url(codificador.encode(JSON.stringify({
    a: area,
    e: Math.floor(Date.now() / 1000) + DURACAO_S,
  })));
  return `${corpo}.${await assinar(corpo)}`;
}

// Devolve a área da sessão ou null (sem cookie, expirada, adulterada).
export async function lerSessao(valor) {
  if (!valor || typeof valor !== 'string') return null;
  const [corpo, assinatura] = valor.split('.');
  if (!corpo || !assinatura) return null;
  if (!iguais(assinatura, await assinar(corpo))) return null;
  try {
    const { a, e } = JSON.parse(deBase64url(corpo));
    if (!AREAS[a] || typeof e !== 'number' || e < Date.now() / 1000) return null;
    // A senha da área foi apagada do ambiente: a sessão dela deixa de valer.
    if (!senhaDa(a)) return null;
    return a;
  } catch {
    return null;
  }
}

// O que cada área pode abrir. "app" é o operador: vê tudo.
export function podeAbrir(area, caminho) {
  if (area === 'app') return true;
  if (area === 'parcerias') return caminho === '/parcerias' || caminho.startsWith('/parcerias/');
  return false;
}
