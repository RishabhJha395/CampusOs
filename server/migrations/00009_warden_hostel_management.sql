-- 1. Chat Participants can read each other's profiles
CREATE POLICY "Users can read chat participants" ON public.profiles
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.chat_participants cp1
        JOIN public.chat_participants cp2 ON cp1.channel_id = cp2.channel_id
        WHERE cp1.user_id = auth.uid() AND cp2.user_id = profiles.id
    )
);

-- 2. Wardens can read all profiles in their college
CREATE POLICY "Wardens can read all profiles in college" ON public.profiles
FOR SELECT USING (
    auth_role() = 'warden' AND 
    college_id = auth_college_id()
);

-- 3. Wardens can read parent_student_links for their college
ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Wardens can read parent links" ON public.parent_student_links
FOR SELECT USING (
    auth_role() = 'warden' AND 
    college_id = auth_college_id()
);
