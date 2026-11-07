-- Função rls_auto_enable e Event Trigger
CREATE OR REPLACE FUNCTION public.rls_auto_enable()
RETURNS event_trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands() WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS')
  LOOP
    EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY;', cmd.object_identity);
  END LOOP;
END;
$function$;

CREATE EVENT TRIGGER ensure_rls ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  EXECUTE FUNCTION public.rls_auto_enable();

-- Tabela fda_diretoria
CREATE TABLE IF NOT EXISTS public.fda_diretoria (
  email text NOT NULL,
  CONSTRAINT fda_diretoria_pkey PRIMARY KEY (email)
);

ALTER TABLE public.fda_diretoria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "diretor ve o proprio email" ON public.fda_diretoria
  FOR SELECT
  TO authenticated
  USING (lower(email) = lower((auth.jwt() ->> 'email'::text)));

-- Tabela fda_estado
CREATE TABLE IF NOT EXISTS public.fda_estado (
  id integer NOT NULL,
  dados jsonb,
  versao integer NOT NULL DEFAULT 0,
  atualizado_em timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT fda_estado_pkey PRIMARY KEY (id)
);

ALTER TABLE public.fda_estado ENABLE ROW LEVEL SECURITY;

CREATE POLICY "todos podem ver" ON public.fda_estado
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "diretoria pode salvar" ON public.fda_estado
  FOR UPDATE
  TO authenticated
  USING (lower((auth.jwt() ->> 'email'::text)) IN (SELECT lower(fda_diretoria.email) AS lower FROM public.fda_diretoria))
  WITH CHECK (lower((auth.jwt() ->> 'email'::text)) IN (SELECT lower(fda_diretoria.email) AS lower FROM public.fda_diretoria));
