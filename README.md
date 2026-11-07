# Futebol dos Amigos

Projeto vinculado ao Supabase.

## Detalhes do Supabase
- **Project ID**: jmaeteucizgjiplxhmvi
- **Project URL**: https://jmaeteucizgjiplxhmvi.supabase.co
- **Organização**: M14 Company

## Estrutura do Banco de Dados (Schema public)
- `fda_estado`: (id int4, dados jsonb, versao int4, atualizado_em timestamptz)
- `fda_diretoria`: (email text)
- Funções: `rls_auto_enable`

## Histórico e Status do Projeto
A equipe já iniciou as modificações e evoluções no projeto:
- **Estado atual do banco de dados**: Versão 64 (tabela `fda_estado`).
- **Módulos ativos em `fda_estado`**: `v`, `info`, `meses`, `posts`, `current`, `history`, `players`, `present`, `votacao`, `seedSeen`, `settings`.
- **Inclusão na Diretoria**: Adicionado o e-mail `masc.projetos@gmail.com` à tabela `fda_diretoria` (junto com `michel.asc7@gmail.com` e `rgomes884@gmail.com`) concedendo permissão para salvar modificações no aplicativo.
- **Integração Contínua**: Integração contínua ativa entre GitHub e Supabase.
