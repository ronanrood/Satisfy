# Satisfy — Painel Mestre

Painel de administração do Satisfy: cadastro de clientes, unidades e totens.
Acesso restrito a usuários com `papel = 'mestre'` na tabela `perfis`.

## 1. Configurar o Supabase

1. Rode o `schema-pesquisa-satisfacao.sql` (o que já te enviei) no SQL Editor do seu projeto Supabase.
2. Vá em **Authentication > Users** e crie seu usuário Mestre (e-mail/senha).
3. Copie o `id` (UUID) desse usuário.
4. No SQL Editor, rode:
   ```sql
   insert into perfis (id, nome, papel) values ('COLE-O-UUID-AQUI', 'Seu Nome', 'mestre');
   ```

## 2. Configurar o projeto

```bash
npm install
cp .env.example .env
```

Edite o `.env` com a URL e a chave `anon` do seu projeto Supabase
(encontradas em **Project Settings > API**):

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

## 3. Rodar localmente

```bash
npm run dev
```

Acesse `http://localhost:5173` e entre com o e-mail/senha do usuário Mestre.

## 4. Deploy (grátis)

Suba este projeto num repositório do GitHub e conecte no **Vercel**
(vercel.com → New Project → importar o repo). Nas configurações do
projeto na Vercel, adicione as mesmas duas variáveis de ambiente do
`.env`. Pronto — o painel fica online sem custo.

## O que essa versão já faz

- Login (Supabase Auth) restrito ao papel Mestre
- **Listar e cadastrar clientes**, com **edição e exclusão** direto na
  lista (nome, plano, status) — sem precisar abrir o Supabase
- Dentro de um cliente: **cadastrar, editar e excluir unidades e
  totens** (nome, endereço, unidade vinculada, ativo/inativo), e
  **editar/excluir o próprio cliente** — tudo com confirmação antes
  de qualquer exclusão, já que apaga em cascata (cliente → unidades →
  totens → respostas)
- **Editor de pesquisa por cliente**, dentro da página do cliente:
  - Banner de abertura — upload direto da imagem (Supabase Storage)
    ou colar uma URL já hospedada, além de cor e texto do botão
  - Perguntas customizáveis, com todos estes formatos: Boas-vindas,
    Imagem, Múltipla-escolha (1 opção), Múltipla-seleção (várias),
    NPS (0-10), Comentário (texto longo), Texto curto, Data,
    Nota (0-10), Estrelas (1-5), Carinhas (1-5), Escala de opinião
    (numérica configurável) e Encerramento — em qualquer ordem
- Tela pública `/totem/:token` — a que roda no PC/tablet do cliente,
  sem login: mostra o banner clicável, depois cada pergunta em sua
  própria tela na ordem cadastrada, agradece e reinicia sozinha
- **Dashboard de métricas por cliente** (dentro da página do cliente
  e também no painel do cliente logado): total de respostas, nota
  média, volume por dia/semana e lista de respostas recentes — com
  **filtro de período** (7, 30, 90 dias ou desde o início)
- **Login próprio do cliente**: um usuário com papel `admin_cliente`
  entra pela mesma tela de login e cai direto no próprio painel de
  métricas (só visualização — sem acesso ao banner/perguntas nem aos
  dados de outros clientes, garantido pelo RLS)
- **Gate de pagamento**: o acesso do cliente só funciona enquanto
  `clientes.status = 'ativo'`. Se você mudar pra `suspenso` ou
  `cancelado`, o login para de enxergar qualquer dado — automático,
  reforçado no próprio banco (RLS), não só na tela

## Como criar o acesso de um cliente

1. No Supabase, vá em **Authentication > Users > Add user** e crie
   o e-mail/senha do cliente.
2. Copie o `id` (UUID) desse usuário.
3. No SQL Editor, rode (trocando os valores):
   ```sql
   insert into perfis (id, nome, papel, cliente_id)
   values ('COLE-O-UUID-AQUI', 'Nome do responsável', 'admin_cliente', 'ID-DO-CLIENTE-NA-TABELA-clientes');
   ```
4. Passe o e-mail/senha pro cliente — ele entra pela mesma URL do
   painel e já cai direto no dashboard dele.

## Como suspender um cliente que não pagou

No painel Mestre, na lista de clientes, hoje isso ainda é feito
direto no Supabase (Table Editor → `clientes` → mudar `status` pra
`suspenso`). O login dele para de funcionar imediatamente — o
próprio banco bloqueia, não depende do app. Colocar esse botão
direto na interface do Mestre é um bom próximo passo.

⚠️ **Se você já rodou o SQL antes de 28/08 (mais recente)**, rode de
novo — essa versão adiciona a função `meu_cliente_esta_ativo()` e
recria (com segurança, usando `drop policy if exists`) as políticas
de leitura do cliente para checar o status antes de liberar os dados.

(Criar isso direto pela interface, sem precisar mexer no Supabase, é
um dos itens que ainda ficam para depois — ver "Próximos passos".)

⚠️ **Importante:** se você já rodou o `schema-pesquisa-satisfacao.sql`
antes de 28/08, rode de novo — foram adicionadas colunas
(`banner_url`, `texto_botao_iniciar` em `configuracoes`;
`respostas_detalhe` em `respostas`) e policies de leitura pública
(papel `anon`) que faltavam.

## Sobre a imagem do banner

O upload agora é direto pelo painel (aba "Pesquisa e banner de
abertura" → "Enviar imagem do banner"). A imagem vai para um bucket
público chamado `banners` no Supabase Storage — criado automaticamente
ao rodar o SQL atualizado (grátis, dentro do free tier). Limite de 3MB
por imagem. Se preferir, o campo de URL manual continua disponível
como alternativa.

⚠️ **Se você já rodou o SQL antes de 28/08 (mais recente)**, rode de
novo — a seção de Storage no fim do arquivo cria o bucket `banners`
e as políticas de acesso (só o Mestre pode enviar/editar/remover,
leitura é pública).

## Como testar o fluxo completo

1. No painel Mestre, crie um cliente.
2. Na página do cliente, preencha o banner e adicione ao menos uma
   pergunta em "Pesquisa e banner de abertura" → Salvar.
3. Crie uma unidade e um totem.
4. Copie o token e acesse `http://localhost:5173/totem/SEU-TOKEN`.

## Próximos passos sugeridos

- Criar o login do cliente e suspender/reativar direto pela interface do Mestre (hoje é manual, ver acima)
- Plugar a IA (Claude Haiku ou GPT-4o mini) pra classificar
  sentimento e tema de cada comentário recebido
- Alertas em tempo real (Telegram/WhatsApp) quando cair uma nota ruim
