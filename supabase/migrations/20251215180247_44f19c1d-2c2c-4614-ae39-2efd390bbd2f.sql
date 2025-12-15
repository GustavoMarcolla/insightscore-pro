-- Drop the problematic trigger on documentos
DROP TRIGGER IF EXISTS update_supplier_score_on_documento ON public.documentos;

-- Recreate the function to handle both tables correctly
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
  -- Determine fornecedor_id based on which table triggered
  IF TG_TABLE_NAME = 'documentos' THEN
    -- Triggered from documentos table - use fornecedor_id directly
    v_fornecedor_id := COALESCE(NEW.fornecedor_id, OLD.fornecedor_id);
  ELSE
    -- Triggered from documento_criterios table - lookup via documento
    SELECT fornecedor_id INTO v_fornecedor_id
    FROM public.documentos
    WHERE id = COALESCE(NEW.documento_id, OLD.documento_id);
  END IF;

  IF v_fornecedor_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Calculate average score for this supplier
  SELECT 
    COALESCE(AVG(dc.score) * 20, 0),
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

-- Recreate the trigger on documentos
CREATE TRIGGER update_supplier_score_on_documento
AFTER UPDATE ON public.documentos
FOR EACH ROW
WHEN (NEW.status = 'concluido' AND OLD.status <> 'concluido')
EXECUTE FUNCTION public.update_supplier_score();