
-- Trigger Function for updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Colleges Table
CREATE TABLE public.colleges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    short_code text UNIQUE NOT NULL,
    domain text UNIQUE,
    logo_url text,
    primary_color text,
    is_active boolean DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz NULL
);

CREATE TRIGGER set_colleges_updated_at
BEFORE UPDATE ON public.colleges
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Profiles Table
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    college_id uuid NOT NULL REFERENCES public.colleges(id) ON DELETE RESTRICT,
    role text CHECK (role IN ('super_admin','college_admin','faculty','student','parent','warden')),
    full_name text NOT NULL,
    avatar_url text,
    phone text,
    gender text,
    date_of_birth date,
    bio text,
    is_active boolean DEFAULT true,
    onboarding_completed boolean DEFAULT false,
    last_seen_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz NULL
);

CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Core RLS Helpers
CREATE OR REPLACE FUNCTION auth_college_id() RETURNS uuid AS $$
  SELECT college_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth_role() RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Indexes
CREATE INDEX idx_profiles_college_role ON public.profiles(college_id, role);
CREATE INDEX idx_profiles_last_seen ON public.profiles(last_seen_at);

-- RLS Enable
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Initial Policies
CREATE POLICY "Colleges are readable by authenticated users" 
ON public.colleges FOR SELECT TO authenticated USING (deleted_at IS NULL);

CREATE POLICY "Users can read own profile" 
ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
