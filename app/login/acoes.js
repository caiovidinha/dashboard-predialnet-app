'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  AREAS, COOKIE, DURACAO_S, criarSessao, senhaConfere,
} from '@/lib/sessao';

const espera = (ms) => new Promise((ok) => { setTimeout(ok, ms); });

export async function entrar(_estadoAnterior, formulario) {
  const area = String(formulario.get('area') || '');
  const senha = String(formulario.get('senha') || '');

  if (!AREAS[area]) return { erro: 'Escolha uma das áreas.', area: 'app' };

  if (!senhaConfere(area, senha)) {
    // Sem bloqueio por tentativa (não há banco aqui); o atraso fixo só deixa
    // o chute em massa caro sem incomodar quem errou uma vez.
    await espera(800);
    return { erro: 'Senha incorreta.', area };
  }

  const loja = await cookies();
  loja.set(COOKIE, await criarSessao(area), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: DURACAO_S,
  });

  redirect(AREAS[area].inicio);
}

export async function sair() {
  const loja = await cookies();
  loja.delete(COOKIE);
  redirect('/login');
}
