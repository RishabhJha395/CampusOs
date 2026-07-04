-- Trigger to create a profile and role-specific row for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role text;
  v_college_id uuid;
  v_full_name text;
  v_department_id uuid;
  v_enrollment_number text;
BEGIN
  -- Extract from metadata
  v_role := NEW.raw_user_meta_data->>'intended_role';
  v_college_id := (NEW.raw_user_meta_data->>'college_id')::uuid;
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User');
  v_department_id := (NEW.raw_user_meta_data->>'department_id')::uuid;
  v_enrollment_number := NEW.raw_user_meta_data->>'enrollment_number';

  -- Security check: only student and parent can self-assign via metadata in signup
  IF v_role NOT IN ('student', 'parent') THEN
    RAISE EXCEPTION 'Invalid role for self-signup. Must be student or parent.';
  END IF;

  IF v_college_id IS NULL THEN
    RAISE EXCEPTION 'college_id is required for signup';
  END IF;

  -- Insert profile
  INSERT INTO public.profiles (
    id,
    college_id,
    role,
    full_name
  ) VALUES (
    NEW.id,
    v_college_id,
    v_role,
    v_full_name
  );

  -- Insert into specific role table
  IF v_role = 'student' THEN
    INSERT INTO public.students (id, college_id, department_id, enrollment_number)
    VALUES (NEW.id, v_college_id, v_department_id, v_enrollment_number);
  ELSIF v_role = 'parent' THEN
    INSERT INTO public.parents (id, college_id)
    VALUES (NEW.id, v_college_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
