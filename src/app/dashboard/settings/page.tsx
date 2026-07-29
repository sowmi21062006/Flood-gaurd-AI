'use client';

import { User, Bell, Shield, Key, Save } from 'lucide-react';
import { useAuth } from '@/components/SessionProvider';

export default function SettingsPage() {
  const { user, userData } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl transition-colors">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">System Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage your account and application preferences.</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition shadow-lg shadow-blue-500/20">
          <Save size={16} className="mr-2" /> Save Changes
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
        {/* Profile Settings */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-6">
            <User size={18} className="mr-2 text-blue-500 dark:text-blue-400" /> Profile Settings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Display Name</label>
              <input type="text" defaultValue={userData?.name || user?.displayName || ''} className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Email Address</label>
              <input type="email" defaultValue={user?.email || ''} disabled className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-500 rounded-lg px-4 py-2.5 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Role</label>
              <input type="text" defaultValue={userData?.role || 'Guest'} disabled className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-500 rounded-lg px-4 py-2.5 cursor-not-allowed uppercase" />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-6">
            <Bell size={18} className="mr-2 text-cyan-500 dark:text-cyan-400" /> Notification Preferences
          </h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Critical Alerts (SMS)</div>
                <div className="text-sm text-gray-500 dark:text-gray-500">Receive immediate SMS for phase 2/3 evacuations.</div>
              </div>
              <input type="checkbox" defaultChecked className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 dark:bg-gray-700 dark:border-gray-600 focus:ring-0 focus:ring-offset-0" />
            </label>
            <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Daily Digest (Email)</div>
                <div className="text-sm text-gray-500 dark:text-gray-500">Receive a daily summary of hydrological activity.</div>
              </div>
              <input type="checkbox" className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 dark:bg-gray-700 dark:border-gray-600 focus:ring-0 focus:ring-offset-0" />
            </label>
          </div>
        </div>

        {/* Security & API */}
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-6">
            <Shield size={18} className="mr-2 text-purple-500 dark:text-purple-400" /> Security & API
          </h2>
          <div className="space-y-4">
            <button className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition">
              <Key size={16} className="mr-2" /> Change Password
            </button>
            <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Groq API Key (Override)</label>
              <div className="flex shadow-sm">
                <input type="password" placeholder="sk-..." className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 border-r-0 rounded-l-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 dark:bg-gray-700 dark:border-gray-700 dark:hover:bg-gray-600 px-4 py-2.5 rounded-r-lg dark:text-white text-sm font-medium transition">
                  Validate
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Leave blank to use system default environment variable.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
