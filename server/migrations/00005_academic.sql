-- Courses Table
CREATE TABLE public.courses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id uuid NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
    faculty_id uuid REFERENCES public.faculty(id) ON DELETE SET NULL, -- Primary instructor
    course_code text NOT NULL,
    name text NOT NULL,
    credits integer NOT NULL DEFAULT 3,
    semester integer NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz NULL,
    UNIQUE(college_id, course_code)
);

CREATE TRIGGER set_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Course Enrollments
CREATE TABLE public.course_enrollments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    enrolled_at timestamptz NOT NULL DEFAULT now(),
    status text CHECK (status IN ('active', 'completed', 'dropped')) DEFAULT 'active',
    UNIQUE(course_id, student_id)
);

-- Attendance Table
CREATE TABLE public.attendance (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id uuid NOT NULL REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
    date date NOT NULL,
    status text CHECK (status IN ('present', 'absent', 'late', 'excused')) NOT NULL,
    marked_by uuid NOT NULL REFERENCES public.profiles(id), -- Usually Faculty
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(enrollment_id, date)
);

CREATE TRIGGER set_attendance_updated_at
BEFORE UPDATE ON public.attendance
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Grades Table
CREATE TABLE public.grades (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id uuid NOT NULL REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
    assessment_name text NOT NULL, -- e.g., "Midterm", "Final", "Assignment 1"
    grade text NOT NULL, -- e.g., "A+", "B", "85/100"
    feedback text,
    graded_by uuid NOT NULL REFERENCES public.profiles(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(enrollment_id, assessment_name)
);

CREATE TRIGGER set_grades_updated_at
BEFORE UPDATE ON public.grades
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- Courses: Readable by everyone in the college
CREATE POLICY "Courses readable by college" ON public.courses
FOR SELECT USING (college_id = auth_college_id() AND deleted_at IS NULL);

-- Enrollments: Readable by the specific student or faculty
CREATE POLICY "Enrollments readable by student and faculty" ON public.course_enrollments
FOR SELECT USING (
    student_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND faculty_id = auth.uid()) OR
    auth_role() IN ('college_admin', 'super_admin')
);

-- Attendance: Readable by the specific student or faculty
CREATE POLICY "Attendance readable by student and faculty" ON public.attendance
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.course_enrollments WHERE id = enrollment_id AND student_id = auth.uid()) OR
    marked_by = auth.uid() OR
    auth_role() IN ('college_admin', 'super_admin')
);

-- Grades: Readable by the specific student or faculty
CREATE POLICY "Grades readable by student and faculty" ON public.grades
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.course_enrollments WHERE id = enrollment_id AND student_id = auth.uid()) OR
    graded_by = auth.uid() OR
    auth_role() IN ('college_admin', 'super_admin')
);
