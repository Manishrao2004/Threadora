import { useEffect, useState, useRef } from 'react';
import { getModerationQueue, approveModerationItem, getConfig, updateConfig } from '../../api/adminApi';
import { deleteThread } from '../../api/threadApi';
import { deleteComment } from '../../api/commentApi';
import { useConfirm } from '../../context/ConfirmContext';
import { useAuth } from '../../hooks/useAuth';
import {
  Shield,
  CheckCircle,
  Trash2,
  Loader2,
  MessageSquare,
  Hash,
  AlertCircle,
  Tag,
  Plus,
  X,
  Save,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function AdminModeration() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';

  // ── Tab state ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('queue');

  // ── Moderation Queue ────────────────────────────────────────────────────────
  const [queue, setQueue] = useState([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(true);
  const [isRefreshingQueue, setIsRefreshingQueue] = useState(false);

  // ── Blocked Keywords ────────────────────────────────────────────────────────
  const [keywords, setKeywords] = useState([]);
  const [isLoadingKeywords, setIsLoadingKeywords] = useState(true);
  const [isSavingKeywords, setIsSavingKeywords] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [keywordsDirty, setKeywordsDirty] = useState(false);
  const inputRef = useRef(null);

  const confirm = useConfirm();

  useEffect(() => {
    fetchQueue();
    if (isSuperAdmin) fetchKeywords();
  }, [isSuperAdmin]);

  // ── Queue logic ─────────────────────────────────────────────────────────────
  const fetchQueue = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshingQueue(true);
    else setIsLoadingQueue(true);
    try {
      const data = await getModerationQueue();
      setQueue(data);
    } catch {
      toast.error('Failed to fetch moderation queue');
    } finally {
      if (isManualRefresh) setIsRefreshingQueue(false);
      else setIsLoadingQueue(false);
    }
  };

  const handleApprove = async (item) => {
    try {
      await approveModerationItem(item._id, item.itemType);
      toast.success(`${item.itemType === 'thread' ? 'Thread' : 'Comment'} approved and restored.`);
      setQueue(prev => prev.filter(q => q._id !== item._id));
    } catch {
      toast.error('Failed to approve item');
    }
  };

  const handleDelete = async (item) => {
    const label = item.itemType === 'thread' ? 'Thread' : 'Comment';
    const confirmed = await confirm({
      title: `Delete ${label}`,
      message: `Permanently delete this ${label.toLowerCase()}? This cannot be undone.`,
      confirmText: 'Delete Permanently',
      type: 'danger',
    });
    if (!confirmed) return;
    try {
      if (item.itemType === 'thread') {
        await deleteThread(item._id);
      } else {
        await deleteComment(item._id);
      }
      toast.success(`${label} permanently deleted.`);
      setQueue(prev => prev.filter(q => q._id !== item._id));
    } catch {
      toast.error(`Failed to delete ${label.toLowerCase()}`);
    }
  };

  // ── Keywords logic ──────────────────────────────────────────────────────────
  const fetchKeywords = async () => {
    setIsLoadingKeywords(true);
    try {
      const data = await getConfig();
      setKeywords(data.blockedKeywords || []);
    } catch {
      toast.error('Failed to load blocked keywords');
    } finally {
      setIsLoadingKeywords(false);
    }
  };

  const handleAddKeyword = () => {
    const trimmed = newKeyword.trim().toLowerCase();
    if (!trimmed) return;
    if (keywords.includes(trimmed)) {
      toast.error(`"${trimmed}" is already in the list`);
      return;
    }
    setKeywords(prev => [...prev, trimmed]);
    setNewKeyword('');
    setKeywordsDirty(true);
    inputRef.current?.focus();
  };

  const handleKeywordInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const handleRemoveKeyword = (word) => {
    setKeywords(prev => prev.filter(k => k !== word));
    setKeywordsDirty(true);
  };

  const handleSaveKeywords = async () => {
    setIsSavingKeywords(true);
    try {
      await updateConfig({ blockedKeywords: keywords });
      toast.success('Blocked keywords saved successfully.');
      setKeywordsDirty(false);
    } catch {
      toast.error('Failed to save blocked keywords');
    } finally {
      setIsSavingKeywords(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[#6366F1]/20 text-[#6366F1]">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Moderation Centre</h1>
            <p className="text-[#908FA0] text-sm">
              Manage auto-flagged content{isSuperAdmin ? ' and configure blocked keywords' : ''}.
            </p>
          </div>
        </div>
        {activeTab === 'queue' && (
          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={() => fetchQueue(true)}
              disabled={isRefreshingQueue}
              className="flex-1 md:flex-none btn-secondary bg-[#6366F1]/10 text-[#6366F1] border-[#6366F1]/20 hover:bg-[#6366F1]/20 text-sm py-2 px-4 whitespace-nowrap flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Loader2 className={`w-3.5 h-3.5 ${isRefreshingQueue ? 'animate-spin' : 'hidden'}`} />
              Refresh Queue
            </button>
          </div>
        )}
      </header>

      {/* ── Tab Bar ──────────────────────────────────────────────────────── */}
      {isSuperAdmin && (
        <div className="flex gap-1 p-1 bg-white/[0.04] rounded-2xl border border-[rgba(255,255,255,0.06)] w-fit">
          <button
            onClick={() => setActiveTab('queue')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'queue'
                ? 'bg-[#6366F1] text-white shadow-lg shadow-[#6366F1]/30'
                : 'text-[#908FA0] hover:text-white'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            Flagged Queue
            {!isLoadingQueue && queue.length > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === 'queue' ? 'bg-white/20 text-white' : 'bg-orange-500/20 text-orange-400'}`}>
                {queue.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('keywords')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'keywords'
                ? 'bg-[#6366F1] text-white shadow-lg shadow-[#6366F1]/30'
                : 'text-[#908FA0] hover:text-white'
            }`}
          >
            <Tag className="w-4 h-4" />
            Blocked Keywords
            {keywordsDirty && (
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>
        </div>
      )}

      {/* ── Tab: Moderation Queue ─────────────────────────────────────────── */}
      {activeTab === 'queue' && (
        <section className="glass-panel p-6 md:p-8 rounded-3xl">
          <div className="flex items-center gap-2 mb-6 text-white font-semibold text-lg">
            <AlertCircle className="w-5 h-5 text-orange-400" />
            Auto-flagged Content
            {!isLoadingQueue && (
              <span className="ml-1 text-sm font-normal text-[#908FA0]">
                ({queue.length} item{queue.length !== 1 ? 's' : ''})
              </span>
            )}
          </div>

          {isLoadingQueue ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-[#6366F1]" />
            </div>
          ) : queue.length > 0 ? (
            <div className="space-y-4">
              {queue.map((item) => (
                <div
                  key={item._id}
                  className="flex flex-col md:flex-row gap-4 p-5 rounded-2xl bg-white/[0.02] border border-[rgba(255,255,255,0.05)] hover:bg-white/[0.04] transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="bg-orange-500/20 text-orange-300 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md border border-orange-500/20">
                        {item.itemType === 'thread' ? 'Thread' : 'Comment'}
                      </span>
                      <span className="bg-red-500/10 text-red-400 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md border border-red-500/20">
                        Auto-flagged
                      </span>
                      <span className="text-[#908FA0] text-xs font-medium">
                        by @{item.authorId?.username || 'unknown'}
                      </span>
                    </div>

                    <p className="text-white font-medium text-base leading-snug mb-2 line-clamp-2">
                      {item.itemType === 'thread' ? item.title || item.content : item.content}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-[#908FA0]">
                      {item.itemType === 'thread' ? (
                        <span className="flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          Thread
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          Comment
                        </span>
                      )}
                      <span>Credibility: {item.authorId?.credibilityScore ?? '—'}</span>
                      {item.authorId?.isSuspended && (
                        <span className="text-red-400 font-semibold">Suspended</span>
                      )}
                    </div>

                    {item.itemType === 'comment' && item.threadId && (
                      <Link
                        to={`/t/${item.threadId._id || item.threadId}#${item._id}`}
                        className="inline-flex items-center gap-1 mt-2 text-xs text-[#6366F1] hover:underline"
                      >
                        View in Thread →
                      </Link>
                    )}
                    {item.itemType === 'thread' && (
                      <Link
                        to={`/t/${item._id}`}
                        className="inline-flex items-center gap-1 mt-2 text-xs text-[#6366F1] hover:underline"
                      >
                        View Thread →
                      </Link>
                    )}
                  </div>

                  <div className="flex items-center gap-3 md:border-l md:border-[rgba(255,255,255,0.08)] md:pl-5 shrink-0">
                    <button
                      onClick={() => handleApprove(item)}
                      className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-medium text-sm rounded-xl transition-colors border border-emerald-500/20 flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="px-4 py-2 bg-[#ffb4ab]/10 hover:bg-[#ffb4ab]/20 text-[#ffb4ab] font-medium text-sm rounded-xl transition-colors border border-[#ffb4ab]/20 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-[#908FA0] border border-dashed border-[rgba(255,255,255,0.08)] rounded-2xl">
              <Shield className="w-12 h-12 mx-auto text-emerald-500/50 mb-3" />
              <p className="font-semibold text-white">Queue is clear!</p>
              <p className="text-sm mt-1">No content currently flagged for moderation.</p>
            </div>
          )}
        </section>
      )}

      {/* ── Tab: Blocked Keywords (SuperAdmin only) ───────────────────────── */}
      {activeTab === 'keywords' && isSuperAdmin && (
        <section className="glass-panel p-6 md:p-8 rounded-3xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 text-white font-semibold text-lg">
              <Tag className="w-5 h-5 text-[#6366F1]" />
              Blocked Keywords
              {!isLoadingKeywords && (
                <span className="ml-1 text-sm font-normal text-[#908FA0]">
                  ({keywords.length} word{keywords.length !== 1 ? 's' : ''})
                </span>
              )}
            </div>
            {keywordsDirty && (
              <span className="text-xs text-amber-400 font-medium animate-pulse">
                • Unsaved changes
              </span>
            )}
          </div>

          <p className="text-[#908FA0] text-sm mb-6 leading-relaxed">
            Any thread or comment containing these words will be automatically hidden and added to
            the moderation queue. Keywords are matched case-insensitively.
          </p>

          {isLoadingKeywords ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#6366F1]" />
            </div>
          ) : (
            <>
              {/* Add new keyword */}
              <div className="flex gap-3 mb-6">
                <input
                  ref={inputRef}
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={handleKeywordInputKeyDown}
                  placeholder="Type a word and press Enter or Add…"
                  className="flex-1 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-2.5 text-white placeholder-[#908FA0] text-sm focus:outline-none focus:border-[#6366F1]/60 focus:bg-white/[0.06] transition-all"
                />
                <button
                  onClick={handleAddKeyword}
                  disabled={!newKeyword.trim()}
                  className="px-4 py-2.5 bg-[#6366F1]/20 hover:bg-[#6366F1]/30 text-[#6366F1] font-semibold text-sm rounded-xl transition-colors border border-[#6366F1]/30 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>

              {/* Keywords tag cloud */}
              {keywords.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-8 p-4 rounded-2xl bg-white/[0.02] border border-[rgba(255,255,255,0.05)] min-h-[60px]">
                  {keywords.map((word) => (
                    <span
                      key={word}
                      className="group inline-flex items-center gap-1.5 bg-[#6366F1]/10 border border-[#6366F1]/20 text-[#908FA0] hover:text-white hover:border-[#ffb4ab]/40 hover:bg-[#ffb4ab]/10 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-default"
                    >
                      {word}
                      <button
                        onClick={() => handleRemoveKeyword(word)}
                        className="text-[#908FA0] hover:text-[#ffb4ab] transition-colors rounded-full"
                        aria-label={`Remove "${word}"`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 mb-6 text-[#908FA0] border border-dashed border-[rgba(255,255,255,0.08)] rounded-2xl">
                  <Tag className="w-10 h-10 mx-auto text-[#6366F1]/30 mb-2" />
                  <p className="text-sm">No blocked keywords configured.</p>
                  <p className="text-xs mt-1 text-[#908FA0]/60">Add words above to start filtering content.</p>
                </div>
              )}

              {/* Save button */}
              <div className="flex justify-end border-t border-[rgba(255,255,255,0.05)] pt-6">
                <button
                  onClick={handleSaveKeywords}
                  disabled={isSavingKeywords || !keywordsDirty}
                  className="btn-primary py-2.5 px-6 flex items-center gap-2 text-sm shadow-lg shadow-[#6366F1]/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {isSavingKeywords ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSavingKeywords ? 'Saving…' : 'Save Keywords'}
                </button>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
