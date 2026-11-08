'use client';

import { useState, useEffect, useRef } from 'react';
import { Kpi, Secao, Metrica, Tabela, Indisponivel } from './ui';
import { numero, ms } from '@/lib/formato';

// Primeiro client component com polling deste dashboard — justificado porque
// é a única tela onde dado desatualizado importa de verdade (o resto do
// dashboard é refresh manual, igual a todas as outras páginas de produto).
const INTERVALO_MS = 30_000;

export default function PainelSaude({ inicial }) {
  const [saude, setSaude] = useState(inicial);
  const [atualizandoEm, setAtualizandoEm] = useState(() => new Date());

  useEffect(() => {
    async function atualizar() {
      try {
        const res = await fetch('/api/sistema', { cache: 'no-store' });
        const data = await res.json();
        setSaude(data);
        setAtualizandoEm(new Date());
      } catch {
        // Falha de rede do próprio navegador: mantém o último estado bom na tela.
      }
    }
    const id = setInterval(atualizar, INTERVALO_MS);
    return () => clearInterval(id);
  }, []);

  if (!saude.ok) return <Indisponivel motivo={saude.erro} />;
  const d = saude.dados;

  return (
    <>
      <p className="vazio" style={{ marginBottom: 14 }}>
        Atualizado às {atualizandoEm.toLocaleTimeString('pt-BR')} — atualiza a cada 30s
      </p>

      <div className="grade-kpi">
        <Kpi rotulo="Redis" valor={d.redis.ok ? 'OK' : 'Indisponível'} nota={d.redis.ok ? ms(d.redis.ms) : d.redis.erro} />
        <Kpi rotulo="Banco" valor={d.banco.ok ? 'OK' : 'Indisponível'} nota={d.banco.ok ? ms(d.banco.ms) : d.banco.erro} />
        <Kpi rotulo="Fila — esperando" valor={numero(d.fila.waiting)} nota={d.fila.ok ? null : d.fila.erro} />
        <Kpi rotulo="Fila — com falha" valor={numero(d.fila.failed)} />
      </div>

      <Secao titulo="Alertas" nota={d.alertas.length ? `${d.alertas.length} ativo(s)` : null}>
        {d.alertas.length === 0 ? (
          <p className="vazio">Nenhum alerta — tudo certo.</p>
        ) : (
          d.alertas.map((a) => (
            <div key={a} className="aviso" style={{ marginBottom: 8 }}>{a}</div>
          ))
        )}
      </Secao>

      <Secao titulo="Processos (pm2)">
        <Tabela
          colunas={[
            { chave: 'nome', titulo: 'Processo' },
            { chave: 'status', titulo: 'Status' },
            { chave: 'restarts', titulo: 'Reinícios', num: true },
            { chave: 'mem', titulo: 'Memória', num: true, render: (l) => (l.memMb != null ? `${numero(Math.round(l.memMb))} MB` : '—') },
            { chave: 'cpu', titulo: 'CPU', num: true, render: (l) => (l.cpu != null ? `${l.cpu}%` : '—') },
          ]}
          linhas={d.pm2.processos || []}
          vazio={d.pm2.ok ? 'Nenhum processo encontrado.' : (d.pm2.erro || 'Não foi possível consultar o pm2.')}
        />
      </Secao>

      <Secao titulo="Logs grandes" nota="arquivos do pm2 acima do limiar de alerta">
        <Tabela
          colunas={[
            { chave: 'arquivo', titulo: 'Arquivo' },
            { chave: 'tamanho', titulo: 'Tamanho', num: true, render: (l) => `${l.tamanhoMb.toFixed(1)} MB` },
          ]}
          linhas={d.logs.arquivos || []}
          vazio="Nenhum log grande."
        />
      </Secao>

      <Secao titulo="Processo Node (api-app)">
        <div className="metricas">
          <Metrica rotulo="Memória RSS" valor={`${d.processo.memRssMb.toFixed(0)} MB`} />
          <Metrica rotulo="Uptime" valor={`${Math.round(d.processo.uptimeS / 60)} min`} />
        </div>
      </Secao>
    </>
  );
}
