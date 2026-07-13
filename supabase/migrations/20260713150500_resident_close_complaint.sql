BEGIN;

CREATE OR REPLACE FUNCTION protect_complaint_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF (SELECT my_role()) = 'resident' THEN
    IF OLD.raised_by = (SELECT auth.uid())
       AND OLD.status = 'resolved'
       AND NEW.status = 'closed'
    THEN
      NEW.priority := OLD.priority;
      NEW.assigned_to := OLD.assigned_to;
      NEW.assigned_service_provider_id := OLD.assigned_service_provider_id;
      NEW.resolved_at := COALESCE(OLD.resolved_at, NEW.resolved_at);
      RETURN NEW;
    END IF;

    NEW.status := OLD.status;
    NEW.priority := OLD.priority;
    NEW.assigned_to := OLD.assigned_to;
    NEW.assigned_service_provider_id := OLD.assigned_service_provider_id;
  END IF;

  RETURN NEW;
END;
$$;

COMMIT;
