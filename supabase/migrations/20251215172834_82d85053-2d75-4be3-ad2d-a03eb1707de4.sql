-- Add sequential code column to documentos
ALTER TABLE public.documentos 
ADD COLUMN codigo SERIAL NOT NULL;

-- Create unique index on codigo
CREATE UNIQUE INDEX idx_documentos_codigo ON public.documentos(codigo);