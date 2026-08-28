# Painel Predialnet

Dashboard de estatísticas do app, consumindo os endpoints `/stats` da API em
`appgw.predialnet.com.br`.

Cobre funil de upgrade de planos (board do Trello), base de usuários, qualidade
de conexão e notificações push.

Chamados de suporte e blog ficaram de fora de propósito — cada um tem painel
próprio, e as rotas /stats/chamados e /stats/blog continuam existindo na API
para quem precisar delas.

Next.js 15 (App Router), JavaScript puro, sem biblioteca de UI nem de gráficos.

---

## Rodando

```bash
cp .env.example .env
# preencha ADMIN_TOKEN com o mesmo ADMIN_BYPASS_TOKEN do backend
npm install
npm run dev      # http://localhost:3200
```

Produção:

```bash
npm run build && npm start
```

### Variáveis

| Variável | Para quê |
|---|---|
| `API_URL` | Base da API (padrão `https://appgw.predialnet.com.br`) |
| `ADMIN_TOKEN` | **Obrigatória.** O `ADMIN_BYPASS_TOKEN` do backend |
| `DASHBOARD_USUARIO` / `DASHBOARD_SENHA` | Autenticação básica da própria tela |

---

## Três decisões que valem explicar

### O token nunca vai para o navegador

Tudo é Server Component. A página busca da API no servidor e manda HTML pronto —
não existe rota de API própria, `fetch` no cliente nem `useEffect`. Por isso o
`ADMIN_TOKEN` **não** tem prefixo `NEXT_PUBLIC_`: se tivesse, o Next embutiria o
token no bundle e qualquer visitante leria o segredo do operador no DevTools.

Como consequência, também não existe problema de CORS: a chamada é
servidor-para-servidor, e o navegador nunca fala com a `appgw`.

### O painel tem senha própria

O app guarda um token poderoso e mostra métricas do negócio inteiro. Sem
proteção, quem descobrisse a URL veria tudo. O `middleware.js` faz autenticação
básica do HTTP quando `DASHBOARD_SENHA` está preenchida.

É proteção modesta — não tem sessão, nem bloqueio por tentativa — mas resolve o
caso real: URL vazada e robô de varredura. **Se você deixar `DASHBOARD_SENHA`
vazio, a página fica aberta**, o que só faz sentido em rede fechada ou atrás de
VPN.

### Gráfico é SVG escrito à mão

Uma biblioteca de charts custaria centenas de kB para desenhar uma linha. Como a
página é renderizada no servidor, o SVG já chega pronto no HTML — o JavaScript
enviado ao navegador (103 kB) é só o runtime do Next, nenhuma linha de código
nosso roda no cliente.

---

## Como a tela lida com dado que falta

**Domínio fora do ar.** A API isola falhas: se a agregação de um domínio quebra,
ela devolve `{ "erro": "indisponivel" }` naquele bloco e mantém o resto. O painel
segue a mesma regra — aquela seção mostra "Dados indisponíveis" e as outras
continuam com número de verdade. Se a API inteira estiver fora, aparece um aviso
no topo com o motivo.

**Usuários sem data de cadastro.** A tabela `users` não tinha timestamp; a coluna
foi criada depois, e quem já existia ficou com `NULL` em vez de receber a data da
migration. O painel mostra esse número explicitamente e avisa, abaixo do gráfico,
que a série cobre apenas cadastros posteriores. Um gráfico que sugerisse que a
base nasceu no dia da migration seria pior que gráfico nenhum.

---

## Verificação

```bash
npm run verifica
```

Sobe uma API falsa com as formas exatas que o `statsRepository` devolve, roda o
dashboard contra ela e confere que os números aparecem no HTML — incluindo que o
token **não** aparece. É também a documentação viva dos formatos esperados: se a
API mudar um campo, é aqui que quebra primeiro.

---

## Publicando

Roda em qualquer lugar com Node. Sob PM2, junto da API:

```bash
npm run build
pm2 start npm --name painel -- start
pm2 save
```

Se for para a Vercel, as variáveis vão em Environment Variables — e vale manter
`DASHBOARD_SENHA` preenchida, já que lá a URL é pública por natureza.

O `npm audit` acusa vulnerabilidades no `postcss`, dependência transitiva do
build do Next. São falhas exploráveis via CSS controlado pelo atacante; aqui o
CSS é só o nosso `globals.css`, então não há vetor. Some quando o Next atualizar
a dependência — não vale forçar `audit fix`, que rebaixaria o Next.
