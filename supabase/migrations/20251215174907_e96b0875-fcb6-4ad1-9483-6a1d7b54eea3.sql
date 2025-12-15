-- Create trigger to update supplier score when documento_criterios changes
CREATE OR REPLACE TRIGGER update_supplier_score_on_criterios
AFTER INSERT OR UPDATE OR DELETE ON public.documento_criterios
FOR EACH ROW
EXECUTE FUNCTION public.update_supplier_score();

-- Also create trigger for when documento status changes to 'concluido'
CREATE OR REPLACE TRIGGER update_supplier_score_on_documento
AFTER UPDATE ON public.documentos
FOR EACH ROW
WHEN (NEW.status = 'concluido' AND OLD.status <> 'concluido')
EXECUTE FUNCTION public.update_supplier_score();