# Futebol dos Amigos

Aplicação pública do FDA Xavante, com avisos, jornal, ranking, times, jogos e elenco. O site é estático, sem etapa de build; a camada de dados existente usa Supabase.

## Estrutura

- `index.html`, `app.js` e `app.css`: interface pública e painel da diretoria.
- `config.js` e `supabase.js`: configuração pública e cliente Supabase.
- `supabase/migrations/`: histórico versionado do schema do banco.
- `dados-iniciais.json` e `novidades.json`: cópias de referência usadas para inicialização e prévia local.
- `assets/`: fotos das camisas e do troféu Bola Murcha, fornecidas pelo clube.

O app lê o estado público de `fda_estado`; alterações continuam restritas ao fluxo autenticado da diretoria, conforme o schema versionado. As cópias JSON devem conter apenas conteúdo que possa ser exibido publicamente.

## Prévia local

Na pasta do projeto, inicie um servidor estático, por exemplo:

```sh
python -m http.server 4173
```

Abra `http://127.0.0.1:4173/?snapshot=1` para visualizar a cópia de referência sem depender de uma conexão com o Supabase.

## Publicação

O projeto pode ser publicado por um host estático apontando para a raiz do repositório. Não há compilação nem dependências de instalação.
