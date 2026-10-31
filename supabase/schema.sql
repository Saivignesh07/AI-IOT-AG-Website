-- =====================================================================
-- AGRIGUARDIAN LMS - DATABASE ARCHITECTURE
-- Multi-School AI + IoT Education Management and Monitoring Platform
-- Complete PostgreSQL & Supabase DDL Schema with RLS and Audit Triggers
-- =====================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================
-- 1. ENUMS & DOMAINS
-- =====================================================================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'faculty', 'staff');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE progress_status AS ENUM ('Not Started', 'In Progress', 'Completed', 'Needs Improvement');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_stage AS ENUM ('Ideation', 'Prototyping', 'Testing', 'Refining', 'Completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE chapter_category AS ENUM ('AI', 'IoT', 'AI_IoT_Capstone');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================================
-- 2. CORE TABLES (23 TABLES)
-- =====================================================================

-- Table 1: schools
CREATE TABLE IF NOT EXISTS public.schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    contact_person VARCHAR(150),
    phone VARCHAR(30),
    email VARCHAR(150) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    max_capacity INTEGER DEFAULT 500,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table 2: profiles (linked to auth.users or standalone auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'staff',
    phone VARCHAR(30),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table 3: school_staff
CREATE TABLE IF NOT EXISTS public.school_staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    designation VARCHAR(100) NOT NULL,
    department VARCHAR(100) DEFAULT 'Science & Tech',
    employee_id VARCHAR(50),
    can_view_reports BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(profile_id, school_id)
);

-- Table 4: faculty
CREATE TABLE IF NOT EXISTS public.faculty (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    specialization VARCHAR(150) DEFAULT 'AI & IoT Agriculture Specialist',
    qualification VARCHAR(150),
    phone VARCHAR(30),
    is_substitute_eligible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table 5: classes (Classes 6, 7, 8, 9)
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grade_level INTEGER NOT NULL CHECK (grade_level IN (6, 7, 8, 9)),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    academic_year VARCHAR(20) DEFAULT '2026-2027' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(grade_level, academic_year)
);

-- Table 6: sections
CREATE TABLE IF NOT EXISTS public.sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name VARCHAR(10) NOT NULL, -- 'A', 'B', 'C'
    room_number VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(class_id, school_id, name)
);

-- Table 7: students
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    roll_number VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    gender VARCHAR(20),
    dob DATE,
    parent_name VARCHAR(150),
    parent_phone VARCHAR(30),
    email VARCHAR(150),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(school_id, roll_number)
);

-- Table 8: enrollments
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    academic_year VARCHAR(20) DEFAULT '2026-2027' NOT NULL,
    status VARCHAR(30) DEFAULT 'active' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(student_id, academic_year)
);

-- Table 9: teams
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
    team_number INTEGER NOT NULL,
    name VARCHAR(150) NOT NULL,
    leader_student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    faculty_supervisor_id UUID REFERENCES public.faculty(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(school_id, class_id, section_id, team_number)
);

-- Table 10: team_members (Enforcing 4 members max, with remainder handling)
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(team_id, student_id)
);

-- Table 11: faculty_assignments
CREATE TABLE IF NOT EXISTS public.faculty_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id UUID NOT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE,
    is_substitute BOOLEAN DEFAULT FALSE NOT NULL,
    authorized_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table 12: curriculum
CREATE TABLE IF NOT EXISTS public.curriculum (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    academic_year VARCHAR(20) DEFAULT '2026-2027' NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(class_id, academic_year)
);

-- Table 13: chapters (5 chapters per class: 2 AI, 2 IoT, 1 Capstone)
CREATE TABLE IF NOT EXISTS public.chapters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    curriculum_id UUID NOT NULL REFERENCES public.curriculum(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    chapter_number INTEGER NOT NULL CHECK (chapter_number BETWEEN 1 AND 5),
    title VARCHAR(255) NOT NULL,
    category chapter_category NOT NULL,
    learning_outcomes TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(class_id, chapter_number)
);

-- Table 14: practical_activities
CREATE TABLE IF NOT EXISTS public.practical_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    required_hardware TEXT,
    max_score INTEGER DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table 15: sessions
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
    faculty_id UUID NOT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
    substitute_faculty_id UUID REFERENCES public.faculty(id),
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    chapter_id UUID REFERENCES public.chapters(id),
    topic VARCHAR(255) NOT NULL,
    status VARCHAR(30) DEFAULT 'completed' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table 16: attendance (Individually recorded per student and session)
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    status attendance_status NOT NULL DEFAULT 'present',
    marked_by_faculty_id UUID NOT NULL REFERENCES public.faculty(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(session_id, student_id)
);

-- Table 17: team_progress
CREATE TABLE IF NOT EXISTS public.team_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
    status progress_status DEFAULT 'Not Started' NOT NULL,
    start_date DATE,
    completion_date DATE,
    faculty_evaluation TEXT,
    score INTEGER CHECK (score >= 0 AND score <= 100),
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(team_id, chapter_id)
);

-- Table 18: projects
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    stage project_stage DEFAULT 'Ideation' NOT NULL,
    status progress_status DEFAULT 'In Progress' NOT NULL,
    milestones JSONB DEFAULT '[]'::jsonb,
    challenges_faced TEXT,
    faculty_observations TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(team_id)
);

-- Table 19: project_media (Stored in Supabase Storage bucket 'agriguardian-media')
CREATE TABLE IF NOT EXISTS public.project_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('photo', 'video', 'document')),
    url TEXT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_size BIGINT,
    uploaded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table 20: assessments
CREATE TABLE IF NOT EXISTS public.assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
    month VARCHAR(20) NOT NULL, -- e.g. 'October 2026'
    academic_year VARCHAR(20) DEFAULT '2026-2027' NOT NULL,
    theory_max NUMERIC(5,2) DEFAULT 20.00 NOT NULL,
    practical_max NUMERIC(5,2) DEFAULT 30.00 NOT NULL,
    project_max NUMERIC(5,2) DEFAULT 30.00 NOT NULL,
    creativity_max NUMERIC(5,2) DEFAULT 10.00 NOT NULL,
    participation_max NUMERIC(5,2) DEFAULT 10.00 NOT NULL,
    total_max NUMERIC(5,2) DEFAULT 100.00 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(school_id, class_id, section_id, month)
);

-- Table 21: assessment_marks (With auto calculation validation)
CREATE TABLE IF NOT EXISTS public.assessment_marks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    theory_marks NUMERIC(5,2) NOT NULL CHECK (theory_marks >= 0 AND theory_marks <= 20),
    practical_marks NUMERIC(5,2) NOT NULL CHECK (practical_marks >= 0 AND practical_marks <= 30),
    project_marks NUMERIC(5,2) NOT NULL CHECK (project_marks >= 0 AND project_marks <= 30),
    creativity_marks NUMERIC(5,2) NOT NULL CHECK (creativity_marks >= 0 AND creativity_marks <= 10),
    participation_marks NUMERIC(5,2) NOT NULL CHECK (participation_marks >= 0 AND participation_marks <= 10),
    total_marks NUMERIC(5,2) NOT NULL,
    percentage NUMERIC(5,2) NOT NULL,
    grade VARCHAR(5) NOT NULL,
    performance_category VARCHAR(50) NOT NULL,
    faculty_remarks TEXT,
    submitted_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(assessment_id, student_id)
);

-- Table 22: faculty_remarks
CREATE TABLE IF NOT EXISTS public.faculty_remarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
    faculty_id UUID NOT NULL REFERENCES public.faculty(id),
    technical_observations TEXT,
    participation_score INTEGER CHECK (participation_score BETWEEN 1 AND 10),
    innovation_notes TEXT,
    improvement_suggestions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table 23: audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id),
    user_email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================================
-- 3. INDEXES FOR PERFORMANCE (SCALE TO 100+ SCHOOLS)
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_students_school ON public.students(school_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_school_class ON public.enrollments(school_id, class_id, section_id);
CREATE INDEX IF NOT EXISTS idx_teams_school_class ON public.teams(school_id, class_id, section_id);
CREATE INDEX IF NOT EXISTS idx_team_members_student ON public.team_members(student_id);
CREATE INDEX IF NOT EXISTS idx_sessions_school_date ON public.sessions(school_id, session_date);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON public.attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_assessment_marks_assessment ON public.assessment_marks(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_marks_student ON public.assessment_marks(student_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- =====================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practical_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_remarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper functions for current user context in Supabase
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_staff_school_id()
RETURNS UUID AS $$
    SELECT school_id FROM public.school_staff WHERE profile_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ADMIN POLICIES: Admin can SELECT, INSERT, UPDATE, DELETE everywhere
CREATE POLICY admin_all_schools ON public.schools FOR ALL USING (public.current_user_role() = 'admin');
CREATE POLICY admin_all_students ON public.students FOR ALL USING (public.current_user_role() = 'admin');
CREATE POLICY admin_all_attendance ON public.attendance FOR ALL USING (public.current_user_role() = 'admin');
CREATE POLICY admin_all_teams ON public.teams FOR ALL USING (public.current_user_role() = 'admin');
CREATE POLICY admin_all_assessments ON public.assessments FOR ALL USING (public.current_user_role() = 'admin');
CREATE POLICY admin_all_marks ON public.assessment_marks FOR ALL USING (public.current_user_role() = 'admin');
CREATE POLICY admin_all_logs ON public.audit_logs FOR ALL USING (public.current_user_role() = 'admin');

-- FACULTY POLICIES: Faculty can manage assigned sessions, attendance, team progress, and marks
CREATE POLICY faculty_select_schools ON public.schools FOR SELECT USING (public.current_user_role() = 'faculty');
CREATE POLICY faculty_manage_attendance ON public.attendance FOR ALL USING (public.current_user_role() = 'faculty');
CREATE POLICY faculty_manage_teams ON public.teams FOR ALL USING (public.current_user_role() = 'faculty');
CREATE POLICY faculty_manage_team_members ON public.team_members FOR ALL USING (public.current_user_role() = 'faculty');
CREATE POLICY faculty_manage_progress ON public.team_progress FOR ALL USING (public.current_user_role() = 'faculty');
CREATE POLICY faculty_manage_projects ON public.projects FOR ALL USING (public.current_user_role() = 'faculty');
CREATE POLICY faculty_manage_media ON public.project_media FOR ALL USING (public.current_user_role() = 'faculty');
CREATE POLICY faculty_manage_marks ON public.assessment_marks FOR ALL USING (public.current_user_role() = 'faculty');
CREATE POLICY faculty_manage_remarks ON public.faculty_remarks FOR ALL USING (public.current_user_role() = 'faculty');

-- SCHOOL STAFF POLICIES: STRICT READ-ONLY, ONLY FOR ASSIGNED SCHOOL
-- Staff can NEVER insert, update, or delete academic records!
CREATE POLICY staff_select_school ON public.schools FOR SELECT 
USING (public.current_user_role() = 'staff' AND id = public.current_staff_school_id());

CREATE POLICY staff_select_students ON public.students FOR SELECT 
USING (public.current_user_role() = 'staff' AND school_id = public.current_staff_school_id());

CREATE POLICY staff_select_sections ON public.sections FOR SELECT 
USING (public.current_user_role() = 'staff' AND school_id = public.current_staff_school_id());

CREATE POLICY staff_select_teams ON public.teams FOR SELECT 
USING (public.current_user_role() = 'staff' AND school_id = public.current_staff_school_id());

CREATE POLICY staff_select_attendance ON public.attendance FOR SELECT 
USING (
    public.current_user_role() = 'staff' 
    AND session_id IN (SELECT id FROM public.sessions WHERE school_id = public.current_staff_school_id())
);

CREATE POLICY staff_select_progress ON public.team_progress FOR SELECT 
USING (
    public.current_user_role() = 'staff' 
    AND team_id IN (SELECT id FROM public.teams WHERE school_id = public.current_staff_school_id())
);

CREATE POLICY staff_select_projects ON public.projects FOR SELECT 
USING (
    public.current_user_role() = 'staff' 
    AND team_id IN (SELECT id FROM public.teams WHERE school_id = public.current_staff_school_id())
);

CREATE POLICY staff_select_marks ON public.assessment_marks FOR SELECT 
USING (
    public.current_user_role() = 'staff' 
    AND student_id IN (SELECT id FROM public.students WHERE school_id = public.current_staff_school_id())
);

CREATE POLICY staff_select_curriculum ON public.curriculum FOR SELECT 
USING (public.current_user_role() = 'staff');

CREATE POLICY staff_select_chapters ON public.chapters FOR SELECT 
USING (public.current_user_role() = 'staff');

CREATE POLICY staff_select_practicals ON public.practical_activities FOR SELECT 
USING (public.current_user_role() = 'staff');
