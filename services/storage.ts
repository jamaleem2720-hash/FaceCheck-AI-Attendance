import { Student, AttendanceRecord } from '../types';

const STUDENTS_KEY = 'facecheck_students';
const ATTENDANCE_KEY = 'facecheck_attendance';

export const getStudents = (): Student[] => {
  const data = localStorage.getItem(STUDENTS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveStudent = (student: Student): void => {
  const students = getStudents();
  students.push(student);
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
};

export const updateStudent = (updatedStudent: Student): void => {
  const students = getStudents();
  const index = students.findIndex(s => s.id === updatedStudent.id);
  if (index !== -1) {
    students[index] = updatedStudent;
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
  }
};

export const deleteStudent = (id: string): void => {
  const students = getStudents();
  // Robust comparison ensuring types match (string vs number edge cases)
  const filtered = students.filter(s => String(s.id) !== String(id));
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(filtered));
};

export const getAttendance = (): AttendanceRecord[] => {
  const data = localStorage.getItem(ATTENDANCE_KEY);
  return data ? JSON.parse(data) : [];
};

export const markAttendance = (studentId: string, confidence: number): AttendanceRecord | null => {
  const records = getAttendance();
  const now = new Date();
  const today = now.toDateString();
  
  // Check if already marked for today
  const alreadyMarked = records.some(r => 
    r.studentId === studentId && new Date(r.timestamp).toDateString() === today
  );

  if (alreadyMarked) return null;

  const newRecord: AttendanceRecord = {
    id: crypto.randomUUID(),
    studentId,
    timestamp: now.toISOString(),
    confidence
  };

  records.push(newRecord);
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(records));
  return newRecord;
};

export const clearData = () => {
  localStorage.removeItem(STUDENTS_KEY);
  localStorage.removeItem(ATTENDANCE_KEY);
};