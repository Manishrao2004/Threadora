import { useState, useRef, useEffect } from 'react';
import { createThread } from '../../api/threadApi';
import { useAuth } from '../../hooks/useAuth';
import { useMediaUpload } from '../../hooks/useMediaUpload';
import { getErrorMessage } from '../../utils/errorUtils';
import { ImagePlus, X, Loader2, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import MediaPreviewStrip from './MediaPreviewStrip';
import DuplicateWarning from './DuplicateWarning';

export default function SlimComposer({ categoryId, categoryName, onSuccess }) {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [suggestedDuplicates, setSuggestedDuplicates] = useState([]);
  const composerRef = useRef(null);

  const {
    mediaFiles,
    mediaPreviews,
    fileInputRef,
    handleFileChange,
    removeMedia,
    clearMedia,
    uploadMedia,
  } = useMediaUpload();

  // Close when clicking outside (only if no content) or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        composerRef.current &&
        !composerRef.current.contains(event.target) &&
        !title &&
        !content &&
        !mediaFiles.length
      ) {
        setIsExpanded(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [title, content, mediaFiles, isExpanded]);

  const handlePost = async (forceIgnoreDuplicates = false) => {
    if (!title.trim() || !content.trim()) return toast.error('Title and content required');
    setIsPosting(true);
    if (!forceIgnoreDuplicates) setSuggestedDuplicates([]);

    try {
      let uploadedMedia = [];
      if (mediaFiles.length > 0) {
        try {
          uploadedMedia = await uploadMedia();
        } catch {
          toast.error('Media upload failed');
          setIsPosting(false);
          return;
        }
      }

      const response = await createThread({
        title,
        content,
        categoryId,
        ignoreDuplicates: forceIgnoreDuplicates ? true : undefined,
        media: uploadedMedia,
      });

      if (response.isUnderReview) {
        toast('Thread posted! It is currently pending moderation review.', { icon: '🛡️' });
      } else {
        toast.success('Posted!');
      }
      setTitle('');
      setContent('');
      clearMedia();
      setSuggestedDuplicates([]);
      setIsExpanded(false);
      if (onSuccess) onSuccess(response);
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.suggestedThreads) {
        setSuggestedDuplicates(err.response.data.suggestedThreads);
        toast.error('Similar discussions found.');
      } else {
        toast.error(getErrorMessage(err, 'Failed to post thread'));
      }
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div
      ref={composerRef}
      className={`glass-panel transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] border-white/5 hover:border-white/10 ${isExpanded ? 'p-6 rounded-3xl shadow-2xl shadow-indigo-500/10' : 'p-3 rounded-2xl cursor-text'}`}
      onClick={() => !isExpanded && setIsExpanded(true)}
    >
      {!isExpanded ? (
        <div className="flex items-center gap-4 animate-in fade-in duration-300">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#3B82F6] flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} className="w-full h-full object-cover rounded-xl" alt="" />
            ) : (
              user?.username?.[0] || 'U'
            )}
          </div>
          <div className="flex-1 text-[#908FA0] text-sm font-medium">
            Start a discussion in #{categoryName || 'community'}...
          </div>
          <button
            className="p-2 text-[#908FA0] hover:text-white transition-colors hover:bg-white/5 rounded-lg"
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); setIsExpanded(true); }}
          >
            <ImagePlus className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div className="space-y-4 animate-in slide-in-from-top-2 fade-in duration-500">
          <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6366F1]">New Thread in #{categoryName}</span>
            <button onClick={() => setIsExpanded(false)} className="text-[#908FA0] hover:text-white p-1 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-700">
            <input
              autoFocus
              type="text"
              placeholder="Title of your thread"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent text-lg font-bold text-white placeholder-[#908FA0] focus:outline-none"
            />
            <textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-transparent text-white placeholder-[#908FA0] resize-none focus:outline-none min-h-[120px] text-sm"
            />
          </div>

          <MediaPreviewStrip previews={mediaPreviews} onRemove={removeMedia} size="sm" />

          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 text-sm text-[#908FA0] hover:text-white transition-colors"
            >
              <ImagePlus className="w-4 h-4" />
              <span>Add Media</span>
            </button>

            <button
              onClick={() => handlePost(false)}
              disabled={isPosting}
              className="px-6 py-2 bg-[#6366F1] hover:bg-[#5558E6] text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Publish
            </button>
          </div>

          <DuplicateWarning
            duplicates={suggestedDuplicates}
            onPostAnyway={() => handlePost(true)}
            onCancel={() => setSuggestedDuplicates([])}
            isPosting={isPosting}
            size="sm"
          />
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        className="hidden"
        accept="image/*,video/*"
      />
    </div>
  );
}
