import { AlertCircle, Loader2 } from 'lucide-react';

/**
 * DuplicateWarning
 * Displays a "Similar Discussions Found" warning panel with suggested threads.
 * Replaces duplicated warning rendering in ThreadComposer and SlimComposer.
 *
 * @param {Array}    duplicates    - Array of suggested duplicate threads
 * @param {Function} onPostAnyway  - Called when user chooses to post anyway
 * @param {Function} onCancel      - Called when user cancels
 * @param {boolean}  isPosting     - Whether a post is in progress
 * @param {'sm'|'md'} size         - Text size preset (default 'md')
 */
export default function DuplicateWarning({ duplicates, onPostAnyway, onCancel, isPosting, size = 'md' }) {
  if (!duplicates || duplicates.length === 0) return null;

  const isSmall = size === 'sm';

  return (
    <div className="mt-4 pt-4 border-t border-yellow-500/20">
      <div className="p-4 border border-yellow-500/30 bg-yellow-500/10 rounded-2xl">
        <h3 className={`text-yellow-400 font-semibold mb-2 flex items-center gap-2 ${isSmall ? 'text-sm' : ''}`}>
          <AlertCircle className={isSmall ? 'w-4 h-4' : 'w-5 h-5'} />
          Similar Discussions Found
        </h3>
        <p className={`text-yellow-200/70 mb-3 ${isSmall ? 'text-[11px]' : 'text-sm'}`}>
          Before posting, check if your thought has already been discussed:
        </p>
        <div className={`space-y-2 mb-4 overflow-y-auto pr-1 custom-scrollbar ${isSmall ? 'max-h-[30vh]' : 'max-h-[40vh]'}`}>
          {duplicates.map(dup => (
            <a
              key={dup._id}
              href={`/t/${dup._id}`}
              target="_blank"
              rel="noreferrer"
              className="block p-3 bg-black/20 rounded-xl hover:bg-black/40 transition-colors border border-white/5 card-hover"
            >
              <div className={`font-medium text-white ${isSmall ? 'text-xs' : 'text-sm'}`}>{dup.title}</div>
              <div className={`text-[#908FA0] mt-1 line-clamp-1 ${isSmall ? 'text-[10px]' : 'text-xs'}`}>{dup.content}</div>
            </a>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onPostAnyway}
            disabled={isPosting}
            className={`px-4 py-2 bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 rounded-xl font-medium transition-colors flex items-center gap-2 ${isSmall ? 'text-[11px] font-bold' : 'text-sm'}`}
          >
            {isPosting && <Loader2 className="w-4 h-4 animate-spin" />}
            My thought is unique. Post anyway.
          </button>
          <button
            onClick={onCancel}
            className={`px-4 py-2 text-gray-400 hover:text-white font-medium transition-colors ${isSmall ? 'text-[11px] font-bold' : 'text-sm'}`}
          >
            Cancel post
          </button>
        </div>
      </div>
    </div>
  );
}
