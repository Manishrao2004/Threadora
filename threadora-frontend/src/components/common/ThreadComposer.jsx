import { useState, useEffect } from 'react';
import { getCategories } from '../../api/categoryApi';
import { createThread } from '../../api/threadApi';
import { Loader2, Hash, X, ImagePlus } from 'lucide-react';
import { getErrorMessage } from '../../utils/errorUtils';
import toast from 'react-hot-toast';
import { useMediaUpload } from '../../hooks/useMediaUpload';
import { useAuth } from '../../hooks/useAuth';
import MediaPreviewStrip from './MediaPreviewStrip';
import DuplicateWarning from './DuplicateWarning';

export default function ThreadComposer({ onSuccess, onCancel, isModal = false, preselectedCategory = '' }) {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCat, setSelectedCat] = useState(preselectedCategory);
  const [isPosting, setIsPosting] = useState(false);
  const [suggestedDuplicates, setSuggestedDuplicates] = useState([]);

  const {
    mediaFiles, mediaPreviews, fileInputRef,
    handleFileChange, removeMedia, clearMedia, uploadMedia,
  } = useMediaUpload();

  useEffect(() => {
    getCategories()
      .then(data => {
        setCategories(data);
        if (data.length > 0 && !selectedCat) setSelectedCat(data[0]._id);
      })
      .catch(() => {});
  }, []);
 
  useEffect(() => {
    if (preselectedCategory) {
      setSelectedCat(preselectedCategory);
    }
  }, [preselectedCategory]);

  const handlePost = async (forceIgnoreDuplicates = false) => {
    if (!title.trim() || !content.trim()) return toast.error('Title and content required');
    if (!selectedCat) return toast.error('Please select a category');

    setIsPosting(true);
    if (!forceIgnoreDuplicates) setSuggestedDuplicates([]);

    try {
      let uploadedMediaArray = [];
      if (mediaFiles.length > 0) {
        try {
          uploadedMediaArray = await uploadMedia();
        } catch (err) {
          setIsPosting(false);
          return toast.error(err.message || 'Media upload failed');
        }
      }

      const data = {
        title,
        content,
        categoryId: selectedCat,
        ignoreDuplicates: forceIgnoreDuplicates ? true : undefined,
        media: uploadedMediaArray
      };

      const response = await createThread(data);
      if (response.isUnderReview) {
        toast('Thread posted! It is currently pending moderation review.', { icon: '🛡️' });
      } else {
        toast.success('Thread posted!');
      }
      setTitle('');
      setContent('');
      setSuggestedDuplicates([]);
      clearMedia();
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
    <div className={`glass-panel p-5 transition-all focus-within:shadow-[0_0_20px_rgba(99,102,241,0.15)] focus-within:border-[#6366F1]/30 ${isModal ? 'w-full mx-auto rounded-3xl' : 'mb-10 rounded-3xl'}`}>
      {isModal && (
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-[rgba(255,255,255,0.05)]">
          <h2 className="text-xl font-bold bg-gradient-to-r from-[#6366F1] to-[#3B82F6] bg-clip-text text-transparent">New Thread</h2>
          {onCancel && (
            <button onClick={onCancel} className="p-1 text-[#908FA0] hover:text-white transition-colors rounded-lg hover:bg-white/5">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      )}
      <div className="flex gap-4 mb-3">
        {!isModal && (
          <div className="w-10 h-10 rounded-xl bg-[#6366F1]/20 hidden sm:flex items-center justify-center flex-shrink-0 border border-[#6366F1]/30 text-[#6366F1] font-bold">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover rounded-xl" />
            ) : (
              user?.username?.[0]?.toUpperCase() || 'U'
            )}
          </div>
        )}
        <div className="flex-1 space-y-3">
          <input 
            type="text"
            placeholder="Title of your thread"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent text-lg font-bold text-white placeholder-[#908FA0] focus:outline-none"
            autoFocus={isModal}
          />
          <textarea 
            className="w-full bg-transparent border-none text-white placeholder-[#908FA0] resize-none focus:ring-0 outline-none min-h-[60px]"
            placeholder="What are your thoughts?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={isModal ? 5 : 2}
          />
          
          <MediaPreviewStrip previews={mediaPreviews} onRemove={removeMedia} size="lg" className="mt-2" />
        </div>
      </div>
      
      <div className={`flex justify-between items-center pt-3 border-t border-[rgba(255,255,255,0.05)] ${!isModal ? 'sm:pl-14' : ''}`}>
        {!preselectedCategory && (
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-[#908FA0]" />
            <select 
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="bg-[#111827] text-sm text-[#E0E2EA] border border-[rgba(255,255,255,0.1)] rounded-lg py-1 px-2 focus:outline-none focus:border-[#6366F1]"
            >
              {!categories.length && <option value="">Loading...</option>}
              {categories.map((c, index) => (
                <option value={c._id} key={`${c._id}-${index}`}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" 
            className="hidden" 
            multiple
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 text-[#908FA0] hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2"
            title="Attach Image or Video"
          >
            <ImagePlus className="w-5 h-5" />
          </button>

          {isModal && onCancel && (
            <button 
              onClick={onCancel}
              className="px-4 py-1.5 text-sm font-medium text-[#908FA0] hover:text-white transition-colors"
            >
              Cancel
            </button>
          )}
          <button 
            onClick={() => handlePost(false)} 
            disabled={isPosting}
            className="btn-primary py-1.5 px-6 text-sm flex items-center gap-2"
          >
            {isPosting && <Loader2 className="w-4 h-4 animate-spin" />}
            Publish
          </button>
        </div>
      </div>

      <DuplicateWarning
        duplicates={suggestedDuplicates}
        onPostAnyway={() => handlePost(true)}
        onCancel={() => { setSuggestedDuplicates([]); if (onCancel) onCancel(); }}
        isPosting={isPosting}
      />
    </div>
  );
}
