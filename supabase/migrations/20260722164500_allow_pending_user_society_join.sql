-- Restore check in protect_profile_fields trigger allowing pending users with null society_id to set their society_id when joining society.
-- The previous trigger unconditional assignment (NEW.society_id := OLD.society_id) silently overwrote society_id to null when joining a society.

CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Escape hatch for SECURITY DEFINER RPCs to update protected fields
  IF current_setting('request.internal_bypass', true) = 'true' THEN
    RETURN NEW;
  END IF;

  IF (SELECT auth.uid()) IS NOT NULL
     AND (SELECT public.my_role()) <> 'admin' THEN
    NEW.role := OLD.role;
    NEW.status := OLD.status;
    IF OLD.society_id IS NOT NULL THEN
      NEW.society_id := OLD.society_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
