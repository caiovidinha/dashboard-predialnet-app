// Link que o influencer divulga. Fica num lugar só porque a tela de cadastro e
// a de números precisam montar exatamente o mesmo endereço.
//
// - parceria: é por ele que o Assine Já conta o funil (o que importa).
// - plano: opcional; abre o Assine Já com o plano já escolhido.
// - UTMs: para o Google Analytics separar esse tráfego. utm_source NÃO é
//   "meta"/"google" de propósito: esses dois viram etiqueta de origem no
//   Trello, e o lead de influencer não é anúncio pago.

export const ASSINEJA_URL = 'https://www.predialnet.com.br/assineja';

export const PLANOS_DO_LINK = [
  { valor: '', rotulo: 'Sem plano (cliente escolhe)' },
  { valor: 'black800', rotulo: 'Black 800' },
  { valor: '600mega', rotulo: '600 Mega' },
  { valor: '800mega', rotulo: '800 Mega' },
  { valor: '1giga', rotulo: '1 Giga' },
  { valor: 'gamer1giga', rotulo: 'Gamer 1 Giga' },
];

export function linkDaParceria(slug, plano) {
  const q = new URLSearchParams({ parceria: slug });
  if (plano) q.set('plano', plano);
  q.set('utm_source', 'influencer');
  q.set('utm_medium', 'parceria');
  q.set('utm_campaign', slug);
  return `${ASSINEJA_URL}?${q.toString()}`;
}
