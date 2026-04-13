import { Play } from 'lucide-react';

/**
 * MediaGrid
 * Renders a horizontally-scrollable row of image/video thumbnails.
 * Used in thread articles and inside comment nodes.
 *
 * @param {Array}    mediaArray  - Array of { url, type } objects
 * @param {Function} onOpen      - Called with (mediaArray, clickedIndex) to open the fullscreen viewer
 * @param {string}   className   - Optional extra classNames for the wrapper
 * @param {number}   thumbHeight - Max height of each thumbnail in px (default 150)
 */
export default function MediaGrid({ mediaArray, onOpen, className = '', thumbHeight = 150 }) {
  if (!mediaArray || mediaArray.length === 0) return null;

  return (
    <div className={`flex gap-2 overflow-x-auto snap-x hide-scrollbar max-w-full ${className}`}>
      {mediaArray.map((item, idx) => (
        <div
          key={idx}
          className="min-w-[140px] max-w-[200px] rounded-xl overflow-hidden border border-white/10 flex-shrink-0 snap-center bg-black/50 cursor-pointer group relative"
          style={{ maxHeight: thumbHeight }}
          onClick={() => onOpen && onOpen(mediaArray, idx)}
        >
          {item.type === 'video' ? (
            <>
              <video
                src={item.url}
                className="w-full h-full object-cover"
                style={{ maxHeight: thumbHeight }}
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-xl">
                  <Play className="w-4 h-4 text-white ml-0.5 fill-white" />
                </div>
              </div>
            </>
          ) : (
            <>
              <img
                src={item.url}
                alt="Media attachment"
                className="w-full h-full object-cover transition-transform duration-300 md:group-hover:scale-105"
                style={{ maxHeight: thumbHeight }}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 md:group-hover:bg-black/10 transition-colors duration-300" />
            </>
          )}
        </div>
      ))}
    </div>
  );
}
