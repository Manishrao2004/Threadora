import { ArrowUp, ArrowDown } from 'lucide-react';

/**
 * VoteControls
 * Shared voting UI used across ThreadCard, ThreadDetail, and CommentNode.
 *
 * @param {number}   score      - Net vote score to display
 * @param {Function} onUpvote   - Called when upvote is clicked
 * @param {Function} onDownvote - Called when downvote is clicked
 * @param {'card'|'detail'|'comment'} variant - Visual variant
 * @param {boolean}  disabled   - Whether voting is disabled
 */
export default function VoteControls({ score, onUpvote, onDownvote, variant = 'card', disabled = false }) {
  if (variant === 'card') {
    return (
      <div className="flex flex-col items-center gap-1 text-[#908FA0]">
        <button
          onClick={onUpvote}
          disabled={disabled}
          className="p-1 text-[#908FA0] hover:text-[#6366F1] hover:bg-[#6366F1]/10 rounded-md transition-colors disabled:opacity-50"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
        <span className={`text-xs font-bold ${score > 0 ? 'text-[#6366F1]' : score < 0 ? 'text-red-400' : 'text-[#E0E2EA]'}`}>
          {score}
        </span>
        <button
          onClick={onDownvote}
          disabled={disabled}
          className="p-1 text-[#908FA0] hover:text-[#ffb4ab] hover:bg-[#ffb4ab]/10 rounded-md transition-colors disabled:opacity-50"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      </div>
    );
  }

  if (variant === 'detail') {
    return (
      <div className="flex items-center rounded-lg bg-[#6366F1]/5 border border-[#6366F1]/20 overflow-hidden flex-shrink-0">
        <button
          onClick={onUpvote}
          disabled={disabled}
          className="flex items-center gap-2 px-3 py-2 text-[#6366F1] hover:bg-[#6366F1]/20 font-medium text-sm transition-all border-r border-[#6366F1]/20 disabled:opacity-50"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
        <span className="px-3 font-bold text-white text-sm">{score}</span>
        <button
          onClick={onDownvote}
          disabled={disabled}
          className="flex items-center gap-2 px-3 py-2 text-[#ffb4ab] hover:bg-[#ffb4ab]/20 font-medium text-sm transition-all border-l border-[#6366F1]/20 disabled:opacity-50"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // variant === 'comment'
  return (
    <div className="flex items-center rounded-md bg-white/[0.03] border border-white/[0.06] overflow-hidden">
      <button
        onClick={onUpvote}
        disabled={disabled}
        className="p-1.5 hover:bg-[#6366F1]/15 hover:text-[#6366F1] transition-colors disabled:opacity-50"
      >
        <ArrowUp className="w-3.5 h-3.5" />
      </button>
      <span className={`text-xs font-semibold px-1.5 min-w-[20px] text-center ${score > 0 ? 'text-[#6366F1]' : score < 0 ? 'text-[#ffb4ab]' : ''}`}>
        {score}
      </span>
      <button
        onClick={onDownvote}
        disabled={disabled}
        className="p-1.5 hover:bg-[#ffb4ab]/15 hover:text-[#ffb4ab] transition-colors disabled:opacity-50"
      >
        <ArrowDown className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
