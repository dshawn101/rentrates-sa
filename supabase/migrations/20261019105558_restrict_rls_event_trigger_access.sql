-- Internal DDL event triggers do not need to be callable by browser clients.
-- Leave the trigger itself enabled so newly created tables still receive RLS.
DO $permissions$
BEGIN
  IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
  END IF;
END
$permissions$;
