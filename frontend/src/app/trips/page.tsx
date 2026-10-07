'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { bookingsAPI, Booking } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/Toast';
import Link from 'next/link';

export default function TripsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [trips, setTrips] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');

  useEffect(() => {
    if (authLoading) return;
    if (!token) { router.push('/'); return; }
    bookingsAPI.getMyTrips(token).then(setTrips).finally(() => setLoading(false));
  }, [token, authLoading]);

  const today = new Date().toISOString().split('T')[0];
  const upcoming = trips.filter(t => t.status !== 'cancelled' && t.check_out >= today);
  const past = trips.filter(t => t.status !== 'cancelled' && t.check_out < today);
  const cancelled = trips.filter(t => t.status === 'cancelled');

  const filteredTrips = tab === 'upcoming' ? upcoming : tab === 'past' ? past : cancelled;

  const handleCancel = async (bookingId: number) => {
    if (!token || !confirm('Cancel this booking?')) return;
    try {
      await bookingsAPI.cancel(token, bookingId);
      setTrips(prev => prev.map(t => t.id === bookingId ? { ...t, status: 'cancelled' } : t));
      showToast('Booking cancelled');
    } catch (err: unknown) {
      showToast((err as Error).message || 'Cancel failed', 'error');
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '24px' }}>Trips</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', borderBottom: '1px solid #DDDDDD', paddingBottom: '0' }}>
        {(['upcoming', 'past', 'cancelled'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{ padding: '12px 16px', fontSize: '14px', fontWeight: tab === t ? 600 : 400, color: tab === t ? '#222' : '#717171', cursor: 'pointer', background: 'none', border: 'none', borderBottom: `2px solid ${tab === t ? '#222' : 'transparent'}`, fontFamily: 'inherit', transition: 'all 0.15s', textTransform: 'capitalize' }}
          >
            {t} ({t === 'upcoming' ? upcoming.length : t === 'past' ? past.length : cancelled.length})
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}><span className="spinner spinner-dark" /></div>
      ) : filteredTrips.length === 0 ? (
        <EmptyTrips tab={tab} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {filteredTrips.map(trip => (
            <div key={trip.id} style={{ display: 'flex', gap: '20px', border: '1px solid #DDDDDD', borderRadius: '16px', overflow: 'hidden', transition: 'box-shadow 0.2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 16px rgba(0,0,0,0.12)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}
            >
              <Link href={`/listings/${trip.listing_id}`} style={{ width: '200px', flexShrink: 0, overflow: 'hidden' }}>
                {trip.listing?.images?.[0] && (
                  <img src={trip.listing.images[0].url} alt={trip.listing?.title} style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: '160px' }} />
                )}
              </Link>
              <div style={{ flex: 1, padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <Link href={`/listings/${trip.listing_id}`} style={{ fontSize: '18px', fontWeight: 700, textDecoration: 'none', color: '#222' }}>
                      {trip.listing?.title}
                    </Link>
                    <p style={{ fontSize: '14px', color: '#717171', marginTop: '4px' }}>{trip.listing?.city}, {trip.listing?.country}</p>
                  </div>
                  <span className={`status-${trip.status}`}>{trip.status}</span>
                </div>

                <div style={{ display: 'flex', gap: '24px', marginTop: '12px', fontSize: '14px', color: '#717171' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px', color: '#222' }}>Check-in</div>
                    {formatDate(trip.check_in)}
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px', color: '#222' }}>Checkout</div>
                    {formatDate(trip.check_out)}
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px', color: '#222' }}>Guests</div>
                    {trip.num_guests}
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px', color: '#222' }}>Total</div>
                    ${trip.total_price.toLocaleString()}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                  <Link href={`/listings/${trip.listing_id}`} className="btn btn-secondary btn-sm" style={{ borderRadius: '8px' }}>View listing</Link>
                  {trip.status === 'confirmed' && (
                    <button className="btn btn-ghost btn-sm" style={{ borderRadius: '8px', color: '#FF385C', border: '1px solid #FF385C' }} onClick={() => handleCancel(trip.id)}>Cancel</button>
                  )}
                  {tab === 'past' && (
                    <Link href={`/listings/${trip.listing_id}?review=1`} className="btn btn-ghost btn-sm" style={{ borderRadius: '8px' }}>Write a review</Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyTrips({ tab }: { tab: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>
        {tab === 'upcoming' ? '🧳' : tab === 'past' ? '🗺️' : '❌'}
      </div>
      <h3 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '8px' }}>
        {tab === 'upcoming' ? 'No upcoming trips' : tab === 'past' ? 'No past trips' : 'No cancelled trips'}
      </h3>
      <p style={{ fontSize: '16px', color: '#717171', marginBottom: '24px' }}>
        {tab === 'upcoming' ? "You don't have any upcoming trips. Time to plan your next adventure!" : "Your trip history will appear here."}
      </p>
      {tab === 'upcoming' && <Link href="/" className="btn btn-primary" style={{ borderRadius: '8px' }}>Start exploring</Link>}
    </div>
  );
}
