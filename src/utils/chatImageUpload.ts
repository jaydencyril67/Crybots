import api from '../api/axios';

const MAX_CHAT_IMAGE_SIZE = 10 * 1024 * 1024;

export const uploadChatImage = async (file: File): Promise<string> => {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.');
  if (file.size > MAX_CHAT_IMAGE_SIZE) throw new Error('Images must be 10 MB or smaller.');

  const configResponse = await api.get('/api/cloudinary/upload');
  const cloudinaryConfig = configResponse.data as { cloudName?: string; uploadPreset?: string };
  if (!cloudinaryConfig.cloudName || !cloudinaryConfig.uploadPreset) throw new Error('Image upload is not configured.');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', cloudinaryConfig.uploadPreset);
  const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`, { method: 'POST', body: formData });
  if (!uploadResponse.ok) throw new Error('Unable to upload image.');
  const uploadedFile = await uploadResponse.json() as { secure_url?: string };
  if (!uploadedFile.secure_url) throw new Error('Image upload did not return a usable URL.');
  return uploadedFile.secure_url;
};
