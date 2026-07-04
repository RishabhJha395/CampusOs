-- Clubs Table
CREATE TABLE public.clubs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id uuid NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text NOT NULL,
    category text NOT NULL,
    president_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Club Members Table
CREATE TABLE public.club_members (
    club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (club_id, student_id)
);

-- Club Events Table
CREATE TABLE public.club_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text NOT NULL,
    event_date date NOT NULL,
    event_time time NOT NULL,
    location text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_events ENABLE ROW LEVEL SECURITY;

-- Clubs Policies
CREATE POLICY "Anyone in college can view clubs" ON public.clubs
FOR SELECT USING (college_id = auth_college_id());

CREATE POLICY "Only admins or presidents can insert/update clubs" ON public.clubs
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND (role = 'college_admin' OR id = president_id)
    )
);

-- Club Members Policies
CREATE POLICY "Anyone in college can view club members" ON public.club_members
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.clubs 
        WHERE id = club_members.club_id AND college_id = auth_college_id()
    )
);

CREATE POLICY "Students can join or leave clubs" ON public.club_members
FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can leave clubs" ON public.club_members
FOR DELETE USING (student_id = auth.uid());

-- Club Events Policies
CREATE POLICY "Anyone in college can view events" ON public.club_events
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.clubs 
        WHERE id = club_events.club_id AND college_id = auth_college_id()
    )
);

CREATE POLICY "Only club presidents can manage events" ON public.club_events
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.clubs 
        WHERE id = club_events.club_id AND president_id = auth.uid()
    )
);
