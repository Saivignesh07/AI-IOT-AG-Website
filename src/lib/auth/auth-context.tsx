'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Profile, UserRole, School, SchoolStaff, Faculty } from '@/types';
import { dbRepository } from '@/lib/db/repository';

interface AuthContextType {
  user: Profile | null;
  role: UserRole | null;
  currentSchool: School | null;
  staffRecord: SchoolStaff | null;
  facultyRecord: Faculty | null;
  isLoading: boolean;
  login: (email: string, role?: UserRole) => Promise<boolean>;
  logout: () => void;
  switchUser: (email: string) => void;
  setCurrentSchool: (school: School | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_KEY = 'agriguardian_auth_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [currentSchool, setCurrentSchoolState] = useState<School | null>(null);
  const [staffRecord, setStaffRecord] = useState<SchoolStaff | null>(null);
  const [facultyRecord, setFacultyRecord] = useState<Faculty | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const loadUserData = (email: string) => {
    const profiles = dbRepository.getProfiles();
    const found = profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
    if (found) {
      setUser(found);
      setRole(found.role);

      if (found.role === 'staff') {
        const staffList = dbRepository.getStaff();
        const sRecord = staffList.find((s) => s.profile_id === found.id) || null;
        setStaffRecord(sRecord);
        if (sRecord && sRecord.school) {
          setCurrentSchoolState(sRecord.school);
        }
      } else if (found.role === 'faculty') {
        const facultyList = dbRepository.getFaculty();
        const fRecord = facultyList.find((f) => f.profile_id === found.id) || null;
        setFacultyRecord(fRecord);
        // Default to Greenwood for faculty demo
        const schools = dbRepository.getSchools();
        if (schools.length > 0) setCurrentSchoolState(schools[0]);
      } else {
        // Admin
        const schools = dbRepository.getSchools();
        if (schools.length > 0) setCurrentSchoolState(schools[0]);
      }

      try {
        localStorage.setItem(AUTH_USER_KEY, email);
      } catch (e) {
        console.warn(e);
      }
      return true;
    }
    return false;
  };

  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem(AUTH_USER_KEY);
      if (savedEmail) {
        loadUserData(savedEmail);
      } else {
        // Default login as Admin for instantaneous preview
        loadUserData('admin@agriguardian.io');
      }
    } catch {
      loadUserData('admin@agriguardian.io');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string): Promise<boolean> => {
    const success = loadUserData(email);
    if (success) {
      const found = dbRepository.getProfiles().find((p) => p.email.toLowerCase() === email.toLowerCase());
      if (found?.role === 'admin') router.push('/admin/dashboard');
      else if (found?.role === 'faculty') router.push('/faculty/dashboard');
      else router.push('/staff/dashboard');
    }
    return success;
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    setCurrentSchoolState(null);
    setStaffRecord(null);
    setFacultyRecord(null);
    try {
      localStorage.removeItem(AUTH_USER_KEY);
    } catch (e) {
      console.warn(e);
    }
    router.push('/login');
  };

  const switchUser = (email: string) => {
    const ok = loadUserData(email);
    if (ok) {
      const found = dbRepository.getProfiles().find((p) => p.email.toLowerCase() === email.toLowerCase());
      if (found?.role === 'admin') router.push('/admin/dashboard');
      else if (found?.role === 'faculty') router.push('/faculty/dashboard');
      else router.push('/staff/dashboard');
    }
  };

  const setCurrentSchool = (school: School | null) => {
    // School staff cannot switch to schools other than their assigned one
    if (role === 'staff' && staffRecord && school?.id !== staffRecord.school_id) {
      return;
    }
    setCurrentSchoolState(school);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        currentSchool,
        staffRecord,
        facultyRecord,
        isLoading,
        login,
        logout,
        switchUser,
        setCurrentSchool,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
