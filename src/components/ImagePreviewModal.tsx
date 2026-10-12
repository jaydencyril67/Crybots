import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useAppTheme } from './AppTheme';
import { HYBRID_THEME_TOKENS } from './HybridTheme';

type Props = { imageUrl: string; onClose: () => void };
const touchDistance = (touches: React.TouchEvent<HTMLDivElement>['touches']) => {
  if (touches.length < 2) return 0;
  return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
};

const ImagePreviewModal = ({ imageUrl, onClose }: Props) => {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const stageRef = useRef<HTMLDivElement | null>(null);
  const pinchStart = useRef<{ distance: number; zoom: number; imagePointX: number; imagePointY: number } | null>(null);
  const dragStart = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const dragging = useRef(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const keyHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', keyHandler);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', keyHandler);
    };
  }, [onClose]);

  const touchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 2) {
      const bounds = stageRef.current?.getBoundingClientRect();
      const midX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
      const midY = (event.touches[0].clientY + event.touches[1].clientY) / 2;
      const centerX = bounds ? bounds.left + bounds.width / 2 : midX;
      const centerY = bounds ? bounds.top + bounds.height / 2 : midY;
      pinchStart.current = { distance: Math.max(1, touchDistance(event.touches)), zoom, imagePointX: (midX - centerX - offset.x) / zoom, imagePointY: (midY - centerY - offset.y) / zoom };
      dragStart.current = null;
    } else if (event.touches.length === 1 && zoom > 1) {
      dragStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY, offsetX: offset.x, offsetY: offset.y };
    }
  };
  const touchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 2 && pinchStart.current) {
      event.preventDefault();
      const start = pinchStart.current;
      const nextZoom = Math.max(1, Math.min(10, start.zoom * touchDistance(event.touches) / Math.max(1, start.distance)));
      const bounds = stageRef.current?.getBoundingClientRect();
      const midX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
      const midY = (event.touches[0].clientY + event.touches[1].clientY) / 2;
      const centerX = bounds ? bounds.left + bounds.width / 2 : midX;
      const centerY = bounds ? bounds.top + bounds.height / 2 : midY;
      setOffset({ x: midX - centerX - start.imagePointX * nextZoom, y: midY - centerY - start.imagePointY * nextZoom });
      setZoom(nextZoom);
    } else if (event.touches.length === 1 && dragStart.current && zoom > 1) {
      event.preventDefault();
      const start = dragStart.current;
      setOffset({ x: start.offsetX + event.touches[0].clientX - start.x, y: start.offsetY + event.touches[0].clientY - start.y });
    }
  };
  const touchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length < 2) pinchStart.current = null;
    if (event.touches.length === 0) dragStart.current = null;
  };
  const mouseDown = (event: React.MouseEvent<HTMLImageElement>) => {
    if (zoom <= 1) return;
    dragging.current = true;
    dragStart.current = { x: event.clientX, y: event.clientY, offsetX: offset.x, offsetY: offset.y };
    event.preventDefault();
  };
  const mouseMove = (event: React.MouseEvent<HTMLImageElement>) => {
    if (!dragging.current || !dragStart.current || zoom <= 1) return;
    setOffset({ x: dragStart.current.offsetX + event.clientX - dragStart.current.x, y: dragStart.current.offsetY + event.clientY - dragStart.current.y });
  };
  const mouseUp = () => { dragging.current = false; dragStart.current = null; };

  return (
    <div role="dialog" aria-modal="true" aria-label="Image preview" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 10000, overflow: 'hidden', background: 'rgba(5,7,16,.96)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', color: '#fff' }}>
      <button type="button" onClick={(event) => { event.stopPropagation(); onClose(); }} aria-label="Close image preview" title="Close preview" style={{ position: 'absolute', zIndex: 2, top: 'max(12px, env(safe-area-inset-top))', right: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 42, height: 42, padding: 0, borderRadius: 999, border: `1px solid ${theme.borderGlass}`, background: 'rgba(12,16,30,.56)', color: '#fff', boxShadow: '0 6px 24px rgba(0,0,0,.24)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', cursor: 'pointer' }}><X size={21} /></button>
      <div ref={stageRef} onClick={(event) => event.stopPropagation()} onTouchStart={touchStart} onTouchMove={touchMove} onTouchEnd={touchEnd} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', touchAction: 'none', padding: 0 }}>
        <img src={imageUrl} alt="Full-size chat attachment" draggable={false} onMouseDown={mouseDown} onMouseMove={mouseMove} onMouseUp={mouseUp} onMouseLeave={mouseUp} style={{ display: 'block', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', userSelect: 'none', cursor: zoom > 1 ? 'grab' : 'zoom-in', transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})`, transformOrigin: 'center center', willChange: 'transform', transition: 'none' }} />
      </div>
    </div>
  );
};

export default ImagePreviewModal;
