'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { criarParceria, atualizarParceria } from '@/lib/api';

// As duas áreas (app e parcerias) podem cadastrar: o middleware já barra quem
// não tem sessão, e o token do operador só é usado aqui, no servidor.

const campos = (formulario) => ({
  nome: String(formulario.get('nome') || ''),
  instagram: String(formulario.get('instagram') || ''),
  contato: String(formulario.get('contato') || ''),
  observacao: String(formulario.get('observacao') || ''),
});

export async function salvarParceria(_estado, formulario) {
  const id = String(formulario.get('id') || '');
  const dados = campos(formulario);
  let criada;

  try {
    if (id) {
      await atualizarParceria(id, dados);
    } else {
      criada = await criarParceria({ ...dados, slug: String(formulario.get('slug') || '') || undefined });
    }
  } catch (err) {
    // devolve o que foi digitado para o formulário não voltar em branco
    return { erro: err.message, valores: { ...dados, slug: formulario.get('slug') || '' } };
  }

  revalidatePath('/parcerias');
  revalidatePath('/parcerias/cadastro');
  // depois de criar, a lista abre já destacando o link novo para copiar
  redirect(id ? '/parcerias/cadastro?salvo=1' : `/parcerias/cadastro?nova=${encodeURIComponent(criada.slug)}`);
}

export async function alternarAtivo(formulario) {
  const id = String(formulario.get('id') || '');
  const ativo = formulario.get('ativo') === 'true';
  try {
    await atualizarParceria(id, { ativo });
  } catch (err) {
    redirect(`/parcerias/cadastro?erro=${encodeURIComponent(err.message)}`);
  }
  revalidatePath('/parcerias');
  revalidatePath('/parcerias/cadastro');
  redirect('/parcerias/cadastro');
}
