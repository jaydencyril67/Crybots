import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Camera, Check, ChevronDown, Image as ImageIcon, LoaderCircle } from 'lucide-react';
import { isNativeGalleryAvailable, loadNativeGalleryImage, loadNativeGalleryPhotos, NativeGalleryPhoto } from '../utils/nativeImagePicker';
import { useAppTheme } from './AppTheme';

type NativeGalleryModalProps = {
  onClose: () => void;
  onSelect: (file: File) => void | Promise<void>;
};

const NativeGalleryModal = ({ onClose, onSelect }: NativeGalleryModalProps) => {
  const { themeMode } = useAppTheme();
  const dark = themeMode === 'dark';
  const [photos, setPhotos] = useState<NativeGalleryPhoto[]>([]);
  const [album, setAlbum] = useState('All photos');
  const [selected, setSelected] = useState<NativeGalleryPhoto | null>(null);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState('');
  const [showAlbums, setShowAlbums] = useState(false);
  const [cameraFallback, setCameraFallback] = useState(false);

  useEffect(() => {
    let active = true;
    loadNativeGalleryPhotos()
      .then((items) => { if (active) setPhotos(items); })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Unable to access your photo library.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const albums = useMemo(() => ['All photos', ...Array.from(new Set(photos.map((photo) => photo.album).filter(Boolean))).sort((a, b) => a.localeCompare(b))], [photos]);
  const visiblePhotos = useMemo(() => album === 'All photos' ? photos : photos.filter((photo) => photo.album === album), [album, photos]);

  const choosePhoto = async () => {
    if (!selected || opening) return;
    setOpening(true);
    setError('');
    try {
      const file = await loadNativeGalleryImage(selected);
      await onSelect(file);
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to open this photo.');
    } finally {
      setOpening(false);
    }
  };

  const background = dark ? '#080b16' : '#f6f7fb';
  const surface = dark ? '#111827' : '#ffffff';
  const text = dark ? '#f8fafc' : '#111827';
  const muted = dark ? '#9ca3af' : '#6b7280';
  const border = dark ? 'rgba(148,163,184,.2)' : 'rgba(15,23,42,.12)';
  const buttonStyle: React.CSSProperties = { border: 0, color: text, background: dark ? '#1f2937' : '#e9edf5', borderRadius: 14, width: 42, height: 42, display: 'grid', placeItems: 'center', flexShrink: 0 };

  if (!isNativeGalleryAvailable()) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="Choose a photo" style={{ position: 'fixed', inset: 0, zIndex: 10050, background, color: text, display: 'flex', flexDirection: 'column', fontFamily: 'inherit' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid ' + border, background: surface }}>
        <button type="button" aria-label="Close gallery" onClick={onClose} style={buttonStyle}><ArrowLeft size={21} /></button>
        <button type="button" onClick={() => setShowAlbums((value) => !value)} style={{ minWidth: 0, flex: 1, display: 'flex', alignItems: 'center', gap: 8, border: 0, background: 'transparent', color: text, fontSize: 17, fontWeight: 800, textAlign: 'left' }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{album}</span><ChevronDown size={18} />
        </button>
        <button type="button" aria-label="Take a photo" onClick={() => setCameraFallback(true)} style={buttonStyle}><Camera size={20} /></button>
      </header>

      {showAlbums && <div style={{ position: 'absolute', top: 72, left: 70, right: 64, zIndex: 2, maxHeight: '55vh', overflowY: 'auto', border: '1px solid ' + border, borderRadius: 16, background: surface, boxShadow: '0 18px 50px rgba(0,0,0,.35)', padding: 6 }}>
        {albums.map((item) => <button key={item} type="button" onClick={() => { setAlbum(item); setShowAlbums(false); setSelected(null); }} style={{ width: '100%', border: 0, borderRadius: 10, background: item === album ? (dark ? '#263449' : '#e7edfa') : 'transparent', color: text, padding: '12px 13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left', fontWeight: item === album ? 800 : 500 }}>
          <span>{item}</span><span style={{ color: muted, fontSize: 12 }}>{item === 'All photos' ? photos.length : photos.filter((photo) => photo.album === item).length}</span>
        </button>)}
      </div>}

      {cameraFallback && <div style={{ position: 'absolute', inset: 0, zIndex: 4, background, display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
        <div style={{ maxWidth: 340 }}>
          <div style={{ margin: '0 auto 12px', width: 54, height: 54, display: 'grid', placeItems: 'center', borderRadius: 18, background: dark ? '#1f2937' : '#e9edf5' }}><Camera size={26} /></div>
          <h3 style={{ margin: '0 0 8px' }}>Take a photo</h3>
          <p style={{ color: muted, lineHeight: 1.5 }}>Use your phone camera, then return here to continue.</p>
          <input type="file" accept="image/*" capture="environment" onChange={async (event) => { const file = event.target.files?.[0]; event.target.value = ''; if (file) { await onSelect(file); onClose(); } }} style={{ display: 'block', width: '100%', margin: '16px 0' }} />
          <button type="button" onClick={() => setCameraFallback(false)} style={{ border: '1px solid ' + border, color: text, background: 'transparent', borderRadius: 12, padding: '11px 18px' }}>Back to gallery</button>
        </div>
      </div>}

      <main style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 3 }}>
        {loading ? <div style={{ minHeight: '50vh', display: 'grid', placeItems: 'center', color: muted }}><div style={{ display: 'grid', justifyItems: 'center', gap: 10 }}><LoaderCircle size={28} className="native-gallery-spin" /><span>Loading your photos…</span></div></div>
          : error && photos.length === 0 ? <div style={{ minHeight: '50vh', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}><div><ImageIcon size={34} color={muted} /><p>{error}</p><button type="button" onClick={onClose} style={{ border: 0, borderRadius: 12, padding: '11px 16px', background: '#6d5dfc', color: '#fff', fontWeight: 800 }}>Close</button></div></div>
          : visiblePhotos.length === 0 ? <div style={{ minHeight: '50vh', display: 'grid', placeItems: 'center', color: muted, textAlign: 'center', padding: 24 }}><div><ImageIcon size={34} /><p>No photos in this album yet.</p></div></div>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 3 }}>
            {visiblePhotos.map((photo) => <button key={photo.id} type="button" aria-label={'Select ' + photo.name} onClick={() => setSelected(photo)} style={{ position: 'relative', padding: 0, border: selected?.id === photo.id ? '3px solid #7c6cff' : '3px solid transparent', borderRadius: 4, aspectRatio: '1 / 1', overflow: 'hidden', background: dark ? '#1f2937' : '#e5e7eb' }}>
              {photo.thumbnail ? <img src={photo.thumbnail} alt={photo.name} loading="lazy" style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}><ImageIcon size={22} color={muted} /></div>}
              {selected?.id === photo.id && <span style={{ position: 'absolute', top: 6, right: 6, width: 25, height: 25, display: 'grid', placeItems: 'center', borderRadius: '50%', background: '#7666ff', color: '#fff', boxShadow: '0 1px 5px rgba(0,0,0,.35)' }}><Check size={16} strokeWidth={3} /></span>}
            </button>)}
          </div>}
      </main>

      <footer style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 16px calc(12px + env(safe-area-inset-bottom))', borderTop: '1px solid ' + border, background: surface }}>
        <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          {selected?.thumbnail ? <img src={selected.thumbnail} alt="" style={{ width: 42, height: 42, borderRadius: 9, objectFit: 'cover' }} /> : <div style={{ width: 42, height: 42, borderRadius: 9, background: dark ? '#1f2937' : '#e9edf5', display: 'grid', placeItems: 'center' }}><ImageIcon size={19} color={muted} /></div>}
          <div style={{ minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 800 }}>{selected ? '1 photo selected' : 'Select a photo'}</div><div style={{ color: muted, fontSize: 11, maxWidth: '42vw', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected?.name || 'Your photos stay on your device until you choose one'}</div></div>
        </div>
        <button type="button" disabled={!selected || opening} onClick={choosePhoto} style={{ border: 0, borderRadius: 14, minWidth: 96, padding: '13px 19px', background: !selected || opening ? (dark ? '#374151' : '#d1d5db') : 'linear-gradient(135deg,#7867ff,#5145cd)', color: !selected || opening ? muted : '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {opening ? <LoaderCircle size={17} className="native-gallery-spin" /> : null}{opening ? 'Opening…' : 'Next'}
        </button>
      </footer>
      <style>{'@keyframes native-gallery-rotate { to { transform: rotate(360deg); } } .native-gallery-spin { animation: native-gallery-rotate 1s linear infinite; }'}</style>
    </div>
  );
};

export default NativeGalleryModal;
