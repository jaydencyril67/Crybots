declare module 'react-avatar-edit' {
  import { ComponentType } from 'react';

  type AvatarProps = {
    width?: number;
    height?: number;
    cropRadius?: number;
    exportAsSquare?: boolean;
    exportSize?: number;
    exportMimeType?: 'image/jpeg' | 'image/png';
    src?: string;
    onCrop?: (preview: string) => void;
    onClose?: () => void;
    closeIconColor?: string;
    shadingColor?: string;
    shadingOpacity?: number;
    label?: string;
  };

  const Avatar: ComponentType<AvatarProps>;
  export default Avatar;
}
