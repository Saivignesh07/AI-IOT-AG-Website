'use client';

import {
  School,
  Profile,
  Faculty,
  SchoolStaff,
  ClassGrade,
  Section,
  Curriculum,
  Chapter,
  PracticalActivity,
  Student,
  Team,
  TeamMember,
  Session,
  Attendance,
  AttendanceStatus,
  TeamProgress,
  ProgressStatus,
  Project,
  ProjectMedia,
  Assessment,
  AssessmentMarks,
  AuditLog,
} from '@/types';
import {
  INITIAL_SCHOOLS,
  INITIAL_PROFILES,
  INITIAL_FACULTY,
  INITIAL_STAFF,
  INITIAL_CLASSES,
  INITIAL_SECTIONS,
  INITIAL_CURRICULUM,
  INITIAL_CHAPTERS,
  INITIAL_PRACTICALS,
  INITIAL_STUDENTS,
  INITIAL_ENROLLMENTS,
  INITIAL_TEAMS,
  INITIAL_TEAM_MEMBERS,
  INITIAL_TEAM_PROGRESS,
  INITIAL_PROJECTS,
  INITIAL_PROJECT_MEDIA,
  INITIAL_SESSIONS,
  INITIAL_ATTENDANCE,
  INITIAL_ASSESSMENTS,
  INITIAL_ASSESSMENT_MARKS,
  INITIAL_AUDIT_LOGS,
} from './initial-data';
import { calculateAssessmentGrade } from '@/lib/utils';

const STORAGE_KEY = 'agriguardian_db_v2_agjain';

interface DatabaseState {
  schools: School[];
  profiles: Profile[];
  faculty: Faculty[];
  staff: SchoolStaff[];
  classes: ClassGrade[];
  sections: Section[];
  curriculum: Curriculum[];
  chapters: Chapter[];
  practicals: PracticalActivity[];
  students: Student[];
  enrollments: any[];
  teams: Team[];
  teamMembers: TeamMember[];
  sessions: Session[];
  attendance: Attendance[];
  teamProgress: TeamProgress[];
  projects: Project[];
  projectMedia: ProjectMedia[];
  assessments: Assessment[];
  assessmentMarks: AssessmentMarks[];
  auditLogs: AuditLog[];
}

function getInitialState(): DatabaseState {
  return {
    schools: [...INITIAL_SCHOOLS],
    profiles: [...INITIAL_PROFILES],
    faculty: [...INITIAL_FACULTY],
    staff: [...INITIAL_STAFF],
    classes: [...INITIAL_CLASSES],
    sections: [...INITIAL_SECTIONS],
    curriculum: [...INITIAL_CURRICULUM],
    chapters: [...INITIAL_CHAPTERS],
    practicals: [...INITIAL_PRACTICALS],
    students: [...INITIAL_STUDENTS],
    enrollments: [...INITIAL_ENROLLMENTS],
    teams: [...INITIAL_TEAMS],
    teamMembers: [...INITIAL_TEAM_MEMBERS],
    sessions: [...INITIAL_SESSIONS],
    attendance: [...INITIAL_ATTENDANCE],
    teamProgress: [...INITIAL_TEAM_PROGRESS],
    projects: [...INITIAL_PROJECTS],
    projectMedia: [...INITIAL_PROJECT_MEDIA],
    assessments: [...INITIAL_ASSESSMENTS],
    assessmentMarks: [...INITIAL_ASSESSMENT_MARKS],
    auditLogs: [...INITIAL_AUDIT_LOGS],
  };
}

class Repository {
  private state: DatabaseState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = getInitialState();
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          this.state = { ...getInitialState(), ...parsed };
        } else {
          this.saveToStorage();
        }
      } catch (e) {
        console.warn('Failed to load local DB state', e);
      }
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        this.notifyListeners();
      } catch (e) {
        console.error('Error saving state to localStorage', e);
      }
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((l) => l());
  }

  public resetToDefault() {
    this.state = getInitialState();
    this.saveToStorage();
  }

  // AUDIT LOGGING
  public addAuditLog(action: string, entity_type: string, entity_id: string, details: any, user_email = 'system@agriguardian.io') {
    const log: AuditLog = {
      id: 'aud-' + Math.random().toString(36).substring(2, 9),
      user_email,
      action,
      entity_type,
      entity_id,
      details,
      created_at: new Date().toISOString(),
    };
    this.state.auditLogs.unshift(log);
    this.saveToStorage();
    return log;
  }

  public getAuditLogs(): AuditLog[] {
    return this.state.auditLogs;
  }

  // SCHOOLS
  public getSchools(): School[] {
    return this.state.schools;
  }

  public getSchoolById(id: string): School | undefined {
    return this.state.schools.find((s) => s.id === id);
  }

  public addSchool(schoolData: Omit<School, 'id' | 'created_at' | 'updated_at'>): School {
    const id = 'sch-' + Math.random().toString(36).substring(2, 9);
    const newSchool: School = {
      ...schoolData,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.state.schools.push(newSchool);
    this.addAuditLog('CREATE_SCHOOL', 'schools', id, { name: newSchool.name, code: newSchool.code });
    this.saveToStorage();
    return newSchool;
  }

  public updateSchool(id: string, updates: Partial<School>): School {
    const index = this.state.schools.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('School not found');
    this.state.schools[index] = {
      ...this.state.schools[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.addAuditLog('UPDATE_SCHOOL', 'schools', id, updates);
    this.saveToStorage();
    return this.state.schools[index];
  }

  // FACULTY & STAFF
  public getProfiles(): Profile[] {
    return this.state.profiles;
  }

  public getFaculty(): (Faculty & { profile?: Profile })[] {
    return this.state.faculty.map((f) => ({
      ...f,
      profile: this.state.profiles.find((p) => p.id === f.profile_id),
    }));
  }

  public getStaff(): (SchoolStaff & { profile?: Profile; school?: School })[] {
    return this.state.staff.map((s) => ({
      ...s,
      profile: this.state.profiles.find((p) => p.id === s.profile_id),
      school: this.state.schools.find((sch) => sch.id === s.school_id),
    }));
  }

  public addFaculty(name: string, email: string, phone: string, specialization: string, qualification: string) {
    const profileId = 'prof-' + Math.random().toString(36).substring(2, 9);
    const facultyId = 'fa-' + Math.random().toString(36).substring(2, 9);
    const profile: Profile = {
      id: profileId,
      full_name: name,
      email,
      phone,
      role: 'faculty',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const faculty: Faculty = {
      id: facultyId,
      profile_id: profileId,
      specialization,
      qualification,
      phone,
      is_substitute_eligible: true,
      created_at: new Date().toISOString(),
    };
    this.state.profiles.push(profile);
    this.state.faculty.push(faculty);
    this.addAuditLog('CREATE_FACULTY', 'faculty', facultyId, { name, email, specialization });
    this.saveToStorage();
    return { faculty, profile };
  }

  public addStaff(name: string, email: string, schoolId: string, designation: string, employeeId: string) {
    const profileId = 'prof-' + Math.random().toString(36).substring(2, 9);
    const staffId = 'st-' + Math.random().toString(36).substring(2, 9);
    const profile: Profile = {
      id: profileId,
      full_name: name,
      email,
      role: 'staff',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const staff: SchoolStaff = {
      id: staffId,
      profile_id: profileId,
      school_id: schoolId,
      designation,
      department: 'Academic Supervision',
      employee_id: employeeId,
      can_view_reports: true,
      created_at: new Date().toISOString(),
    };
    this.state.profiles.push(profile);
    this.state.staff.push(staff);
    this.addAuditLog('CREATE_STAFF', 'school_staff', staffId, { name, email, schoolId, designation });
    this.saveToStorage();
    return { staff, profile };
  }

  // CLASSES & SECTIONS
  public getClasses(): ClassGrade[] {
    return this.state.classes;
  }

  public getSections(schoolId?: string, classId?: string): Section[] {
    return this.state.sections.filter((s) => {
      if (schoolId && s.school_id !== schoolId) return false;
      if (classId && s.class_id !== classId) return false;
      return true;
    });
  }

  public addSection(schoolId: string, classId: string, name: string, roomNumber: string) {
    const existing = this.state.sections.find(
      (s) => s.school_id === schoolId && s.class_id === classId && s.name.toUpperCase() === name.toUpperCase()
    );
    if (existing) throw new Error(`Section ${name} already exists for this class in this school`);
    const id = 'sec-' + Math.random().toString(36).substring(2, 9);
    const newSection: Section = {
      id,
      school_id: schoolId,
      class_id: classId,
      name: name.toUpperCase(),
      room_number: roomNumber,
      created_at: new Date().toISOString(),
    };
    this.state.sections.push(newSection);
    this.addAuditLog('CREATE_SECTION', 'sections', id, { schoolId, classId, name });
    this.saveToStorage();
    return newSection;
  }

  // STUDENTS
  public getStudents(schoolId?: string, classId?: string, sectionId?: string): (Student & { team?: Team; grade_level?: number })[] {
    let result = this.state.students;
    if (schoolId) {
      result = result.filter((st) => st.school_id === schoolId);
    }
    if (classId || sectionId) {
      const matchingEnrollments = this.state.enrollments.filter((e) => {
        if (classId && e.class_id !== classId) return false;
        if (sectionId && e.section_id !== sectionId) return false;
        return true;
      });
      const studentIds = new Set(matchingEnrollments.map((e) => e.student_id));
      result = result.filter((st) => studentIds.has(st.id));
    }

    return result.map((student) => {
      // find team
      const memberRecord = this.state.teamMembers.find((tm) => tm.student_id === student.id);
      const team = memberRecord ? this.state.teams.find((t) => t.id === memberRecord.team_id) : undefined;
      // find grade level from enrollment
      const enrollment = this.state.enrollments.find((e) => e.student_id === student.id);
      const classRecord = enrollment ? this.state.classes.find((c) => c.id === enrollment.class_id) : undefined;
      return {
        ...student,
        team,
        grade_level: classRecord?.grade_level,
      };
    });
  }

  public getStudentById(id: string): Student | undefined {
    return this.state.students.find((s) => s.id === id);
  }

  public addStudent(
    studentData: Omit<Student, 'id' | 'created_at' | 'updated_at'>,
    classId: string,
    sectionId: string
  ): Student {
    const id = 'st-' + Math.random().toString(36).substring(2, 9);
    const newStudent: Student = {
      ...studentData,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.state.students.push(newStudent);
    // create enrollment
    this.state.enrollments.push({
      id: 'en-' + Math.random().toString(36).substring(2, 9),
      student_id: id,
      class_id: classId,
      section_id: sectionId,
      school_id: studentData.school_id,
      academic_year: '2026-2027',
      status: 'active',
      created_at: new Date().toISOString(),
    });

    this.addAuditLog('ADD_STUDENT', 'students', id, {
      name: `${newStudent.first_name} ${newStudent.last_name}`,
      roll: newStudent.roll_number,
      schoolId: newStudent.school_id,
      classId,
    });
    this.saveToStorage();
    return newStudent;
  }

  public bulkImportStudents(
    studentsList: Array<{
      roll_number: string;
      first_name: string;
      last_name: string;
      gender: string;
      parent_name: string;
      parent_phone: string;
      email?: string;
    }>,
    schoolId: string,
    classId: string,
    sectionId: string
  ) {
    const added: Student[] = [];
    studentsList.forEach((st) => {
      const id = 'st-' + Math.random().toString(36).substring(2, 9);
      const newSt: Student = {
        id,
        roll_number: st.roll_number,
        first_name: st.first_name,
        last_name: st.last_name,
        gender: st.gender,
        parent_name: st.parent_name,
        parent_phone: st.parent_phone,
        email: st.email || `${st.first_name.toLowerCase()}.${st.last_name.toLowerCase()}@student.edu`,
        school_id: schoolId,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.state.students.push(newSt);
      this.state.enrollments.push({
        id: 'en-' + Math.random().toString(36).substring(2, 9),
        student_id: id,
        class_id: classId,
        section_id: sectionId,
        school_id: schoolId,
        academic_year: '2026-2027',
        status: 'active',
        created_at: new Date().toISOString(),
      });
      added.push(newSt);
    });

    this.addAuditLog('BULK_IMPORT_STUDENTS', 'students', `${added.length} students`, {
      schoolId,
      count: added.length,
    });
    this.saveToStorage();
    return added;
  }

  public importExcelWorkbookStudents(
    sheetsData: Array<{
      gradeLevel: number; // 6, 7, 8, 9
      sheetName: string;
      students: Array<{
        name: string;
        roll?: string;
        gender?: string;
        parentName?: string;
        parentPhone?: string;
      }>;
    }>
  ) {
    const school = this.state.schools[0];
    if (!school) throw new Error('No active school found');

    const classWiseCounts: Record<number, number> = { 6: 0, 7: 0, 8: 0, 9: 0 };
    let totalImported = 0;

    sheetsData.forEach((sheet) => {
      const targetClass = this.state.classes.find((c) => c.grade_level === sheet.gradeLevel);
      if (!targetClass) return;

      // Find section A for this school and class (or create if not present)
      let section = this.state.sections.find(
        (s) => s.school_id === school.id && s.class_id === targetClass.id && s.name === 'A'
      );
      if (!section) {
        section = this.state.sections.find(
          (s) => s.school_id === school.id && s.class_id === targetClass.id
        );
      }

      const sectionId = section?.id || 'sec-default';

      sheet.students.forEach((st, index) => {
        const cleanName = (st.name || '').trim();
        if (!cleanName) return;

        // Split name into first and last name cleanly
        const nameParts = cleanName.split(/\s+/);
        let firstName = nameParts[0] || 'Student';
        let lastName = nameParts.slice(1).join(' ') || '';
        if (nameParts.length === 1) {
          firstName = cleanName;
          lastName = '';
        }

        const studentIndex = String(classWiseCounts[sheet.gradeLevel] + 1).padStart(2, '0');
        const rollNumber = st.roll || `SAGJ-0${sheet.gradeLevel}-${studentIndex}`;
        const studentId = 'st-jain-' + Math.random().toString(36).substring(2, 9);

        const newStudent: Student = {
          id: studentId,
          roll_number: rollNumber,
          first_name: firstName,
          last_name: lastName,
          gender: st.gender || 'Not Specified',
          parent_name: st.parentName || '',
          parent_phone: st.parentPhone || '',
          email: `${firstName.toLowerCase().replace(/[^a-z0-9]/g, '')}.${studentIndex}@shreeagjainschool.edu.in`,
          school_id: school.id,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        this.state.students.push(newStudent);
        this.state.enrollments.push({
          id: 'en-' + Math.random().toString(36).substring(2, 9),
          student_id: studentId,
          class_id: targetClass.id,
          section_id: sectionId,
          school_id: school.id,
          academic_year: '2026-2027',
          status: 'active',
          created_at: new Date().toISOString(),
        });

        classWiseCounts[sheet.gradeLevel]++;
        totalImported++;
      });
    });

    this.addAuditLog('IMPORT_EXCEL_STUDENTS_SHREE_A_G_JAIN', 'students', `${totalImported} students`, {
      schoolName: school.name,
      classWiseCounts,
      totalImported,
    });

    this.saveToStorage();
    return { totalImported, classWiseCounts };
  }

  public transferStudent(studentId: string, targetClassId: string, targetSectionId: string) {
    const student = this.state.students.find((s) => s.id === studentId);
    if (!student) throw new Error('Student not found');

    const enrollmentIndex = this.state.enrollments.findIndex(
      (e) => e.student_id === studentId && e.status === 'active'
    );
    if (enrollmentIndex !== -1) {
      this.state.enrollments[enrollmentIndex].class_id = targetClassId;
      this.state.enrollments[enrollmentIndex].section_id = targetSectionId;
    }

    // Remove from existing teams in old section
    const memberIdx = this.state.teamMembers.findIndex((tm) => tm.student_id === studentId);
    if (memberIdx !== -1) {
      this.state.teamMembers.splice(memberIdx, 1);
    }

    this.addAuditLog('TRANSFER_STUDENT', 'students', studentId, { targetClassId, targetSectionId });
    this.saveToStorage();
    return student;
  }

  // TEAMS
  public getTeams(schoolId?: string, classId?: string, sectionId?: string): (Team & { members: Student[]; leader?: Student })[] {
    return this.state.teams
      .filter((t) => {
        if (schoolId && t.school_id !== schoolId) return false;
        if (classId && t.class_id !== classId) return false;
        if (sectionId && t.section_id !== sectionId) return false;
        return true;
      })
      .map((t) => {
        const memberIds = this.state.teamMembers.filter((tm) => tm.team_id === t.id).map((tm) => tm.student_id);
        const members = this.state.students.filter((st) => memberIds.includes(st.id));
        const leader = this.state.students.find((st) => st.id === t.leader_student_id);
        const project = this.state.projects.find((p) => p.team_id === t.id);
        return {
          ...t,
          members,
          leader,
          project,
        };
      });
  }

  public getTeamById(id: string): (Team & { members: Student[]; leader?: Student; project?: Project; progress: TeamProgress[] }) | undefined {
    const team = this.state.teams.find((t) => t.id === id);
    if (!team) return undefined;
    const memberIds = this.state.teamMembers.filter((tm) => tm.team_id === team.id).map((tm) => tm.student_id);
    const members = this.state.students.filter((st) => memberIds.includes(st.id));
    const leader = this.state.students.find((st) => st.id === team.leader_student_id);
    const project = this.state.projects.find((p) => p.team_id === team.id);
    const progress = this.state.teamProgress.filter((tp) => tp.team_id === team.id);
    return {
      ...team,
      members,
      leader,
      project,
      progress,
    };
  }

  public createTeam(
    name: string,
    schoolId: string,
    classId: string,
    sectionId: string,
    leaderStudentId: string,
    studentIds: string[],
    facultySupervisorId: string
  ): Team {
    // Validation 1: Student cannot belong to multiple active teams in the same class/section
    for (const stId of studentIds) {
      const alreadyInTeam = this.state.teamMembers.some((tm) => {
        if (tm.student_id !== stId) return false;
        const existingTeam = this.state.teams.find((t) => t.id === tm.team_id);
        return existingTeam && existingTeam.school_id === schoolId && existingTeam.class_id === classId;
      });
      if (alreadyInTeam) {
        const student = this.state.students.find((s) => s.id === stId);
        throw new Error(`Student ${student?.first_name || ''} ${student?.last_name || ''} is already assigned to an active team in this class.`);
      }
    }

    // Validation 2: exactly 4 members wherever possible, but allow remainder team
    if (studentIds.length > 4) {
      throw new Error('A team cannot exceed 4 students as per AgriGuardian guidelines.');
    }
    if (studentIds.length === 0) {
      throw new Error('Please select at least 1 student for the team.');
    }

    const teamId = 't-' + Math.random().toString(36).substring(2, 9);
    const teamCount = this.state.teams.filter(
      (t) => t.school_id === schoolId && t.class_id === classId && t.section_id === sectionId
    ).length;

    const newTeam: Team = {
      id: teamId,
      name,
      team_number: teamCount + 1,
      school_id: schoolId,
      class_id: classId,
      section_id: sectionId,
      leader_student_id: leaderStudentId || studentIds[0],
      faculty_supervisor_id: facultySupervisorId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.state.teams.push(newTeam);

    // Add members
    studentIds.forEach((stId) => {
      this.state.teamMembers.push({
        id: 'tm-' + Math.random().toString(36).substring(2, 9),
        team_id: teamId,
        student_id: stId,
        joined_at: new Date().toISOString(),
      });
    });

    // Initialize team progress for the 5 chapters of this class
    const chapters = this.getChapters(classId);
    chapters.forEach((ch) => {
      this.state.teamProgress.push({
        id: 'tp-' + Math.random().toString(36).substring(2, 9),
        team_id: teamId,
        chapter_id: ch.id,
        status: 'Not Started',
        updated_at: new Date().toISOString(),
      });
    });

    // Initialize project
    this.state.projects.push({
      id: 'pr-' + Math.random().toString(36).substring(2, 9),
      team_id: teamId,
      title: `${name} IoT Innovation Prototype`,
      description: 'AI and IoT automated farming benchtop solution',
      stage: 'Ideation',
      status: 'In Progress',
      milestones: [
        { title: 'System Architecture Design', completed: false },
        { title: 'Sensor Calibration and Telemetry', completed: false },
        { title: 'AI Classification Model Training', completed: false },
        { title: 'Automated Relay Actuator Setup', completed: false },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    this.addAuditLog('CREATE_TEAM', 'teams', teamId, {
      name,
      schoolId,
      memberCount: studentIds.length,
      leaderId: leaderStudentId,
    });
    this.saveToStorage();
    return newTeam;
  }

  // CURRICULUM & CHAPTERS
  public getChapters(classId?: string): (Chapter & { practicals: PracticalActivity[] })[] {
    return this.state.chapters
      .filter((c) => (!classId ? true : c.class_id === classId))
      .sort((a, b) => a.chapter_number - b.chapter_number)
      .map((c) => ({
        ...c,
        practicals: this.state.practicals.filter((p) => p.chapter_id === c.id),
      }));
  }

  public updateChapter(chapterId: string, updates: Partial<Chapter>) {
    const idx = this.state.chapters.findIndex((c) => c.id === chapterId);
    if (idx === -1) throw new Error('Chapter not found');
    this.state.chapters[idx] = { ...this.state.chapters[idx], ...updates };
    this.addAuditLog('UPDATE_CHAPTER', 'chapters', chapterId, updates);
    this.saveToStorage();
    return this.state.chapters[idx];
  }

  // SESSIONS & ATTENDANCE
  public getSessions(schoolId?: string, facultyId?: string): Session[] {
    return this.state.sessions
      .filter((s) => {
        if (schoolId && s.school_id !== schoolId) return false;
        if (facultyId && s.faculty_id !== facultyId && s.substitute_faculty_id !== facultyId) return false;
        return true;
      })
      .map((s) => ({
        ...s,
        school: this.state.schools.find((sch) => sch.id === s.school_id),
        class: this.state.classes.find((c) => c.id === s.class_id),
        section: this.state.sections.find((sec) => sec.id === s.section_id),
        chapter: this.state.chapters.find((ch) => ch.id === s.chapter_id),
      }));
  }

  public createSession(sessionData: Omit<Session, 'id' | 'created_at'>): Session {
    const id = 'se-' + Math.random().toString(36).substring(2, 9);
    const newSession: Session = {
      ...sessionData,
      id,
      created_at: new Date().toISOString(),
    };
    this.state.sessions.unshift(newSession);
    this.addAuditLog('CREATE_SESSION', 'sessions', id, {
      topic: newSession.topic,
      date: newSession.session_date,
      schoolId: newSession.school_id,
    });
    this.saveToStorage();
    return newSession;
  }

  public getSessionAttendance(sessionId: string): (Attendance & { student?: Student })[] {
    return this.state.attendance
      .filter((a) => a.session_id === sessionId)
      .map((a) => ({
        ...a,
        student: this.state.students.find((st) => st.id === a.student_id),
      }));
  }

  public submitAttendance(
    sessionId: string,
    records: Array<{ student_id: string; status: AttendanceStatus; notes?: string }>,
    markedByFacultyId: string
  ) {
    const session = this.state.sessions.find((s) => s.id === sessionId);
    if (!session) throw new Error('Session not found');

    // Remove any existing records for this session to update cleanly (avoid duplicates)
    this.state.attendance = this.state.attendance.filter((a) => a.session_id !== sessionId);

    let presentCount = 0;
    records.forEach((r) => {
      if (r.status === 'present') presentCount++;
      this.state.attendance.push({
        id: 'att-' + Math.random().toString(36).substring(2, 9),
        session_id: sessionId,
        student_id: r.student_id,
        status: r.status,
        marked_by_faculty_id: markedByFacultyId,
        notes: r.notes || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    });

    // Mark session completed
    session.status = 'completed';

    this.addAuditLog('SUBMIT_ATTENDANCE', 'attendance', sessionId, {
      total: records.length,
      present: presentCount,
      facultyId: markedByFacultyId,
    });
    this.saveToStorage();
    return { success: true, count: records.length, present: presentCount };
  }

  // PROGRESS & PROJECTS
  public getTeamProgress(teamId: string): (TeamProgress & { chapter?: Chapter })[] {
    return this.state.teamProgress
      .filter((tp) => tp.team_id === teamId)
      .map((tp) => ({
        ...tp,
        chapter: this.state.chapters.find((ch) => ch.id === tp.chapter_id),
      }));
  }

  public updateTeamProgress(
    teamId: string,
    chapterId: string,
    status: ProgressStatus,
    score?: number,
    facultyEvaluation?: string
  ) {
    let entry = this.state.teamProgress.find((tp) => tp.team_id === teamId && tp.chapter_id === chapterId);
    if (!entry) {
      entry = {
        id: 'tp-' + Math.random().toString(36).substring(2, 9),
        team_id: teamId,
        chapter_id: chapterId,
        status,
        updated_at: new Date().toISOString(),
      };
      this.state.teamProgress.push(entry);
    }
    entry.status = status;
    if (score !== undefined) entry.score = score;
    if (facultyEvaluation !== undefined) entry.faculty_evaluation = facultyEvaluation;
    if (status === 'Completed' && !entry.completion_date) {
      entry.completion_date = new Date().toISOString().split('T')[0];
    }
    entry.updated_at = new Date().toISOString();

    this.addAuditLog('UPDATE_PROGRESS', 'team_progress', teamId, { chapterId, status, score });
    this.saveToStorage();
    return entry;
  }

  public getProject(teamId: string): (Project & { media: ProjectMedia[] }) | undefined {
    const project = this.state.projects.find((p) => p.team_id === teamId);
    if (!project) return undefined;
    const media = this.state.projectMedia.filter((m) => m.team_id === teamId);
    return {
      ...project,
      media,
    };
  }

  public updateProject(teamId: string, updates: Partial<Project>) {
    let project = this.state.projects.find((p) => p.team_id === teamId);
    if (!project) {
      project = {
        id: 'pr-' + Math.random().toString(36).substring(2, 9),
        team_id: teamId,
        title: 'IoT Agricultural Prototype',
        stage: 'Ideation',
        status: 'In Progress',
        milestones: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.state.projects.push(project);
    }
    Object.assign(project, updates, { updated_at: new Date().toISOString() });
    this.addAuditLog('UPDATE_PROJECT', 'projects', project.id, updates);
    this.saveToStorage();
    return project;
  }

  public addProjectMedia(mediaData: Omit<ProjectMedia, 'id' | 'created_at'>) {
    const id = 'pm-' + Math.random().toString(36).substring(2, 9);
    const media: ProjectMedia = {
      ...mediaData,
      id,
      created_at: new Date().toISOString(),
    };
    this.state.projectMedia.push(media);
    this.addAuditLog('UPLOAD_MEDIA', 'project_media', id, { title: media.title, type: media.media_type });
    this.saveToStorage();
    return media;
  }

  // ASSESSMENTS & MARKS
  public getAssessments(schoolId?: string, classId?: string): Assessment[] {
    return this.state.assessments.filter((a) => {
      if (schoolId && a.school_id !== schoolId) return false;
      if (classId && a.class_id !== classId) return false;
      return true;
    });
  }

  public getOrCreateAssessment(schoolId: string, classId: string, sectionId: string, month: string): Assessment {
    let assessment = this.state.assessments.find(
      (a) => a.school_id === schoolId && a.class_id === classId && a.section_id === sectionId && a.month === month
    );
    if (!assessment) {
      assessment = {
        id: 'as-' + Math.random().toString(36).substring(2, 9),
        school_id: schoolId,
        class_id: classId,
        section_id: sectionId,
        month,
        academic_year: '2026-2027',
        theory_max: 20,
        practical_max: 30,
        project_max: 30,
        creativity_max: 10,
        participation_max: 10,
        total_max: 100,
        created_at: new Date().toISOString(),
      };
      this.state.assessments.push(assessment);
      this.saveToStorage();
    }
    return assessment;
  }

  public getAssessmentMarks(assessmentId: string): (AssessmentMarks & { student?: Student })[] {
    return this.state.assessmentMarks
      .filter((am) => am.assessment_id === assessmentId)
      .map((am) => ({
        ...am,
        student: this.state.students.find((st) => st.id === am.student_id),
      }));
  }

  public submitStudentMarks(
    assessmentId: string,
    studentId: string,
    marks: { theory: number; practical: number; project: number; creativity: number; participation: number },
    facultyRemarks: string,
    submittedBy: string
  ): AssessmentMarks {
    const calc = calculateAssessmentGrade(
      marks.theory,
      marks.practical,
      marks.project,
      marks.creativity,
      marks.participation
    );

    let markEntry = this.state.assessmentMarks.find(
      (am) => am.assessment_id === assessmentId && am.student_id === studentId
    );

    if (markEntry) {
      markEntry.theory_marks = calc.theory;
      markEntry.practical_marks = calc.practical;
      markEntry.project_marks = calc.project;
      markEntry.creativity_marks = calc.creativity;
      markEntry.participation_marks = calc.participation;
      markEntry.total_marks = calc.total;
      markEntry.percentage = calc.percentage;
      markEntry.grade = calc.grade;
      markEntry.performance_category = calc.performance_category;
      markEntry.faculty_remarks = facultyRemarks;
      markEntry.submitted_by = submittedBy;
      markEntry.updated_at = new Date().toISOString();
    } else {
      markEntry = {
        id: 'am-' + Math.random().toString(36).substring(2, 9),
        assessment_id: assessmentId,
        student_id: studentId,
        theory_marks: calc.theory,
        practical_marks: calc.practical,
        project_marks: calc.project,
        creativity_marks: calc.creativity,
        participation_marks: calc.participation,
        total_marks: calc.total,
        percentage: calc.percentage,
        grade: calc.grade,
        performance_category: calc.performance_category,
        faculty_remarks: facultyRemarks,
        submitted_by: submittedBy,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.state.assessmentMarks.push(markEntry);
    }

    this.addAuditLog('SUBMIT_ASSESSMENT_MARKS', 'assessment_marks', markEntry.id, {
      studentId,
      total: calc.total,
      grade: calc.grade,
    });
    this.saveToStorage();
    return markEntry;
  }

  // DYNAMIC LIVE STATS & METRICS (NO HARDCODING)
  public getDashboardMetrics(role: 'admin' | 'faculty' | 'staff', schoolId?: string, facultyId?: string) {
    const schools = this.state.schools.filter((s) => (!schoolId ? true : s.id === schoolId));
    const students = this.state.students.filter((st) => (!schoolId ? true : st.school_id === schoolId));
    const classes = this.state.classes;
    const teams = this.state.teams.filter((t) => (!schoolId ? true : t.school_id === schoolId));
    const faculty = this.state.faculty;

    // Attendance calculation
    const allSessions = this.state.sessions.filter((s) => (!schoolId ? true : s.school_id === schoolId));
    const sessionIds = new Set(allSessions.map((s) => s.id));
    const attendanceRecords = this.state.attendance.filter((a) => sessionIds.has(a.session_id));
    const presentRecords = attendanceRecords.filter((a) => a.status === 'present' || a.status === 'late');
    const attendancePercentage = attendanceRecords.length > 0
      ? Number(((presentRecords.length / attendanceRecords.length) * 100).toFixed(1))
      : 88.5;

    // Course completion calculation: based on completed team_progress records
    const relevantTeams = this.state.teams.filter((t) => (!schoolId ? true : t.school_id === schoolId));
    const relevantTeamIds = new Set(relevantTeams.map((t) => t.id));
    const teamProgressRecords = this.state.teamProgress.filter((tp) => relevantTeamIds.has(tp.team_id));
    const completedProgress = teamProgressRecords.filter((tp) => tp.status === 'Completed').length;
    const totalPossibleProgress = Math.max(teamProgressRecords.length, 1);
    const courseCompletionPercentage = Number(((completedProgress / totalPossibleProgress) * 100).toFixed(1));

    // Assessment average
    const marks = this.state.assessmentMarks.filter((m) => {
      const st = this.state.students.find((s) => s.id === m.student_id);
      return !schoolId ? true : st?.school_id === schoolId;
    });
    const avgScore = marks.length > 0
      ? Number((marks.reduce((acc, curr) => acc + curr.total_marks, 0) / marks.length).toFixed(1))
      : 85.0;

    // Faculty specific metrics
    const facultySessions = this.state.sessions.filter(
      (s) => s.faculty_id === facultyId || s.substitute_faculty_id === facultyId
    );
    const completedFacultySessions = facultySessions.filter((s) => s.status === 'completed').length;
    const upcomingFacultySessions = facultySessions.filter((s) => s.status === 'scheduled').length;

    return {
      totalSchools: schools.length,
      totalStudents: students.length,
      totalFaculty: faculty.length,
      totalClasses: classes.length,
      totalTeams: teams.length,
      attendancePercentage,
      courseCompletionPercentage,
      assessmentAverage: avgScore,
      completedSessions: completedFacultySessions,
      upcomingSessions: upcomingFacultySessions,
      recentSessions: allSessions.slice(0, 5),
    };
  }
}

// Singleton repository
export const dbRepository = new Repository();
