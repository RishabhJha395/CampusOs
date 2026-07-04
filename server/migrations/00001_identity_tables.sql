-- Departments
CREATE TABLE public.departments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id uuid NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    name text NOT NULL,
    code text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz NULL,
    UNIQUE(college_id, code)
);

CREATE TRIGGER set_departments_updated_at
BEFORE UPDATE ON public.departments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Departments read same college" ON public.departments
FOR SELECT USING (college_id = auth_college_id() AND deleted_at IS NULL);

-- Hostels (Needed for wardens and students)
CREATE TABLE public.hostels (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id uuid NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    name text NOT NULL,
    type text CHECK (type IN ('boys','girls','co-ed')),
    total_capacity int,
    warden_id uuid, -- FK added later when wardens table exists, or just leave as uuid
    address text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz NULL
);

-- Rooms
CREATE TABLE public.rooms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id uuid NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    hostel_id uuid NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
    room_number text NOT NULL,
    capacity smallint DEFAULT 2,
    occupied_count smallint DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz NULL,
    UNIQUE(hostel_id, room_number)
);

-- Students
CREATE TABLE public.students (
    id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    college_id uuid NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
    enrollment_number text,
    year smallint CHECK (year BETWEEN 1 AND 6),
    section text,
    hostel_id uuid REFERENCES public.hostels(id) ON DELETE SET NULL,
    room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
    skills text[],
    interests text[],
    resume_url text,
    social_links jsonb DEFAULT '{}',
    parent_invite_code text UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz NULL,
    UNIQUE(college_id, enrollment_number)
);

CREATE TRIGGER set_students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Faculty
CREATE TABLE public.faculty (
    id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    college_id uuid NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
    designation text,
    office_hours text,
    research_interests text[],
    employee_code text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz NULL,
    UNIQUE(college_id, employee_code)
);

-- Parents
CREATE TABLE public.parents (
    id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    college_id uuid NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz NULL
);

-- Wardens
CREATE TABLE public.wardens (
    id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    college_id uuid NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    hostel_id uuid REFERENCES public.hostels(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz NULL
);

-- Add foreign key to hostels now that wardens exist
ALTER TABLE public.hostels ADD CONSTRAINT fk_hostels_warden FOREIGN KEY (warden_id) REFERENCES public.wardens(id) ON DELETE SET NULL;

-- Parent Student Links
CREATE TABLE public.parent_student_links (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id uuid NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    parent_id uuid NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    relationship text DEFAULT 'guardian',
    linked_via_code text,
    status text CHECK (status IN ('active','revoked')) DEFAULT 'active',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz NULL,
    UNIQUE(parent_id, student_id)
);

-- Redeem Invite Code Function
CREATE OR REPLACE FUNCTION public.redeem_parent_invite_code(invite_code text, p_parent_id uuid)
RETURNS boolean AS $$
DECLARE
    v_student_id uuid;
    v_college_id uuid;
BEGIN
    -- Find student with this code
    SELECT id, college_id INTO v_student_id, v_college_id
    FROM public.students
    WHERE parent_invite_code = invite_code AND deleted_at IS NULL;

    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Invalid or expired invite code';
    END IF;

    -- Create link
    INSERT INTO public.parent_student_links (college_id, parent_id, student_id, linked_via_code)
    VALUES (v_college_id, p_parent_id, v_student_id, invite_code)
    ON CONFLICT (parent_id, student_id) DO NOTHING;

    -- Invalidate code (one-time use)
    UPDATE public.students SET parent_invite_code = NULL WHERE id = v_student_id;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
