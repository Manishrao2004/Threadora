import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getConfig, updateConfig } from '../../api/adminApi';
import { Settings, Save, Globe, Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { PageLoader } from '../../components/common/Skeletons';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const { user } = useAuth();
  const [config, setConfig] = useState({
    maintenanceMode: false,
    allowGuestViews: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const data = await getConfig();
      setConfig({
        maintenanceMode: data.maintenanceMode || false,
        allowGuestViews: data.allowGuestViews ?? true
      });
    } catch (err) {
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (key) => {
    setConfig(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateConfig({
        maintenanceMode: config.maintenanceMode,
        allowGuestViews: config.allowGuestViews
      });
      toast.success('System settings updated globally.');
    } catch (err) {
      toast.error('Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <PageLoader />;

  // SuperAdmin-only guard — redirect admins who navigate here directly
  if (user && user.role !== 'superadmin') {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-xl bg-orange-500/20 text-orange-400">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">System Settings</h1>
          <p className="text-[#908FA0] text-sm">Control global application behavior and maintenance flags.</p>
        </div>
      </div>

      <div className="glass-panel p-6 md:p-10 rounded-3xl space-y-8">
        
        {/* Setting Toggle: Maintenance */}
        <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.05)] pb-8">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-red-500/10 text-red-400 mt-1">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-1">Maintenance Mode</h3>
              <p className="text-[#908FA0] text-sm max-w-md line-clamp-2">
                When enabled, the application will display a placeholder screen to all regular users. Only administrators will be able to log in and interact.
              </p>
            </div>
          </div>
          <button 
            onClick={() => handleToggle('maintenanceMode')}
            className={`relative inline-flex items-center h-6 rounded-full w-11 shrink-0 transition-colors duration-300 focus:outline-none ${config.maintenanceMode ? 'bg-red-500' : 'bg-[#464554]'}`}
          >
            <span className={`inline-block w-4 h-4 bg-white rounded-full transition-transform duration-300 transform ${config.maintenanceMode ? 'translate-x-[22px]' : 'translate-x-1'}`}></span>
          </button>
        </div>

        {/* Setting Toggle: Guest Views */}
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-[#2FD9F4]/10 text-[#2FD9F4] mt-1">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-1">Allow Guest Views</h3>
              <p className="text-[#908FA0] text-sm max-w-md line-clamp-2">
                If disabled, unauthenticated visitors will be immediately redirected to the login screen and cannot browse threads.
              </p>
            </div>
          </div>
          <button 
            onClick={() => handleToggle('allowGuestViews')}
            className={`relative inline-flex items-center h-6 rounded-full w-11 shrink-0 transition-colors duration-300 focus:outline-none ${config.allowGuestViews ? 'bg-[#2FD9F4]' : 'bg-[#464554]'}`}
          >
            <span className={`inline-block w-4 h-4 bg-white rounded-full transition-transform duration-300 transform ${config.allowGuestViews ? 'translate-x-[22px]' : 'translate-x-1'}`}></span>
          </button>
        </div>

        <div className="flex justify-end pt-8 border-t border-[rgba(255,255,255,0.05)]">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary py-3 px-8 flex items-center gap-2 text-base shadow-lg shadow-[#6366F1]/20"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save System Configurations
          </button>
        </div>

      </div>
    </div>
  );
}
