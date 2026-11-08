import { buscarArquivosLog } from '@/lib/api';
import Cabecalho from '@/components/Cabecalho';
import PainelLogs from '@/components/PainelLogs';

export default async function Logs() {
  const inicial = await buscarArquivosLog();

  return (
    <>
      <Cabecalho atual="/sistema/logs" semPeriodo />
      <main className="pagina">
        <PainelLogs inicial={inicial} />
      </main>
    </>
  );
}
