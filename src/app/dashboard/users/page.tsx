'use client';

import { Users, UserPlus, Shield, MoreVertical } from 'lucide-react';
import { useState } from 'react';

const mockUsers = [
  { id: 1, name: 'Admin User', email: 'admin@floodguard.ai', role: 'admin', status: 'active', lastLogin: '2 mins ago' },
  { id: 2, name: 'Field Officer Sarah', email: 'sarah@floodguard.ai', role: 'officer', status: 'active', lastLogin: '1 hour ago' },
  { id: 3, name: 'Volunteer Team A', email: 'vol.a@floodguard.ai', role: 'volunteer', status: 'offline', lastLogin: '2 days ago' },
];

export default function UsersPage() {
  const [users, setUsers] = useState(mockUsers);

  return (
    <div className="space-y-6 transition-colors">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage platform access, roles, and personnel.</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition shadow-lg shadow-blue-500/20">
          <UserPlus size={16} className="mr-2" /> Add User
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Last Login</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs mr-3">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-200">{user.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium uppercase ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400' : 
                      user.role === 'officer' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' : 
                      'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {user.role === 'admin' && <Shield size={12} className="mr-1" />}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span className={`w-2 h-2 rounded-full mr-2 ${user.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                      <span className="text-gray-600 dark:text-gray-300 capitalize">{user.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                    {user.lastLogin}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded transition">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
