-- Run once on the existing FDA project. This migration preserves other months.
create schema if not exists fda_private;
revoke all on schema fda_private from public, anon, authenticated;

create table if not exists fda_private.votos (
  rodada_id text not null,
  eleitor_id uuid not null,
  cheia text not null,
  murcha text not null,
  registrado_em timestamptz not null default now(),
  primary key (rodada_id, eleitor_id),
  check (cheia <> murcha)
);
alter table fda_private.votos enable row level security;
revoke all on fda_private.votos from public, anon, authenticated;

create or replace function public.fda_registrar_voto(
  rodada text, craque text, bola_murcha text, versao_esperada integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  eleitor uuid := auth.uid();
  estado jsonb;
  versao_atual integer;
  jogo jsonb;
  indice integer;
  votos jsonb;
  candidatos jsonb;
begin
  if eleitor is null or not exists (
    select 1 from public.fda_diretoria d
    where lower(d.email) = lower(auth.jwt()->>'email')
  ) then
    raise exception 'Acesso restrito à diretoria.' using errcode = '42501';
  end if;
  select dados, versao into strict estado, versao_atual
  from public.fda_estado where id = 1 for update;
  if exists (select 1 from fda_private.votos v where v.rodada_id = rodada and v.eleitor_id = eleitor) then
    raise exception 'Esta conta já votou nesta rodada.' using errcode = '23505';
  end if;
  if versao_atual <> versao_esperada then
    raise exception 'A rodada foi atualizada. Recarregue antes de votar.' using errcode = '40001';
  end if;
  select partida, ord::integer - 1 into jogo, indice
  from jsonb_array_elements(estado->'history') with ordinality as jogos(partida, ord)
  where partida->>'id' = rodada;
  if jogo is null or coalesce(jogo#>>'{juri,final}', 'false') = 'true' then
    raise exception 'Rodada indisponível para votação.' using errcode = '22023';
  end if;
  select coalesce(jsonb_agg(atleta), '[]'::jsonb) into candidatos
  from jsonb_array_elements(jogo->'teams') as time(lista)
  cross join lateral jsonb_array_elements(lista) as presentes(atleta);
  if craque is null or bola_murcha is null or craque = bola_murcha
      or not (candidatos ? craque and candidatos ? bola_murcha) then
    raise exception 'Escolha dois atletas diferentes na escalação.' using errcode = '22023';
  end if;
  votos := coalesce(jogo#>'{juri,votos}', '[]'::jsonb);
  if jsonb_array_length(votos) >= 5 then
    raise exception 'A rodada já tem cinco votos.' using errcode = '22023';
  end if;
  insert into fda_private.votos (rodada_id, eleitor_id, cheia, murcha)
  values (rodada, eleitor, craque, bola_murcha);
  jogo := jsonb_set(jogo, '{juri}', coalesce(jogo->'juri', '{}'::jsonb) ||
    jsonb_build_object('votos', votos || jsonb_build_array(jsonb_build_object(
      'nome', 'Eleitor ' || (jsonb_array_length(votos) + 1),
      'cheia', craque, 'murcha', bola_murcha
    ))));
  update public.fda_estado
  set dados = jsonb_set(estado, array['history', indice::text], jogo),
      versao = versao_atual + 1, atualizado_em = now()
  where id = 1;
end;
$$;
revoke all on function public.fda_registrar_voto(text,text,text,integer) from public, anon, authenticated;
grant execute on function public.fda_registrar_voto(text,text,text,integer) to authenticated;

-- Prevent direct browser updates of ballots. Closure, match edits and tie breaks
-- can still be saved through the existing administrator path.
create or replace function fda_private.proteger_votos()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user = 'authenticated' and exists (
    select 1 from jsonb_array_elements(new.dados->'history') as novos(novo)
    left join jsonb_array_elements(old.dados->'history') as anteriores(anterior)
      on anterior->>'id' = novo->>'id'
    where coalesce(novo#>'{juri,votos}', '[]'::jsonb)
      is distinct from coalesce(anterior#>'{juri,votos}', '[]'::jsonb)
  ) then
    raise exception 'Use a votação por conta para registrar votos.' using errcode = '42501';
  end if;
  return new;
end;
$$;
drop trigger if exists fda_proteger_votos on public.fda_estado;
create trigger fda_proteger_votos before update of dados on public.fda_estado
for each row execute function fda_private.proteger_votos();

do $$
declare
  estado jsonb;
  outubro jsonb;
  novembro jsonb;
  mac text;
begin
  select dados into strict estado from public.fda_estado where id = 1 for update;
  outubro := estado#>'{meses,2026-10}';
  if jsonb_array_length(coalesce(outubro->'teams','[]'::jsonb)) <> 2
      or jsonb_array_length(outubro#>'{teams,0}') = 0
      or jsonb_array_length(outubro#>'{teams,1}') = 0 then
    raise exception 'Escalação oficial de outubro incompleta.';
  end if;
  select pessoa->>'id' into mac from jsonb_array_elements(estado->'players') as atletas(pessoa)
  where regexp_replace(lower(pessoa->>'name'), '[^a-z]', '', 'g') = 'macgyver' limit 1;
  if mac is null then
    mac := 'fda-macgyver';
    estado := jsonb_set(estado, '{players}', (estado->'players') ||
      jsonb_build_array(jsonb_build_object('id',mac,'name','MacGyver','stars',3,'pos','','photo','','num',0)));
  end if;
  novembro := jsonb_set(outubro, '{campeao}', 'null'::jsonb);
  if not (outubro#>'{teams,0}' ? mac) then
    novembro := jsonb_set(novembro, '{teams,0}', (outubro#>'{teams,0}') || to_jsonb(mac));
  end if;
  if estado#>'{meses,2026-11}' is distinct from novembro then
    estado := jsonb_set(estado, '{meses,2026-11}', novembro);
    if coalesce(estado#>>'{current,month}','') <= '2026-11' then
      estado := jsonb_set(estado, '{current}', jsonb_build_object(
        'teams',novembro->'teams','date',1793523600000,'confirmed',true,
        'month','2026-11','roles','{}'::jsonb,'order','[]'::jsonb));
    end if;
    update public.fda_estado
    set dados = estado, versao = versao + 1, atualizado_em = now() where id = 1;
  end if;
end;
$$;
