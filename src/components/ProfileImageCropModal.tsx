import React, { useEffect, useRef, useState } from 'react';
import { Check, X, ZoomIn, ZoomOut } from 'lucide-react';

type ProfileImageCropModalProps = {
  imageUrl: string;
  onCancel: () => void;
  onDone: (file: File) => void | Promise<void>;
};

const CROP_SIZE = 300;
const OUTPUT_SIZE = 800;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const ProfileImageCropModal = ({ imageUrl, onCancel, onDone }: ProfileImageCropModalProps) => {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef({ active: false, x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);

  const getGeometry = () => {
    const image = imageRef.current;
    if (!image?.naturalWidth || !image.naturalHeight) return null;
    const baseScale = Math.max(CROP_SIZE / image.naturalWidth, CROP_SIZE / image.naturalHeight);
    const scale = baseScale * zoom;
    return {
      scale,
      width: image.naturalWidth * scale,
      height: image.naturalHeight * scale,
    };
  };

  const constrainOffset = (next: { x: number; y: number }) => {
    const geometry = getGeometry();
    if (!geometry) return next;
    const minX = CROP_SIZE - geometry.width;
    const minY = CROP_SIZE - geometry.height;
    return {
      x: clamp(next.x, minX, 0),
      y: clamp(next.y, minY, 0),
    };
  };

  useEffect(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setReady(false);
  }, [imageUrl]);

  const handleImageLoad = () => {
    const geometry = getGeometry();
    if (!geometry) return;
    setOffset({
      x: (CROP_SIZE - geometry.width) / 2,
      y: (CROP_SIZE - geometry.height) / 2,
    });
    setReady(true);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!ready || saving) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { active: true, x: event.clientX, y: event.clientY };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active || saving) return;
    const dx = event.clientX - dragRef.current.x;
    const dy = event.clientY - dragRef.current.y;
    dragRef.current = { active: true, x: event.clientX, y: event.clientY };
    setOffset((current) => constrainOffset({ x: current.x + dx, y: current.y + dy }));
  };

  const handlePointerUp = () => {
    dragRef.current.active = false;
  };

  const handleZoomChange = (nextZoom: number) => {
    const previous = getGeometry();
    setZoom(nextZoom);
    requestAnimationFrame(() => {
      const image = imageRef.current;
      if (!image?.naturalWidth || !image.naturalHeight) return;
      const baseScale = Math.max(CROP_SIZE / image.naturalWidth, CROP_SIZE / image.naturalHeight);
      const nextScale = baseScale * nextZoom;
      const nextWidth = image.naturalWidth * nextScale;
      const nextHeight = image.naturalHeight * nextScale;
      setOffset((current) => {
        if (!previous) return constrainOffset({ x: (CROP_SIZE - nextWidth) / 2, y: (CROP_SIZE - nextHeight) / 2 });
        const ratio = nextZoom / zoom;
        const centeredX = CROP_SIZE / 2 + (current.x - CROP_SIZE / 2) * ratio;
        const centeredY = CROP_SIZE / 2 + (current.y - CROP_SIZE / 2) * ratio;
        return constrainOffset({ x: centeredX, y: centeredY });
      });
    });
  };

  const createCroppedFile = async () => {
    const image = imageRef.current;
    const geometry = getGeometry();
    if (!image || !geometry || !ready) return;

    setSaving(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Unable to prepare the cropped image.');

      const ratio = OUTPUT_SIZE / CROP_SIZE;
      context.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
      context.drawImage(
        image,
        offset.x * ratio,
        offset.y * ratio,
        geometry.width * ratio,
        geometry.height * ratio,
      );

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      if (!blob) throw new Error('Unable to create the cropped image.');
      await onDone(new File([blob], 'profile-picture.jpg', { type: 'image/jpeg' }));
    } catch (error) {
      console.error('[profile-crop] failed to create cropped image', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Edit profile picture"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '22px',
        padding: '24px',
        boxSizing: 'border-box',
        background: 'rgba(0,0,0,0.88)',
        color: '#fff',
      }}
    >
      <div style={{ width: '100%', maxWidth: '420px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button type="button" onClick={onCancel} disabled={saving} aria-label="Cancel" style={{ background: 'transparent', border: 0, color: '#fff', padding: 8, cursor: 'pointer' }}>
          <X size={25} />
        </button>
        <strong style={{ fontSize: '1rem' }}>Edit profile picture</strong>
        <button type="button" onClick={() => void createCroppedFile()} disabled={!ready || saving} aria-label="Done" style={{ background: 'transparent', border: 0, color: '#fff', padding: 8, cursor: ready && !saving ? 'pointer' : 'default' }}>
          <Check size={27} />
        </button>
      </div>

      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          position: 'relative',
          width: CROP_SIZE,
          height: CROP_SIZE,
          maxWidth: '82vw',
          maxHeight: '82vw',
          overflow: 'hidden',
          borderRadius: '24px',
          background: '#111',
          touchAction: 'none',
          cursor: saving ? 'default' : 'grab',
          boxShadow: '0 0 0 2px rgba(255,255,255,0.9), 0 0 0 100vmax rgba(0,0,0,0.18)',
        }}
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Profile picture crop preview"
          onLoad={handleImageLoad}
          draggable={false}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: ready ? getGeometry()?.width : '100%',
            height: ready ? getGeometry()?.height : '100%',
            maxWidth: 'none',
            objectFit: 'fill',
            transform: ready ? `translate(${offset.x}px, ${offset.y}px)` : 'none',
            transformOrigin: 'top left',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.8)', pointerEvents: 'none' }} />
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: '360px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          touchAction: 'none',
        }}
      >
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => handleZoomChange(clamp(zoom - 0.15, 1, 3))}
          disabled={!ready || saving || zoom <= 1}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '999px',
            border: '1px solid rgba(255,255,255,0.24)',
            background: 'rgba(255,255,255,0.08)',
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
          }}
        >
          <ZoomOut size={18} />
        </button>

        <div
          role="slider"
          aria-label="Zoom"
          aria-valuemin={1}
          aria-valuemax={3}
          aria-valuenow={Number(zoom.toFixed(2))}
          tabIndex={0}
          onPointerDown={(event) => {
            if (!ready || saving) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            const rect = event.currentTarget.getBoundingClientRect();
            const updateFromPointer = (clientX: number) => {
              const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
              handleZoomChange(1 + ratio * 2);
            };
            updateFromPointer(event.clientX);
            const move = (moveEvent: PointerEvent) => updateFromPointer(moveEvent.clientX);
            const stop = () => {
              window.removeEventListener('pointermove', move);
              window.removeEventListener('pointerup', stop);
            };
            window.addEventListener('pointermove', move);
            window.addEventListener('pointerup', stop, { once: true });
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') handleZoomChange(clamp(zoom - 0.1, 1, 3));
            if (event.key === 'ArrowRight') handleZoomChange(clamp(zoom + 0.1, 1, 3));
          }}
          style={{
            position: 'relative',
            width: '190px',
            height: '42px',
            display: 'flex',
            alignItems: 'center',
            cursor: ready && !saving ? 'ew-resize' : 'default',
            opacity: ready ? 1 : 0.5,
          }}
        >
          <div style={{ position: 'absolute', left: 0, right: 0, height: '4px', borderRadius: '999px', background: 'rgba(255,255,255,0.22)' }} />
          <div
            style={{
              position: 'absolute',
              left: `calc(${((zoom - 1) / 2) * 100}% - 13px)`,
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: '#fff',
              boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#777' }} />
          </div>
        </div>

        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => handleZoomChange(clamp(zoom + 0.15, 1, 3))}
          disabled={!ready || saving || zoom >= 3}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '999px',
            border: '1px solid rgba(255,255,255,0.24)',
            background: 'rgba(255,255,255,0.08)',
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
          }}
        >
          <ZoomIn size={18} />
        </button>
      </div>

      <span style={{ fontSize: '0.78rem', opacity: 0.7 }}>Drag the photo to position it</span>
    </div>
  );
};

export default ProfileImageCropModal;
