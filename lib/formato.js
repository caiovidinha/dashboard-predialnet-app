const nf = new Intl.NumberFormat('pt-BR');
const nf1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// "—" em vez de 0 quando o valor não existe: zero é uma informação, ausência é
// outra, e o dashboard não deve confundir as duas.
export const numero = (v) => (v === null || v === undefined ? '—' : nf.format(v));

export const decimal = (v) => (v === null || v === undefined ? '—' : nf1.format(v));

export const porcento = (v) => (v === null || v === undefined ? '—' : `${nf1.format(v)}%`);

export const mbps = (v) => (v === null || v === undefined ? '—' : `${nf1.format(v)} Mb/s`);

export const ms = (v) => (v === null || v === undefined ? '—' : `${nf1.format(v)} ms`);

export const horas = (v) => (v === null || v === undefined ? '—' : `${nf1.format(v)} h`);

export const dataCurta = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

export const dataHora = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });
};

// Transforma { chave: valor } num array ordenado do maior para o menor —
// formato que os componentes de barra esperam.
export const distribuir = (objeto = {}) =>
  Object.entries(objeto)
    .map(([rotulo, valor]) => ({ rotulo, valor }))
    .sort((a, b) => b.valor - a.valor);

const ROTULOS = {
  ABERTO: 'Aberto',
  EM_ANDAMENTO: 'Em andamento',
  AGUARDANDO: 'Aguardando',
  RESOLVIDO: 'Resolvido',
  FECHADO: 'Fechado',
  BAIXA: 'Baixa',
  MEDIA: 'Média',
  ALTA: 'Alta',
  URGENTE: 'Urgente',
  completed: 'Concluído',
  aborted: 'Abortado',
  error: 'Erro',
  android: 'Android',
  ios: 'iOS',
  web: 'Web',
  wifi: 'Wi-Fi',
  cellular: 'Celular',
  ethernet: 'Cabo',
  unknown: 'Desconhecido',
  desconhecido: 'Desconhecido',
};

export const rotular = (chave) => ROTULOS[chave] ?? chave;
