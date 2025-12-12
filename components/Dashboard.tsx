import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getStudents, getAttendance } from '../services/storage';
import { Users, UserCheck, Clock } from 'lucide-react';

const Dashboard: React.FC = () => {
  const students = getStudents();
  const attendance = getAttendance();

  const stats = useMemo(() => {
    const todayStr = new Date().toDateString();
    const todayCount = attendance.filter(a => new Date(a.timestamp).toDateString() === todayStr).length;
    
    return {
      totalStudents: students.length,
      totalAttendance: attendance.length,
      todayAttendance: todayCount
    };
  }, [students, attendance]);

  const chartData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toDateString();
    }).reverse();

    return last7Days.map(dateStr => {
        const dayStr = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });
        const count = attendance.filter(a => new Date(a.timestamp).toDateString() === dateStr).length;
        return { name: dayStr, students: count };
    });
  }, [attendance]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
           <div className="p-3 bg-blue-100 rounded-full">
             <Users className="w-6 h-6 text-blue-600" />
           </div>
           <div>
             <p className="text-sm text-gray-500">Total Students</p>
             <p className="text-2xl font-bold text-gray-800">{stats.totalStudents}</p>
           </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
           <div className="p-3 bg-green-100 rounded-full">
             <UserCheck className="w-6 h-6 text-green-600" />
           </div>
           <div>
             <p className="text-sm text-gray-500">Present Today</p>
             <p className="text-2xl font-bold text-gray-800">{stats.todayAttendance}</p>
           </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
           <div className="p-3 bg-indigo-100 rounded-full">
             <Clock className="w-6 h-6 text-indigo-600" />
           </div>
           <div>
             <p className="text-sm text-gray-500">Total Records</p>
             <p className="text-2xl font-bold text-gray-800">{stats.totalAttendance}</p>
           </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-6">Attendance Trends (Last 7 Days)</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                cursor={{fill: '#f3f4f6'}}
              />
              <Bar dataKey="students" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;