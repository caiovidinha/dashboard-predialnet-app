import { NextResponse } from 'next/server';
import { buscarArquivosLog, buscarConteudoLog } from '@/lib/api';

// GET /api/sistema/logs            -> lista os arquivos
// GET /api/sistema/logs?arquivo=X  -> conteúdo (últimas linhas) do arquivo X
// Mesmo motivo do /api/sistema: é o único jeito do client buscar isso sem o
// ADMIN_TOKEN vazar pro navegador.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const arquivo = searchParams.get('arquivo');

  if (!arquivo) {
    const resultado = await buscarArquivosLog();
    return NextResponse.json(resultado, { status: resultado.ok ? 200 : 502 });
  }

  const linhas = searchParams.get('linhas');
  const busca = searchParams.get('busca');
  const resultado = await buscarConteudoLog(arquivo, { linhas, busca });
  return NextResponse.json(resultado, { status: resultado.ok ? 200 : 502 });
}
