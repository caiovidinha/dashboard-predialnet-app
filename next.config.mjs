/** @type {import('next').NextConfig} */
const nextConfig = {
  // Nada de imagem remota nem rota de API própria: o dashboard só renderiza
  // no servidor e busca do appgw. Config mínima de propósito.
  reactStrictMode: true,
};

export default nextConfig;
