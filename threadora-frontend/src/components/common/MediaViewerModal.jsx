import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function MediaViewerModal({ isOpen, onClose, mediaArray = [], initialIndex = 0 }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Sync index when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen || mediaArray.length <= 1) return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        setCurrentIndex(prev => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex(prev => (prev < mediaArray.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, mediaArray.length, onClose]);

  if (!isOpen || !mediaArray || mediaArray.length === 0) return null;

  const handleNext = (e) => {
    e.stopPropagation();
    if (currentIndex < mediaArray.length - 1) setCurrentIndex(prev => prev + 1);
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  const currentMedia = mediaArray[currentIndex];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md animate-fade-in text-white">
      <div className="absolute top-4 left-4 text-sm font-medium bg-black/50 px-3 py-1.5 rounded-full z-50">
        {currentIndex + 1} / {mediaArray.length}
      </div>
      
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-50 focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
      >
        <X className="w-6 h-6" />
      </button>
      
      {/* Navigation Chevrons */}
      {mediaArray.length > 1 && currentIndex > 0 && (
        <button 
          onClick={handlePrev}
          className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all z-50 active:scale-95"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}

      {mediaArray.length > 1 && currentIndex < mediaArray.length - 1 && (
        <button 
          onClick={handleNext}
          className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all z-50 active:scale-95"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}

      {/* Media Container */}
      <div 
        className="relative max-w-[95vw] max-h-[95vh] w-full h-full flex items-center justify-center p-4 animate-scale-in"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {currentMedia.type === 'video' ? (
          <video 
            key={currentMedia.url} // Force re-render when changing videos
            src={currentMedia.url} 
            className="w-full h-full max-w-6xl object-contain rounded-xl shadow-2xl" 
            controls
            autoPlay
            playsInline
          />
        ) : (
          <img 
            key={currentMedia.url}
            src={currentMedia.url} 
            alt={`Media ${currentIndex + 1}`} 
            className="w-full h-full max-w-6xl object-contain rounded-xl shadow-2xl select-none"
          />
        )}
      </div>
      
      {/* Thumbnail Bar */}
      {mediaArray.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[90vw] p-2 bg-black/50 rounded-2xl backdrop-blur-md">
          {mediaArray.map((media, idx) => (
            <div 
              key={idx}
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
              className={`w-14 h-14 flex-shrink-0 cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 ${idx === currentIndex ? 'border-[#6366F1] scale-110 opacity-100' : 'border-transparent opacity-50 hover:opacity-100'}`}
            >
              {media.type === 'video' ? (
                <video src={media.url} className="w-full h-full object-cover" />
              ) : (
                <img src={media.url} className="w-full h-full object-cover" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
