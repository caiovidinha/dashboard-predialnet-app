'use client';

import { useState } from 'react';
import { linkDaParceria, PLANOS_DO_LINK } from '@/lib/links';

// Link pronto para mandar ao influencer: escolhe (ou não) o plano e copia.
export default function LinkParceria({ slug, destaque = false }) {
  const [plano, setPlano] = useState('');
  const [copiado, setCopiado] = useState(false);
  const link = linkDaParceria(slug, plano);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // http sem permissão de clipboard: seleciona para o Ctrl+C
      const campo = document.getElementById(`link-${slug}`);
      campo?.select();
      return;
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1800);
  };

  return (
    <div className="link-parceria" data-destaque={destaque}>
      <select
        aria-label="Plano do link"
        value={plano}
        onChange={(e) => setPlano(e.target.value)}
        className="link-plano"
      >
        {PLANOS_DO_LINK.map((p) => <option key={p.valor} value={p.valor}>{p.rotulo}</option>)}
      </select>
      <input id={`link-${slug}`} readOnly value={link} className="link-url" onFocus={(e) => e.target.select()} />
      <button type="button" onClick={copiar} className="botao link-copiar">
        {copiado ? 'Copiado!' : 'Copiar'}
      </button>
    </div>
  );
}
