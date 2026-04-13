import { X as XIcon } from 'lucide-react';

/**
 * MediaPreviewStrip
 * Reusable horizontal scrollable strip of media previews with remove buttons.
 * Replaces duplicated preview rendering across all composers and forms.
 *
 * @param {Array}    previews   - Array of { url, type } preview objects
 * @param {Function} onRemove   - Called with (index) to remove a preview
 * @param {'sm'|'md'|'lg'} size - Thumbnail size preset (default 'md')
 * @param {string}   className  - Optional extra class names for the wrapper
 */

const SIZE_MAP = {
  sm: { width: 'w-20', height: 'h-20', iconSize: 'w-3 h-3' },
  md: { width: 'w-[120px]', height: 'h-[120px]', iconSize: 'w-3 h-3' },
  lg: { width: 'w-[150px]', height: 'h-[150px]', iconSize: 'w-4 h-4' },
};

export default function MediaPreviewStrip({ previews, onRemove, size = 'md', className = '' }) {
  if (!previews || previews.length === 0) return null;

  const dims = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <div className={`flex gap-2 overflow-x-auto pb-1 snap-x hide-scrollbar ${className}`}>
      {previews.map((preview, index) => (
        <div
          key={index}
          className={`relative ${dims.width} ${dims.height} rounded-lg overflow-hidden border border-white/10 flex-shrink-0 snap-center bg-black/50 group`}
        >
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(index); }}
            className="absolute top-1 right-1 p-1 bg-black/60 backdrop-blur-md text-white rounded-full hover:bg-black/90 z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-colors"
          >
            <XIcon className={dims.iconSize} />
          </button>
          {preview.type === 'video' ? (
            <video src={preview.url} className="w-full h-full object-cover" />
          ) : (
            <img src={preview.url} alt="Preview" className="w-full h-full object-cover" />
          )}
        </div>
      ))}
    </div>
  );
}
