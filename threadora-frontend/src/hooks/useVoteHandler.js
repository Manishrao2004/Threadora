import { upvoteThread, downvoteThread } from '../api/voteApi';
import toast from 'react-hot-toast';

/**
 * Shared vote handler used across feed pages (UserHome, MyThreads, Saved).
 *
 * On a successful API response, the thread's vote counts are updated in-place
 * within the threads array so the change is reflected immediately without a
 * full refetch of the feed.
 *
 * @param {Function} setThreads - State setter for the threads array
 * @returns {{ handleVote: (e: Event, threadId: string, type: 'up'|'down') => Promise<void> }}
 */
export function useVoteHandler(setThreads) {
  const handleVote = async (e, threadId, type) => {
    e.preventDefault();
    try {
      let data;
      if (type === 'up')   data = await upvoteThread(threadId);
      if (type === 'down') data = await downvoteThread(threadId);
      if (!data) return;

      setThreads(prev =>
        prev.map(t =>
          t._id === threadId
            ? { ...t, upvotes: data.upvotes, downvotes: data.downvotes }
            : t
        )
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to vote');
    }
  };

  return { handleVote };
}
