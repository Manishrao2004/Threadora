import { upvoteThread, downvoteThread } from '../api/voteApi';
import toast from 'react-hot-toast';
import { useAuth } from './useAuth';

/**
 * Shared vote handler used across feed pages (UserHome, MyThreads, Saved).
 *
 * Implements optimistic UI: the vote count and active state are updated
 * immediately in the local state, then reconciled with the server response.
 * On error the optimistic update is reverted.
 *
 * @param {Function} setThreads - State setter for the threads array
 * @returns {{ handleVote: (e: Event, threadId: string, type: 'up'|'down') => Promise<void> }}
 */
export function useVoteHandler(setThreads) {
  const { user } = useAuth();

  const handleVote = async (e, threadId, type) => {
    e.preventDefault();
    if (!user) {
      toast.error('Sign in to vote on threads');
      return;
    }

    // ── Optimistic update ────────────────────────────────────────────────
    let snapshot; // keep a snapshot to revert on error
    setThreads(prev => {
      snapshot = prev;
      return prev.map(t => {
        if (t._id !== threadId) return t;

        const currentVote = t.userVote || null;
        const voteType = type === 'up' ? 'upvote' : 'downvote';
        let upvotes   = t.upvotes   || 0;
        let downvotes = t.downvotes || 0;
        let newUserVote;

        if (currentVote === voteType) {
          // Undo
          if (voteType === 'upvote') upvotes = Math.max(0, upvotes - 1);
          else                       downvotes = Math.max(0, downvotes - 1);
          newUserVote = null;
        } else if (currentVote) {
          // Flip
          if (voteType === 'upvote') {
            upvotes += 1;
            downvotes = Math.max(0, downvotes - 1);
          } else {
            downvotes += 1;
            upvotes = Math.max(0, upvotes - 1);
          }
          newUserVote = voteType;
        } else {
          // New vote
          if (voteType === 'upvote') upvotes += 1;
          else                       downvotes += 1;
          newUserVote = voteType;
        }

        return { ...t, upvotes, downvotes, userVote: newUserVote };
      });
    });

    // ── API call ─────────────────────────────────────────────────────────
    try {
      let data;
      if (type === 'up')   data = await upvoteThread(threadId);
      if (type === 'down') data = await downvoteThread(threadId);
      if (!data) return;

      // Reconcile with server truth
      setThreads(prev =>
        prev.map(t =>
          t._id === threadId
            ? { ...t, upvotes: data.upvotes, downvotes: data.downvotes, userVote: data.userVote }
            : t
        )
      );
    } catch (err) {
      // Revert optimistic update
      if (snapshot) setThreads(snapshot);
      toast.error(err.response?.data?.message || 'Failed to vote');
    }
  };

  return { handleVote };
}
