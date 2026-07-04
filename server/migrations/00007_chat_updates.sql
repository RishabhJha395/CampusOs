-- 1. Add is_edited to chat_messages
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_edited boolean DEFAULT false;

-- 2. RLS for Updating Messages (Edit within 10 mins)
CREATE POLICY "Users can edit their recent messages" ON public.chat_messages
FOR UPDATE USING (
    sender_id = auth.uid() 
    AND created_at >= now() - interval '10 minutes'
    AND deleted_at IS NULL
) WITH CHECK (
    sender_id = auth.uid() 
    AND created_at >= now() - interval '10 minutes'
);

CREATE OR REPLACE FUNCTION mark_message_as_edited_simple()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.content IS DISTINCT FROM NEW.content THEN
        NEW.is_edited = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_is_edited_on_update ON public.chat_messages;
CREATE TRIGGER set_is_edited_on_update
BEFORE UPDATE ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION mark_message_as_edited_simple();


-- 3. Student Union RLS Policies
-- Allow students to see the Student Union channel for their college
CREATE POLICY "Students can view Student Union" ON public.chat_channels
FOR SELECT USING (
    name = 'Student Union' AND type = 'group' 
    AND college_id = auth_college_id() 
    AND auth_role() = 'student'
);

-- Allow students to read messages in the Student Union
CREATE POLICY "Students can read Student Union messages" ON public.chat_messages
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.chat_channels c
        WHERE c.id = chat_messages.channel_id 
        AND c.name = 'Student Union' 
        AND c.type = 'group' 
        AND c.college_id = auth_college_id() 
        AND auth_role() = 'student'
    )
);

-- Allow students to insert messages in the Student Union
CREATE POLICY "Students can insert Student Union messages" ON public.chat_messages
FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM public.chat_channels c
        WHERE c.id = chat_messages.channel_id 
        AND c.name = 'Student Union' 
        AND c.type = 'group' 
        AND c.college_id = auth_college_id() 
        AND auth_role() = 'student'
    )
);

-- 4. RPC to securely create a Direct Chat with Role Validation
CREATE OR REPLACE FUNCTION public.create_direct_chat(other_user_id uuid)
RETURNS uuid AS $$
DECLARE
    v_my_role text;
    v_other_role text;
    v_my_college uuid;
    v_other_college uuid;
    v_channel_id uuid;
    v_is_linked boolean;
BEGIN
    -- Get my info
    SELECT role, college_id INTO v_my_role, v_my_college FROM public.profiles WHERE id = auth.uid();
    -- Get other info
    SELECT role, college_id INTO v_other_role, v_other_college FROM public.profiles WHERE id = other_user_id;

    -- Basic validation
    IF v_my_role IS NULL OR v_other_role IS NULL THEN
        RAISE EXCEPTION 'Invalid user profiles';
    END IF;
    
    IF auth.uid() = other_user_id THEN
        RAISE EXCEPTION 'Cannot chat with yourself';
    END IF;

    -- Check if a direct channel already exists between these two
    SELECT c.id INTO v_channel_id
    FROM public.chat_channels c
    JOIN public.chat_participants p1 ON p1.channel_id = c.id AND p1.user_id = auth.uid()
    JOIN public.chat_participants p2 ON p2.channel_id = c.id AND p2.user_id = other_user_id
    WHERE c.type = 'direct'
    LIMIT 1;

    IF v_channel_id IS NOT NULL THEN
        RETURN v_channel_id; -- Return existing channel
    END IF;

    -- Role Validation
    IF (v_my_role = 'student' AND v_other_role = 'parent') OR (v_my_role = 'parent' AND v_other_role = 'student') THEN
        SELECT EXISTS (
            SELECT 1 FROM public.parent_student_links 
            WHERE (parent_id = auth.uid() AND student_id = other_user_id) 
               OR (parent_id = other_user_id AND student_id = auth.uid())
        ) INTO v_is_linked;
        IF NOT v_is_linked THEN
            RAISE EXCEPTION 'Parents can only chat with their explicitly linked students';
        END IF;
    ELSIF (v_my_role = 'student' AND v_other_role = 'student') THEN
        IF v_my_college != v_other_college THEN RAISE EXCEPTION 'Students must be in the same college'; END IF;
    ELSIF (v_my_role = 'student' AND v_other_role = 'faculty') OR (v_my_role = 'faculty' AND v_other_role = 'student') THEN
        IF v_my_college != v_other_college THEN RAISE EXCEPTION 'Must be in the same college'; END IF;
    ELSIF (v_my_role = 'student' AND v_other_role = 'warden') OR (v_my_role = 'warden' AND v_other_role = 'student') THEN
        IF v_my_college != v_other_college THEN RAISE EXCEPTION 'Must be in the same college'; END IF;
    ELSIF (v_my_role = 'parent' AND v_other_role = 'warden') OR (v_my_role = 'warden' AND v_other_role = 'parent') THEN
        -- Acceptable
        NULL;
    ELSIF (v_my_role = 'faculty' AND v_other_role = 'college_admin') OR (v_my_role = 'college_admin' AND v_other_role = 'faculty') THEN
        IF v_my_college != v_other_college THEN RAISE EXCEPTION 'Must be in the same college'; END IF;
    ELSE
        RAISE EXCEPTION 'Chat pairing between % and % is not allowed by system rules', v_my_role, v_other_role;
    END IF;

    -- Create the channel
    INSERT INTO public.chat_channels (college_id, type)
    VALUES (v_my_college, 'direct')
    RETURNING id INTO v_channel_id;

    -- Add participants
    INSERT INTO public.chat_participants (channel_id, user_id) VALUES (v_channel_id, auth.uid());
    INSERT INTO public.chat_participants (channel_id, user_id) VALUES (v_channel_id, other_user_id);

    RETURN v_channel_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. Trigger to automatically create a "Student Union" channel when a new college is created
CREATE OR REPLACE FUNCTION create_student_union_for_college()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.chat_channels (college_id, name, type)
    VALUES (NEW.id, 'Student Union', 'group');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS create_college_student_union ON public.colleges;
CREATE TRIGGER create_college_student_union
AFTER INSERT ON public.colleges
FOR EACH ROW EXECUTE FUNCTION create_student_union_for_college();

-- Create for existing colleges
INSERT INTO public.chat_channels (college_id, name, type)
SELECT id, 'Student Union', 'group' FROM public.colleges
WHERE NOT EXISTS (
    SELECT 1 FROM public.chat_channels WHERE college_id = public.colleges.id AND name = 'Student Union'
);
