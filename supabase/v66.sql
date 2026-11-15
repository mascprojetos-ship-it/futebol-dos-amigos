do $$
declare
  estado jsonb;
  outubro jsonb;
  novembro jsonb;
  oficial text;
  duplicado constant text := 'fda-macgyver';
  equipes jsonb;
begin
  select dados into strict estado from public.fda_estado where id = 1 for update;
  select p->>'id' into strict oficial
  from jsonb_array_elements(estado->'players') p
  where p->>'name' = 'Magaiver' and p->>'id' <> duplicado;
  outubro := estado#>'{meses,2026-10,teams}';
  novembro := estado#>'{meses,2026-11}';
  equipes := jsonb_build_array((outubro->0) || to_jsonb(oficial), outubro->1);
  if novembro->'teams' = equipes and not (estado->'players' @> jsonb_build_array(jsonb_build_object('id', duplicado))) then
    return;
  end if;
  if jsonb_array_length(outubro->0) is distinct from 19
     or jsonb_array_length(outubro->1) is distinct from 19
     or (outubro->0) ? oficial or (outubro->1) ? oficial
     or novembro->'teams' is distinct from jsonb_build_array((outubro->0) || to_jsonb(duplicado), outubro->1)
     or estado#>'{current,teams}' is distinct from novembro->'teams'
     or estado#>>'{current,month}' is distinct from '2026-11' then
    raise exception 'A escalação mudou desde a V65; revise antes de substituir o vínculo.';
  end if;
  estado := jsonb_set(estado, '{meses,2026-11,teams}', equipes);
  estado := jsonb_set(estado, '{current,teams}', equipes);
  if (estado - 'players')::text like '%"fda-macgyver"%' or exists (
    select 1 from fda_private.votos where cheia = duplicado or murcha = duplicado
  ) then
    raise exception 'O cadastro duplicado ainda tem outros vínculos.';
  end if;
  estado := jsonb_set(estado, '{players}', (
    select jsonb_agg(p order by ord)
    from jsonb_array_elements(estado->'players') with ordinality as elenco(p, ord)
    where p->>'id' is distinct from duplicado
  ));
  update public.fda_estado set dados = estado, versao = versao + 1, atualizado_em = now() where id = 1;
end;
$$;
