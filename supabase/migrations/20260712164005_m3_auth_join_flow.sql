-- M3: Auth join-flow policies
-- Allows new users (who have no society_id yet) to:
--   1. Look up a society by code to join
--   2. Browse towers and flats within that society during onboarding
--   3. Self-register into flat_residents

-- ─── societies: allow any authenticated user to SELECT for join-flow lookup ───
-- The existing policy only works once the user already has a society_id.
-- This additional policy allows unauthenticated-to-a-society users to find
-- a society by code so they can complete the join flow.
CREATE POLICY "Authenticated users can look up any society"
ON societies FOR SELECT
TO authenticated
USING (true);

-- ─── towers: allow authenticated users to browse towers during join ───
-- An unjoined user needs to list towers to pick one during sign-up.
CREATE POLICY "Authenticated users can browse towers for join flow"
ON towers FOR SELECT
TO authenticated
USING (true);

-- ─── flats: allow authenticated users to browse flats during join ───
CREATE POLICY "Authenticated users can browse flats for join flow"
ON flats FOR SELECT
TO authenticated
USING (true);

-- ─── flat_residents: allow self-registration during join flow ───
-- The existing policy only allows admins. New users need to insert
-- their own row when they join a society.
CREATE POLICY "Users can register themselves as a flat resident"
ON flat_residents FOR INSERT
TO authenticated
WITH CHECK (profile_id = (SELECT auth.uid()));
