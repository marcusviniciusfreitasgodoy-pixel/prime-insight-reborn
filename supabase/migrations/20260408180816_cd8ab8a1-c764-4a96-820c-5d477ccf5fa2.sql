CREATE POLICY "Permitir leitura pública de transações para views agregadas"
ON public.itbi_transactions
FOR SELECT
TO anon, authenticated
USING (true);