import './globals.css';

export const metadata = {
  title: 'Painel — Predialnet',
  description: 'Estatísticas do aplicativo Predialnet',
};

// Tela interna de operador: não faz sentido no índice de busca nenhum.
export const robots = { index: false, follow: false };

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
