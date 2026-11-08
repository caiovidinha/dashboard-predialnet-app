import { buscarSaude } from '@/lib/api';
import Cabecalho from '@/components/Cabecalho';
import PainelSaude from '@/components/PainelSaude';

export default async function Sistema() {
  // Primeiro paint já vem preenchido, sem esperar o 1º ciclo de polling do
  // client component.
  const inicial = await buscarSaude();

  return (
    <>
      <Cabecalho atual="/sistema" semPeriodo />
      <main className="pagina">
        <PainelSaude inicial={inicial} />
      </main>
    </>
  );
}
