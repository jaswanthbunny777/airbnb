'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { wishlistsAPI, Wishlist } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

export default function WishlistsPage() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!token) { router.push('/'); return; }
    wishlistsAPI.getAll(token).then(setWishlists).finally(() => setLoading(false));
  }, [token, authLoading]);

  if (loading) return <div style={{ padding: '80px', textAlign: 'center' }}><span className="spinner spinner-dark" /></div>;

  const totalSaved = wishlists.reduce((s, w) => s + w.listings.length, 0);

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>Wishlists</h1>
      <p style={{ fontSize: '16px', color: '#717171', marginBottom: '32px' }}>
        {totalSaved} saved place{totalSaved !== 1 ? 's' : ''}
      </p>

      {wishlists.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❤️</div>
          <h3 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '8px' }}>Save your favorites</h3>
          <p style={{ color: '#717171', marginBottom: '24px' }}>Tap the heart on any listing to save it to a wishlist.</p>
          <Link href="/" className="btn btn-primary" style={{ borderRadius: '8px' }}>Start exploring</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
          {wishlists.map(w => (
            <WishlistCard key={w.id} wishlist={w} />
          ))}
        </div>
      )}
    </div>
  );
}

function WishlistCard({ wishlist }: { wishlist: Wishlist }) {
  const imgs = wishlist.listings.slice(0, 4).map(l => l.images?.[0]?.url).filter(Boolean);

  return (
    <div style={{ cursor: 'pointer' }}>
      {/* Photo grid */}
      <div style={{ borderRadius: '16px', overflow: 'hidden', aspectRatio: '1', display: 'grid', gridTemplateColumns: imgs.length >= 2 ? '1fr 1fr' : '1fr', gridTemplateRows: imgs.length >= 3 ? '1fr 1fr' : '1fr', gap: '4px', background: '#F7F7F7', marginBottom: '12px' }}>
        {imgs.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', color: '#DDDDDD' }}>❤️</div>
        ) : imgs.map((url, i) => (
          <img key={i} src={url || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ))}
      </div>
      <div style={{ fontSize: '15px', fontWeight: 600 }}>{wishlist.name}</div>
      <div style={{ fontSize: '14px', color: '#717171', marginTop: '4px' }}>
        {wishlist.listings.length} place{wishlist.listings.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
