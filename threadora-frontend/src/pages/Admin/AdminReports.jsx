import { useEffect, useState } from 'react';
import { getReports, resolveReport } from '../../api/reportApi';
import { deleteThread } from '../../api/threadApi';
import { deleteComment } from '../../api/commentApi';
import { ShieldCheck, AlertTriangle, Trash2, Loader2, ExternalLink, CheckCircle } from 'lucide-react';
import { PageLoader } from '../../components/common/Skeletons';
import { useConfirm } from '../../context/ConfirmContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    try {
      const data = await getReports();
      setReports(data);
    } catch (err) {
      toast.error('Failed to fetch reports queue');
    } finally {
      setIsLoading(false);
      if (isManualRefresh) setIsRefreshing(false);
    }
  };

  const handleDismissReport = async (reportId) => {
    try {
      await resolveReport(reportId);
      toast.success('Report resolved and dismissed');
      setReports(prev => prev.filter(r => r._id !== reportId));
    } catch (err) {
      toast.error('Failed to dismiss report');
    }
  };

  const confirm = useConfirm();

  const handleDeleteContent = async (report) => {
    const contentType = report.commentId ? 'comment' : 'thread';
    const confirmed = await confirm({
      title: `Delete ${contentType.charAt(0).toUpperCase() + contentType.slice(1)}`,
      message: `Are you sure you want to permanently delete this ${contentType}? This action cannot be undone.`,
      confirmText: 'Delete Permanently',
      type: 'danger'
    });
    
    if(!confirmed) return;
    
    try {
      if (report.commentId) {
        await deleteComment(report.commentId._id);
        toast.success('Comment deleted from database.');
        setReports(prev => prev.filter(r => r.commentId?._id !== report.commentId._id));
      } else if (report.threadId) {
        await deleteThread(report.threadId._id);
        toast.success('Thread deleted from database.');
        setReports(prev => prev.filter(r => r.threadId?._id !== report.threadId._id));
      }
    } catch (error) {
      toast.error('Failed to delete content');
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[#ffb4ab]/20 text-[#ffb4ab]">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Reports Queue</h1>
            <p className="text-[#908FA0] text-sm">Review content flagged by the community for violating guidelines.</p>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={() => fetchReports(true)}
            disabled={isRefreshing}
            className="flex-1 md:flex-none btn-secondary bg-[#6366F1]/10 text-[#6366F1] border-[#6366F1]/20 hover:bg-[#6366F1]/20 text-sm py-2 px-4 whitespace-nowrap flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Loader2 className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : 'hidden'}`} />
            Refresh Data
          </button>
        </div>
      </header>

      <div className="glass-panel p-6 md:p-8 rounded-3xl">
        <div className="flex items-center gap-2 mb-6 text-white font-semibold">
          <ShieldCheck className="w-5 h-5 text-[#ffb4ab]" /> Pending Action required
        </div>

        <div className="space-y-4">
          {reports.length > 0 ? (
             reports.map((report) => (
                <div key={report._id} className="flex flex-col md:flex-row gap-4 p-5 rounded-2xl bg-white/[0.02] border border-[rgba(255,255,255,0.05)] hover:bg-white/[0.04] transition-all">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="bg-[#ffb4ab]/20 text-[#ffb4ab] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md">
                          {report.reason}
                        </span>
                        <span className="bg-gray-500/20 text-gray-300 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md border border-gray-500/30">
                          {report.commentId ? 'Comment' : 'Thread'}
                        </span>
                      </div>
                      <span 
                        className="text-[#908FA0] text-xs font-medium truncate min-w-[100px] max-w-[200px] sm:max-w-xs" 
                        title={`Reported by @${report.reportedBy?.username}`}
                      >
                        Reported by @{report.reportedBy?.username}
                      </span>
                    </div>
                    
                    <div className="text-white font-medium text-lg leading-tight mb-1">
                      {report.commentId ? (
                        report.commentId.content || <span className="text-gray-500 italic">Comment Deleted</span>
                      ) : (
                        report.threadId?.title || <span className="text-gray-500 italic">Thread Deleted</span>
                      )}
                    </div>

                    {report.message && (
                      <div className="mt-3 p-3 rounded-xl bg-orange-500/5 border border-orange-500/10 text-orange-200/80 text-sm italic">
                        &ldquo;{report.message}&rdquo;
                      </div>
                    )}

                    <div className="text-xs text-[#6366F1] font-medium flex items-center gap-1 mt-3">
                      <ExternalLink className="w-3 h-3" />
                      {(() => {
                        const threadId = report.threadId?._id || report.threadId;
                        const commentId = report.commentId?._id;
                        const parentThreadId = report.commentId?.threadId?._id || report.commentId?.threadId;
                        const targetThreadId = threadId || parentThreadId;
                        if (!targetThreadId) return <span className="text-gray-500">Source Unavailable</span>;
                        const url = commentId ? `/t/${targetThreadId}#${commentId}` : `/t/${targetThreadId}`;
                        return (
                          <Link to={url} className="hover:underline">
                            View Source {report.commentId ? 'Comment' : 'Thread'}
                          </Link>
                        );
                      })()}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 md:border-l md:border-[rgba(255,255,255,0.08)] md:pl-5">
                    <button 
                      onClick={() => handleDismissReport(report._id)}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-medium text-sm rounded-xl transition-colors flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4 text-green-400" /> Dismiss
                    </button>
                    {(report.threadId || report.commentId) && (
                      <button 
                        onClick={() => handleDeleteContent(report)}
                        className="px-4 py-2 bg-[#ffb4ab]/10 hover:bg-[#ffb4ab]/20 text-[#ffb4ab] font-medium text-sm rounded-xl transition-colors border border-[#ffb4ab]/20 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" /> {report.commentId ? 'Delete Comment' : 'Delete Thread'}
                      </button>
                    )}
                  </div>
                </div>
             ))
          ) : (
            <div className="text-center py-12 text-[#908FA0] border border-dashed border-[rgba(255,255,255,0.08)] rounded-2xl">
              <ShieldCheck className="w-12 h-12 mx-auto text-green-500/50 mb-3" />
              <p className="font-semibold text-white">All caught up!</p>
              <p className="text-sm mt-1">There are no pending reports in the queue.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
