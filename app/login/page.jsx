import FormLogin from './FormLogin';

export const metadata = { title: 'Entrar — Painel Predialnet' };

export default async function Login({ searchParams }) {
  const params = await searchParams;
  // O middleware manda quem tentou abrir /parcerias para cá com ?area=parcerias,
  // e a tela já abre no botão certo.
  const areaInicial = params?.area === 'parcerias' ? 'parcerias' : 'app';

  return (
    <main className="login">
      <div className="login-cartao">
        <img src="/logo.png" alt="Predialnet" className="login-logo" width={128} height={32} />
        <h1 className="login-titulo">Painel</h1>
        <p className="login-sub">Escolha a área e informe a senha dela.</p>
        <FormLogin areaInicial={areaInicial} />
      </div>
    </main>
  );
}
