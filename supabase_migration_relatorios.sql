-- ====================================================================
-- MIGRAÇÃO SUPABASE: Relatório Semanal de Pesquisas por E-mail
-- Execute este script no SQL Editor do seu painel Supabase (https://supabase.com/dashboard)
-- ====================================================================

-- Adiciona campos para armazenar o e-mail de recebimento e status de envio automático
ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS email_relatorio text,
ADD COLUMN IF NOT EXISTS receber_relatorio_semanal boolean DEFAULT true;

-- Comentários descritivos nas colunas
COMMENT ON COLUMN clientes.email_relatorio IS 'Endereço de e-mail do cliente para recebimento do relatório periódico das pesquisas';
COMMENT ON COLUMN clientes.receber_relatorio_semanal IS 'Define se o envio automático semanal de relatórios está ativo (true) ou cancelado (false)';

