import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Check, X } from "lucide-react";

type StoryImageCropModalProps = {
  imageUrl: string;
  onCancel: () => void;
  onDone: (file: File) => void | Promise<void>;
  title?: string;
  aspectRatio?: number;
  preserveAspectRatio?: boolean;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function StoryImageCropModal({ imageUrl, onCancel, onDone, title = "Edit photo", aspectRatio, preserveAspectRatio = false }: StoryImageCropModalProps) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const gestureRef = useRef<{ distance: number; midpoint: { x: number; y: number }; zoom: number; offset: { x: number; y: number } } | null>(null);
  const dragRef = useRef<{ x: number; y: number; offset: { x: number; y: number } } | null>(null);
  const zoomRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });
  const paintFrameRef = useRef<number | null>(null);
  const [frame, setFrame] = useState({ width: 320, height: 320 });
  const [frameAspectRatio, setFrameAspectRatio] = useState<number | undefined>(aspectRatio);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    zoomRef.current = 1;
    offsetRef.current = { x: 0, y: 0 };
    setReady(false);
    setFrameAspectRatio(aspectRatio);
    pointersRef.current.clear();
    gestureRef.current = null;
    dragRef.current = null;
    if (paintFrameRef.current !== null) cancelAnimationFrame(paintFrameRef.current);
    paintFrameRef.current = null;
    setErrorMessage("");
    return () => {
      if (paintFrameRef.current !== null) cancelAnimationFrame(paintFrameRef.current);
      paintFrameRef.current = null;
      pointersRef.current.clear();
      gestureRef.current = null;
      dragRef.current = null;
    };
  }, [imageUrl]);

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

  const constrainOffset = (next: { x: number; y: number }, nextZoom = zoomRef.current) => {
    const image = imageRef.current;
    if (!image?.naturalWidth || !image.naturalHeight) return next;
    const scale = baseScale() * nextZoom;
    return {
      x: clamp(next.x, frame.width - image.naturalWidth * scale, 0),
      y: clamp(next.y, frame.height - image.naturalHeight * scale, 0),
    };
  };


  const handleImageLoad = () => {
    const image = imageRef.current;
    if (!image?.naturalWidth || !image.naturalHeight) return;
    const maxWidth = Math.max(200, Math.min(window.innerWidth * 0.92, 900));
    const maxHeight = Math.max(180, Math.min(window.innerHeight * 0.76, 900));
    let width: number;
    let height: number;
    const targetAspectRatio = typeof aspectRatio === "number" && aspectRatio > 0 ? aspectRatio : preserveAspectRatio ? image.naturalWidth / image.naturalHeight : undefined;
    setFrameAspectRatio(targetAspectRatio);
    if (typeof targetAspectRatio === "number" && targetAspectRatio > 0) {
      width = maxWidth;
      height = width / targetAspectRatio;
      if (height > maxHeight) {
        height = maxHeight;
        width = height * targetAspectRatio;
      }
    } else {
      const scale = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
      width = image.naturalWidth * scale;
      height = image.naturalHeight * scale;
    }
    const nextFrame = { width: Math.max(1, width), height: Math.max(1, height) };
    const scale = Math.max(nextFrame.width / image.naturalWidth, nextFrame.height / image.naturalHeight);
    const initialOffset = {
      x: (nextFrame.width - image.naturalWidth * scale) / 2,
      y: (nextFrame.height - image.naturalHeight * scale) / 2,
    };
    setFrame(nextFrame);
    zoomRef.current = 1;
    offsetRef.current = initialOffset;
    setReady(true);
  };

  // Batch visual writes to one paint per frame. Keep the image at its base size
  // and use a GPU-composited transform for zoom instead of relaying out width/height
  // on every finger movement.
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

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!ready || saving) return;
    setErrorMessage("");
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Continue with pointer events if capture is unavailable. */ }
    const bounds = event.currentTarget.getBoundingClientRect();
    pointersRef.current.set(event.pointerId, { x: event.clientX - bounds.left, y: event.clientY - bounds.top });
    if (pointersRef.current.size === 1) {
      const point = pointersRef.current.get(event.pointerId)!;
      dragRef.current = { x: point.x, y: point.y, offset: offsetRef.current };
      gestureRef.current = null;
    } else if (pointersRef.current.size === 2) {
      const [a, b] = Array.from(pointersRef.current.values());
      gestureRef.current = {
        distance: Math.max(1, Math.hypot(b.x - a.x, b.y - a.y)),
        midpoint: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        zoom: zoomRef.current,
        offset: offsetRef.current,
      };
      dragRef.current = null;
    }
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(event.pointerId) || !ready || saving) return;
    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    pointersRef.current.set(event.pointerId, { x: event.clientX - bounds.left, y: event.clientY - bounds.top });
    if (pointersRef.current.size >= 2 && gestureRef.current) {
      const [a, b] = Array.from(pointersRef.current.values());
      const distance = Math.max(1, Math.hypot(b.x - a.x, b.y - a.y));
      const midpoint = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const nextZoom = clamp(gestureRef.current.zoom * distance / gestureRef.current.distance, 1, 12);
      const startScale = baseScale() * gestureRef.current.zoom;
      const nextScale = baseScale() * nextZoom;
      const imagePointX = (gestureRef.current.midpoint.x - gestureRef.current.offset.x) / startScale;
      const imagePointY = (gestureRef.current.midpoint.y - gestureRef.current.offset.y) / startScale;
      const nextOffset = constrainOffset({
        x: midpoint.x - imagePointX * nextScale,
        y: midpoint.y - imagePointY * nextScale,
      }, nextZoom);
      zoomRef.current = nextZoom;
      offsetRef.current = nextOffset;
      syncImageStyles();
      return;
    }
    if (!dragRef.current) return;
    const point = pointersRef.current.get(event.pointerId);
    if (!point) return;
    const nextOffset = constrainOffset({
      x: offsetRef.current.x + point.x - dragRef.current.x,
      y: offsetRef.current.y + point.y - dragRef.current.y,
    });
    dragRef.current = { x: point.x, y: point.y, offset: nextOffset };
    offsetRef.current = nextOffset;
    syncImageStyles();
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);
    try { event.currentTarget.releasePointerCapture(event.pointerId); } catch { /* Pointer capture may already be released. */ }
    gestureRef.current = null;
    dragRef.current = null;
    if (pointersRef.current.size === 1) {
      const point = Array.from(pointersRef.current.values())[0];
      dragRef.current = { x: point.x, y: point.y, offset: offsetRef.current };
    }
  };

  const saveCrop = async () => {
    const image = imageRef.current;
    const drawn = geometry();
    if (!image || !drawn || !ready || saving) return;
    setSaving(true);
    setErrorMessage("");
    try {
      const outputWidth = Math.min(1600, Math.max(800, Math.round(frame.width * 2)));
      const outputHeight = Math.max(1, Math.round(outputWidth * frame.height / frame.width));
      const canvas = document.createElement("canvas");
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Couldn't prepare this photo. Please try again.");
      const scale = outputWidth / frame.width;
      context.drawImage(image, offsetRef.current.x * scale, offsetRef.current.y * scale, drawn.width * scale, drawn.height * scale);
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", 0.9));
      if (!blob) throw new Error("Couldn't crop this photo. Please try again.");
      await onDone(new File([blob], "edited-photo.jpg", { type: "image/jpeg" }));
    } catch (error) {
      console.error("[image-crop] failed to create cropped image", error);
      setErrorMessage(error instanceof Error ? error.message : "Couldn’t crop this photo. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="social-story-crop-overlay">
      <style>{`.social-story-crop-overlay{position:fixed;inset:0;z-index:10020;display:flex;flex-direction:column;width:100vw;height:100vh;height:100dvh;min-height:0;overflow:hidden;box-sizing:border-box;background:linear-gradient(160deg,rgba(43,13,23,.99),rgba(21,7,12,.99));backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);color:#f8e9ec}
.social-story-crop-header{display:flex;flex:0 0 auto;align-items:center;justify-content:space-between;gap:12px;padding:max(14px,env(safe-area-inset-top)) 16px 14px;border-bottom:1px solid rgba(255,210,219,.14);background:rgba(75,13,27,.35)}
.social-story-crop-header>div{display:flex;flex:1;min-width:0;flex-direction:column;gap:4px;text-align:center}
.social-story-crop-header strong{font-size:.96rem;font-weight:750;color:#fff0f3}
.social-story-crop-header span{color:#c29da6;font-size:.72rem}
.social-story-crop-header>button{display:inline-flex;flex:0 0 42px;align-items:center;justify-content:center;width:42px;height:42px;padding:0;border:1px solid rgba(255,210,219,.14);border-radius:13px;background:rgba(240,120,137,.09);color:#ffe9ed}
.social-story-crop-header>button:last-child{background:linear-gradient(145deg,#e2536b,#a82039);border-color:transparent;color:#fff}
.social-story-crop-header>button:disabled{opacity:.45}
.social-story-crop-stage{display:flex;flex:1 1 auto;min-height:0;align-items:center;justify-content:center;overflow:auto;overscroll-behavior:contain;padding:12px 12px}
.social-story-crop-frame{position:relative;flex:0 0 auto;overflow:hidden;background:#17070d;touch-action:none;overscroll-behavior:contain;user-select:none;-webkit-user-select:none;cursor:grab;isolation:isolate;box-shadow:0 0 0 1px rgba(255,210,219,.55),0 12px 48px rgba(0,0,0,.42)}
.social-story-crop-frame:active{cursor:grabbing}
.social-story-crop-frame>img{position:absolute;left:0;top:0;display:block;max-width:none;object-fit:fill;transform-origin:top left;will-change:transform;width:auto;user-select:none;-webkit-user-select:none;-webkit-user-drag:none;pointer-events:none;backface-visibility:hidden;-webkit-backface-visibility:hidden}
.social-story-crop-grid{position:absolute;inset:0;pointer-events:none;background:linear-gradient(to right,transparent 33.15%,rgba(255,226,231,.48) 33.33%,transparent 33.5%,transparent 66.5%,rgba(255,226,231,.48) 66.67%,transparent 66.85%),linear-gradient(to bottom,transparent 33.15%,rgba(255,226,231,.48) 33.33%,transparent 33.5%,transparent 66.5%,rgba(255,226,231,.48) 66.67%,transparent 66.85%);box-shadow:inset 0 0 0 1px rgba(255,210,219,.65)}
.social-story-crop-footer{display:flex;flex:0 0 auto;align-items:center;justify-content:center;gap:12px;padding:12px 16px calc(16px + env(safe-area-inset-bottom));border-top:1px solid rgba(255,210,219,.14);background:rgba(75,13,27,.3)}
.social-story-crop-footer>button{display:grid;place-items:center;flex:0 0 42px;width:42px;height:42px;border:1px solid rgba(255,210,219,.16);border-radius:13px;background:rgba(240,120,137,.1);color:#ffe9ed}
.social-story-crop-footer>button:disabled{opacity:.4}
.social-story-crop-footer input[type=range]{width:min(42vw,260px);accent-color:#f07889}
.social-story-crop-footer>span{min-width:42px;color:#e5c3ca;font-size:.78rem;text-align:right}
.social-story-crop-bottom{position:relative;display:flex;flex:0 0 auto;align-items:center;justify-content:center;min-height:54px;padding:8px 16px calc(12px + env(safe-area-inset-bottom));border-top:1px solid rgba(255,210,219,.13);background:linear-gradient(180deg,rgba(75,13,27,.52),rgba(18,5,10,.98));box-shadow:0 -12px 34px rgba(0,0,0,.18),inset 0 1px 0 rgba(255,255,255,.025)}
.social-story-crop-bottom::before{content:"";position:absolute;top:0;left:50%;width:72px;height:2px;transform:translateX(-50%);border-radius:0 0 99px 99px;background:linear-gradient(90deg,rgba(240,120,137,.12),#f07889,rgba(240,120,137,.12));box-shadow:0 0 13px rgba(240,120,137,.22)}
.social-story-crop-bottom span{display:block;width:34px;height:4px;border-radius:99px;background:rgba(255,210,219,.24)}
.social-story-crop-error{position:absolute;left:16px;right:16px;bottom:calc(68px + env(safe-area-inset-bottom));z-index:2;padding:10px 12px;border:1px solid rgba(255,115,135,.38);border-radius:12px;background:rgba(54,9,19,.96);color:#ffdce2;font-size:.82rem;line-height:1.4;text-align:center;box-shadow:0 8px 28px rgba(0,0,0,.28)}
@media(max-width:520px){.social-story-crop-stage{padding:10px 8px}.social-story-crop-header{gap:7px;padding-right:10px;padding-left:10px}.social-story-crop-header>button{flex-basis:38px;width:38px;height:38px}.social-story-crop-bottom{min-height:48px;padding-bottom:calc(10px + env(safe-area-inset-bottom))}}`}</style>
      <header className="social-story-crop-header">
        <button type="button" onClick={onCancel} disabled={saving} aria-label="Cancel photo edit"><X size={23} /></button>
        <div><strong>{title}</strong></div>
        <button type="button" onClick={() => void saveCrop()} disabled={!ready || saving} aria-label="Apply crop">{saving ? "…" : <Check size={25} />}</button>
      </header>
      <div className="social-story-crop-stage">
        <div
          className="social-story-crop-frame"
          style={{ width: frame.width, height: frame.height, maxWidth: "92vw", maxHeight: "76dvh", aspectRatio: frameAspectRatio }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Selected photo crop"
            onLoad={handleImageLoad}
            draggable={false}
            style={{
              width: ready && imageRef.current?.naturalWidth ? imageRef.current.naturalWidth * baseScale() : "100%",
              height: ready && imageRef.current?.naturalHeight ? imageRef.current.naturalHeight * baseScale() : "100%",
              transform: `translate3d(${offsetRef.current.x}px, ${offsetRef.current.y}px, 0) scale(${zoomRef.current})`,
            }}
          />
          <div className="social-story-crop-grid" aria-hidden="true" />
        </div>
      </div>
      {errorMessage && <div className="social-story-crop-error" role="alert">{errorMessage}</div>}
      <footer className="social-story-crop-bottom" aria-hidden="true"><span /></footer>
    </div>
  );
}
