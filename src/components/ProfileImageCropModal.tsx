import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Check, X } from 'lucide-react';
import { HYBRID_THEME_TOKENS } from './HybridTheme';
import { useAppTheme } from './AppTheme';

type StoryImageCropModalProps = {
  imageUrl: string;
  onCancel: () => void;
  onDone: (file: File) => void | Promise<void>;
  title?: string;
  aspectRatio?: number;
  preserveAspectRatio?: boolean;
};
type Point = { x: number; y: number };
type CropRect = { x: number; y: number; width: number; height: number };
type CropDrag = { pointerId: number; start: Point; crop: CropRect; mode: 'move' | 'resize'; handle?: string };
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function StoryImageCropModal({ imageUrl, onCancel, onDone, title = 'Edit photo', aspectRatio, preserveAspectRatio = false }: StoryImageCropModalProps) {
  const { themeMode } = useAppTheme();
  const theme = HYBRID_THEME_TOKENS[themeMode];
  const imageRef = useRef<HTMLImageElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const pointersRef = useRef(new Map<number, Point>());
  const gestureRef = useRef<{ distance: number; midpoint: Point; zoom: number; offset: Point } | null>(null);
  const imageDragRef = useRef<{ pointerId: number; point: Point; offset: Point } | null>(null);
  const cropDragRef = useRef<CropDrag | null>(null);
  const zoomRef = useRef(1);
  const offsetRef = useRef<Point>({ x: 0, y: 0 });
  const paintFrameRef = useRef<number | null>(null);
  const [frame, setFrame] = useState({ width: 320, height: 320 });
  const [frameAspectRatio, setFrameAspectRatio] = useState<number | undefined>(aspectRatio);
  const [crop, setCrop] = useState<CropRect>({ x: 16, y: 16, width: 288, height: 288 });
  const cropRef = useRef(crop);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const updateCrop = (next: CropRect) => { cropRef.current = next; setCrop(next); };

  useEffect(() => {
    zoomRef.current = 1;
    offsetRef.current = { x: 0, y: 0 };
    setReady(false);
    setFrameAspectRatio(aspectRatio);
    pointersRef.current.clear();
    gestureRef.current = null;
    imageDragRef.current = null;
    cropDragRef.current = null;
    if (paintFrameRef.current !== null) cancelAnimationFrame(paintFrameRef.current);
    paintFrameRef.current = null;
    setErrorMessage('');
    return () => {
      if (paintFrameRef.current !== null) cancelAnimationFrame(paintFrameRef.current);
      paintFrameRef.current = null;
      pointersRef.current.clear();
      gestureRef.current = null;
      imageDragRef.current = null;
      cropDragRef.current = null;
    };
  }, [imageUrl, aspectRatio]);

  const baseScale = () => {
    const image = imageRef.current;
    if (!image?.naturalWidth || !image.naturalHeight) return 1;
    return Math.max(frame.width / image.naturalWidth, frame.height / image.naturalHeight);
  };
  const geometry = (activeZoom = zoomRef.current) => {
    const image = imageRef.current;
    if (!image?.naturalWidth || !image.naturalHeight) return null;
    const scale = baseScale() * activeZoom;
    return { width: image.naturalWidth * scale, height: image.naturalHeight * scale };
  };
  const constrainOffset = (next: Point, nextZoom = zoomRef.current) => {
    const image = imageRef.current;
    if (!image?.naturalWidth || !image.naturalHeight) return next;
    const scale = baseScale() * nextZoom;
    return { x: clamp(next.x, frame.width - image.naturalWidth * scale, 0), y: clamp(next.y, frame.height - image.naturalHeight * scale, 0) };
  };

  const handleImageLoad = () => {
    const image = imageRef.current;
    if (!image?.naturalWidth || !image.naturalHeight) return;
    const maxWidth = Math.max(200, Math.min(window.innerWidth * 0.92, 900));
    const maxHeight = Math.max(180, Math.min(window.innerHeight * 0.70, 900));
    const ratio = typeof aspectRatio === 'number' && aspectRatio > 0 ? aspectRatio : preserveAspectRatio ? image.naturalWidth / image.naturalHeight : undefined;
    setFrameAspectRatio(ratio);
    let width: number;
    let height: number;
    if (ratio && ratio > 0) {
      width = maxWidth;
      height = width / ratio;
      if (height > maxHeight) { height = maxHeight; width = height * ratio; }
    } else {
      const scale = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
      width = image.naturalWidth * scale;
      height = image.naturalHeight * scale;
    }
    const nextFrame = { width: Math.max(1, width), height: Math.max(1, height) };
    const scale = Math.max(nextFrame.width / image.naturalWidth, nextFrame.height / image.naturalHeight);
    const nextOffset = { x: (nextFrame.width - image.naturalWidth * scale) / 2, y: (nextFrame.height - image.naturalHeight * scale) / 2 };
    setFrame(nextFrame);
    zoomRef.current = 1;
    offsetRef.current = nextOffset;
    const cropRatio = typeof aspectRatio === 'number' && aspectRatio > 0 ? aspectRatio : nextFrame.width / nextFrame.height;
    let cropWidth = nextFrame.width * 0.84;
    let cropHeight = cropWidth / cropRatio;
    if (cropHeight > nextFrame.height * 0.84) { cropHeight = nextFrame.height * 0.84; cropWidth = cropHeight * cropRatio; }
    updateCrop({ x: (nextFrame.width - cropWidth) / 2, y: (nextFrame.height - cropHeight) / 2, width: cropWidth, height: cropHeight });
    setReady(true);
  };

  const syncImageStyles = () => {
    if (paintFrameRef.current !== null) return;
    paintFrameRef.current = requestAnimationFrame(() => {
      paintFrameRef.current = null;
      const image = imageRef.current;
      if (!image?.naturalWidth || !image.naturalHeight) return;
      const scale = baseScale();
      image.style.width = `${image.naturalWidth * scale}px`;
      image.style.height = `${image.naturalHeight * scale}px`;
      image.style.transform = `translate3d(${offsetRef.current.x}px, ${offsetRef.current.y}px, 0) scale(${zoomRef.current})`;
    });
  };
  const localPoint = (event: { clientX: number; clientY: number }): Point => {
    const bounds = stageRef.current?.getBoundingClientRect();
    return bounds ? { x: event.clientX - bounds.left, y: event.clientY - bounds.top } : { x: 0, y: 0 };
  };
  const handleStagePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!ready || saving || (event.target as HTMLElement).closest('.social-story-crop-selection')) return;
    setErrorMessage('');
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Pointer capture is optional. */ }
    const point = localPoint(event);
    pointersRef.current.set(event.pointerId, point);
    if (pointersRef.current.size === 1) {
      imageDragRef.current = { pointerId: event.pointerId, point, offset: offsetRef.current };
      gestureRef.current = null;
    } else if (pointersRef.current.size === 2) {
      const [a, b] = Array.from(pointersRef.current.values());
      gestureRef.current = { distance: Math.max(1, Math.hypot(b.x - a.x, b.y - a.y)), midpoint: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, zoom: zoomRef.current, offset: offsetRef.current };
      imageDragRef.current = null;
    }
  };
  const handleStagePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(event.pointerId) || !ready || saving) return;
    event.preventDefault();
    const point = localPoint(event);
    pointersRef.current.set(event.pointerId, point);
    if (pointersRef.current.size >= 2 && gestureRef.current) {
      const [a, b] = Array.from(pointersRef.current.values());
      const distance = Math.max(1, Math.hypot(b.x - a.x, b.y - a.y));
      const midpoint = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const nextZoom = clamp(gestureRef.current.zoom * distance / gestureRef.current.distance, 1, 12);
      const startScale = baseScale() * gestureRef.current.zoom;
      const nextScale = baseScale() * nextZoom;
      const imagePointX = (gestureRef.current.midpoint.x - gestureRef.current.offset.x) / startScale;
      const imagePointY = (gestureRef.current.midpoint.y - gestureRef.current.offset.y) / startScale;
      offsetRef.current = constrainOffset({ x: midpoint.x - imagePointX * nextScale, y: midpoint.y - imagePointY * nextScale }, nextZoom);
      zoomRef.current = nextZoom;
      syncImageStyles();
      return;
    }
    if (!imageDragRef.current || imageDragRef.current.pointerId !== event.pointerId) return;
    offsetRef.current = constrainOffset({ x: offsetRef.current.x + point.x - imageDragRef.current.point.x, y: offsetRef.current.y + point.y - imageDragRef.current.point.y });
    imageDragRef.current = { pointerId: event.pointerId, point, offset: offsetRef.current };
    syncImageStyles();
  };
  const handleStagePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);
    try { event.currentTarget.releasePointerCapture(event.pointerId); } catch { /* Capture may already be released. */ }
    gestureRef.current = null;
    imageDragRef.current = null;
    if (pointersRef.current.size === 1) {
      const [pointerId, point] = Array.from(pointersRef.current.entries())[0];
      imageDragRef.current = { pointerId, point, offset: offsetRef.current };
    }
  };
  const handleCropPointerDown = (event: PointerEvent<HTMLElement>, mode: 'move' | 'resize', handle?: string) => {
    if (!ready || saving) return;
    event.preventDefault();
    event.stopPropagation();
    setErrorMessage('');
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Pointer capture is optional. */ }
    cropDragRef.current = { pointerId: event.pointerId, start: localPoint(event), crop: cropRef.current, mode, handle };
  };
  const handleCropPointerMove = (event: PointerEvent<HTMLElement>) => {
    const drag = cropDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId || saving) return;
    event.preventDefault();
    event.stopPropagation();
    const point = localPoint(event);
    const dx = point.x - drag.start.x;
    const dy = point.y - drag.start.y;
    const minSize = 56;
    if (drag.mode === 'move') {
      updateCrop({ ...drag.crop, x: clamp(drag.crop.x + dx, 0, frame.width - drag.crop.width), y: clamp(drag.crop.y + dy, 0, frame.height - drag.crop.height) });
      return;
    }
    let left = drag.crop.x, top = drag.crop.y, right = drag.crop.x + drag.crop.width, bottom = drag.crop.y + drag.crop.height;
    const handle = drag.handle || '';
    if (handle.includes('w')) left = clamp(drag.crop.x + dx, 0, right - minSize);
    if (handle.includes('e')) right = clamp(drag.crop.x + drag.crop.width + dx, left + minSize, frame.width);
    if (handle.includes('n')) top = clamp(drag.crop.y + dy, 0, bottom - minSize);
    if (handle.includes('s')) bottom = clamp(drag.crop.y + drag.crop.height + dy, top + minSize, frame.height);
    const ratio = typeof aspectRatio === 'number' && aspectRatio > 0 ? aspectRatio : null;
    if (ratio) {
      const width = right - left, height = bottom - top;
      if (Math.abs(dx) >= Math.abs(dy)) {
        const nextHeight = width / ratio;
        if (handle.includes('n')) top = clamp(bottom - nextHeight, 0, bottom - minSize);
        else bottom = clamp(top + nextHeight, top + minSize, frame.height);
      } else {
        const nextWidth = height * ratio;
        if (handle.includes('w')) left = clamp(right - nextWidth, 0, right - minSize);
        else right = clamp(left + nextWidth, left + minSize, frame.width);
      }
    }
    updateCrop({ x: left, y: top, width: Math.max(minSize, right - left), height: Math.max(minSize, bottom - top) });
  };
  const handleCropPointerUp = (event: PointerEvent<HTMLElement>) => {
    if (cropDragRef.current?.pointerId !== event.pointerId) return;
    event.stopPropagation();
    cropDragRef.current = null;
    try { event.currentTarget.releasePointerCapture(event.pointerId); } catch { /* Capture may already be released. */ }
  };

  const saveCrop = async () => {
    const image = imageRef.current;
    if (!image || !geometry() || !ready || saving) return;
    setSaving(true);
    setErrorMessage('');
    try {
      const selected = cropRef.current;
      const scale = baseScale() * zoomRef.current;
      const sourceX = clamp((selected.x - offsetRef.current.x) / scale, 0, image.naturalWidth);
      const sourceY = clamp((selected.y - offsetRef.current.y) / scale, 0, image.naturalHeight);
      const sourceWidth = Math.min(image.naturalWidth - sourceX, selected.width / scale);
      const sourceHeight = Math.min(image.naturalHeight - sourceY, selected.height / scale);
      if (sourceWidth <= 0 || sourceHeight <= 0) throw new Error('Move the crop box over the photo before applying it.');
      const outputWidth = Math.min(1600, Math.max(800, Math.round(selected.width * 2)));
      const outputHeight = Math.max(1, Math.round(outputWidth * selected.height / selected.width));
      const canvas = document.createElement('canvas');
      canvas.width = outputWidth; canvas.height = outputHeight;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Couldn\'t prepare this photo. Please try again.');
      context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, outputWidth, outputHeight);
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      if (!blob) throw new Error('Couldn\'t crop this photo. Please try again.');
      await onDone(new File([blob], 'edited-photo.jpg', { type: 'image/jpeg' }));
    } catch (error) {
      console.error('[image-crop] failed to create cropped image', error);
      setErrorMessage(error instanceof Error ? error.message : 'Couldn’t crop this photo. Please try again.');
    } finally { setSaving(false); }
  };

  const handles = [
    { key: 'nw', className: 'nw' }, { key: 'n', className: 'n' }, { key: 'ne', className: 'ne' },
    { key: 'w', className: 'w' }, { key: 'e', className: 'e' },
    { key: 'sw', className: 'sw' }, { key: 's', className: 's' }, { key: 'se', className: 'se' },
  ];

  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="social-story-crop-overlay">
      <style>{`.social-story-crop-overlay{position:fixed;inset:0;z-index:10020;display:flex;flex-direction:column;width:100vw;height:100vh;height:100dvh;min-height:0;overflow:hidden;box-sizing:border-box;background:linear-gradient(160deg,${theme.background},${theme.surface});backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);color:${theme.text}}
.social-story-crop-header{position:absolute;inset:0 0 auto;z-index:5;display:block;height:0;padding:0;border:0;background:transparent;pointer-events:none}
.social-story-crop-header>div{display:none}
.social-story-crop-header>button{position:absolute;top:max(12px,env(safe-area-inset-top));display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;padding:0;border:1px solid ${theme.borderGlass};border-radius:999px;background:rgba(12,16,30,.58);color:${theme.text};box-shadow:0 6px 24px rgba(0,0,0,.24);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);pointer-events:auto}
.social-story-crop-header>button:first-child{left:14px}
.social-story-crop-header>button:last-child{right:14px;background:linear-gradient(145deg,${theme.primary},${theme.primary});border-color:transparent;color:${theme.textInverse}}
.social-story-crop-header>button:disabled{opacity:.45}
.social-story-crop-stage{display:flex;flex:1 1 auto;min-height:0;align-items:center;justify-content:center;overflow:auto;overscroll-behavior:contain;padding:12px}
.social-story-crop-frame{position:relative;flex:0 0 auto;overflow:hidden;background:${theme.surfaceMuted};touch-action:none;overscroll-behavior:contain;user-select:none;-webkit-user-select:none;isolation:isolate;box-shadow:0 0 0 1px ${theme.borderStrong},0 12px 48px rgba(0,0,0,.30)}
.social-story-crop-frame>img{position:absolute;left:0;top:0;display:block;max-width:none;object-fit:fill;transform-origin:top left;will-change:transform;width:auto;user-select:none;-webkit-user-select:none;-webkit-user-drag:none;pointer-events:none;backface-visibility:hidden;-webkit-backface-visibility:hidden}
.social-story-crop-selection{position:absolute;z-index:2;box-sizing:border-box;border:2px solid ${theme.text};box-shadow:0 0 0 9999px rgba(0,0,0,.56),0 0 0 1px ${theme.primary};cursor:move;touch-action:none;user-select:none;-webkit-user-select:none}
.social-story-crop-grid{position:absolute;inset:0;pointer-events:none;background:linear-gradient(to right,transparent 33.15%,${theme.borderStrong} 33.33%,transparent 33.5%,transparent 66.5%,${theme.borderStrong} 66.67%,transparent 66.85%),linear-gradient(to bottom,transparent 33.15%,${theme.borderStrong} 33.33%,transparent 33.5%,transparent 66.5%,${theme.borderStrong} 66.67%,transparent 66.85%)}
.social-story-crop-handle{position:absolute;z-index:3;display:block;width:16px;height:16px;border:2px solid ${theme.text};border-radius:5px;background:${theme.primary};box-shadow:0 2px 9px rgba(0,0,0,.45);touch-action:none}
.social-story-crop-handle.nw{top:-8px;left:-8px;cursor:nwse-resize}.social-story-crop-handle.n{top:-8px;left:calc(50% - 8px);cursor:ns-resize}.social-story-crop-handle.ne{top:-8px;right:-8px;cursor:nesw-resize}
.social-story-crop-handle.w{top:calc(50% - 8px);left:-8px;cursor:ew-resize}.social-story-crop-handle.e{top:calc(50% - 8px);right:-8px;cursor:ew-resize}
.social-story-crop-handle.sw{bottom:-8px;left:-8px;cursor:nesw-resize}.social-story-crop-handle.s{bottom:-8px;left:calc(50% - 8px);cursor:ns-resize}.social-story-crop-handle.se{right:-8px;bottom:-8px;cursor:nwse-resize}
.social-story-crop-bottom{display:none;position:relative;display:flex;flex:0 0 auto;align-items:center;justify-content:center;min-height:54px;padding:8px 16px calc(12px + env(safe-area-inset-bottom));border-top:1px solid ${theme.border};background:linear-gradient(180deg,${theme.surfaceMuted},${theme.surface});box-shadow:0 -12px 34px rgba(0,0,0,.18),inset 0 1px 0 rgba(255,255,255,.025)}
.social-story-crop-bottom::before{content:"";position:absolute;top:0;left:50%;width:72px;height:2px;transform:translateX(-50%);border-radius:0 0 99px 99px;background:linear-gradient(90deg,${theme.primarySoft},${theme.primary},${theme.primarySoft})}
.social-story-crop-bottom span{display:block;width:34px;height:4px;border-radius:99px;background:${theme.borderStrong}}
.social-story-crop-error{position:absolute;left:16px;right:16px;bottom:calc(16px + env(safe-area-inset-bottom));z-index:4;padding:10px 12px;border:1px solid ${theme.danger};border-radius:12px;background:${theme.surfaceElevated};color:${theme.danger};font-size:.82rem;line-height:1.4;text-align:center;box-shadow:0 8px 28px rgba(0,0,0,.28)}
@media(max-width:520px){.social-story-crop-stage{padding:10px 8px}.social-story-crop-header{gap:7px;padding-right:10px;padding-left:10px}.social-story-crop-header>button{flex-basis:38px;width:38px;height:38px}.social-story-crop-handle{width:18px;height:18px}.social-story-crop-handle.nw{top:-9px;left:-9px}.social-story-crop-handle.n{top:-9px}.social-story-crop-handle.ne{top:-9px;right:-9px}.social-story-crop-handle.w{left:-9px}.social-story-crop-handle.e{right:-9px}.social-story-crop-handle.sw{bottom:-9px;left:-9px}.social-story-crop-handle.s{bottom:-9px}.social-story-crop-handle.se{right:-9px;bottom:-9px}.social-story-crop-bottom{min-height:48px;padding-bottom:calc(10px + env(safe-area-inset-bottom))}}`}</style>
      <header className="social-story-crop-header">
        <button type="button" onClick={onCancel} disabled={saving} aria-label="Cancel photo edit"><X size={23} /></button>
        <div><strong>{title}</strong><span>Drag the box to move it · Drag handles to resize</span></div>
        <button type="button" onClick={() => void saveCrop()} disabled={!ready || saving} aria-label="Apply crop">{saving ? '…' : <Check size={25} />}</button>
      </header>
      <div className="social-story-crop-stage">
        <div ref={stageRef} className="social-story-crop-frame" style={{ width: frame.width, height: frame.height, maxWidth: '92vw', maxHeight: '70dvh', aspectRatio: frameAspectRatio }}
          onPointerDown={handleStagePointerDown} onPointerMove={handleStagePointerMove} onPointerUp={handleStagePointerUp} onPointerCancel={handleStagePointerUp}>
          <img ref={imageRef} src={imageUrl} alt="Selected photo crop" onLoad={handleImageLoad} draggable={false}
            style={{ width: ready && imageRef.current?.naturalWidth ? imageRef.current.naturalWidth * baseScale() : '100%', height: ready && imageRef.current?.naturalHeight ? imageRef.current.naturalHeight * baseScale() : '100%', transform: `translate3d(${offsetRef.current.x}px, ${offsetRef.current.y}px, 0) scale(${zoomRef.current})` }} />
          {ready && <div className="social-story-crop-selection" style={{ left: crop.x, top: crop.y, width: crop.width, height: crop.height }}
            onPointerDown={event => handleCropPointerDown(event, 'move')} onPointerMove={handleCropPointerMove} onPointerUp={handleCropPointerUp} onPointerCancel={handleCropPointerUp}>
            <div className="social-story-crop-grid" aria-hidden="true" />
            {handles.map(({ key, className }) => <span key={key} className={`social-story-crop-handle ${className}`}
              onPointerDown={event => { event.stopPropagation(); handleCropPointerDown(event, 'resize', key); }}
              onPointerMove={handleCropPointerMove} onPointerUp={handleCropPointerUp} onPointerCancel={handleCropPointerUp} />)}
          </div>}
        </div>
      </div>
      {errorMessage && <div className="social-story-crop-error" role="alert">{errorMessage}</div>}
      
    </div>
  );
}
