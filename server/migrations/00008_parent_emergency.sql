-- Migration to allow parents to read and create emergency alerts for their children

-- Allow parents to read alerts for their linked children
CREATE POLICY "Parents can read alerts for their children" ON public.emergency_alerts
FOR SELECT USING (
    auth_role() = 'parent' AND
    student_id IN (
        SELECT student_id FROM public.parent_student_links 
        WHERE parent_id = auth.uid() AND status = 'active'
    )
);

-- Allow parents to create alerts for their linked children
CREATE POLICY "Parents can create alerts for their children" ON public.emergency_alerts
FOR INSERT WITH CHECK (
    auth_role() = 'parent' AND
    college_id = auth_college_id() AND
    student_id IN (
        SELECT student_id FROM public.parent_student_links 
        WHERE parent_id = auth.uid() AND status = 'active'
    )
);
