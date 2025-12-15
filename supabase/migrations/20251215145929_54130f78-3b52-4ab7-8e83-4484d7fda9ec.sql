-- Create grupos_qualificacao table
CREATE TABLE public.grupos_qualificacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  descricao TEXT NOT NULL,
  situacao TEXT NOT NULL DEFAULT 'ativo' CHECK (situacao IN ('ativo', 'inativo')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create criterios table
CREATE TABLE public.criterios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  descricao TEXT NOT NULL,
  grupo_id UUID REFERENCES public.grupos_qualificacao(id) ON DELETE SET NULL,
  situacao TEXT NOT NULL DEFAULT 'ativo' CHECK (situacao IN ('ativo', 'inativo')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fornecedores table
CREATE TABLE public.fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  cnpj TEXT NOT NULL,
  endereco TEXT,
  situacao TEXT NOT NULL DEFAULT 'ativo' CHECK (situacao IN ('ativo', 'inativo')),
  score_atual NUMERIC(5,2) DEFAULT 0,
  total_avaliacoes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fornecedor_contatos table
CREATE TABLE public.fornecedor_contatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fornecedor_id UUID REFERENCES public.fornecedores(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  email TEXT,
  whatsapp TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.grupos_qualificacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.criterios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedor_contatos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for grupos_qualificacao (authenticated users can CRUD)
CREATE POLICY "Authenticated users can view grupos"
ON public.grupos_qualificacao FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert grupos"
ON public.grupos_qualificacao FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update grupos"
ON public.grupos_qualificacao FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete grupos"
ON public.grupos_qualificacao FOR DELETE
TO authenticated
USING (true);

-- RLS Policies for criterios
CREATE POLICY "Authenticated users can view criterios"
ON public.criterios FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert criterios"
ON public.criterios FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update criterios"
ON public.criterios FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete criterios"
ON public.criterios FOR DELETE
TO authenticated
USING (true);

-- RLS Policies for fornecedores
CREATE POLICY "Authenticated users can view fornecedores"
ON public.fornecedores FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert fornecedores"
ON public.fornecedores FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update fornecedores"
ON public.fornecedores FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete fornecedores"
ON public.fornecedores FOR DELETE
TO authenticated
USING (true);

-- RLS Policies for fornecedor_contatos
CREATE POLICY "Authenticated users can view contatos"
ON public.fornecedor_contatos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert contatos"
ON public.fornecedor_contatos FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update contatos"
ON public.fornecedor_contatos FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete contatos"
ON public.fornecedor_contatos FOR DELETE
TO authenticated
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_criterios_grupo ON public.criterios(grupo_id);
CREATE INDEX idx_fornecedor_contatos_fornecedor ON public.fornecedor_contatos(fornecedor_id);
CREATE INDEX idx_fornecedores_score ON public.fornecedores(score_atual DESC);

-- Add updated_at triggers
CREATE TRIGGER update_grupos_qualificacao_updated_at
  BEFORE UPDATE ON public.grupos_qualificacao
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_criterios_updated_at
  BEFORE UPDATE ON public.criterios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fornecedores_updated_at
  BEFORE UPDATE ON public.fornecedores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();