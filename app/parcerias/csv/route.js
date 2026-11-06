import { baixarCsvParcerias } from '@/lib/api';

// Download da "planilha" das parcerias. É a única rota de servidor do painel,
// e existe pelo mesmo motivo de tudo ser Server Component: o navegador nunca
// fala com a appgw, então nunca vê o ADMIN_TOKEN. O middleware de senha
// protege esta rota como protege as páginas.

export const dynamic = 'force-dynamic';

export async function GET(requisicao) {
  const p = requisicao.nextUrl.searchParams;
  try {
    const resposta = await baixarCsvParcerias({
      dias: p.get('dias'),
      parceria: p.get('parceria'),
      tipo: p.get('tipo') === 'eventos' ? 'eventos' : 'diario',
    });
    return new Response(resposta.body, {
      status: 200,
      headers: {
        'Content-Type': resposta.headers.get('content-type') || 'text/csv; charset=utf-8',
        'Content-Disposition': resposta.headers.get('content-disposition') || 'attachment; filename="parcerias.csv"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    return new Response(`Não foi possível exportar: ${err.message}`, {
      status: 502,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
