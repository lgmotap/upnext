-- Block direct PostgREST access; Prisma uses the postgres connection (bypasses RLS).
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Organization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Membership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BusinessProfile" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public."User" FROM anon, authenticated;
REVOKE ALL ON TABLE public."Organization" FROM anon, authenticated;
REVOKE ALL ON TABLE public."Membership" FROM anon, authenticated;
REVOKE ALL ON TABLE public."BusinessProfile" FROM anon, authenticated;
