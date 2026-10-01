import React, { useRef, useState } from 'react';
import { pickNativeImage } from '../utils/nativeImagePicker';

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
  const [opening, setOpening] = useState(false);

  const openPicker = async () => {
    if (disabled || opening) return;
    setOpening(true);
    try {
      const nativeFile = await pickNativeImage();
      if (nativeFile) {
        await onImageSelected(nativeFile);
        return;
      }
      inputRef.current?.click();
    } catch {
      inputRef.current?.click();
    } finally {
      setOpening(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) await onImageSelected(file);
  };

  return (
    <>
      <button type="button" onClick={openPicker} disabled={disabled || opening} style={style} title={title} aria-label={ariaLabel}>
        {children}
      </button>
      <input ref={inputRef} type="file" accept={accept} onChange={handleFileChange} disabled={disabled} style={{ display: 'none' }} />
    </>
  );
};

export default ImagePickerButton;
