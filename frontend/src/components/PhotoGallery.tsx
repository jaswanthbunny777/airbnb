/* eslint-disable */
'use client';
import { useState, useEffect } from 'react';

interface Props { images: string[]; title: string; onClose: () => void; }

export default function PhotoGallery({ images, title, onClose }: Props) {
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent(i => (i - 1 + images.length) % images.length);
  const next = () => setCurrent(i => (i + 1) % images.length);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 9000, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', color: 'white' }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontFamily: 'inherit' }}>
          <svg viewBox="0 0 32 32" width="16" height="16" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 6l20 20M26 6L6 26"/>
          </svg>
          Close
        </button>
        <span style={{ fontSize: '15px' }}>{current + 1} / {images.length}</span>
        <div style={{ width: '64px' }} />
      </div>

      {/* Main image */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '0 80px', overflow: 'hidden' }}>
        <img
          src={images[current]}
          alt={`${title} - photo ${current + 1}`}
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px' }}
        />
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '48px', height: '48px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg viewBox="0 0 32 32" width="20" height="20" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M20 4L8 16l12 12"/>
              </svg>
            </button>
            <button
              onClick={next}
              style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '48px', height: '48px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg viewBox="0 0 32 32" width="20" height="20" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 4l12 12-12 12"/>
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      <div style={{ display: 'flex', gap: '8px', padding: '16px 24px', overflowX: 'auto', justifyContent: 'center', flexShrink: 0 }}>
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            style={{ flexShrink: 0, width: '72px', height: '54px', borderRadius: '6px', overflow: 'hidden', border: `2px solid ${i === current ? 'white' : 'transparent'}`, cursor: 'pointer', background: 'none', padding: 0, opacity: i === current ? 1 : 0.6, transition: 'all 0.15s' }}
          >
            <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </button>
        ))}
      </div>
    </div>
  );
}
