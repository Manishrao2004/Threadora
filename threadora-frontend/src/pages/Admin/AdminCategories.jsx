import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../api/categoryApi';
import { useConfirm } from '../../context/ConfirmContext';
import { Hash, Plus, Trash2, Loader2, Save, X, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', description: '' });
  
  const [editingId, setEditingId] = useState(null);
  const [editCat, setEditCat] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      toast.error('Failed to load communities');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newCat.name.trim()) return toast.error('Name is required');
    if (!newCat.description.trim()) return toast.error('Description is required');
    setIsActionLoading(true);
    try {
      await createCategory(newCat);
      toast.success('Community created successfully');
      setNewCat({ name: '', description: '' });
      setShowCreateForm(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create community');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editCat.name.trim()) return toast.error('Name is required');
    if (!editCat.description.trim()) return toast.error('Description is required');
    
    const originalCat = categories.find(c => c._id === editingId);
    if (editCat.name.toLowerCase() === 'general' && originalCat?.name?.toLowerCase() !== 'general') {
       return toast.error('The default "general" community name cannot be changed.');
    }
    
    setIsActionLoading(true);
    try {
      await updateCategory(editingId, editCat);
      toast.success('Community updated');
      setEditingId(null);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update community');
    } finally {
      setIsActionLoading(false);
    }
  };

  const confirm = useConfirm();
  const { user } = useAuth(); // Import useAuth to check role

  const handleDelete = async (id, name) => {
    if (user?.role !== 'superadmin') return toast.error("Only SuperAdmins can delete communities.");
    if (name.toLowerCase() === 'general') {
      return toast.error('The default "general" community cannot be deleted.');
    }
    const confirmed = await confirm({
      title: `Delete Community`,
      message: `Are you sure you want to delete #${name}? This will PERMANENTLY delete all threads and comments within this community.`,
      confirmText: 'Delete Everything',
      type: 'danger'
    });
    if (!confirmed) return;
    setIsActionLoading(true);
    try {
      await deleteCategory(id);
      toast.success('Community and all associated content deleted');
      fetchCategories();
    } catch (err) {
      toast.error('Failed to delete community');
    } finally {
      setIsActionLoading(false);
    }
  };

  const startEdit = (cat) => {
    if (user?.role !== 'superadmin') return toast.error("Only SuperAdmins can edit communities.");
    setEditingId(cat._id);
    setEditCat({ name: cat.name, description: cat.description || '' });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-[#6366F1]" />
      </div>
    );
  }

  const isSuperAdmin = user?.role === 'superadmin';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[#6366F1]/20 text-[#6366F1]">
            <Hash className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Communities</h1>
            <p className="text-[#908FA0] text-sm">Manage hashtags and community structured discussions.</p>
          </div>
        </div>
        {isSuperAdmin && (
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn-primary py-2.5 px-5 flex items-center justify-center gap-2"
          >
            {showCreateForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showCreateForm ? 'Cancel' : 'New Community'}
          </button>
        )}
      </div>

      {showCreateForm && isSuperAdmin && (
        <div className="glass-panel p-6 rounded-3xl animate-slideDown shadow-2xl shadow-black/40 border-[#6366F1]/30">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Community Name</label>
                <input 
                  type="text"
                  placeholder="e.g. technology"
                  value={newCat.name}
                  onChange={(e) => setNewCat({...newCat, name: e.target.value})}
                  className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#6366F1] transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Short Description</label>
                <input 
                  type="text"
                  placeholder="What is this space for?"
                  value={newCat.description}
                  onChange={(e) => setNewCat({...newCat, description: e.target.value})}
                  className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#6366F1] transition-all"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button 
                type="submit" 
                disabled={isActionLoading}
                className="btn-primary py-2 px-8 flex items-center gap-2"
              >
                {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Create #Community
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <div key={cat._id} className="glass-panel p-6 rounded-3xl group relative overflow-hidden transition-all hover:border-[#6366F1]/30 text-white">
            {editingId === cat._id ? (
              <form onSubmit={handleUpdate} className="space-y-4 h-full flex flex-col">
                <input 
                  type="text"
                  value={editCat.name}
                  onChange={(e) => setEditCat({...editCat, name: e.target.value})}
                  disabled={cat.name.toLowerCase() === 'general'}
                  className={`w-full bg-[#111827] border border-[#6366F1]/50 rounded-xl px-3 py-2 text-white font-bold mb-1 focus:outline-none ${cat.name.toLowerCase() === 'general' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  autoFocus
                />
                <textarea 
                  value={editCat.description}
                  onChange={(e) => setEditCat({...editCat, description: e.target.value})}
                  className="w-full h-24 bg-[#111827] border border-white/10 rounded-xl px-3 py-2 text-gray-400 text-sm focus:outline-none focus:border-[#6366F1] resize-none"
                />
                <div className="flex gap-2 mt-auto pt-4">
                   <button 
                    type="submit" 
                    disabled={isActionLoading}
                    className="flex-1 bg-emerald-500/20 text-emerald-400 py-2 rounded-xl text-xs font-bold hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-2"
                   >
                     <Save className="w-3 h-3" /> Save
                   </button>
                   <button 
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="flex-1 bg-white/5 text-gray-400 py-2 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors"
                   >
                     Cancel
                   </button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2 px-2 py-1 bg-[#6366F1]/10 text-[#6366F1] rounded-lg border border-[#6366F1]/20">
                    <Hash className="w-3.5 h-3.5" />
                    <span className="text-sm font-bold uppercase tracking-wide">{cat.name}</span>
                  </div>
                  <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    {isSuperAdmin && (
                      <button 
                        onClick={() => startEdit(cat)}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {isSuperAdmin && cat.name.toLowerCase() !== 'general' && (
                      <button 
                        onClick={() => handleDelete(cat._id, cat.name)}
                        className="p-1.5 text-red-500/60 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[#908FA0] text-sm line-clamp-3 leading-relaxed mb-4 flex-1">
                  {cat.description || 'No description provided for this community.'}
                </p>
                <div className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                  Active in {cat.name}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
