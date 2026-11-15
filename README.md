# NotiFlow

Plugin de notificações configuráveis para clientes Android no formato Bunny/Vendetta. A primeira versão cria uma camada local de alertas prioritários: pop-ups dentro do app e um painel com os avisos recentes.

## O que faz

- Filtra mensagens novas por menção direta, resposta a uma mensagem sua, DM e palavras-chave.
- Permite restringir alertas a IDs específicos de servidores ou canais e ignorar IDs de usuários.
- Mostra um pop-up compacto dentro do Discord e mantém, se você quiser, até 100 avisos no painel do plugin.
- Permite desativar pop-ups ou o histórico, limpar os avisos e ajustar cada regra.

## Instalação

Adicione o plugin usando esta URL no cliente Bunny/Vendetta:

`https://anokbass.github.io/notiflow-bunny/notiflow/`

Se o cliente pedir especificamente o arquivo de manifesto, use:

`https://anokbass.github.io/notiflow-bunny/notiflow/manifest.json`

Alternativa direta ao manifesto: `https://raw.githubusercontent.com/anokbass/notiflow-bunny/main/dist/notiflow/manifest.json`.

Depois de instalar, ative o NotiFlow e abra suas configurações em **Settings → Plugins → NotiFlow**. Em interfaces traduzidas, o caminho pode aparecer como **Configurações → Plugins → NotiFlow**.

## Como funciona o filtro

Por padrão, NotiFlow avisa sobre menções diretas, respostas às suas mensagens e mensagens diretas. Palavras-chave começam desativadas. Você pode editar as opções dentro da tela do plugin. Os campos de local aceitam IDs separados por vírgula ou espaço; deixar a lista “somente estes” vazia significa não restringir por esse campo.

A lista de avisos é local ao cliente. O plugin não envia mensagens, não consulta a API do Discord e não transmite dados para servidores externos. Se o histórico estiver ativo, ele salva no armazenamento local do plugin o autor, o local, a categoria e uma prévia curta da mensagem.

## Limites importantes

NotiFlow observa eventos de mensagens novas enquanto o cliente está aberto. Ele não intercepta, silencia ou substitui os pushs do Discord/Android quando o app está em segundo plano ou fechado. Os alertas do NotiFlow são uma camada adicional; as notificações nativas ainda podem aparecer em paralelo. Para controlar pushes do sistema, use as preferências do próprio Discord e do Android.

Este build usa a API JS de plugins no estilo Vendetta/Bunny. O Bunny original está arquivado e os forks podem divergir; clientes baseados numa API mais nova, como Valenced, podem exigir um build separado. A compatibilidade deve ser confirmada no cliente exato.

## Desenvolvimento

```sh
pnpm install
pnpm build
```

O artefato compilado fica em `dist/notiflow/`.
