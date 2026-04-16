import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, TrendingUp, MoreVertical, Edit3, Trash2, Bookmark, BookmarkCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useConfirm } from '../../context/ConfirmContext';
import TrustBadge from '../common/TrustBadge';
import { deleteThread, toggleSaveThread } from '../../api/threadApi';
import toast from 'react-hot-toast';
import RichTextRenderer from '../common/RichTextRenderer';
import MediaGrid from './MediaGrid';
import MediaViewerModal from '../common/MediaViewerModal';
import { formatTimeAgo, formatFullDate } from '../../utils/dateUtils';
import VoteControls from '../common/VoteControls';

export default function ThreadCard({ thread, onVote, onDelete, onEdit }) {
  const { user, updateUser } = useAuth();
  const [showOptions, setShowOptions] = useState(false);
  const [mediaViewer, setMediaViewer] = useState({ isOpen: false, mediaArray: [], initialIndex: 0 });
  const optionsRef = useRef(null);
  const isAuthor = user && thread.authorId?._id === user._id;
  const isAdmin = user && (user.role === 'admin' || user.role === 'superadmin');
  const isSaved = user?.savedThreads?.includes(thread._id);

  // Close options dropdown when clicking outside
  useEffect(() => {
    if (!showOptions) return;
    const handleClickOutside = (e) => {
      if (optionsRef.current && !optionsRef.current.contains(e.target)) {
        setShowOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showOptions]);

  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error('You must be logged in to save threads');
      return;
    }
    
    // Optimistic UI update
    const newSavedThreads = isSaved 
      ? user.savedThreads.filter(id => id !== thread._id)
      : [...(user.savedThreads || []), thread._id];
      
    updateUser({ savedThreads: newSavedThreads });
    
    try {
      const res = await toggleSaveThread(thread._id);
      updateUser({ savedThreads: res.savedThreads });
    } catch (err) {
      toast.error('Failed to change save status');
    }
  };


  const confirm = useConfirm();

  const handleDelete = async (e) => {
    e.preventDefault();
    const confirmed = await confirm({
      title: 'Delete Thread',
      message: 'Are you sure you want to delete this thread? This action is permanent and will delete all comments.',
      confirmText: 'Delete',
      type: 'danger'
    });
    
    if (!confirmed) return;
    
    try {
      await toast.promise(deleteThread(thread._id), {
        loading: 'Deleting thread...',
        success: 'Thread deleted!',
        error: (err) => err.response?.data?.message || 'Failed to delete'
      });
      if (onDelete) onDelete(thread._id);
    } catch (_) {
      // toast.promise already shows the error
    }
  };

  const handleEdit = (e) => {
    e.preventDefault();
    if (onEdit) onEdit(thread);
    setShowOptions(false);
  };

  const score = (thread.upvotes || 0) - (thread.downvotes || 0);

  return (
    <div className="relative group">
      <Link 
        to={`/t/${thread._id}`} 
        className="block glass-panel p-5 rounded-3xl card-hover cursor-pointer outline-none focus:ring-2 focus:ring-[#6366F1]/50 mb-4"
      >
        <div className="flex gap-4">
          {/* Voting Column */}
          <VoteControls
            score={score}
            onUpvote={(e) => { e.preventDefault(); onVote(e, thread._id, 'up'); }}
            onDownvote={(e) => { e.preventDefault(); onVote(e, thread._id, 'down'); }}
            variant="card"
            userVote={thread.userVote || null}
          />

          {/* Content Column */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 pr-8 relative">
              <span className="font-semibold text-[10px] text-[#6366F1] truncate uppercase tracking-wider flex-shrink-0 max-w-[100px]">
                {thread.categoryId?.name || 'general'}
              </span>
              <span className="text-gray-600 text-[10px] flex-shrink-0">•</span>
              <span className="text-[#908FA0] text-[10px] truncate min-w-0">@{thread.authorId?.username || 'user'}</span>
              <span className="text-gray-600 text-[10px] flex-shrink-0">•</span>
              <span className="text-[#908FA0] text-[10px] flex-shrink-0" title={formatFullDate(thread.createdAt)}>
                {formatTimeAgo(thread.createdAt)}
              </span>
              <div className="flex-shrink-0 ml-1">
                <TrustBadge 
                  credibilityScore={thread.authorId?.credibilityScore} 
                  isSuspended={thread.authorId?.isSuspended} 
                />
              </div>
              {score >= 10 && (
                <span title="Trending Discussion" className="inline-flex items-center gap-1 text-[10px] font-bold text-[#6366F1] bg-[#6366F1]/10 px-1.5 py-0.5 rounded border border-[#6366F1]/20 uppercase tracking-wide flex-shrink-0">
                  <TrendingUp className="w-3 h-3" /> <span className="hidden sm:inline">Trending</span>
                </span>
              )}
              
              {/* Options Trigger (Only for Auth/Admin) */}
              {(isAuthor || isAdmin) && (
                <div className="absolute right-0 top-0" ref={optionsRef}>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      setShowOptions(!showOptions);
                    }}
                    className="p-1 text-[#908FA0] hover:text-white hover:bg-white/5 rounded-lg transition-all"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  
                  {showOptions && (
                    <div className="absolute right-0 top-8 w-36 glass-panel border border-white/10 rounded-xl shadow-2xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in duration-200">
                      {isAuthor && (
                        <button 
                          onClick={handleEdit}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#908FA0] hover:text-[#6366F1] hover:bg-[#6366F1]/10 transition-all"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit Post
                        </button>
                      )}
                      <button 
                        onClick={handleDelete}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-400/10 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Post
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <h3 className="text-lg font-bold text-white mb-2 leading-tight pr-4">{thread.title}</h3>
            
            <div className="text-gray-400 text-sm line-clamp-3 leading-relaxed mb-4">
              <RichTextRenderer content={thread.content} truncate={true} />
            </div>

            {/* Thread media — rendered via shared MediaGrid */}
            {thread.media && thread.media.length > 0 && (
              <div
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              >
                <MediaGrid
                  mediaArray={thread.media}
                  onOpen={(arr, idx) => setMediaViewer({ isOpen: true, mediaArray: arr, initialIndex: idx })}
                  className="mb-4"
                  thumbHeight={300}
                />
              </div>
            )}

            <div className="flex items-center gap-6 text-[#908FA0]">
              <div className="flex items-center gap-2 text-xs font-medium bg-white/5 px-3 py-1.5 rounded-full hover:bg-white/10 transition-all hover:text-white">
                <MessageSquare className="w-3.5 h-3.5" />
                {thread.commentCount || 0}
              </div>
              {user && (
                <button 
                  onClick={handleSave}
                  className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full transition-all ${isSaved ? 'text-[#6366F1] bg-[#6366F1]/10' : 'bg-white/5 hover:bg-white/10 hover:text-white'}`}
                >
                  {isSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                  {isSaved ? 'Saved' : 'Save'}
                </button>
              )}
            </div>
          </div>
        </div>
      </Link>
      
      {/* Fullscreen Media Viewer */}
      <MediaViewerModal 
        isOpen={mediaViewer.isOpen}
        onClose={() => setMediaViewer({ isOpen: false, mediaArray: [], initialIndex: 0 })}
        mediaArray={mediaViewer.mediaArray}
        initialIndex={mediaViewer.initialIndex}
      />
    </div>
  );
}
