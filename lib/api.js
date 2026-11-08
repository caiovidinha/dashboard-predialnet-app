const BASE = (process.env.API_URL || 'https://appgw.predialnet.com.br').replace(/\/+$/, '');
const TOKEN = process.env.ADMIN_TOKEN;

// Toda busca acontece em Server Component: o token do operador nunca chega ao
// navegador. É por isso que não existe rota de API aqui nem fetch no cliente.

export class ErroApi extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}

const explicar = (status) => {
  if (status === 401) return 'Token recusado pela API. Confira o ADMIN_TOKEN.';
  if (status === 403) return 'Este token não tem permissão de operador.';
  if (status === 404) return 'Endpoint não encontrado. A API está atualizada?';
  return `A API respondeu ${status}.`;
};

async function buscar(recurso, dias) {
  if (!TOKEN) throw new ErroApi(0, 'ADMIN_TOKEN não configurado no .env.');

  let resposta;
  try {
    resposta = await fetch(`${BASE}/stats/${recurso}?dias=${dias}`, {
      headers: { 'x-access-token': TOKEN },
      // A API já mantém 60 s de cache nas agregações; cachear de novo aqui só
      // faria o número ficar velho em dobro.
      cache: 'no-store',
    });
  } catch (err) {
    throw new ErroApi(0, `Não foi possível falar com ${BASE}: ${err.message}`);
  }

  if (!resposta.ok) throw new ErroApi(resposta.status, explicar(resposta.status));
  return resposta.json();
}

// Um domínio fora do ar não pode derrubar a página inteira — a API já pensa
// assim no /stats/overview, e o dashboard segue a mesma regra.
async function tentar(recurso, dias) {
  try {
    return { ok: true, dados: await buscar(recurso, dias) };
  } catch (err) {
    return { ok: false, erro: err.message };
  }
}

export async function buscarPainel(dias) {
  // Chamados de suporte têm painel próprio (o board kanban) e ficaram de fora
  // daqui — a rota /stats/chamados continua existindo na API.
  const [overview, usuarios, notificacoes, speedtest, upgrades] = await Promise.all([
    tentar('overview', dias),
    tentar('usuarios', dias),
    tentar('notificacoes', dias),
    tentar('speedtest', dias),
    tentar('upgrades', dias),
  ]);

  return { overview, usuarios, notificacoes, speedtest, upgrades, base: BASE };
}

// ── Saúde dos sistemas ───────────────────────────────────────
// Sem ?dias= (diferente de buscar/tentar acima, que sempre fixam esse
// querystring) — por isso uma variante local em vez de reaproveitar aquelas.

async function buscarSemPeriodo(caminho) {
  if (!TOKEN) throw new ErroApi(0, 'ADMIN_TOKEN não configurado no .env.');
  let resposta;
  try {
    resposta = await fetch(`${BASE}${caminho}`, { headers: { 'x-access-token': TOKEN }, cache: 'no-store' });
  } catch (err) {
    throw new ErroApi(0, `Não foi possível falar com ${BASE}: ${err.message}`);
  }
  if (!resposta.ok) throw new ErroApi(resposta.status, explicar(resposta.status));
  return resposta.json();
}

export async function buscarSaude() {
  try {
    return { ok: true, dados: await buscarSemPeriodo('/admin/health') };
  } catch (err) {
    return { ok: false, erro: err.message };
  }
}

// ── Parcerias do Assine Já ───────────────────────────────────

const consulta = (params) => new URLSearchParams(
  Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
).toString();

export async function buscarParcerias(dias, parceria) {
  if (!TOKEN) return { ok: false, erro: 'ADMIN_TOKEN não configurado no .env.' };
  try {
    const resposta = await fetch(`${BASE}/stats/parcerias?${consulta({ dias, parceria })}`, {
      headers: { 'x-access-token': TOKEN },
      cache: 'no-store',
    });
    if (!resposta.ok) return { ok: false, erro: explicar(resposta.status) };
    return { ok: true, dados: await resposta.json() };
  } catch (err) {
    return { ok: false, erro: `Não foi possível falar com ${BASE}: ${err.message}` };
  }
}

// Usado pela rota /parcerias/csv: o download passa pelo servidor do painel
// para o token continuar fora do navegador.
export async function baixarCsvParcerias({ dias, parceria, tipo }) {
  if (!TOKEN) throw new ErroApi(0, 'ADMIN_TOKEN não configurado no .env.');
  const resposta = await fetch(`${BASE}/stats/parcerias/csv?${consulta({ dias, parceria, tipo })}`, {
    headers: { 'x-access-token': TOKEN },
    cache: 'no-store',
  });
  if (!resposta.ok) throw new ErroApi(resposta.status, explicar(resposta.status));
  return resposta;
}

// ── Cadastro de influencers ──────────────────────────────────

// A API devolve { error } com a frase pronta para mostrar (slug repetido,
// Instagram inválido…); quando não houver, cai na explicação pelo status.
async function chamarCadastro(caminho, { metodo = 'GET', corpo } = {}) {
  if (!TOKEN) throw new ErroApi(0, 'ADMIN_TOKEN não configurado no .env.');
  let resposta;
  try {
    resposta = await fetch(`${BASE}/parcerias${caminho}`, {
      method: metodo,
      headers: { 'x-access-token': TOKEN, ...(corpo ? { 'Content-Type': 'application/json' } : {}) },
      body: corpo ? JSON.stringify(corpo) : undefined,
      cache: 'no-store',
    });
  } catch (err) {
    throw new ErroApi(0, `Não foi possível falar com ${BASE}: ${err.message}`);
  }
  const dados = await resposta.json().catch(() => null);
  if (!resposta.ok) throw new ErroApi(resposta.status, dados?.error || explicar(resposta.status));
  return dados;
}

export async function listarCadastro() {
  try {
    return { ok: true, dados: await chamarCadastro('') };
  } catch (err) {
    return { ok: false, erro: err.message };
  }
}

export const criarParceria = (dados) => chamarCadastro('', { metodo: 'POST', corpo: dados });

export const atualizarParceria = (id, dados) => chamarCadastro(`/${encodeURIComponent(id)}`, { metodo: 'PATCH', corpo: dados });

// A API marca bloco quebrado com { erro: 'indisponivel' } dentro do overview.
export const indisponivel = (bloco) => !bloco || bloco.erro === 'indisponivel';
