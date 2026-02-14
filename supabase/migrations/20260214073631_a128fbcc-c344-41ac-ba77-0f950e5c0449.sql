
-- Projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Bez tytułu',
  subtitle TEXT DEFAULT '',
  author_name TEXT DEFAULT '',
  description TEXT DEFAULT '',
  language TEXT DEFAULT 'pl',
  page_size TEXT DEFAULT 'A4',
  custom_width NUMERIC,
  custom_height NUMERIC,
  template TEXT DEFAULT 'modern',
  cover_url TEXT,
  header_config JSONB DEFAULT '{"showTitle":true,"showAuthor":true,"showLogo":false}'::jsonb,
  footer_config JSONB DEFAULT '{"showPageNumbers":true,"copyrightText":"© Paveelo"}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own projects" ON public.projects
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Chapters table
CREATE TABLE public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Nowy rozdział',
  sort_order INT NOT NULL DEFAULT 0,
  blocks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own chapters" ON public.chapters
  FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE id = chapters.project_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE id = chapters.project_id AND user_id = auth.uid()));

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_chapters_updated BEFORE UPDATE ON public.chapters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Cover storage bucket (public)
INSERT INTO storage.buckets (id, name, public) VALUES ('ebook-covers', 'ebook-covers', true);
CREATE POLICY "Users can upload covers" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'ebook-covers');
CREATE POLICY "Public view covers" ON storage.objects FOR SELECT USING (bucket_id = 'ebook-covers');
CREATE POLICY "Users can delete covers" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'ebook-covers');
