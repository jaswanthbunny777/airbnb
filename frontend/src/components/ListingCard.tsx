/* eslint-disable */
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ListingCard } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { wishlistsAPI } from '@/lib/api';
import { useToast } from './Toast';

interface Props { listing: ListingCard; }

export default function ListingCardComponent({ listing }: Props) {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const [wishlisted, setWishlisted] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);

  const images = listing.images?.length ? listing.images : [{ url: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800', position: 0 }];
  const mainImage = images[imgIdx]?.url || images[0]?.url;

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token) { showToast('Please log in to save listings', 'error'); return; }
    try {
      const result = await wishlistsAPI.toggle(token, listing.id);
      setWishlisted(result.action === 'added');
      showToast(result.action === 'added' ? 'Added to wishlist!' : 'Removed from wishlist');
    } catch { showToast('Something went wrong', 'error'); }
  };

  const prevImg = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setImgIdx(i => (i - 1 + images.length) % images.length);
  };

  const nextImg = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setImgIdx(i => (i + 1) % images.length);
  };

  return (
    <Link href={`/listings/${listing.id}`} className="listing-card" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
      {/* Image */}
      <div className="listing-card-image">
        <img src={mainImage} alt={listing.title} loading="lazy" />

        {/* Heart */}
        <button className="listing-card-heart" onClick={toggleWishlist} title="Save to wishlist">
          <svg viewBox="0 0 32 32" width="24" height="24">
            <path
              d="M16 28C16 28 4 20 4 11.5A7.5 7.5 0 0 1 16 6.2 7.5 7.5 0 0 1 28 11.5C28 20 16 28 16 28z"
              fill={wishlisted ? '#FF385C' : 'rgba(0,0,0,0.5)'}
              stroke="white"
              strokeWidth="2"
            />
          </svg>
        </button>

        {/* Carousel controls */}
        {images.length > 1 && (
          <>
            {imgIdx > 0 && (
              <button onClick={prevImg} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.18)' }}>
                <svg viewBox="0 0 32 32" width="12" height="12"><path d="M20 4L8 16l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/></svg>
              </button>
            )}
            {imgIdx < images.length - 1 && (
              <button onClick={nextImg} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.18)' }}>
                <svg viewBox="0 0 32 32" width="12" height="12"><path d="M12 4l12 12-12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/></svg>
              </button>
            )}
            {/* Dots */}
            <div className="dots">
              {images.slice(0, 5).map((_, i) => (
                <div key={i} className={`dot ${i === imgIdx ? 'active' : ''}`} />
              ))}
            </div>
          </>
        )}

        {/* Superhost badge */}
        {listing.host?.is_superhost && (
          <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'white', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', fontWeight: 700, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
            ★ Superhost
          </div>
        )}
      </div>

      {/* Info */}
      <div className="listing-card-info">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span className="listing-card-location truncate" style={{ flex: 1 }}>
            {listing.city}, {listing.country}
          </span>
          {listing.avg_rating > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '14px', fontWeight: 500, flexShrink: 0, marginLeft: '8px' }}>
              ★ {listing.avg_rating.toFixed(2)}
            </span>
          )}
        </div>
        <div className="listing-card-meta line-clamp-2" style={{ fontSize: '14px', color: '#717171', marginTop: '2px' }}>
          {listing.title}
        </div>
        <div className="listing-card-price" style={{ marginTop: '6px' }}>
          <strong>${listing.price_per_night.toLocaleString()}</strong>
          <span style={{ color: '#717171' }}> night</span>
        </div>
      </div>
    </Link>
  );
}
