export interface Student {
  id: string;
  name: string;
  studentClass: string;
  section: string;
  photoData: string; // Base64
  registeredAt: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  timestamp: string;
  confidence: number;
}

export interface DashboardStats {
  totalStudents: number;
  totalAttendance: number;
  todayAttendance: number;
}

export type ViewState = 'dashboard' | 'register' | 'attendance' | 'students';