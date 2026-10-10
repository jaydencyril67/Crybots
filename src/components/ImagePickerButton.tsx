import React, { useRef, useState } from 'react';
import { isNativeGalleryAvailable } from '../utils/nativeImagePicker';
import NativeGalleryModal from './NativeGalleryModal';

type ImagePickerButtonProps = {
  accept?: string;
  disabled?: boolean;
  onImageSelected: (file: File) => void | Promise<void>;
  children: React.ReactNode;
  style?: React.CSSProperties;
  title?: string;
  'aria-label'?: string;
};

const ImagePickerButton = ({ accept = 'image/*', disabled = false, onImageSelected, children, style, title, 'aria-label': ariaLabel }: ImagePickerButtonProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [nativeGalleryOpen, setNativeGalleryOpen] = useState(false);

  const openPicker = () => {
    if (disabled) return;
    if (isNativeGalleryAvailable()) {
      setNativeGalleryOpen(true);
      return;
    }
    inputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) await onImageSelected(file);
  };

  return (
    <>
      <button type="button" onClick={openPicker} disabled={disabled} style={style} title={title} aria-label={ariaLabel}>
        {children}
      </button>
      <input ref={inputRef} type="file" accept={accept} onChange={handleFileChange} disabled={disabled} style={{ display: 'none' }} />
      {nativeGalleryOpen && <NativeGalleryModal onClose={() => setNativeGalleryOpen(false)} onSelect={onImageSelected} />}
    </>
  );
};

export default ImagePickerButton;
