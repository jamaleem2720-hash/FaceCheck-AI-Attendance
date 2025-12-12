import React, { useState } from 'react';
import { Student } from '../types';
import { deleteStudent, updateStudent } from '../services/storage';
import { Trash2, Pencil, UserPlus, X, Check } from 'lucide-react';

interface Props {
  students: Student[];
  onRefresh: () => void;
  onAddNew: () => void;
}

const StudentList: React.FC<Props> = ({ students, onRefresh, onAddNew }) => {
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editName, setEditName] = useState('');
  const [editId, setEditId] = useState('');
  const [editClass, setEditClass] = useState('');
  const [editSection, setEditSection] = useState('');

  const handleDelete = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation(); // Prevent event bubbling
    // Use a slightly more descriptive confirm message to ensure the user knows what's happening
    if (window.confirm(`Are you sure you want to delete ${name} (ID: ${id})? This action cannot be undone.`)) {
      deleteStudent(id);
      onRefresh();
    }
  };

  const startEdit = (student: Student) => {
    setEditingStudent(student);
    setEditName(student.name);
    setEditId(student.id);
    setEditClass(student.studentClass || '');
    setEditSection(student.section || '');
  };

  const handleSaveEdit = () => {
    if (editingStudent && editName && editId) {
      updateStudent({
        ...editingStudent,
        name: editName,
        id: editId,
        studentClass: editClass,
        section: editSection
      });
      setEditingStudent(null);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onAddNew}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          Add Student
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class/Sec</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    <p className="mb-2">No students registered yet.</p>
                    <button 
                      type="button"
                      onClick={onAddNew}
                      className="text-indigo-600 font-medium hover:underline"
                    >
                      Register your first student
                    </button>
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img src={student.photoData} alt={student.name} className="h-10 w-10 rounded-full object-cover border border-gray-300 shadow-sm" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{student.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{student.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {(student.studentClass || student.section) ? (
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs font-semibold text-gray-600">
                          {student.studentClass} {student.section}
                        </span>
                      ) : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(student.registeredAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3">
                        <button 
                          type="button"
                          onClick={() => startEdit(student)}
                          className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 p-2 rounded-full hover:bg-indigo-100 transition-colors"
                          title="Edit Student"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          type="button"
                          onClick={(e) => handleDelete(e, student.id, student.name)}
                          className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-full hover:bg-red-100 transition-colors"
                          title="Delete Student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Edit Student</h3>
              <button 
                type="button"
                onClick={() => setEditingStudent(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-center mb-6">
                 <img 
                   src={editingStudent.photoData} 
                   alt="Preview" 
                   className="w-24 h-24 rounded-full object-cover border-4 border-gray-100 shadow-lg"
                 />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                <input
                  type="text"
                  value={editId}
                  onChange={(e) => setEditId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                    <input
                    type="text"
                    value={editClass}
                    onChange={(e) => setEditClass(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                    <input
                    type="text"
                    value={editSection}
                    onChange={(e) => setEditSection(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    />
                </div>
              </div>

              <div className="bg-blue-50 text-blue-700 text-sm p-3 rounded-lg">
                Note: To update the biometric photo, please delete this record and register the student again.
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={!editName || !editId}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;