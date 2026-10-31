export type UserRole = 'admin' | 'faculty' | 'staff';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export type ProgressStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Needs Improvement';

export type ProjectStage = 'Ideation' | 'Prototyping' | 'Testing' | 'Refining' | 'Completed';

export type ChapterCategory = 'AI' | 'IoT' | 'AI_IoT_Capstone';

// 1. schools
export interface School {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  contact_person: string;
  phone: string;
  email: string;
  is_active: boolean;
  max_capacity: number;
  created_at: string;
  updated_at: string;
}

// 2. profiles
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  password?: string;
  created_at: string;
  updated_at: string;
}

// 3. school_staff
export interface SchoolStaff {
  id: string;
  profile_id: string;
  school_id: string;
  designation: string;
  department: string;
  employee_id: string;
  can_view_reports: boolean;
  created_at: string;
  // joined fields
  profile?: Profile;
  school?: School;
}

// 4. faculty
export interface Faculty {
  id: string;
  profile_id: string;
  specialization: string;
  qualification: string;
  phone: string;
  is_substitute_eligible: boolean;
  created_at: string;
  profile?: Profile;
}

// 5. classes
export interface ClassGrade {
  id: string;
  grade_level: 6 | 7 | 8 | 9;
  name: string;
  description?: string;
  academic_year: string;
  created_at: string;
}

// 6. sections
export interface Section {
  id: string;
  class_id: string;
  school_id: string;
  name: string; // 'A', 'B', etc.
  room_number?: string;
  created_at: string;
  class?: ClassGrade;
  school?: School;
}

// 7. students
export interface Student {
  id: string;
  roll_number: string;
  first_name: string;
  last_name: string;
  gender?: string;
  dob?: string;
  parent_name?: string;
  parent_phone?: string;
  email?: string;
  school_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // relations
  school?: School;
  current_class?: ClassGrade;
  current_section?: Section;
  current_team?: Team;
  team?: Team;
}

// 8. enrollments
export interface Enrollment {
  id: string;
  student_id: string;
  class_id: string;
  section_id: string;
  school_id: string;
  academic_year: string;
  status: 'active' | 'transferred' | 'graduated';
  created_at: string;
}

// 9. teams
export interface Team {
  id: string;
  school_id: string;
  class_id: string;
  section_id: string;
  team_number: number;
  name: string;
  leader_student_id?: string;
  faculty_supervisor_id?: string;
  created_at: string;
  updated_at: string;
  // joined relations
  members?: Student[];
  leader?: Student;
  school?: School;
  class?: ClassGrade;
  section?: Section;
  project?: Project;
}

// 10. team_members
export interface TeamMember {
  id: string;
  team_id: string;
  student_id: string;
  joined_at: string;
}

// 11. faculty_assignments
export interface FacultyAssignment {
  id: string;
  faculty_id: string;
  school_id: string;
  class_id: string;
  section_id?: string;
  is_substitute: boolean;
  authorized_by?: string;
  created_at: string;
  faculty?: Faculty;
  school?: School;
  class?: ClassGrade;
  section?: Section;
}

// 12. curriculum
export interface Curriculum {
  id: string;
  class_id: string;
  academic_year: string;
  title: string;
  description?: string;
  created_at: string;
}

// 13. chapters
export interface Chapter {
  id: string;
  curriculum_id: string;
  class_id: string;
  chapter_number: number; // 1 to 5
  title: string;
  category: ChapterCategory;
  learning_outcomes: string;
  description?: string;
  created_at: string;
  practicals?: PracticalActivity[];
}

// 14. practical_activities
export interface PracticalActivity {
  id: string;
  chapter_id: string;
  title: string;
  description: string;
  required_hardware?: string;
  max_score: number;
  created_at: string;
}

// 15. sessions
export interface Session {
  id: string;
  school_id: string;
  class_id: string;
  section_id: string;
  faculty_id: string;
  substitute_faculty_id?: string;
  session_date: string;
  start_time: string;
  end_time: string;
  chapter_id?: string;
  topic: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  school?: School;
  class?: ClassGrade;
  section?: Section;
  faculty?: Faculty;
  chapter?: Chapter;
}

// 16. attendance
export interface Attendance {
  id: string;
  session_id: string;
  student_id: string;
  status: AttendanceStatus;
  marked_by_faculty_id: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  student?: Student;
  session?: Session;
}

// 17. team_progress
export interface TeamProgress {
  id: string;
  team_id: string;
  chapter_id: string;
  status: ProgressStatus;
  start_date?: string;
  completion_date?: string;
  faculty_evaluation?: string;
  score?: number;
  updated_at: string;
  chapter?: Chapter;
}

// 18. projects
export interface Project {
  id: string;
  team_id: string;
  title: string;
  description?: string;
  stage: ProjectStage;
  status: ProgressStatus;
  milestones: Array<{ title: string; completed: boolean }>;
  challenges_faced?: string;
  faculty_observations?: string;
  created_at: string;
  updated_at: string;
  media?: ProjectMedia[];
}

// 19. project_media
export interface ProjectMedia {
  id: string;
  project_id: string;
  team_id: string;
  media_type: 'photo' | 'video' | 'document';
  url: string;
  title: string;
  description?: string;
  file_size?: number;
  uploaded_by?: string;
  created_at: string;
}

// 20. assessments
export interface Assessment {
  id: string;
  school_id: string;
  class_id: string;
  section_id: string;
  month: string; // 'October 2026'
  academic_year: string;
  theory_max: number; // default 20
  practical_max: number; // default 30
  project_max: number; // default 30
  creativity_max: number; // default 10
  participation_max: number; // default 10
  total_max: number; // default 100
  created_at: string;
  school?: School;
  class?: ClassGrade;
  section?: Section;
}

// 21. assessment_marks
export interface AssessmentMarks {
  id: string;
  assessment_id: string;
  student_id: string;
  theory_marks: number;
  practical_marks: number;
  project_marks: number;
  creativity_marks: number;
  participation_marks: number;
  total_marks: number;
  percentage: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  performance_category: 'Exemplary' | 'Proficient' | 'Developing' | 'Needs Support';
  faculty_remarks?: string;
  submitted_by?: string;
  created_at: string;
  updated_at: string;
  student?: Student;
  assessment?: Assessment;
}

// 22. faculty_remarks
export interface FacultyRemark {
  id: string;
  team_id?: string;
  student_id?: string;
  session_id?: string;
  faculty_id: string;
  technical_observations?: string;
  participation_score?: number; // 1-10
  innovation_notes?: string;
  improvement_suggestions?: string;
  created_at: string;
  faculty?: Faculty;
}

// 23. audit_logs
export interface AuditLog {
  id: string;
  user_id?: string;
  user_email?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  created_at: string;
}
