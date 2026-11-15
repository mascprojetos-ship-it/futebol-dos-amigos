update public.fda_estado
set dados = jsonb_set(dados, '{info,festa}', evento.payload),
    versao = versao + 1,
    atualizado_em = now()
from (values ('{
  "date": "2026-11-22",
  "deadline": "2026-11-15",
  "local": "Espaço Casa de Pedra em Xavantes (próximo ao campo do Imperial)",
  "pix": "0e1e4a25-fdd3-49c3-b94b-5c0cf172e067",
  "family": 200,
  "individual": 100
}'::jsonb)) as evento(payload)
where id = 1 and dados#>'{info,festa}' is distinct from evento.payload;
