import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useConfirm } from '../../context/ConfirmContext';
import { createComment, updateComment, deleteComment } from '../../api/commentApi';
import { upvoteComment, downvoteComment } from '../../api/voteApi';
import { useMediaUpload } from '../../hooks/useMediaUpload';
import {
  Reply, ChevronDown, ChevronRight,
  MoreVertical, Edit3, Trash2, Save, Loader2, AlertTriangle,
  ImagePlus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import TrustBadge from '../common/TrustBadge';
import RichTextRenderer from '../common/RichTextRenderer';
import MediaGrid from './MediaGrid';
import VoteControls from '../common/VoteControls';
import MediaPreviewStrip from '../common/MediaPreviewStrip';
import { formatTimeAgo, formatFullDate } from '../../utils/dateUtils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function countAllReplies(comment) {
  if (!comment.replies || comment.replies.length === 0) return 0;
  return comment.replies.reduce((acc, r) => acc + 1 + countAllReplies(r), 0);
}

const THREAD_COLORS = [
  '#6366F1', '#3B82F6', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444',
];

// ─── CommentNode ─────────────────────────────────────────────────────────────

/**
 * Recursive comment node with voting, collapse, edit, delete, reply, and report.
 */
export default function CommentNode({
  comment,
  depth,
  threadId,
  user,
  onCommentAdded,
  onReport,
  onOpenMediaViewer,
  highlightedId,
}) {
  const [isReplyOpen, setIsReplyOpen]   = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCollapsed, setIsCollapsed]   = useState(false);
  const [localScore, setLocalScore]     = useState(comment.score || 0);
  const [isVoting, setIsVoting]         = useState(false);
  const [isEditing, setIsEditing]       = useState(false);
  const [editContent, setEditContent]   = useState(comment.content);
  const [showOptions, setShowOptions]   = useState(false);

  const { mediaFiles, mediaPreviews, fileInputRef, handleFileChange, removeMedia, clearMedia, uploadMedia } = useMediaUpload();
  const confirm = useConfirm();

  const isAuthor   = user && comment.authorId?._id === user._id;
  const isAdmin    = user && (user.role === 'admin' || user.role === 'superadmin');
  const isDeleted  = comment.isDeleted;
  const hasReplies = comment.replies && comment.replies.length > 0;
  const maxDepth   = 6;
  const threadColor    = THREAD_COLORS[depth % THREAD_COLORS.length];
  const isHighlighted  = highlightedId && comment._id === highlightedId;

  // ── Voting ────────────────────────────────────────────────────────────────
  const vote = async (direction) => {
    if (!user) { toast.error('Sign in to vote on comments'); return; }
    if (isVoting) return;
    setIsVoting(true);
    try {
      const data = direction === 'up'
        ? await upvoteComment(comment._id)
        : await downvoteComment(comment._id);
      setLocalScore(data.score);
    } catch {
      toast.error('Failed to vote');
    } finally {
      setIsVoting(false);
    }
  };

  // ── Edit ─────────────────────────────────────────────────────────────────
  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editContent.trim()) return;
    setIsSubmitting(true);
    try {
      await updateComment(comment._id, { content: editContent });
      toast.success('Comment updated');
      setIsEditing(false);
      onCommentAdded();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Comment',
      message: 'Are you sure you want to delete this comment?',
      confirmText: 'Delete',
      type: 'danger',
    });
    if (!confirmed) return;
    try {
      await deleteComment(comment._id);
      toast.success('Comment deleted');
      onCommentAdded();
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  // ── Reply submit ──────────────────────────────────────────────────────────
  const handleSubmitReply = async (e) => {
    e?.preventDefault();
    if (!replyContent.trim()) return;
    setIsSubmitting(true);
    try {
      let uploadedMedia = [];
      if (mediaFiles.length > 0) {
        try { uploadedMedia = await uploadMedia(); }
        catch { toast.error('Media upload failed'); setIsSubmitting(false); return; }
      }
      const result = await createComment({
        threadId,
        content: replyContent,
        parentId: comment._id,
        media: uploadedMedia,
      });
      if (result.isUnderReview) {
        toast('Reply posted! Pending moderation review.', { icon: '🛡️' });
      } else {
        toast.success('Reply posted');
      }
      setReplyContent('');
      clearMedia();
      setIsReplyOpen(false);
      onCommentAdded();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id={comment._id}
      className={`transition-all duration-300 ${isHighlighted ? 'ring-2 ring-[#6366F1]/60 ring-offset-1 ring-offset-[#0B0F14] rounded-xl' : ''}`}
    >
      <div className="flex group">
        {/* Avatar + thread line column */}
        <div className="flex flex-col items-center mr-3 flex-shrink-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs uppercase flex-shrink-0 cursor-pointer select-none"
            style={{
              backgroundColor: `${threadColor}15`,
              color: threadColor,
              border: `1px solid ${threadColor}30`,
            }}
            onClick={() => hasReplies && setIsCollapsed(!isCollapsed)}
            title={hasReplies ? (isCollapsed ? 'Expand replies' : 'Collapse replies') : ''}
          >
            {comment.authorId?.username?.[0] || 'U'}
          </div>
          {hasReplies && !isCollapsed && (
            <div
              className="w-[2px] flex-1 mt-1 rounded-full transition-colors duration-200 opacity-40 group-hover:opacity-100 cursor-pointer"
              style={{ backgroundColor: threadColor }}
              onClick={() => setIsCollapsed(true)}
            />
          )}
        </div>

        {/* Comment body */}
        <div className={`flex-1 min-w-0 pb-4 ${isDeleted ? 'opacity-60' : ''}`}>

          {/* Header row */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="font-semibold text-white text-sm">
              @{comment.authorId?.username || 'User'}
            </span>
            <TrustBadge
              credibilityScore={comment.authorId?.credibilityScore}
              isSuspended={comment.authorId?.isSuspended}
            />
            {(comment.authorId?.role === 'admin' || comment.authorId?.role === 'superadmin') && (
              <span className="text-[9px] font-bold uppercase tracking-wider bg-[#6366F1]/20 text-[#6366F1] px-1.5 py-0.5 rounded-md border border-[#6366F1]/30">
                Mod
              </span>
            )}
            <span className="text-[11px] text-[#908FA0]" title={formatFullDate(comment.createdAt)}>
              {formatTimeAgo(comment.createdAt)}
            </span>
            {comment.isEdited && !isDeleted && (
              <span className="text-[10px] text-[#908FA0]/60 italic">(edited)</span>
            )}

            {/* Collapsed pill */}
            {isCollapsed && hasReplies && (
              <button
                onClick={() => setIsCollapsed(false)}
                className="text-[11px] text-[#6366F1] hover:text-[#818CF8] font-medium ml-1 flex items-center gap-1 transition-colors"
              >
                <ChevronRight className="w-3 h-3" />
                {countAllReplies(comment)} {countAllReplies(comment) === 1 ? 'reply' : 'replies'}
              </button>
            )}

            {/* Options menu */}
            {(isAuthor || isAdmin) && !isDeleted && (
              <div className="relative ml-auto">
                <button
                  onClick={() => setShowOptions(!showOptions)}
                  className="p-1 text-[#908FA0] hover:text-white rounded-lg transition-colors"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
                {showOptions && (
                  <div className="absolute right-0 top-6 w-32 glass-panel border border-white/10 rounded-xl shadow-2xl z-50 py-1">
                    {isAuthor && (
                      <button
                        onClick={() => { setIsEditing(true); setShowOptions(false); }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#908FA0] hover:text-[#6366F1] hover:bg-[#6366F1]/10 transition-all"
                      >
                        <Edit3 className="w-3 h-3" /> Edit
                      </button>
                    )}
                    <button
                      onClick={() => { handleDelete(); setShowOptions(false); }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-500/70 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Expanded body */}
          {!isCollapsed && (
            <>
              {/* Edit form */}
              {isEditing ? (
                <div className="mb-3">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full bg-[#111827] border border-[#6366F1]/50 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#6366F1] min-h-[80px]"
                    autoFocus
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleEdit}
                      disabled={isSubmitting || !editContent.trim()}
                      className="text-xs font-semibold text-white bg-[#6366F1] px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                    >
                      {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      Save
                    </button>
                    <button
                      onClick={() => { setIsEditing(false); setEditContent(comment.content); }}
                      className="text-xs font-semibold text-gray-400 border border-white/10 px-3 py-1.5 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`text-[#E0E2EA] text-sm leading-relaxed mb-2.5 ${isDeleted ? 'italic text-gray-500' : ''}`}>
                  {isDeleted
                    ? '[comment deleted by user]'
                    : <RichTextRenderer content={comment.content} truncate={false} />}
                </div>
              )}

              {/* Attached media */}
              {comment.media && comment.media.length > 0 && !isDeleted && (
                <MediaGrid
                  mediaArray={comment.media}
                  onOpen={onOpenMediaViewer}
                  className="mb-3"
                  thumbHeight={150}
                />
              )}

              {/* Action row */}
              <div className="flex items-center gap-1 text-[#908FA0] flex-wrap">
                {/* Votes */}
                <VoteControls
                  score={localScore}
                  onUpvote={() => vote('up')}
                  onDownvote={() => vote('down')}
                  variant="comment"
                  disabled={isVoting || isDeleted}
                />

                {/* Reply */}
                {!isDeleted && user ? (
                  <button
                    onClick={() => setIsReplyOpen(!isReplyOpen)}
                    className="flex items-center gap-1.5 text-xs font-medium hover:text-[#6366F1] transition-colors px-2 py-1.5 rounded-md hover:bg-[#6366F1]/10 ml-1"
                  >
                    <Reply className="w-3.5 h-3.5" /> Reply
                  </button>
                ) : !isDeleted && (
                  <Link
                    to="/login"
                    className="flex items-center gap-1.5 text-xs font-medium text-[#908FA0] hover:text-[#6366F1] transition-colors px-2 py-1.5 rounded-md hover:bg-[#6366F1]/10 ml-1"
                  >
                    <Reply className="w-3.5 h-3.5" /> Reply
                  </Link>
                )}

                {/* Collapse */}
                {hasReplies && !isCollapsed && (
                  <button
                    onClick={() => setIsCollapsed(true)}
                    className="flex items-center gap-1 text-xs font-medium hover:text-white transition-colors ml-auto px-2 py-1.5 rounded-md hover:bg-white/5"
                  >
                    <ChevronDown className="w-3.5 h-3.5" /> Collapse
                  </button>
                )}

                {/* Report (regular users only, not their own comment) */}
                {user && user._id !== comment.authorId?._id && user.role === 'user' && !isDeleted && (
                  <button
                    onClick={() => onReport(comment._id)}
                    className="p-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[#908FA0] hover:text-[#ffb4ab] hover:bg-[#ffb4ab]/10 transition-all ml-auto"
                    title="Report Comment"
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Reply form */}
              {isReplyOpen && (
                <form onSubmit={handleSubmitReply} className="mt-3 animate-slideDown">
                  <div className="flex-1 bg-[#111827] border border-white/10 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#6366F1]/30 transition-all">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={`Reply to @${comment.authorId?.username || 'User'}…`}
                      className="w-full bg-transparent text-white text-sm p-3 placeholder-[#908FA0] focus:outline-none resize-none min-h-[60px]"
                      rows={2}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmitReply(e);
                        if (e.key === 'Escape') setIsReplyOpen(false);
                      }}
                    />

                    <MediaPreviewStrip previews={mediaPreviews} onRemove={removeMedia} size="sm" className="mx-3 mb-2" />

                    <div className="flex items-center justify-between px-3 py-2 border-t border-white/5">
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
                          className="p-1 text-[#908FA0] hover:text-white transition-colors"
                        >
                          <ImagePlus className="w-4 h-4" />
                        </button>
                        <span className="text-[10px] text-[#908FA0]">Ctrl+Enter to submit</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => { setIsReplyOpen(false); setReplyContent(''); clearMedia(); }}
                          className="text-xs text-[#908FA0] hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting || !replyContent.trim()}
                          className="text-xs font-semibold text-white bg-[#6366F1] hover:bg-[#5558E6] disabled:opacity-40 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
                        >
                          {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              )}

              {/* Nested replies */}
              {hasReplies && (
                <div className="mt-3">
                  {comment.replies.map(reply => (
                    <CommentNode
                      key={reply._id}
                      comment={reply}
                      depth={Math.min(depth + 1, maxDepth)}
                      threadId={threadId}
                      user={user}
                      onCommentAdded={onCommentAdded}
                      onReport={onReport}
                      onOpenMediaViewer={onOpenMediaViewer}
                      highlightedId={highlightedId}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
