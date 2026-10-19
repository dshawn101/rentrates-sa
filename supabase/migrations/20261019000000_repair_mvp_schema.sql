-- Safe to apply to an empty application schema or a Phase 1 database.
-- Existing rows and existing RLS policies are preserved.
BEGIN;

-- Uses PostgreSQL built-in gen_random_uuid(); no extension installation required.

-- Table: user_profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'express', 'craft')),
    subscription_status TEXT DEFAULT 'inactive',
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
DO $policy$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_profiles' AND policyname = 'Users can view their own profile') THEN
    CREATE POLICY "Users can view their own profile" ON public.user_profiles FOR SELECT TO authenticated USING ((select auth.uid()) = id);
  END IF;
END
$policy$;

-- Table: books
CREATE TABLE IF NOT EXISTS public.books (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'draft',
    tier_created TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
DO $policy$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'books' AND policyname = 'Users can view their own books') THEN
    CREATE POLICY "Users can view their own books" ON public.books FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
  END IF;
END
$policy$;
DO $policy$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'books' AND policyname = 'Users can insert their own books') THEN
    CREATE POLICY "Users can insert their own books" ON public.books FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
  END IF;
END
$policy$;
DO $policy$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'books' AND policyname = 'Users can update their own books') THEN
    CREATE POLICY "Users can update their own books" ON public.books FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
  END IF;
END
$policy$;
DO $policy$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'books' AND policyname = 'Users can delete their own books') THEN
    CREATE POLICY "Users can delete their own books" ON public.books FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
  END IF;
END
$policy$;

-- Table: chapters
CREATE TABLE IF NOT EXISTS public.chapters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
    title TEXT,
    content TEXT,
    order_index INTEGER NOT NULL,
    ai_contribution JSONB DEFAULT '{}'::jsonb,
    version_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
-- Policies for chapters based on book ownership
DO $policy$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'chapters' AND policyname = 'Users can manage chapters for their books') THEN
    CREATE POLICY "Users can manage chapters for their books" ON public.chapters TO authenticated
    USING (EXISTS (SELECT 1 FROM public.books WHERE books.id = chapters.book_id AND books.user_id = (select auth.uid())));
  END IF;
END
$policy$;

-- Table: book_covers
CREATE TABLE IF NOT EXISTS public.book_covers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    provider TEXT NOT NULL,
    is_selected BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.book_covers ENABLE ROW LEVEL SECURITY;
DO $policy$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'book_covers' AND policyname = 'Users can manage covers for their books') THEN
    CREATE POLICY "Users can manage covers for their books" ON public.book_covers TO authenticated
    USING (EXISTS (SELECT 1 FROM public.books WHERE books.id = book_covers.book_id AND books.user_id = (select auth.uid())));
  END IF;
END
$policy$;

-- Table: usage_tracking
CREATE TABLE IF NOT EXISTS public.usage_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    api_provider TEXT NOT NULL,
    tokens INTEGER NOT NULL,
    cost_usd DECIMAL(10, 4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
DO $policy$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'usage_tracking' AND policyname = 'Users can view their own usage') THEN
    CREATE POLICY "Users can view their own usage" ON public.usage_tracking FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
  END IF;
END
$policy$;
DO $policy$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'usage_tracking' AND policyname = 'Users can insert their own usage') THEN
    CREATE POLICY "Users can insert their own usage" ON public.usage_tracking FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
  END IF;
END
$policy$;

-- Table: billing_events
CREATE TABLE IF NOT EXISTS public.billing_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    event_type TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    stripe_event_id TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;
DO $policy$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'billing_events' AND policyname = 'Users can view their own billing events') THEN
    CREATE POLICY "Users can view their own billing events" ON public.billing_events FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
  END IF;
END
$policy$;

-- Functions and Triggers
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
CREATE OR REPLACE FUNCTION private.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, tier, subscription_status)
  VALUES (new.id, new.email, 'free', 'inactive')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE EXECUTE ON FUNCTION private.handle_new_user() FROM PUBLIC, anon, authenticated;

DO $trigger$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created' AND tgrelid = 'auth.users'::regclass) THEN
    CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION private.handle_new_user();
  END IF;
END
$trigger$;

-- Users may have signed up before the application schema was installed.
INSERT INTO public.user_profiles (id, email, tier, subscription_status)
SELECT id, email, 'free', 'inactive' FROM auth.users WHERE email IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- Clear any broad project default grants before assigning client privileges.
REVOKE ALL ON public.user_profiles, public.books, public.chapters, public.book_covers,
  public.usage_tracking, public.billing_events FROM anon, authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.books, public.chapters, public.book_covers TO authenticated;
GRANT SELECT, INSERT ON public.usage_tracking TO authenticated;
GRANT SELECT ON public.billing_events TO authenticated;

CREATE INDEX IF NOT EXISTS books_user_updated_idx ON public.books(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS chapters_book_order_idx ON public.chapters(book_id, order_index);
CREATE INDEX IF NOT EXISTS book_covers_book_idx ON public.book_covers(book_id);
CREATE INDEX IF NOT EXISTS usage_tracking_user_idx ON public.usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS billing_events_user_idx ON public.billing_events(user_id);

-- Refresh PostgREST's relationship/table cache after the transaction commits.
NOTIFY pgrst, 'reload schema';

COMMIT;
