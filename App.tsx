import React, { useState, useEffect } from 'react';
import { ViewState, Student } from './types';
import Dashboard from './components/Dashboard';
import Registration from './components/Registration';
import AttendanceScanner from './components/AttendanceScanner';
import StudentList from './components/StudentList';
import { getStudents, clearData } from './services/storage';
import { LayoutDashboard, UserPlus, ScanFace, Users, LogOut } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('dashboard');
  const [students, setStudents] = useState<Student[]>([]);

  const loadStudents = () => {
    setStudents(getStudents());
  };

  // Reload students whenever the view changes to 'students' or 'dashboard'
  useEffect(() => {
    loadStudents();
  }, [view]);

  const NavItem = ({ id, label, icon: Icon }: { id: ViewState, label: string, icon: any }) => (
    <button
      onClick={() => setView(id)}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full transition-colors ${
        view === id 
          ? 'bg-indigo-50 text-indigo-700 font-medium' 
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col h-auto md:h-screen sticky top-0 z-10">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ScanFace className="w-8 h-8 text-indigo-600" />
            <span className="text-xl font-bold text-gray-900">FaceCheck AI</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <NavItem id="dashboard" label="Dashboard" icon={LayoutDashboard} />
          <NavItem id="attendance" label="Mark Attendance" icon={ScanFace} />
          <NavItem id="register" label="Register Student" icon={UserPlus} />
          <NavItem id="students" label="Student List" icon={Users} />
        </nav>

        <div className="p-4 border-t border-gray-100">
           <button 
             onClick={() => {
               if(confirm("Are you sure you want to clear all data?")) {
                 clearData();
                 window.location.reload();
               }
             }}
             className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-red-600 hover:bg-red-50 transition-colors text-sm"
           >
             <LogOut className="w-5 h-5" />
             <span>Reset System</span>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 capitalize">
              {view === 'attendance' ? 'Attendance Scanner' : view === 'students' ? 'Student Management' : view}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {view === 'dashboard' && 'Overview of system status'}
              {view === 'attendance' && 'Live facial recognition active'}
              {view === 'register' && 'Add new students to the database'}
              {view === 'students' && 'Manage registered students'}
            </p>
          </div>
        </header>

        <div className="max-w-6xl mx-auto">
          {view === 'dashboard' && <Dashboard />}
          {view === 'register' && <Registration onComplete={() => setView('students')} />}
          {view === 'attendance' && <AttendanceScanner />}
          {view === 'students' && (
            <StudentList 
              students={students} 
              onRefresh={loadStudents} 
              onAddNew={() => setView('register')}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;