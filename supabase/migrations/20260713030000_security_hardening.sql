-- Security Hardening Migration
-- Fixes critical and high-severity RLS and function issues

BEGIN;

-- ============================================================
-- 1. Profile privilege escalation (CRITICAL)
-- ============================================================

-- Force role='resident' and status='pending' on self-insert
DROP POLICY IF EXISTS "profiles_insert_self" ON profiles;
CREATE POLICY "profiles_insert_self"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (
  id = (SELECT auth.uid())
  AND role = 'resident'
  AND status = 'pending'
);

-- Restrict self-update to safe columns via trigger
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
TO authenticated
USING (id = (SELECT auth.uid()))
WITH CHECK (id = (SELECT auth.uid()));

CREATE OR REPLACE FUNCTION protect_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF (SELECT auth.uid()) IS NOT NULL
     AND (SELECT my_role()) <> 'admin' THEN
    NEW.role := OLD.role;
    NEW.status := OLD.status;
    NEW.society_id := OLD.society_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_protect_profile_fields ON profiles;
CREATE TRIGGER tg_protect_profile_fields
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION protect_profile_fields();

-- ============================================================
-- 2. Join-flow RLS — scope towers and flats (CRITICAL)
-- ============================================================

-- Drop overly-broad M3 policies on towers and flats
DROP POLICY IF EXISTS "Authenticated users can browse towers for join flow" ON towers;
DROP POLICY IF EXISTS "Authenticated users can browse flats for join flow" ON flats;

-- Towers: allow if user is in that society, OR user has no society yet (joining)
CREATE POLICY "towers_read_own_or_joining"
ON towers FOR SELECT
TO authenticated
USING (
  society_id = (SELECT my_society_id())
  OR (SELECT my_society_id()) IS NULL
);

-- Flats: same logic via tower lookup
CREATE POLICY "flats_read_own_or_joining"
ON flats FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM towers t
    WHERE t.id = flats.tower_id
    AND (
      t.society_id = (SELECT my_society_id())
      OR (SELECT my_society_id()) IS NULL
    )
  )
);

-- ============================================================
-- 3. flat_residents INSERT — restrict join-flow insert (CRITICAL)
-- ============================================================

-- Drop overly-permissive M3 policy
DROP POLICY IF EXISTS "Users can register themselves as a flat resident" ON flat_residents;

-- Allow joining users (no society yet) to insert themselves only once
CREATE POLICY "flat_residents_join_first_flat"
ON flat_residents FOR INSERT
TO authenticated
WITH CHECK (
  profile_id = (SELECT auth.uid())
  AND (SELECT my_society_id()) IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM flat_residents
    WHERE profile_id = (SELECT auth.uid())
  )
);

-- ============================================================
-- 4. search_flats society membership check (HIGH)
-- ============================================================

CREATE OR REPLACE FUNCTION search_flats(p_society uuid, p_query text)
RETURNS TABLE(id uuid, number text, tower_name text, primary_resident text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    f.id, f.number, t.name AS tower_name,
    (
      SELECT p.full_name
      FROM flat_residents fr
      JOIN profiles p ON p.id = fr.profile_id
      WHERE fr.flat_id = f.id
      ORDER BY fr.is_head DESC, fr.joined_at ASC
      LIMIT 1
    ) AS primary_resident
  FROM flats f
  JOIN towers t ON t.id = f.tower_id
  WHERE t.society_id = p_society
    AND (p_society = my_society_id() OR my_role() = 'admin')
    AND f.number ILIKE '%' || p_query || '%'
  ORDER BY t.name, f.number
  LIMIT 20;
$$;

-- ============================================================
-- 5. verify_preapproval PII leak (MEDIUM)
-- ============================================================

CREATE OR REPLACE FUNCTION verify_preapproval(p_code text)
RETURNS TABLE(
  pre_approval_id uuid,
  flat_id uuid,
  visitor_name text,
  visitor_phone text,
  type visitor_type,
  valid boolean,
  reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r pre_approvals%rowtype;
  preapproval_society uuid;
BEGIN
  IF (SELECT my_role()) NOT IN ('guard', 'admin') THEN
    RETURN QUERY SELECT null::uuid, null::uuid, null::text, null::text, null::visitor_type, false, 'not_authorized'::text;
    RETURN;
  END IF;

  SELECT pa.* INTO r FROM pre_approvals pa WHERE upper(pa.code) = upper(p_code);

  IF NOT FOUND THEN
    RETURN QUERY SELECT null::uuid, null::uuid, null::text, null::text, null::visitor_type, false, 'invalid_code'::text;
    RETURN;
  END IF;

  SELECT t.society_id INTO preapproval_society
  FROM flats f JOIN towers t ON t.id = f.tower_id WHERE f.id = r.flat_id;

  IF preapproval_society IS DISTINCT FROM (SELECT my_society_id()) THEN
    RETURN QUERY SELECT null::uuid, null::uuid, null::text, null::text, null::visitor_type, false, 'wrong_society'::text;
    RETURN;
  END IF;

  IF r.qr_used_at IS NOT NULL AND NOT r.recurring THEN
    RETURN QUERY SELECT null::uuid, null::uuid, null::text, null::text, null::visitor_type, false, 'already_used'::text;
    RETURN;
  END IF;

  IF now() < r.start_at OR now() > r.end_at THEN
    RETURN QUERY SELECT null::uuid, null::uuid, null::text, null::text, null::visitor_type, false, 'out_of_window'::text;
    RETURN;
  END IF;

  RETURN QUERY SELECT r.id, r.flat_id, r.visitor_name, r.visitor_phone, r.type, true, ''::text;
END;
$$;

-- ============================================================
-- 6. Storage buckets — make private, add SELECT policies (HIGH)
-- ============================================================

UPDATE storage.buckets SET public = false WHERE id IN ('visitor-photos', 'complaint-photos', 'notice-attachments');

-- SELECT policies for private buckets
DROP POLICY IF EXISTS "visitor_photos_select_society" ON storage.objects;
CREATE POLICY "visitor_photos_select_society"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'visitor-photos'
  AND (SELECT public.my_role()) IN ('guard', 'admin')
);

DROP POLICY IF EXISTS "complaint_photos_select_society" ON storage.objects;
CREATE POLICY "complaint_photos_select_society"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'complaint-photos');

DROP POLICY IF EXISTS "notice_attachments_select_society" ON storage.objects;
CREATE POLICY "notice_attachments_select_society"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'notice-attachments');

-- Scope complaint-photos upload to user's own folder
DROP POLICY IF EXISTS "complaint_photos_insert_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "complaint_photos_insert_own" ON storage.objects;
CREATE POLICY "complaint_photos_insert_own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'complaint-photos'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

-- ============================================================
-- 7. Amenity booking overlap prevention (MEDIUM)
-- ============================================================

CREATE OR REPLACE FUNCTION check_booking_overlap()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM amenity_bookings
    WHERE amenity_id = NEW.amenity_id
      AND id <> NEW.id
      AND status NOT IN ('cancelled')
      AND tstzrange(start_at, end_at) && tstzrange(NEW.start_at, NEW.end_at)
  ) THEN
    RAISE EXCEPTION 'booking_overlap' USING HINT = 'Another booking overlaps this time slot';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_check_booking_overlap ON amenity_bookings;
CREATE TRIGGER tg_check_booking_overlap
BEFORE INSERT OR UPDATE ON amenity_bookings
FOR EACH ROW
WHEN (NEW.status <> 'cancelled')
EXECUTE FUNCTION check_booking_overlap();

-- ============================================================
-- 8. RLS write restrictions — visitors and complaints (MEDIUM)
-- ============================================================

-- Protect visitor fields from resident modification
CREATE OR REPLACE FUNCTION protect_visitor_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF (SELECT my_role()) = 'resident' THEN
    NEW.status := OLD.status;
    NEW.guard_id := OLD.guard_id;
    NEW.entered_at := OLD.entered_at;
    NEW.exited_at := OLD.exited_at;
    NEW.guard_note := OLD.guard_note;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_protect_visitor_fields ON visitors;
CREATE TRIGGER tg_protect_visitor_fields
BEFORE UPDATE ON visitors
FOR EACH ROW
EXECUTE FUNCTION protect_visitor_fields();

-- Protect complaint fields from resident modification
CREATE OR REPLACE FUNCTION protect_complaint_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF (SELECT my_role()) = 'resident' THEN
    NEW.status := OLD.status;
    NEW.priority := OLD.priority;
    NEW.assigned_to := OLD.assigned_to;
    NEW.assigned_service_provider_id := OLD.assigned_service_provider_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_protect_complaint_fields ON complaints;
CREATE TRIGGER tg_protect_complaint_fields
BEFORE UPDATE ON complaints
FOR EACH ROW
EXECUTE FUNCTION protect_complaint_fields();

COMMIT;
