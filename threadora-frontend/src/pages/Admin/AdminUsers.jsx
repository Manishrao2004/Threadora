import { useEffect, useState } from 'react';
import { getUsers, updateUserRole, deleteUser, toggleUserSuspension } from '../../api/adminApi';
import { useAuth } from '../../hooks/useAuth';
import { useConfirm } from '../../context/ConfirmContext';
import { Users, Trash2, Shield, User as UserIcon, Loader2, Ban, CheckCircle } from 'lucide-react';
import { PageLoader } from '../../components/common/Skeletons';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setIsLoading(false);
      if (isManualRefresh) setIsRefreshing(false);
    }
  };

  const handleRoleToggle = async (userId, currentRole) => {
    if (currentUser?.role !== 'superadmin') return toast.error("Only SuperAdmins can modify roles.");
    if (userId === currentUser?._id) return toast.error("You cannot change your own role.");
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      await updateUserRole(userId, newRole);
      toast.success(`User role updated to ${newRole}`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const confirm = useConfirm();

  const handleDelete = async (userId) => {
    if (currentUser?.role !== 'superadmin') return toast.error("Only SuperAdmins can delete accounts.");
    if (userId === currentUser?._id) return toast.error("You cannot delete your own account.");
    
    const confirmed = await confirm({
      title: 'Delete User',
      message: 'Are you sure you want to permanently delete this user? This action cannot be undone.',
      confirmText: 'Delete Permanently',
      type: 'danger'
    });
    
    if(!confirmed) return;
    try {
      await deleteUser(userId);
      toast.success('User deleted successfully');
      setUsers(prev => prev.filter(u => u._id !== userId));
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleToggleSuspension = async (userId, isSuspended, targetRole) => {
    if (userId === currentUser?._id) return toast.error("You cannot change your own suspension status.");
    
    // Admins cannot suspend other Admins or SuperAdmins
    if (currentUser?.role === 'admin' && (targetRole === 'admin' || targetRole === 'superadmin')) {
        return toast.error("You do not have permission to suspend other administrative accounts.");
    }
    // SuperAdmins are immune
    if (targetRole === 'superadmin') {
        return toast.error("SuperAdmins are immune to suspension.");
    }

    const action = isSuspended ? 'unsuspend' : 'suspend';
    
    const confirmed = await confirm({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      message: `Are you sure you want to ${action} this user?`,
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      type: isSuspended ? 'primary' : 'warning'
    });
    
    if(!confirmed) return;
    try {
      const updatedUser = await toggleUserSuspension(userId);
      toast.success(`User ${action}ed successfully`);
      setUsers(prev => prev.map(u => (u._id === userId ? { ...u, isSuspended: updatedUser.isSuspended, credibilityScore: updatedUser.credibilityScore } : u)));
    } catch (error) {
      toast.error(`Failed to ${action} user`);
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[#6366F1]/20 text-[#6366F1]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">User Management</h1>
            <p className="text-[#908FA0] text-sm">View, moderate, and manage registered accounts.</p>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={() => fetchUsers(true)}
            disabled={isRefreshing}
            className="flex-1 md:flex-none btn-secondary bg-[#6366F1]/10 text-[#6366F1] border-[#6366F1]/20 hover:bg-[#6366F1]/20 text-sm py-2 px-4 whitespace-nowrap flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Loader2 className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : 'hidden'}`} />
            Refresh Data
          </button>
        </div>
      </header>

      <div className="glass-panel overflow-hidden rounded-3xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.05)] bg-[#111827]">
                <th className="py-4 px-6 text-[#908FA0] font-semibold text-sm">User</th>
                <th className="py-4 px-6 text-[#908FA0] font-semibold text-sm">Email</th>
                <th className="py-4 px-6 text-[#908FA0] font-semibold text-sm">Role</th>
                <th className="py-4 px-6 text-[#908FA0] font-semibold text-sm">Credibility</th>
                <th className="py-4 px-6 text-[#908FA0] font-semibold text-sm">Joined</th>
                <th className="py-4 px-6 text-[#908FA0] font-semibold text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b border-[rgba(255,255,255,0.05)] hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#6366F1]/20 flex items-center justify-center text-[#6366F1] font-bold text-xs">
                        {user.username?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-white font-medium">@{user.username}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-[#E0E2EA] text-sm">{user.email}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 text-[10px] font-extrabold rounded-full tracking-wider ${
                      user.role === 'superadmin' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 
                      user.role === 'admin' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 
                      'bg-white/10 text-[#908FA0] border border-white/5'
                    }`}>
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${user.credibilityScore > 10 ? 'text-emerald-400' : user.credibilityScore < 0 ? 'text-red-400' : 'text-gray-300'}`}>
                        {user.credibilityScore || 0}
                      </span>
                      {user.isSuspended && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-500 px-2 border border-red-500/20 rounded-md">
                          Suspended
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-[#E0E2EA] text-sm">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end gap-2">
                      {currentUser?.role === 'superadmin' && (
                        <button 
                          onClick={() => handleRoleToggle(user._id, user.role)}
                          disabled={user._id === currentUser?._id || user.role === 'superadmin'}
                          className={`p-2 rounded-lg transition-colors border ${user._id === currentUser?._id || user.role === 'superadmin' ? 'opacity-20 cursor-not-allowed bg-white/5 border-white/5 text-gray-500' : 'bg-white/5 hover:bg-white/10 text-white border-white/10'}`}
                          title={user._id === currentUser?._id ? "Cannot modify own role" : user.role === 'superadmin' ? "SuperAdmins are immune" : (user.role === 'admin' ? 'Demote to User' : 'Promote to Admin')}
                        >
                          {user.role === 'admin' ? <UserIcon className="w-4 h-4" /> : <Shield className="w-4 h-4 text-[#3B82F6]" />}
                        </button>
                      )}
                      
                      <button 
                        onClick={() => handleToggleSuspension(user._id, user.isSuspended, user.role)}
                        disabled={user._id === currentUser?._id || user.role === 'superadmin' || (currentUser?.role === 'admin' && user.role === 'admin')}
                        className={`p-2 rounded-lg transition-colors border ${
                          user._id === currentUser?._id || user.role === 'superadmin' || (currentUser?.role === 'admin' && user.role === 'admin') 
                          ? 'opacity-20 cursor-not-allowed bg-white/5 border-white/5 text-gray-500' 
                          : (user.isSuspended ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20' : 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border-orange-500/20')
                        }`}
                        title={user._id === currentUser?._id ? "Cannot modify own suspension" : user.role === 'superadmin' ? "SuperAdmins cannot be suspended" : (user.isSuspended ? 'Unsuspend User' : 'Suspend User')}
                      >
                        {user.isSuspended ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                      </button>

                      {currentUser?.role === 'superadmin' && (
                        <button 
                          onClick={() => handleDelete(user._id)}
                          disabled={user._id === currentUser?._id || user.role === 'superadmin'}
                          className={`p-2 rounded-lg transition-colors border ${user._id === currentUser?._id || user.role === 'superadmin' ? 'opacity-20 cursor-not-allowed bg-[#ffb4ab]/5 border-[#ffb4ab]/5 text-gray-500' : 'bg-[#ffb4ab]/10 hover:bg-[#ffb4ab]/20 text-[#ffb4ab] border-[#ffb4ab]/20'}`}
                          title={user._id === currentUser?._id ? "Cannot delete own account" : user.role === 'superadmin' ? "SuperAdmins cannot be deleted" : "Delete User"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="text-center py-10 text-[#908FA0]">No users found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
