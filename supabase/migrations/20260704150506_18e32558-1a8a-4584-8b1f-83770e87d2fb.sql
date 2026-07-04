CREATE OR REPLACE FUNCTION public.check_lead_rate_limit(p_email text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recent_count int;
BEGIN
  IF p_email IS NULL OR length(trim(p_email)) = 0 THEN
    RETURN false;
  END IF;

  SELECT COUNT(*) INTO v_recent_count
  FROM public.leads
  WHERE email = lower(trim(p_email))
    AND created_at > now() - interval '5 minutes';

  -- Allow up to 10 inserts per email within a 5-minute window.
  RETURN v_recent_count < 10;
END;
$$;