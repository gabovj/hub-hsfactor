-- Banco de Temas de Contenido
CREATE TABLE IF NOT EXISTS public.temas_contenido (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tema text NOT NULL,
  angulo text,
  activo boolean NOT NULL DEFAULT false,
  orden integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.temas_contenido TO authenticated;
GRANT ALL ON public.temas_contenido TO service_role;

ALTER TABLE public.temas_contenido ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "superadmin manage temas" ON public.temas_contenido;
CREATE POLICY "superadmin manage temas"
  ON public.temas_contenido
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));
