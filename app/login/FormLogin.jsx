'use client';

import { useActionState, useState } from 'react';
import { entrar } from './acoes';

// Único componente de cliente do painel: o seletor de área e a mensagem de
// erro precisam de estado. A senha em si só é conferida no servidor.

const OPCOES = [
  { area: 'app', rotulo: 'Painel do app' },
  { area: 'parcerias', rotulo: 'Parcerias' },
];

export default function FormLogin({ areaInicial }) {
  const [estado, acao, enviando] = useActionState(entrar, null);
  const [area, setArea] = useState(areaInicial);

  return (
    <form action={acao} className="login-form">
      <div className="login-areas" role="radiogroup" aria-label="Área">
        {OPCOES.map((o) => (
          <button
            key={o.area}
            type="button"
            role="radio"
            aria-checked={area === o.area}
            className="login-area"
            data-ativo={area === o.area}
            onClick={() => setArea(o.area)}
          >
            {o.rotulo}
          </button>
        ))}
      </div>
      <input type="hidden" name="area" value={area} />

      <label htmlFor="senha" className="login-rotulo">
        Senha {area === 'parcerias' ? 'das parcerias' : 'do painel'}
      </label>
      <input
        key={area}
        id="senha"
        name="senha"
        type="password"
        autoComplete="current-password"
        required
        autoFocus
        className="login-campo"
        aria-invalid={estado?.erro ? 'true' : 'false'}
        aria-describedby={estado?.erro ? 'login-erro' : undefined}
      />

      {estado?.erro && estado.area === area ? (
        <p id="login-erro" role="alert" className="login-erro">{estado.erro}</p>
      ) : null}

      <button type="submit" className="botao login-entrar" disabled={enviando}>
        {enviando ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  );
}
