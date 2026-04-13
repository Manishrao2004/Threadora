/**
 * Uploads a single file to Cloudinary via the unsigned upload API.
 *
 * Size limits are checked client-side before the request is sent to provide
 * instant feedback. The actual enforcement also happens server-side via the
 * Cloudinary upload preset configuration.
 *
 * @param  {File} file
 * @returns {{ secure_url: string, type: 'image'|'video' }}
 * @throws  {Error} on oversized files or Cloudinary API errors
 */
export const uploadToCloudinary = async (file) => {
  if (file.size > 2 * 1024 * 1024 && file.type.startsWith('image')) {
    throw new Error('Image too large (max 2MB)');
  }

  if (file.size > 50 * 1024 * 1024 && file.type.startsWith('video')) {
    throw new Error('Video too large (max 50MB)');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', import.meta.env.VITE_UPLOAD_PRESET);

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

  if ((!cloudName || !import.meta.env.VITE_UPLOAD_PRESET) && import.meta.env.DEV) {
    console.warn('Cloudinary environment variables (CLOUD_NAME or UPLOAD_PRESET) are missing.');
  }
  const resourceType  = file.type.startsWith('video') ? 'video' : 'image';

  const res  = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    { method: 'POST', body: formData }
  );

  const data = await res.json();
  if (data.error) throw new Error(data.error.message);

  return { secure_url: data.secure_url, type: resourceType };
};

/**
 * Injects Cloudinary transformation parameters into an existing asset URL
 * to serve an optimised variant appropriate for its display context.
 *
 * Does nothing for non-Cloudinary URLs (e.g. external embeds) so it's safe
 * to call unconditionally on any URL in the codebase.
 *
 * @param {string} url        - Original Cloudinary URL
 * @param {'image'|'video'} type
 * @param {'feed'|'thumb'} context - 'feed' serves a 500px wide auto-quality image;
 *                                   'thumb' serves a 150px thumbnail
 */
export const optimizeCloudinaryUrl = (url, type, context = 'feed') => {
  if (!url || !url.includes('cloudinary.com')) return url;

  if (type === 'image') {
    const transformations = context === 'feed' ? 'f_auto,q_auto,w_500' : 'w_150,q_auto';
    return url.replace('/upload/', `/upload/${transformations}/`);
  }

  if (type === 'video') {
    return url.replace('/upload/', '/upload/q_auto,vc_auto/');
  }

  return url;
};
