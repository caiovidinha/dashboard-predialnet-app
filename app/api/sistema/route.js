import { NextResponse } from 'next/server';
import { buscarSaude } from '@/lib/api';

// Único Route Handler deste repositório: necessário porque é o único jeito
// do client fazer polling sem o ADMIN_TOKEN vazar pro navegador (todo o resto
// do dashboard busca direto em Server Components).
export async function GET() {
  const resultado = await buscarSaude();
  return NextResponse.json(resultado, { status: resultado.ok ? 200 : 502 });
}
