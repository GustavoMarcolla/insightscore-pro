-- Create documentos table (recebimentos/notas fiscais)
CREATE TABLE public.documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fornecedor_id UUID REFERENCES public.fornecedores(id) ON DELETE CASCADE NOT NULL,
  data_recebimento DATE NOT NULL DEFAULT CURRENT_DATE,
  serie_nf TEXT,
  numero_nf TEXT,
  observacao TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'concluido')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create documento_criterios table (avaliações por critério)
CREATE TABLE public.documento_criterios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_id UUID REFERENCES public.documentos(id) ON DELETE CASCADE NOT NULL,
  criterio_id UUID REFERENCES public.criterios(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 5),
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(documento_id, criterio_id)
);

-- Create documento_anexos table (fotos e documentos)
CREATE TABLE public.documento_anexos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_id UUID REFERENCES public.documentos(id) ON DELETE CASCADE NOT NULL,
  criterio_id UUID REFERENCES public.criterios(id) ON DELETE SET NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documento_criterios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documento_anexos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for documentos
CREATE POLICY "Authenticated users can view documentos"
ON public.documentos FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert documentos"
ON public.documentos FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update documentos"
ON public.documentos FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete documentos"
ON public.documentos FOR DELETE TO authenticated USING (true);

-- RLS Policies for documento_criterios
CREATE POLICY "Authenticated users can view documento_criterios"
ON public.documento_criterios FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert documento_criterios"
ON public.documento_criterios FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update documento_criterios"
ON public.documento_criterios FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete documento_criterios"
ON public.documento_criterios FOR DELETE TO authenticated USING (true);

-- RLS Policies for documento_anexos
CREATE POLICY "Authenticated users can view documento_anexos"
ON public.documento_anexos FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert documento_anexos"
ON public.documento_anexos FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can delete documento_anexos"
ON public.documento_anexos FOR DELETE TO authenticated USING (true);

-- Create indexes
CREATE INDEX idx_documentos_fornecedor ON public.documentos(fornecedor_id);
CREATE INDEX idx_documentos_data ON public.documentos(data_recebimento DESC);
CREATE INDEX idx_documento_criterios_documento ON public.documento_criterios(documento_id);
CREATE INDEX idx_documento_anexos_documento ON public.documento_anexos(documento_id);

-- Add triggers for updated_at
CREATE TRIGGER update_documentos_updated_at
  BEFORE UPDATE ON public.documentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for qualification files
INSERT INTO storage.buckets (id, name, public) VALUES ('qualificacoes', 'qualificacoes', true);

-- Storage policies
CREATE POLICY "Authenticated users can upload qualification files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'qualificacoes');

CREATE POLICY "Anyone can view qualification files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'qualificacoes');

CREATE POLICY "Authenticated users can delete qualification files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'qualificacoes');

-- Function to update supplier score after qualification
CREATE OR REPLACE FUNCTION public.update_supplier_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fornecedor_id UUID;
  v_avg_score NUMERIC;
  v_total_avaliacoes INTEGER;
BEGIN
  -- Get fornecedor_id from documento
  SELECT fornecedor_id INTO v_fornecedor_id
  FROM public.documentos
  WHERE id = COALESCE(NEW.documento_id, OLD.documento_id);

  -- Calculate average score for this supplier
  SELECT 
    COALESCE(AVG(dc.score) * 20, 0), -- Convert 0-5 to 0-100
    COUNT(DISTINCT d.id)
  INTO v_avg_score, v_total_avaliacoes
  FROM public.documentos d
  JOIN public.documento_criterios dc ON dc.documento_id = d.id
  WHERE d.fornecedor_id = v_fornecedor_id
    AND d.status = 'concluido';

  -- Update supplier score
  UPDATE public.fornecedores
  SET 
    score_atual = v_avg_score,
    total_avaliacoes = v_total_avaliacoes
  WHERE id = v_fornecedor_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger to update score when criterios are modified
CREATE TRIGGER update_supplier_score_on_criterio
  AFTER INSERT OR UPDATE OR DELETE ON public.documento_criterios
  FOR EACH ROW EXECUTE FUNCTION public.update_supplier_score();