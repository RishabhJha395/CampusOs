-- Emergency Alerts Table
CREATE TABLE public.emergency_alerts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id uuid NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    type text CHECK (type IN ('medical', 'security', 'fire', 'other')) DEFAULT 'other',
    location text, -- User provided description of location
    status text CHECK (status IN ('active', 'acknowledged', 'resolved')) DEFAULT 'active',
    resolved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL, -- Who resolved it (Warden/Admin)
    resolved_at timestamptz NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz NULL
);

CREATE TRIGGER set_emergency_alerts_updated_at
BEFORE UPDATE ON public.emergency_alerts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;

-- Students can read their own alerts
CREATE POLICY "Students can read their own alerts" ON public.emergency_alerts
FOR SELECT USING (student_id = auth.uid());

-- Wardens and Admins can read all alerts in their college
CREATE POLICY "Wardens and Admins can read college alerts" ON public.emergency_alerts
FOR SELECT USING (
    college_id = auth_college_id() AND 
    auth_role() IN ('warden', 'college_admin', 'super_admin')
);

-- Students can insert their own alerts
CREATE POLICY "Students can create alerts" ON public.emergency_alerts
FOR INSERT WITH CHECK (
    student_id = auth.uid() AND 
    college_id = auth_college_id()
);

-- Wardens and Admins can update alerts (e.g. mark as resolved)
CREATE POLICY "Wardens and Admins can update alerts" ON public.emergency_alerts
FOR UPDATE USING (
    college_id = auth_college_id() AND 
    auth_role() IN ('warden', 'college_admin', 'super_admin')
);
