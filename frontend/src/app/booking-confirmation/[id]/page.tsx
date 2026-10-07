'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { bookingsAPI, Booking } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

export default function BookingConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { router.push('/'); return; }
    bookingsAPI.getMyTrips(token).then(trips => {
      const b = trips.find(t => t.id === Number(id));
      if (b) setBooking(b); else router.push('/trips');
    }).finally(() => setLoading(false));
  }, [id, token]);

  if (loading) return <div style={{ padding: '80px', textAlign: 'center' }}><span className="spinner spinner-dark" /></div>;
  if (!booking) return null;

  const nights = Math.ceil((new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / (1000 * 60 * 60 * 24));
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px' }}>
      {/* Success banner */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
        <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>Your trip is confirmed!</h1>
        <p style={{ fontSize: '16px', color: '#717171' }}>You&apos;re all set. We hope you enjoy your stay!</p>
      </div>

      {/* Booking card */}
      <div style={{ border: '1px solid #DDDDDD', borderRadius: '16px', overflow: 'hidden', marginBottom: '32px' }}>
        {booking.listing?.images?.[0] && (
          <img src={booking.listing.images[0].url} alt={booking.listing.title} style={{ width: '100%', height: '240px', objectFit: 'cover' }} />
        )}
        <div style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>{booking.listing?.title}</h2>
          <p style={{ fontSize: '15px', color: '#717171', marginBottom: '24px' }}>
            {booking.listing?.city}, {booking.listing?.country}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '16px', background: '#F7F7F7', borderRadius: '12px', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#717171', marginBottom: '4px' }}>Check-in</div>
              <div style={{ fontWeight: 600 }}>{formatDate(booking.check_in)}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#717171', marginBottom: '4px' }}>Checkout</div>
              <div style={{ fontWeight: 600 }}>{formatDate(booking.check_out)}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#717171' }}>{nights} night{nights !== 1 ? 's' : ''} · {booking.num_guests} guest{booking.num_guests !== 1 ? 's' : ''}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid #DDDDDD', paddingTop: '12px', marginTop: '4px' }}>
              <span>Total paid</span>
              <span>${booking.total_price.toLocaleString()}</span>
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <span className={`status-${booking.status}`}>{booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span>
            <span style={{ marginLeft: '8px', fontSize: '13px', color: '#717171' }}>Booking #{booking.id}</span>
          </div>
        </div>
      </div>

      {/* Important info */}
      <div style={{ padding: '24px', background: '#F7F7F7', borderRadius: '12px', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>Important information</h3>
        <ul style={{ fontSize: '14px', color: '#717171', display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '20px' }}>
          <li>The host will be in touch within 24 hours to confirm any special requests.</li>
          <li>Check-in time is typically after 3:00 PM.</li>
          <li>Please review house rules before arriving.</li>
          <li>Contact your host if you need early check-in arrangements.</li>
        </ul>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <Link href="/trips" className="btn btn-primary" style={{ borderRadius: '8px' }}>View all trips</Link>
        <Link href="/" className="btn btn-secondary" style={{ borderRadius: '8px' }}>Explore more homes</Link>
        <Link href={`/listings/${booking.listing_id}`} className="btn btn-ghost" style={{ borderRadius: '8px' }}>View listing</Link>
      </div>
    </div>
  );
}
