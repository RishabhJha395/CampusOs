import { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { useDepartments, useCreateDepartment } from '../../features/departments/hooks/useDepartments';
import { Building2, Plus, Users } from 'lucide-react';

export function Directory() {
  const { profile } = useSelector((state: RootState) => state.auth);
  const collegeId = profile?.college_id || '';
  
  const { data: departments, isLoading } = useDepartments(collegeId);
  const createDepartment = useCreateDepartment(collegeId);

  const [isCreating, setIsCreating] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName || !newDeptCode) return;
    
    await createDepartment.mutateAsync({
      name: newDeptName,
      code: newDeptCode.toUpperCase(),
      college_id: collegeId,
    });
    
    setNewDeptName('');
    setNewDeptCode('');
    setIsCreating(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Academic Directory</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage departments and faculty</p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-sm active:scale-[0.98]"
        >
          <Plus size={20} className="mr-2" />
          Add Department
        </button>
      </div>

      {isCreating && (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-all">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">New Department</h2>
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text" placeholder="Department Name (e.g. Computer Science)" required
                value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="sm:w-48">
              <input
                type="text" placeholder="Code (e.g. CSE)" required
                value={newDeptCode} onChange={(e) => setNewDeptCode(e.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 uppercase"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={createDepartment.isPending} className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:opacity-90 transition-opacity font-medium">
                {createDepartment.isPending ? 'Saving...' : 'Save'}
              </button>
              <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-2xl w-full"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments?.map((dept) => (
            <div key={dept.id} className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{dept.name}</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 mt-2">
                      {dept.code}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer transition-colors">
                  <Users size={16} className="mr-2" />
                  View Faculty
                </div>
              </div>
            </div>
          ))}
          
          {departments?.length === 0 && !isCreating && (
            <div className="col-span-full py-12 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 border-dashed">
              <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No departments yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Get started by creating your first academic department.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
