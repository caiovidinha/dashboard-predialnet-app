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

// A API marca bloco quebrado com { erro: 'indisponivel' } dentro do overview.
export const indisponivel = (bloco) => !bloco || bloco.erro === 'indisponivel';
