import { useState, useEffect } from 'react';
import { X, Loader2, Save, ImagePlus } from 'lucide-react';
import { updateThread } from '../../api/threadApi';
import { getErrorMessage } from '../../utils/errorUtils';
import { useMediaUpload } from '../../hooks/useMediaUpload';
import MediaPreviewStrip from './MediaPreviewStrip';
import toast from 'react-hot-toast';

export default function EditThreadModal({ isOpen, onClose, thread, onSuccess }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingMedia, setExistingMedia] = useState([]);

  const {
    mediaFiles, mediaPreviews, fileInputRef,
    handleFileChange, removeMedia, clearMedia, uploadMedia,
  } = useMediaUpload();

  useEffect(() => {
    if (thread) {
      setTitle(thread.title || '');
      setContent(thread.content || '');
      setExistingMedia(thread.media || []);
      clearMedia();
    }
  }, [thread]);

  if (!isOpen) return null;

  const removeExistingMedia = (index) => {
    setExistingMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return toast.error('Title is required');
    if (!content.trim()) return toast.error('Content is required');

    setIsSubmitting(true);
    try {
      let uploadedMediaArray = [];

      if (mediaFiles.length > 0) {
        try {
          uploadedMediaArray = await uploadMedia();
        } catch (err) {
          setIsSubmitting(false);
          return toast.error(err.message || 'Media upload failed');
        }
      }

      const finalMedia = [...existingMedia, ...uploadedMediaArray];

      const payload = {
        title,
        content,
        media: finalMedia
      };

      const updatedThread = await updateThread(thread._id, payload);
      toast.success('Thread updated successfully!');
      if (onSuccess) onSuccess(updatedThread);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update thread'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalMediaCount = existingMedia.length + mediaFiles.length;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl glass-panel rounded-3xl overflow-hidden shadow-2xl border border-white/10 animate-in slide-in-from-bottom-4 duration-300">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Edit Your Thread</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#6366F1] uppercase tracking-wider px-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="Give your thread a punchy title"
              required
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#6366F1] uppercase tracking-wider px-1">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="input-field min-h-[150px] resize-none"
              placeholder="Explain your thoughts in detail..."
              required
            />
          </div>

          <div className="space-y-2">
             <label className="text-xs font-bold text-[#6366F1] uppercase tracking-wider px-1 mb-1 block">Media ({totalMediaCount}/4)</label>
             <div className="flex gap-3 overflow-x-auto pb-2 min-h-[50px]">
                {/* Existing Media — uses MediaPreviewStrip */}
                <MediaPreviewStrip
                  previews={existingMedia}
                  onRemove={removeExistingMedia}
                  size="sm"
                />

                {/* New Media Previews — uses MediaPreviewStrip */}
                <MediaPreviewStrip
                  previews={mediaPreviews}
                  onRemove={removeMedia}
                  size="sm"
                />
                
                {totalMediaCount < 4 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-lg border border-dashed border-white/20 hover:border-[#6366F1]/50 hover:bg-[#6366F1]/5 flex flex-col items-center justify-center text-[#908FA0] hover:text-white transition-colors flex-shrink-0"
                  >
                    <ImagePlus className="w-6 h-6 mb-1" />
                    <span className="text-xs">Add</span>
                  </button>
                )}
             </div>
             <input 
              type="file" 
              accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" 
              className="hidden" 
              multiple
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl border border-white/10 text-gray-400 font-semibold hover:bg-white/5 transition-all text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !content.trim()}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
