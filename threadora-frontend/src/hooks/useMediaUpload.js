import { useState, useRef, useCallback } from 'react';
import { uploadToCloudinary } from '../utils/cloudinary';
import toast from 'react-hot-toast';

/**
 * Manages media file selection, validation, local preview generation,
 * and Cloudinary upload for thread and comment composers.
 *
 * Validation is intentionally duplicated here (client-side) and in Cloudinary
 * (server enforces limits). The client check gives instant feedback before any
 * network request is made.
 *
 * @param {object} options
 * @param {number} options.maxFiles    - Maximum total attachments (default 4)
 * @param {number} options.maxVideos   - Maximum video attachments (default 2)
 * @param {number} options.maxImageMB  - Maximum image file size in MB (default 2)
 * @param {number} options.maxVideoMB  - Maximum video file size in MB (default 50)
 */
export function useMediaUpload({
  maxFiles   = 4,
  maxVideos  = 2,
  maxImageMB = 2,
  maxVideoMB = 50,
} = {}) {
  const [mediaFiles,    setMediaFiles]    = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    let validFiles = [...mediaFiles];
    let previews   = [...mediaPreviews];

    for (const file of files) {
      if (validFiles.length >= maxFiles) {
        toast.error(`Max ${maxFiles} files allowed`);
        break;
      }

      const isVideo = file.type.startsWith('video');

      if (isVideo && validFiles.filter(f => f.type.startsWith('video')).length >= maxVideos) {
        toast.error(`Max ${maxVideos} videos allowed`);
        continue;
      }

      if (!isVideo && file.size > maxImageMB * 1024 * 1024) {
        toast.error(`Image too large (max ${maxImageMB}MB)`);
        continue;
      }

      if (isVideo && file.size > maxVideoMB * 1024 * 1024) {
        toast.error(`Video too large (max ${maxVideoMB}MB)`);
        continue;
      }

      validFiles.push(file);
      previews.push({
        url:  URL.createObjectURL(file),
        type: isVideo ? 'video' : 'image',
        name: file.name,
      });
    }

    setMediaFiles(validFiles);
    setMediaPreviews(previews);
    // Reset the input so the same file can be re-selected after removal
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeMedia = (index) => {
    setMediaFiles(prev    => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const clearMedia = () => {
    setMediaFiles([]);
    setMediaPreviews([]);
  };

  /**
   * Uploads all pending files to Cloudinary concurrently.
   * Shows a loading toast for the duration. Throws on any upload failure
   * so callers can surface the error and bail out of the form submission.
   *
   * @returns {Array<{ url: string, type: 'image'|'video' }>}
   */
  const uploadMedia = async () => {
    if (mediaFiles.length === 0) return [];

    toast.loading(`Uploading ${mediaFiles.length} item(s)…`, { id: 'mediaUpload' });
    try {
      const results = await Promise.all(mediaFiles.map(f => uploadToCloudinary(f)));
      toast.dismiss('mediaUpload');
      return results.map(res => ({ url: res.secure_url, type: res.type }));
    } catch (err) {
      toast.dismiss('mediaUpload');
      throw err;
    }
  };

  return {
    mediaFiles,
    mediaPreviews,
    fileInputRef,
    handleFileChange,
    removeMedia,
    clearMedia,
    uploadMedia,
  };
}
