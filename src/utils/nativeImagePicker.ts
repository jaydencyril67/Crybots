export type NativeImageResult = {
  dataUrl?: string;
  webPath?: string;
  format?: string;
};

type NativeCameraPlugin = {
  getPhoto: (options: {
    source: 'PHOTOS';
    resultType: 'DATA_URL';
    quality: number;
    allowEditing: false;
  }) => Promise<NativeImageResult>;
};

type CapacitorWindow = Window & {
  Capacitor?: {
    isNativePlatform?: () => boolean;
    Plugins?: { Camera?: NativeCameraPlugin };
  };
};

export const hasNativeImagePicker = (): boolean => {
  if (typeof window === 'undefined') return false;
  const capacitor = (window as CapacitorWindow).Capacitor;
  return Boolean(capacitor?.isNativePlatform?.() && capacitor.Plugins?.Camera);
};

const getNativeCamera = (): NativeCameraPlugin | null => {
  if (!hasNativeImagePicker()) return null;
  return (window as CapacitorWindow).Capacitor?.Plugins?.Camera || null;
};

const dataUrlToFile = (dataUrl: string, format = 'jpeg'): File => {
  const [metadata, encoded] = dataUrl.split(',');
  const mimeType = metadata.match(/data:(.*?);/)?.[1] || `image/${format}`;
  const binary = window.atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new File([bytes], `photo.${format}`, { type: mimeType });
};

export const pickNativeImage = async (): Promise<File | null> => {
  const camera = getNativeCamera();
  if (!camera) return null;
  const result = await camera.getPhoto({
    source: 'PHOTOS',
    resultType: 'DATA_URL',
    quality: 90,
    allowEditing: false,
  });
  if (result.dataUrl) return dataUrlToFile(result.dataUrl, result.format);
  if (result.webPath) {
    const response = await fetch(result.webPath);
    const blob = await response.blob();
    return new File([blob], `photo.${result.format || 'jpeg'}`, { type: blob.type || `image/${result.format || 'jpeg'}` });
  }
  return null;
};
