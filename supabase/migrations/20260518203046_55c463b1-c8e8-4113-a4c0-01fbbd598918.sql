
-- Tighten public read on itbi_transactions; views (itbi_stats_bairro / itbi_stats_recent) already expose aggregates publicly
DROP POLICY IF EXISTS "Permitir leitura pública de transações para views agregadas" ON public.itbi_transactions;

-- Harden UPDATE on valuations: only the existing owner may update, and the user_id column may not be reassigned
DROP POLICY IF EXISTS "Usuários podem atualizar suas avaliações" ON public.valuations;
CREATE POLICY "Usuários podem atualizar suas avaliações"
ON public.valuations
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
