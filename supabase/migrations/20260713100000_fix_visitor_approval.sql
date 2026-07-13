-- Residents must be able to approve/reject pending visitor requests.
-- The security_hardening trigger was reverting status on every resident update.

CREATE OR REPLACE FUNCTION protect_visitor_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF (SELECT my_role()) = 'resident' THEN
    NEW.guard_id := OLD.guard_id;
    NEW.entered_at := OLD.entered_at;
    NEW.exited_at := OLD.exited_at;
    NEW.guard_note := OLD.guard_note;

    IF OLD.status IS DISTINCT FROM NEW.status THEN
      IF NOT (OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected')) THEN
        NEW.status := OLD.status;
        NEW.decided_at := OLD.decided_at;
        NEW.decided_by := OLD.decided_by;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
