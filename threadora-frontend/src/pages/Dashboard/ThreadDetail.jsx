import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useConfirm } from '../../context/ConfirmContext';
import { useMediaUpload } from '../../hooks/useMediaUpload';
import { getThreadById, deleteThread, toggleSaveThread } from '../../api/threadApi';
import { createComment, getComments } from '../../api/commentApi';
import { upvoteThread, downvoteThread } from '../../api/voteApi';
import {
  ArrowLeft, MessageSquare,
  Loader2, Link as LinkIcon, Send, Bookmark, BookmarkCheck,
} from 'lucide-react';
import { ImagePlus, Edit3, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

import TrustBadge from '../../components/common/TrustBadge';
import EditThreadModal from '../../components/common/EditThreadModal';
import RichTextRenderer from '../../components/common/RichTextRenderer';
import MediaViewerModal from '../../components/common/MediaViewerModal';
import { ThreadDetailSkeleton } from '../../components/common/Skeletons';
import CommentNode from '../../components/threads/CommentNode';
import MediaGrid from '../../components/threads/MediaGrid';
import ReportModal from '../../components/threads/ReportModal';
import { formatTimeAgo, formatFullDate } from '../../utils/dateUtils';
import VoteControls from '../../components/common/VoteControls';
import MediaPreviewStrip from '../../components/common/MediaPreviewStrip';

// ─── Count all comments (recursive) ──────────────────────────────────────────
function countTotalComments(comments) {
  return comments.reduce((acc, c) => acc + 1 + (c.replies ? countTotalComments(c.replies) : 0), 0);
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ThreadDetail() {
  const { threadId } = useParams();
  const navigate     = useNavigate();
  const location     = useLocation();
  const { user, updateUser } = useAuth();
  const confirm = useConfirm();

  const [thread, setThread]     = useState(null);
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Main reply composer state
  const [replyContent, setReplyContent]   = useState('');
  const [isReplying, setIsReplying]       = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting]       = useState(false);

  // Report modal state
  const [reportTarget, setReportTarget]   = useState(null); // { type: 'thread'|'comment', id }

  // Media viewer state
  const [mediaViewer, setMediaViewer] = useState({ isOpen: false, mediaArray: [], initialIndex: 0 });

  // Media upload for main reply form
  const {
    mediaFiles, mediaPreviews, fileInputRef,
    handleFileChange, removeMedia, clearMedia, uploadMedia,
  } = useMediaUpload();

  const isThreadAuthor = user && thread?.authorId?._id === user._id;
  const isThreadAdmin  = user && (user.role === 'admin' || user.role === 'superadmin');
  const isSaved        = user?.savedThreads?.includes(threadId);

  // ── Data fetching ────────────────────────────────────────────────────────
  const fetchThreadData = useCallback(() => {
    Promise.all([
      getThreadById(threadId),
      getComments(threadId).catch(() => []),
    ])
      .then(([threadData, commentsData]) => {
        setThread(threadData);
        setComments(commentsData);
      })
      .catch(() => {
        toast.error('Thread not found');
        navigate('/dashboard');
      })
      .finally(() => setIsLoading(false));
  }, [threadId, navigate]);

  useEffect(() => { fetchThreadData(); }, [fetchThreadData]);

  // Scroll to highlighted comment from URL hash
  useEffect(() => {
    if (!isLoading && comments.length > 0 && location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => element.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
      }
    }
  }, [isLoading, comments, location.hash]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    setIsReplying(true);
    try {
      let uploadedMedia = [];
      if (mediaFiles.length > 0) {
        try { uploadedMedia = await uploadMedia(); }
        catch { toast.error('Media upload failed'); setIsReplying(false); return; }
      }
      const res = await createComment({ threadId, content: replyContent, media: uploadedMedia });
      if (res.isUnderReview) {
        toast('Reply posted! Pending moderation review.', { icon: '🛡️' });
      } else {
        toast.success('Reply posted');
      }
      setReplyContent('');
      clearMedia();
      fetchThreadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post reply');
    } finally {
      setIsReplying(false);
    }
  };

  const handleThreadUpvote = async () => {
    if (!user) { toast.error('Sign in to vote on threads'); return; }
    try {
      const data = await upvoteThread(threadId);
      setThread(prev => ({ ...prev, upvotes: data.upvotes, downvotes: data.downvotes }));
    } catch { toast.error('Failed to upvote'); }
  };

  const handleThreadDownvote = async () => {
    if (!user) { toast.error('Sign in to vote on threads'); return; }
    try {
      const data = await downvoteThread(threadId);
      setThread(prev => ({ ...prev, upvotes: data.upvotes, downvotes: data.downvotes }));
    } catch { toast.error('Failed to downvote'); }
  };

  const handleSave = async () => {
    if (!user) { toast.error('You must be logged in to save threads'); return; }
    const newSaved = isSaved
      ? user.savedThreads.filter(id => id !== threadId)
      : [...(user.savedThreads || []), threadId];
    updateUser({ savedThreads: newSaved });
    try {
      const res = await toggleSaveThread(threadId);
      updateUser({ savedThreads: res.savedThreads });
    } catch { toast.error('Failed to change save status'); }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
  };

  const handleThreadDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Thread',
      message: 'Are you sure you want to delete this thread? Everything inside will be lost.',
      confirmText: 'Delete',
      type: 'danger',
    });
    if (!confirmed) return;
    setIsDeleting(true);
    try {
      await deleteThread(threadId);
      toast.success('Thread deleted');
      navigate('/dashboard');
    } catch {
      toast.error('Failed to delete thread');
      setIsDeleting(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  if (isLoading) return <ThreadDetailSkeleton />;
  if (!thread) return null;

  const totalCommentCount  = countTotalComments(comments);
  const highlightedId      = location.hash.replace('#', '');
  const netVotes           = (thread.upvotes || 0) - (thread.downvotes || 0);

  return (
    <div className="max-w-4xl mx-auto pb-20 relative">

      {/* Top action bar */}
      <div className="flex items-center gap-4 mb-6 sticky top-0 md:static z-20 py-2 md:py-0 bg-[#0B0F14]/80 backdrop-blur-md md:bg-transparent border-b border-white/5 md:border-none">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.05] text-[#908FA0] hover:text-white transition-all shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-medium text-[#c7c4d7] uppercase tracking-widest hidden sm:block">
          Thread Details
        </span>
      </div>

      {/* Main thread article */}
      <article className="glass-panel p-6 md:p-8 rounded-3xl mb-8">

        {/* Author row */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-[#6366F1]/20 flex items-center justify-center border border-[#6366F1]/30">
            <span className="text-[#6366F1] font-bold uppercase">{thread.authorId?.username?.[0] || 'U'}</span>
          </div>
          <div>
            <div className="font-semibold text-white text-sm flex items-center gap-2">
              <span className="truncate">@{thread.authorId?.username || 'User'}</span>
              <span className="text-gray-600 text-xs flex-shrink-0">•</span>
              <span className="text-[#908FA0] text-xs font-normal flex-shrink-0" title={formatFullDate(thread.createdAt)}>
                {formatTimeAgo(thread.createdAt)}
              </span>
              <TrustBadge credibilityScore={thread.authorId?.credibilityScore} isSuspended={thread.authorId?.isSuspended} />
            </div>
            <div className="text-xs text-[#908FA0] flex items-center gap-2 mt-0.5">
              <span className="text-[#6366F1] font-medium">c/{thread.categoryId?.name || 'general'}</span>
            </div>
          </div>

          {/* Author / Admin controls */}
          {(isThreadAuthor || isThreadAdmin) && (
            <div className="ml-auto flex gap-1">
              {isThreadAuthor && (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="p-2 text-[#908FA0] hover:text-[#6366F1] hover:bg-[#6366F1]/10 rounded-lg transition-colors"
                  title="Edit Thread"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={handleThreadDelete}
                className="p-2 text-[#908FA0] hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                title="Delete Thread"
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
              </button>
            </div>
          )}

          {/* Report button for regular users */}
          {user && user._id !== thread.authorId?._id && user.role === 'user' && (
            <div className={`${(isThreadAuthor || isThreadAdmin) ? '' : 'ml-auto'}`}>
              <button
                onClick={() => setReportTarget({ type: 'thread', id: thread._id })}
                className="p-2 text-[#908FA0] hover:text-[#ffb4ab] hover:bg-[#ffb4ab]/10 rounded-lg transition-colors border border-white/5"
                title="Report Thread"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                  <path d="M12 9v4"/><path d="M12 17h.01"/>
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-6 leading-tight">{thread.title}</h1>

        {/* Body */}
        <div className="prose prose-invert max-w-none text-[#E0E2EA] leading-relaxed space-y-4 whitespace-pre-wrap">
          <RichTextRenderer content={thread.content} truncate={false} />
        </div>

        {/* Thread media */}
        {thread.media && thread.media.length > 0 && (
          <MediaGrid
            mediaArray={thread.media}
            onOpen={(arr, idx) => setMediaViewer({ isOpen: true, mediaArray: arr, initialIndex: idx })}
            className="mt-6"
            thumbHeight={400}
          />
        )}

        {/* Action footer */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-3 sm:gap-4 mt-8 pt-6 border-t border-white/[0.08]">
          {/* Votes */}
          <VoteControls
            score={netVotes}
            onUpvote={handleThreadUpvote}
            onDownvote={handleThreadDownvote}
            variant="detail"
            disabled={!user}
          />

          {/* Comment count */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.08] text-[#908FA0] font-medium text-sm flex-shrink-0">
            <MessageSquare className="w-4 h-4" />
            <span><span className="hidden sm:inline">{totalCommentCount} Comments</span><span className="sm:hidden">{totalCommentCount}</span></span>
          </div>

          {/* Save */}
          {user && (
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border font-medium text-sm transition-all flex-shrink-0 ${
                isSaved
                  ? 'bg-[#6366F1]/10 border-[#6366F1]/20 text-[#6366F1]'
                  : 'bg-white/[0.02] border-white/[0.08] text-[#908FA0] hover:bg-white/[0.05] hover:text-white'
              }`}
            >
              {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              {isSaved ? 'Saved' : 'Save'}
            </button>
          )}

          {/* Share */}
          <button
            onClick={copyLink}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.08] text-[#908FA0] hover:text-white hover:bg-white/[0.05] font-medium text-sm transition-all md:ml-auto flex-shrink-0"
          >
            <LinkIcon className="w-4 h-4" /> Share
          </button>
        </div>
      </article>

      {/* Reply composer / guest CTA */}
      <div className="mb-8">
        {user ? (
          <>
            <h3 className="text-[10px] font-bold text-[#908FA0] uppercase tracking-widest mb-3 pl-2">Post a Reply</h3>
            <form
              onSubmit={handleReply}
              className="glass-panel rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-[#6366F1]/40 transition-all"
            >
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Add a comment to the discussion…"
                className="w-full bg-transparent border-none focus:outline-none text-white text-sm placeholder-[#908FA0] p-4 resize-none min-h-[80px]"
                disabled={isReplying}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleReply(e);
                }}
              />

              {/* Main reply media previews */}
              <MediaPreviewStrip previews={mediaPreviews} onRemove={removeMedia} size="md" className="mx-4 mb-3" />

              <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                    className="hidden"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 text-[#908FA0] hover:text-white transition-colors"
                    title="Attach media"
                  >
                    <ImagePlus className="w-5 h-5" />
                  </button>
                  <span className="text-[10px] text-[#908FA0]">Ctrl+Enter to submit</span>
                </div>
                <button
                  type="submit"
                  disabled={isReplying || !replyContent.trim()}
                  className="btn-primary py-2 px-6 rounded-xl text-sm whitespace-nowrap flex items-center gap-2 disabled:opacity-40"
                >
                  {isReplying && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Send className="w-4 h-4" /> Comment
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="glass-panel rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 border border-[#6366F1]/20">
            <div className="w-12 h-12 rounded-xl bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-6 h-6 text-[#6366F1]/70" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="font-semibold text-white text-sm mb-1">Join the discussion</p>
              <p className="text-xs text-[#908FA0]">Sign in or create an account to post comments and interact with threads.</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link to="/login" className="px-4 py-2 text-sm font-semibold text-white/80 border border-white/10 rounded-xl hover:bg-white/5 transition-all">Sign In</Link>
              <Link to="/register" className="px-4 py-2 text-sm font-semibold text-white bg-[#6366F1] hover:bg-[#5558E6] rounded-xl transition-all shadow-lg shadow-[#6366F1]/20">Sign Up</Link>
            </div>
          </div>
        )}
      </div>

      {/* Comments section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[10px] font-bold text-[#908FA0] uppercase tracking-widest pl-2">
            Discussion ({totalCommentCount})
          </h3>
        </div>

        {comments.length > 0 ? (
          <div className="space-y-1">
            {comments.map(comment => (
              <CommentNode
                key={comment._id}
                comment={comment}
                depth={0}
                threadId={threadId}
                user={user}
                onCommentAdded={fetchThreadData}
                onReport={(commentId) => setReportTarget({ type: 'comment', id: commentId })}
                onOpenMediaViewer={(arr, idx) => setMediaViewer({ isOpen: true, mediaArray: arr, initialIndex: idx })}
                highlightedId={highlightedId}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-14 glass-panel rounded-2xl">
            <MessageSquare className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-white mb-1">No comments yet</h4>
            <p className="text-sm text-[#908FA0]">Start the conversation!</p>
          </div>
        )}
      </div>

      {/* Report modal */}
      <ReportModal
        isOpen={!!reportTarget}
        onClose={() => setReportTarget(null)}
        target={reportTarget}
        threadId={threadId}
      />

      {/* Edit thread modal */}
      <EditThreadModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        thread={thread}
        onSuccess={(updated) => setThread(updated)}
      />

      {/* Fullscreen media viewer */}
      <MediaViewerModal
        isOpen={mediaViewer.isOpen}
        onClose={() => setMediaViewer({ isOpen: false, mediaArray: [], initialIndex: 0 })}
        mediaArray={mediaViewer.mediaArray}
        initialIndex={mediaViewer.initialIndex}
      />
    </div>
  );
}
