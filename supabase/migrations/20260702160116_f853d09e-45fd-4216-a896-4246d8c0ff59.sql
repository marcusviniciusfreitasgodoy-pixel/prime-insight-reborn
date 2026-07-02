
CREATE OR REPLACE FUNCTION public.check_lead_rate_limit(p_email text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN true;
END;
$function$;
