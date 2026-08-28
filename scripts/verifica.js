// Sobe uma API falsa com as formas exatas do statsRepository, roda o dashboard
// contra ela e confere que os números aparecem no HTML renderizado.
//
// É também a documentação viva dos formatos: se a API mudar um campo, quebra
// aqui antes de quebrar na tela.
const http = require('http');
const net = require('net');
const path = require('path');
const { spawn } = require('child_process');

const PROJETO = path.resolve(__dirname, '..');
const TOKEN = 'token-de-teste';
const PORTA_API = 4599;
const PORTA_APP = 3299;

const serie = (n) => Array.from({ length: n }, (_, i) => ({
  dia: `2026-08-${String(i + 1).padStart(2, '0')}`,
  total: 3 + (i % 7),
}));

const USUARIOS = {
  periodo: { dias: 30, desde: '2026-07-29T00:00:00.000Z', ate: '2026-08-28T00:00:00.000Z' },
  total: 12043,
  novos_periodo: 87,
  sem_data_conhecida: 11956,
  com_fatura_aberta: 412,
  com_push: 9821,
  dispositivos: 10433,
  serie_cadastros: serie(20),
  cobertura: {
    enderecos_conhecidos: 8801,
    por_cidade: [
      { cidade: 'Niterói', clientes: 4210 },
      { cidade: 'Rio de Janeiro', clientes: 3102 },
      { cidade: 'São Gonçalo', clientes: 1489 },
    ],
  },
};

const NOTIFICACOES = {
  enviadas: 14, falhas: 1, pendentes: 0,
  alcance: 98211, entregues: 98211, lidas: 31044, taxa_leitura: 31.6,
  serie_envios: serie(12),
};

const SPEEDTEST = {
  testes: 2109,
  download_medio: 412.7, upload_medio: 198.3, ping_medio: 11.2, jitter_medio: 3.1,
  por_status: { completed: 2043, aborted: 66 },
  por_plataforma: [
    { platform: 'android', testes: 1401, download_medio: 388.2 },
    { platform: 'ios', testes: 642, download_medio: 455.9 },
  ],
  por_conexao: [
    { connectionType: 'wifi', testes: 1988, download_medio: 401.5 },
    { connectionType: 'cellular', testes: 55, download_medio: 88.1 },
  ],
  por_versao_app: [{ versao: '2.0.9', testes: 1877 }, { versao: '2.0.8', testes: 166 }],
  serie_testes: serie(25),
};

const UPGRADES = {
  board: 'D4P4xr4H',
  funil: [
    { lista: 'Novos Leads', cartoes: 93, tipo: 'em_andamento' },
    { lista: 'Primeiro contato', cartoes: 3, tipo: 'em_andamento' },
    { lista: 'Instalação Agendada', cartoes: 0, tipo: 'em_andamento' },
    { lista: 'Lead convertido', cartoes: 1222, tipo: 'convertido' },
    { lista: 'Lead não convertido', cartoes: 145, tipo: 'nao_convertido' },
  ],
  total: 1463, convertidos: 1222, nao_convertidos: 145, em_andamento: 96,
  taxa_conversao: 89.4, novos_periodo: 41, serie_novos: serie(14),
};

// Chamados e blog continuam existindo na API, mas saíram deste painel — o mock
// os serve para que uma volta acidental deles apareça nas asserções.
const CHAMADOS = { em_fila: 17, tempo_medio_resolucao_horas: 9.4, por_status: { ABERTO: 12 } };
const BLOG = { publicados: 4, inscritos_newsletter: 51, mais_lidos: [] };

const RESPOSTAS = {
  '/stats/overview': {
    periodo: USUARIOS.periodo,
    usuarios: USUARIOS, notificacoes: NOTIFICACOES, chamados: CHAMADOS,
    speedtest: SPEEDTEST, blog: BLOG, upgrades: UPGRADES,
    mensagens_app: { ativas: 3, segmentacoes: 12 },
  },
  '/stats/usuarios': USUARIOS,
  '/stats/notificacoes': NOTIFICACOES,
  '/stats/chamados': CHAMADOS,
  '/stats/speedtest': SPEEDTEST,
  '/stats/blog': BLOG,
  '/stats/upgrades': UPGRADES,
};

let pedidosSemToken = 0;
const rotasChamadas = new Set();

const api = http.createServer((req, res) => {
  const caminho = req.url.split('?')[0];
  if (req.headers['x-access-token'] !== TOKEN) {
    pedidosSemToken += 1;
    res.writeHead(401, { 'Content-Type': 'application/json' });
    return res.end('{"error":"nao autorizado"}');
  }
  rotasChamadas.add(caminho);
  const corpo = RESPOSTAS[caminho];
  if (!corpo) { res.writeHead(404); return res.end('{}'); }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  return res.end(JSON.stringify(corpo));
});

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// Porta ocupada por um servidor de execução anterior faria o teste medir o
// alvo errado e passar/falhar por motivo nenhum. Melhor abortar alto.
const portaLivre = (porta) => new Promise((resolve) => {
  const sonda = net.createServer();
  sonda.once('error', () => resolve(false));
  sonda.once('listening', () => sonda.close(() => resolve(true)));
  sonda.listen(porta, '127.0.0.1');
});

const buscarPagina = async (caminho) => {
  for (let i = 0; i < 40; i += 1) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORTA_APP}${caminho}`);
      const bruto = await r.text();
      // O React separa nós de texto adjacentes com <!-- -->; sem tirar, um
      // "+87" no JSX não casa com a busca por "+87".
      return { status: r.status, html: bruto.replace(/<!-- -->/g, ''), bruto };
    } catch {
      await esperar(500);
    }
  }
  throw new Error('o dashboard não subiu a tempo');
};

let passou = 0;
let falhou = 0;
const checar = (nome, condicao, detalhe = '') => {
  if (condicao) { passou += 1; console.log(`  ok    ${nome}`); }
  else { falhou += 1; console.log(`  FALHA ${nome} ${detalhe}`); }
};

(async () => {
  if (!(await portaLivre(PORTA_APP))) {
    console.error(`A porta ${PORTA_APP} já está ocupada — provavelmente sobrou um servidor`);
    console.error('de uma execução anterior. Encerre-o e rode de novo.');
    process.exit(1);
  }

  await new Promise((r) => api.listen(PORTA_API, '127.0.0.1', r));
  console.log(`API falsa em :${PORTA_API}\n`);

  const app = spawn('npx', ['next', 'start', '-p', String(PORTA_APP)], {
    cwd: PROJETO,
    shell: true,
    env: {
      ...process.env,
      API_URL: `http://127.0.0.1:${PORTA_API}`,
      ADMIN_TOKEN: TOKEN,
      // Desliga a autenticação básica: o alvo aqui é a renderização, e o Next
      // carrega o .env.local sozinho — sem isto o teste bateria em 401.
      DASHBOARD_SENHA: '',
    },
  });
  app.stderr.on('data', (d) => {
    const t = String(d);
    if (/error/i.test(t)) console.log('[next]', t.trim().slice(0, 200));
  });

  try {
    const { status, html } = await buscarPagina('/?dias=30');
    console.log('Renderização (30 dias)');
    checar('página responde 200', status === 200, `-> ${status}`);
    checar('não caiu no aviso de API fora', !html.includes('Não foi possível falar com a API'));

    console.log('\nMarca');
    checar('usa o logo da Predialnet', html.includes('src="/logo.png"'));
    checar('logo tem alt', html.includes('alt="Predialnet"'));
    checar('reserva o espaço da imagem', html.includes('width="96"') && html.includes('height="24"'));

    console.log('\nNúmeros vindos da API');
    checar('total de usuários (12.043)', html.includes('12.043'));
    checar('novos no período (+87)', html.includes('+87'));
    checar('com push (9.821)', html.includes('9.821'));
    checar('download médio (412,7 Mb/s)', html.includes('412,7 Mb/s'));
    checar('taxa de leitura (31,6%)', html.includes('31,6%'));
    checar('cidade da cobertura', html.includes('Niterói'));

    console.log('\nFunil de upgrades');
    checar('convertidos (1.222)', html.includes('1.222'));
    checar('taxa de conversão (89,4%)', html.includes('89,4%'));
    checar('etapa Novos Leads', html.includes('Novos Leads'));
    checar('etapa vazia continua visível', html.includes('Instalação Agendada'));
    checar('explica o denominador da taxa', html.includes('leads já decididos'));

    console.log('\nO que saiu do painel');
    checar('sem seção de chamados', !html.includes('Chamados de suporte') && !html.includes('Chamados em fila'));
    checar('sem seção de blog', !html.includes('Mais lidos') && !html.includes('Inscritos'));
    checar('nem chega a buscar /stats/chamados', !rotasChamadas.has('/stats/chamados'));
    checar('nem chega a buscar /stats/blog', !rotasChamadas.has('/stats/blog'));

    console.log('\nTradução de rótulos técnicos');
    checar('android vira "Android"', html.includes('>Android<'));
    checar('wifi vira "Wi-Fi"', html.includes('>Wi-Fi<'));
    checar('completed vira "Concluído"', html.includes('>Concluído<'));

    console.log('\nGráfico e ressalva do histórico');
    checar('SVG da série renderizado no servidor', html.includes('<svg') && html.includes('degradeSerie'));
    checar('avisa que a série não cobre a base antiga', html.includes('11.956 usuários anteriores'));

    console.log('\nSegredo não vaza para o navegador');
    checar('token ausente do HTML', !html.includes(TOKEN));
    checar('API não recebeu chamada sem token', pedidosSemToken === 0, `-> ${pedidosSemToken}`);

    console.log('\nTroca de período');
    const outro = await buscarPagina('/?dias=7');
    checar('7 dias responde 200', outro.status === 200);
    checar('marca o botão ativo', outro.html.includes('data-ativo="true"'));
    checar('rodapé reflete o período', outro.html.includes('período de 7 dias'));

    console.log(`\n${passou} passaram, ${falhou} falharam`);
  } finally {
    // No Windows, kill() com shell:true mata o cmd e deixa o next rodando —
    // o órfão seguraria a porta e envenenaria a próxima execução.
    try {
      if (process.platform === 'win32') {
        require('child_process').spawnSync('taskkill', ['/pid', String(app.pid), '/T', '/F']);
      } else {
        app.kill();
      }
    } catch { /* processo já morreu */ }
    api.close();
  }

  process.exit(falhou ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
