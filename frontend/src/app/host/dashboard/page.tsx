'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { listingsAPI, bookingsAPI, ListingCard, Booking } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/Toast';
import Link from 'next/link';

type Tab = 'listings' | 'bookings';

export default function HostDashboard() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>('listings');
  const [listings, setListings] = useState<ListingCard[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!token) { router.push('/'); return; }
    Promise.all([
      listingsAPI.getMyListings(token),
      bookingsAPI.getHostBookings(token),
    ]).then(([l, b]) => { setListings(l); setBookings(b); })
      .finally(() => setLoading(false));
  }, [token, authLoading]);

  const handleDelete = async (id: number) => {
    if (!token || !confirm('Delete this listing? This cannot be undone.')) return;
    try {
      await listingsAPI.delete(token, id);
      setListings(prev => prev.filter(l => l.id !== id));
      showToast('Listing deleted');
    } catch (err: unknown) {
      showToast((err as Error).message || 'Delete failed', 'error');
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const stats = {
    totalListings: listings.length,
    activeBookings: bookings.filter(b => b.status === 'confirmed').length,
    totalRevenue: bookings.filter(b => b.status !== 'cancelled').reduce((s, b) => s + b.total_price, 0),
    avgRating: listings.length > 0 ? listings.reduce((s, l) => s + (l.avg_rating || 0), 0) / listings.length : 0,
  };

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '4px' }}>
            Welcome, {user?.first_name}! 👋
          </h1>
          <p style={{ fontSize: '16px', color: '#717171' }}>Manage your Airbnb hosting business</p>
        </div>
        <Link href="/host/new" className="btn btn-primary" style={{ borderRadius: '8px' }}>
          + New listing
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '40px' }}>
        {[
          { label: 'Total listings', value: stats.totalListings, icon: '🏠' },
          { label: 'Active bookings', value: stats.activeBookings, icon: '📅' },
          { label: 'Total revenue', value: `$${stats.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: '💰' },
          { label: 'Avg. rating', value: stats.avgRating > 0 ? `★ ${stats.avgRating.toFixed(2)}` : 'N/A', icon: '⭐' },
        ].map(s => (
          <div key={s.label} style={{ border: '1px solid #DDDDDD', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>{s.icon}</div>
            <div style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>{s.value}</div>
            <div style={{ fontSize: '13px', color: '#717171' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #DDDDDD', marginBottom: '24px' }}>
        {(['listings', 'bookings'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '12px 20px', fontWeight: tab === t ? 600 : 400, color: tab === t ? '#222' : '#717171', cursor: 'pointer', background: 'none', border: 'none', borderBottom: `2px solid ${tab === t ? '#222' : 'transparent'}`, fontFamily: 'inherit', textTransform: 'capitalize', fontSize: '15px' }}>
            {t} {t === 'listings' ? `(${listings.length})` : `(${bookings.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}><span className="spinner spinner-dark" /></div>
      ) : tab === 'listings' ? (
        <ListingsTab listings={listings} onDelete={handleDelete} />
      ) : (
        <BookingsTab bookings={bookings} formatDate={formatDate} />
      )}
    </div>
  );
}

function ListingsTab({ listings, onDelete }: { listings: ListingCard[]; onDelete: (id: number) => void }) {
  if (listings.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏠</div>
        <h3 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '8px' }}>No listings yet</h3>
        <p style={{ color: '#717171', marginBottom: '24px' }}>Create your first listing and start earning!</p>
        <Link href="/host/new" className="btn btn-primary" style={{ borderRadius: '8px' }}>Create a listing</Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
      {listings.map(l => (
        <div key={l.id} style={{ border: '1px solid #DDDDDD', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
            <img src={l.images?.[0]?.url || ''} alt={l.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'white', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', fontWeight: 600 }}>
              ${l.price_per_night}/night
            </div>
          </div>
          <div style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</h3>
            <p style={{ fontSize: '13px', color: '#717171', marginBottom: '8px' }}>{l.city}, {l.country}</p>
            {l.avg_rating > 0 && (
              <p style={{ fontSize: '13px', marginBottom: '12px' }}>★ {l.avg_rating.toFixed(2)} · {l.num_reviews} reviews</p>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link href={`/host/listings/${l.id}/edit`} className="btn btn-secondary btn-sm" style={{ flex: 1, borderRadius: '8px', justifyContent: 'center' }}>Edit</Link>
              <Link href={`/listings/${l.id}`} className="btn btn-ghost btn-sm" style={{ flex: 1, borderRadius: '8px', justifyContent: 'center' }}>View</Link>
              <button className="btn btn-ghost btn-sm" style={{ color: '#FF385C', borderRadius: '8px' }} onClick={() => onDelete(l.id)}>Delete</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function BookingsTab({ bookings, formatDate }: { bookings: Booking[]; formatDate: (d: string) => string }) {
  if (bookings.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
        <h3 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '8px' }}>No bookings yet</h3>
        <p style={{ color: '#717171' }}>Your guest bookings will appear here.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {bookings.map(b => (
        <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', border: '1px solid #DDDDDD', borderRadius: '12px' }}>
          {b.listing?.images?.[0] && (
            <img src={b.listing.images[0].url} alt={b.listing?.title} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.listing?.title}</div>
            <div style={{ fontSize: '13px', color: '#717171', marginTop: '2px' }}>
              {formatDate(b.check_in)} → {formatDate(b.check_out)} · {b.num_guests} guest{b.num_guests !== 1 ? 's' : ''}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '15px' }}>${b.total_price.toLocaleString()}</div>
            <div style={{ marginTop: '4px' }}><span className={`status-${b.status}`}>{b.status}</span></div>
          </div>
        </div>
      ))}
    </div>
  );
}
