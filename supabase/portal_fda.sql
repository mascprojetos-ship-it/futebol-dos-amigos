-- Preserve the existing REST endpoint used by the live site while removing
-- management data from its public representation.
alter table public.fda_estado set schema fda_private;
revoke all on fda_private.fda_estado from public, anon, authenticated;

-- The voting RPC now locks the private base table directly.
do $$
declare body text;
begin
  body := pg_get_functiondef('public.fda_registrar_voto(text,text,text,integer)'::regprocedure);
  execute replace(body, 'public.fda_estado', 'fda_private.fda_estado');
end;
$$;

create function fda_private.estado_publico(state jsonb)
returns jsonb language sql immutable set search_path = '' as $$
  select (state - 'present' - 'current' - 'votacao')
      || jsonb_build_object(
        'history', coalesce((
          select jsonb_agg(game - 'juri' - 'voiceEntries' order by ord)
          from jsonb_array_elements(state->'history') with ordinality as games(game,ord)
        ), '[]'::jsonb),
        'posts', coalesce((
          select jsonb_agg(post - 'orders' order by ord)
          from jsonb_array_elements(state->'posts') with ordinality as posts(post,ord)
        ), '[]'::jsonb)
      );
$$;
revoke all on function fda_private.estado_publico(jsonb) from public;
grant execute on function fda_private.estado_publico(jsonb) to anon, authenticated;

create view public.fda_estado as
select s.id, case when auth.uid() is not null and exists (
  select 1 from public.fda_diretoria d where lower(d.email) = lower(auth.jwt()->>'email')
) then s.dados else fda_private.estado_publico(s.dados) end as dados,
s.versao, s.atualizado_em
from fda_private.fda_estado s;

create function fda_private.editar_estado()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.fda_diretoria d where lower(d.email) = lower(auth.jwt()->>'email')
  ) then
    raise exception 'Acesso restrito à diretoria.' using errcode = '42501';
  end if;
  if new.id is distinct from old.id or new.versao is distinct from old.versao + 1
      or jsonb_typeof(new.dados) is distinct from 'object' then
    raise exception 'Atualização do estado inválida.' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_array_elements(new.dados->'history') as novos(novo)
    left join jsonb_array_elements(old.dados->'history') as anteriores(anterior)
      on anterior->>'id' = novo->>'id'
    where coalesce(novo#>'{juri,votos}', '[]'::jsonb)
      is distinct from coalesce(anterior#>'{juri,votos}', '[]'::jsonb)
  ) then
    raise exception 'Registre votos pelo painel de votação.' using errcode = '42501';
  end if;
  update fda_private.fda_estado set dados = new.dados, versao = new.versao, atualizado_em = now()
    where id = old.id and versao = old.versao returning atualizado_em into new.atualizado_em;
  if not found then return null; end if;
  return new;
end;
$$;
revoke all on function fda_private.editar_estado() from public;
create trigger fda_editar_estado instead of update on public.fda_estado
for each row execute function fda_private.editar_estado();
revoke all on public.fda_estado from public, anon, authenticated;
grant select on public.fda_estado to anon, authenticated;
grant update(dados,versao,atualizado_em) on public.fda_estado to authenticated;

create table public.fda_videos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (length(btrim(titulo)) between 1 and 100),
  descricao text not null default '' check (length(descricao) <= 400),
  categoria text not null check (categoria in ('lance','gol','resenha')),
  url text check (length(url) <= 500 and url ~ '^https://[^[:space:]]+$'),
  arquivo text check (arquivo ~ '^[0-9a-f-]{36}\.(mp4|webm)$'),
  criado_em timestamptz not null default now(),
  check ((url is null) <> (arquivo is null))
);
alter table public.fda_videos enable row level security;
revoke all on public.fda_videos from public, anon, authenticated;
grant select on public.fda_videos to anon, authenticated;
grant insert, update, delete on public.fda_videos to authenticated;
create policy fda_videos_leitura on public.fda_videos for select to anon, authenticated using (true);
create policy fda_videos_diretoria on public.fda_videos for all to authenticated using (
  auth.uid() is not null and exists (select 1 from public.fda_diretoria d where lower(d.email)=lower(auth.jwt()->>'email'))
) with check (
  auth.uid() is not null and exists (select 1 from public.fda_diretoria d where lower(d.email)=lower(auth.jwt()->>'email'))
);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('fda-videos','fda-videos',true,26214400,array['video/mp4','video/webm']);
create policy fda_video_storage_insert on storage.objects for insert to authenticated with check (
  bucket_id='fda-videos' and name ~ '^[0-9a-f-]{36}\.(mp4|webm)$' and exists (
    select 1 from public.fda_diretoria d where lower(d.email)=lower(auth.jwt()->>'email')
  )
);
create policy fda_video_storage_delete on storage.objects for delete to authenticated using (
  bucket_id='fda-videos' and exists (
    select 1 from public.fda_diretoria d where lower(d.email)=lower(auth.jwt()->>'email')
  )
);
create policy fda_video_storage_select on storage.objects for select to authenticated using (
  bucket_id='fda-videos' and exists (
    select 1 from public.fda_diretoria d where lower(d.email)=lower(auth.jwt()->>'email')
  )
);

-- Assert the public response before committing the change.
set local role anon;
do $$
declare state jsonb;
begin
  select dados into strict state from public.fda_estado where id=1;
  if state ? 'votacao' or state ? 'current' or state ? 'present' or exists (
    select 1 from jsonb_array_elements(state->'history') p where p ? 'juri'
  ) then
    raise exception 'A representação pública ainda contém informações da diretoria.';
  end if;
end;
$$;
reset role;

