import { useEffect, useState } from 'react';
import { getReports } from '../../api/reportApi';
import { getSystemStats } from '../../api/adminApi';
import { Activity, Users, MessageSquare, AlertTriangle, Loader2 } from 'lucide-react';


export default function AdminOverview() {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalThreads: 0, engagements: 0 });
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const [rData, statsData] = await Promise.all([
        getReports().catch(() => []),
        getSystemStats().catch(() => ({ totalUsers: 0, totalThreads: 0, engagements: 0 }))
      ]);
      setReports(rData);
      setStats(statsData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };



  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">System Overview</h1>
          <p className="text-gray-400 text-sm">Real-time moderation metrics and active reports queue.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={fetchData}
            disabled={isRefreshing}
            className="flex-1 md:flex-none btn-secondary bg-[#6366F1]/10 text-[#6366F1] border-[#6366F1]/20 hover:bg-[#6366F1]/20 text-sm py-2 px-4 whitespace-nowrap flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Loader2 className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : 'hidden'}`} />
            Refresh Data
          </button>
        </div>
      </header>

      {/* Real-time Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="glass-panel p-6 rounded-2xl flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-[#6366F1]/20 text-[#6366F1]">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total Threads</p>
          <h2 className="text-3xl font-bold text-white">{stats.totalThreads}</h2>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-[#3B82F6]/20 text-[#3B82F6]">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Active Users</p>
          <h2 className="text-3xl font-bold text-white">{stats.totalUsers}</h2>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-[#2FD9F4]/20 text-[#2FD9F4]">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Engagements</p>
          <h2 className="text-3xl font-bold text-white">{stats.engagements}</h2>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col border-[#ffb4ab]/20 bg-[#ffb4ab]/5">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-[#93000a]/30 text-[#ffb4ab]">
              <AlertTriangle className="w-5 h-5" />
            </div>
            {reports.length > 0 && (
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ffb4ab] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#ffb4ab]"></span>
              </span>
            )}
          </div>
          <p className="text-[#ffb4ab]/80 text-xs font-bold uppercase tracking-widest mb-1">Pending Reports</p>
          <h2 className="text-3xl font-bold text-white">{reports.length > 0 ? reports.length : '0'}</h2>
        </div>
      </div>


    </div>
  );
}
