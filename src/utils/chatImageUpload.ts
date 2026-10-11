import api from '../api/axios';

const MAX_CHAT_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1600;

const compressImage = async (file: File): Promise<File> => {
  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('Unable to read the selected image.'));
      element.src = sourceUrl;
    });
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Unable to prepare the selected image.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const encode = (type: string, quality: number) =>
      new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
    let blob = await encode('image/webp', 0.82);
    let type = 'image/webp';
    if (!blob || blob.type !== 'image/webp') {
      blob = await encode('image/jpeg', 0.82);
      type = 'image/jpeg';
    }
    if (!blob) throw new Error('Unable to compress the selected image.');
    if (blob.size >= file.size && scale === 1) return file;

    const name = file.name.replace(/\.[^.]+$/, '') || 'kingshall-image';
    return new File([blob], `${name}.${type === 'image/webp' ? 'webp' : 'jpg'}`, {
      type,
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
};

export const uploadChatImage = async (file: File): Promise<string> => {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.');
  if (file.size > MAX_CHAT_IMAGE_SIZE) throw new Error('Images must be 10 MB or smaller.');

  const preparedFile = await compressImage(file);
  const configResponse = await api.get('/api/cloudinary/upload');
  const cloudinaryConfig = configResponse.data as { cloudName?: string; uploadPreset?: string };
  if (!cloudinaryConfig.cloudName || !cloudinaryConfig.uploadPreset) throw new Error('Image upload is not configured.');

  const formData = new FormData();
  formData.append('file', preparedFile);
  formData.append('upload_preset', cloudinaryConfig.uploadPreset);
  const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`, { method: 'POST', body: formData });
  if (!uploadResponse.ok) throw new Error('Unable to upload image.');
  const uploadedFile = await uploadResponse.json() as { secure_url?: string };
  if (!uploadedFile.secure_url) throw new Error('Image upload did not return a usable URL.');
  return uploadedFile.secure_url;
};
