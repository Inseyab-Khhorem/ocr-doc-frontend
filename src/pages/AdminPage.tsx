import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Trash2, Users, FileText, AlertTriangle } from 'lucide-react';
import { apiClient } from '../lib/api';
import toast from 'react-hot-toast';

interface AdminRecord {
  id: string;
  user_id: string;
  action: string;
  created_at: string;
  prompt?: string;
  output_file_url: string;
}

export const AdminPage: React.FC = () => {
  const [adminToken, setAdminToken] = useState(localStorage.getItem('admin_token') || '');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  
  const queryClient = useQueryClient();

  // Admin login
  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      apiClient.adminLogin(email, password),
    onSuccess: (data) => {
      setAdminToken(data.data.access_token);
      localStorage.setItem('admin_token', data.data.access_token);
      toast.success('Admin login successful');
    },
    onError: () => toast.error('Invalid admin credentials'),
  });

  // Get all records
  const { data: records = [], isLoading } = useQuery<AdminRecord[]>({
    queryKey: ['admin-records'],
    queryFn: () => apiClient.adminGetAllRecords(),
    enabled: !!adminToken,
  });

  // Delete record mutation
  const deleteRecordMutation = useMutation({
    mutationFn: (recordId: string) => apiClient.adminDeleteRecord(recordId),
    onSuccess: () => {
      toast.success('Record deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-records'] });
    },
    onError: () => toast.error('Failed to delete record'),
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginForm);
  };

  const handleLogout = () => {
    setAdminToken('');
    localStorage.removeItem('admin_token');
    toast.success('Logged out');
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getActionIcon = (action: string) => {
    return action === 'OCR Conversion' ? 
      <FileText className="h-5 w-5 text-blue-600" /> :
      <FileText className="h-5 w-5 text-purple-600" />;
  };

  if (!adminToken) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Shield className="mx-auto h-12 w-12 text-red-600 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Admin Login</h2>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              placeholder="Admin Email"
              value={loginForm.email}
              onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              required
            />
            <input
              type="password"
              placeholder="Admin Password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              required
            />
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {loginMutation.isPending ? 'Logging in...' : 'Admin Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Manage all users and records</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Logout
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-500">Total Records</p>
              <p className="text-2xl font-bold text-gray-900">{records.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-500">Unique Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(records.map(r => r.user_id)).size}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-500">Recent Activity</p>
              <p className="text-2xl font-bold text-gray-900">
                {records.filter(r => 
                  new Date(r.created_at) > new Date(Date.now() - 24*60*60*1000)
                ).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">All Records</h2>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center">Loading...</div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No records found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Files</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {records.map((record) => {
                  let urls: { docx?: string; pdf?: string } = {};
                  try {
                    urls = JSON.parse(record.output_file_url || "{}");
                  } catch (e) {}

                  return (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {getActionIcon(record.action)}
                          <span className="text-sm font-medium text-gray-900">{record.action}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                        {record.user_id.slice(0, 8)}...
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(record.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          {urls.docx && (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">DOCX</span>
                          )}
                          {urls.pdf && (
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">PDF</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => deleteRecordMutation.mutate(record.id)}
                          disabled={deleteRecordMutation.isPending}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};