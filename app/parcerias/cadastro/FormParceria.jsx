'use client';

import { useActionState, useState } from 'react';
import { salvarParceria } from './acoes';

// Mesmo slug que o backend gera (normalizarParceria): a prévia do link mostra
// exatamente o que vai ficar salvo.
const slugDe = (v) => String(v || '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9_-]+/g, '-')
  .replace(/-{2,}/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 40);

export default function FormParceria({ parceria }) {
  const editando = Boolean(parceria);
  const [estado, acao, salvando] = useActionState(salvarParceria, null);
  const inicial = estado?.valores || parceria || {};

  const [nome, setNome] = useState(inicial.nome || '');
  const [slug, setSlug] = useState(editando ? parceria.slug : (inicial.slug || ''));
  const [slugTocado, setSlugTocado] = useState(Boolean(inicial.slug));

  const slugFinal = editando ? parceria.slug : slugDe(slugTocado ? slug : nome);

  return (
    <form action={acao} className="form-parceria">
      {editando ? <input type="hidden" name="id" value={parceria.id} /> : null}

      <div className="campos">
        <label className="campo">
          <span className="campo-rotulo">Nome *</span>
          <input
            name="nome"
            required
            maxLength={120}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Fulana Silva"
            className="campo-entrada"
          />
        </label>

        <label className="campo">
          <span className="campo-rotulo">Instagram</span>
          <input
            name="instagram"
            defaultValue={inicial.instagram ? `@${String(inicial.instagram).replace(/^@/, '')}` : ''}
            placeholder="@fulana ou link do perfil"
            className="campo-entrada"
          />
        </label>

        <label className="campo">
          <span className="campo-rotulo">Contato</span>
          <input
            name="contato"
            maxLength={120}
            defaultValue={inicial.contato || ''}
            placeholder="E-mail ou telefone"
            className="campo-entrada"
          />
        </label>

        <label className="campo">
          <span className="campo-rotulo">Identificador do link</span>
          <input
            name="slug"
            value={editando ? parceria.slug : (slugTocado ? slug : slugDe(nome))}
            onChange={(e) => { setSlugTocado(true); setSlug(e.target.value); }}
            disabled={editando}
            maxLength={40}
            placeholder="gerado pelo nome"
            className="campo-entrada"
          />
          <span className="campo-ajuda">
            {editando ? 'Não muda depois de criado — o link já pode ter sido divulgado.' : 'Pode ajustar agora; depois de salvo, fica fixo.'}
          </span>
        </label>

        <label className="campo campo-largo">
          <span className="campo-rotulo">Observação</span>
          <textarea
            name="observacao"
            rows={2}
            maxLength={2000}
            defaultValue={inicial.observacao || ''}
            placeholder="Combinado, cupom, período da campanha…"
            className="campo-entrada"
          />
        </label>
      </div>

      <div className="form-rodape">
        <span className="previa-link">
          {slugFinal ? <>Link: <code>assineja?parceria={slugFinal}</code></> : 'Preencha o nome para gerar o link.'}
        </span>
        <div className="acoes">
          {editando ? <a className="botao botao-fraco" href="/parcerias/cadastro">Cancelar</a> : null}
          <button type="submit" className="botao" disabled={salvando || !slugFinal}>
            {salvando ? 'Salvando…' : editando ? 'Salvar alterações' : 'Cadastrar e gerar link'}
          </button>
        </div>
      </div>

      {estado?.erro ? <p role="alert" className="form-erro">{estado.erro}</p> : null}
    </form>
  );
}
