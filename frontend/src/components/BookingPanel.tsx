/* eslint-disable */
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ListingDetail, BookedDateRange, bookingsAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from './Toast';
import { DayPicker, DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

interface Props {
  listing: ListingDetail;
  bookedDates: BookedDateRange[];
}

export default function BookingPanel({ listing, bookedDates }: Props) {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [range, setRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build disabled days from booked ranges
  const disabledDays = bookedDates.flatMap(b => {
    const days: Date[] = [];
    const start = new Date(b.check_in);
    const end = new Date(b.check_out);
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    return days;
  });

  const nights = range?.from && range?.to
    ? Math.ceil((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const nightly = listing.price_per_night * nights;
  const total = nightly + listing.cleaning_fee + listing.service_fee;

  const formatDate = (d?: Date) => d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Add date';

  const handleBook = async () => {
    if (!token) { showToast('Please log in to book', 'error'); return; }
    if (!range?.from || !range?.to) { showToast('Please select dates', 'error'); return; }

    setLoading(true);
    try {
      const toLocalStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const booking = await bookingsAPI.create(token, {
        listing_id: listing.id,
        check_in: toLocalStr(range.from),
        check_out: toLocalStr(range.to),
        num_guests: guests,
      });
      showToast('Booking confirmed!');
      router.push(`/booking-confirmation/${booking.id}`);
    } catch (err: any) {
      showToast(err.message || 'Booking failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="price-box">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '24px' }}>
        <span style={{ fontSize: '22px', fontWeight: 700 }}>${listing.price_per_night.toLocaleString()}</span>
        <span style={{ fontSize: '15px', color: '#717171' }}>night</span>
        {listing.avg_rating > 0 && (
          <span style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            ★ {listing.avg_rating.toFixed(2)} · <span style={{ color: '#717171' }}>{listing.num_reviews} reviews</span>
          </span>
        )}
      </div>

      {/* Date picker */}
      <div style={{ border: '1.5px solid #222', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #DDDDDD' }}>
          <button
            onClick={() => { setShowCalendar(!showCalendar); setShowGuestPicker(false); }}
            style={{ padding: '10px 12px', borderRight: '1px solid #DDDDDD', cursor: 'pointer', background: 'none', border: 'none', textAlign: 'left', fontFamily: 'inherit' }}
          >
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '2px' }}>Check-in</div>
            <div style={{ fontSize: '14px', color: range?.from ? '#222' : '#717171' }}>{formatDate(range?.from)}</div>
          </button>
          <button
            onClick={() => { setShowCalendar(!showCalendar); setShowGuestPicker(false); }}
            style={{ padding: '10px 12px', cursor: 'pointer', background: 'none', border: 'none', textAlign: 'left', fontFamily: 'inherit' }}
          >
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '2px' }}>Checkout</div>
            <div style={{ fontSize: '14px', color: range?.to ? '#222' : '#717171' }}>{formatDate(range?.to)}</div>
          </button>
        </div>
        <button
          onClick={() => { setShowGuestPicker(!showGuestPicker); setShowCalendar(false); }}
          style={{ width: '100%', padding: '10px 12px', cursor: 'pointer', background: 'none', border: 'none', textAlign: 'left', fontFamily: 'inherit' }}
        >
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '2px' }}>Guests</div>
          <div style={{ fontSize: '14px', color: '#222' }}>{guests} guest{guests !== 1 ? 's' : ''}</div>
        </button>
      </div>

      {/* Calendar popup */}
      {showCalendar && (
        <div style={{ border: '1px solid #DDDDDD', borderRadius: '12px', padding: '16px', marginBottom: '12px', background: 'white' }}>
          <DayPicker
            mode="range"
            selected={range}
            onSelect={setRange}
            numberOfMonths={1}
            disabled={[{ before: today }, ...disabledDays]}
            modifiersStyles={{ selected: { background: '#222', color: 'white' }, range_middle: { background: '#f0f0f0' } }}
          />
          {range?.from && range?.to && (
            <button
              className="btn btn-secondary btn-sm"
              style={{ marginTop: '8px', width: '100%', borderRadius: '8px' }}
              onClick={() => setShowCalendar(false)}
            >
              Done
            </button>
          )}
        </div>
      )}

      {/* Guest picker */}
      {showGuestPicker && (
        <div style={{ border: '1px solid #DDDDDD', borderRadius: '12px', padding: '16px', marginBottom: '12px', background: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '15px' }}>Guests</div>
              <div style={{ fontSize: '13px', color: '#717171' }}>Max {listing.max_guests} guests</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={() => setGuests(g => Math.max(1, g - 1))}
                disabled={guests === 1}
                style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #DDDDDD', background: 'white', cursor: guests === 1 ? 'not-allowed' : 'pointer', opacity: guests === 1 ? 0.3 : 1, fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >−</button>
              <span style={{ fontSize: '15px', fontWeight: 500 }}>{guests}</span>
              <button
                onClick={() => setGuests(g => Math.min(listing.max_guests, g + 1))}
                disabled={guests === listing.max_guests}
                style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #DDDDDD', background: 'white', cursor: guests === listing.max_guests ? 'not-allowed' : 'pointer', opacity: guests === listing.max_guests ? 0.3 : 1, fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >+</button>
            </div>
          </div>
        </div>
      )}

      {/* Reserve button */}
      <button
        className="btn btn-gradient btn-full"
        style={{ borderRadius: '8px', padding: '14px', fontSize: '16px', marginBottom: '16px' }}
        onClick={handleBook}
        disabled={loading}
      >
        {loading ? <span className="spinner" /> : nights > 0 ? 'Reserve' : 'Check availability'}
      </button>

      <p style={{ textAlign: 'center', fontSize: '14px', color: '#717171', marginBottom: '16px' }}>You won't be charged yet</p>

      {/* Price breakdown */}
      {nights > 0 && (
        <>
          <div className="price-row">
            <span style={{ textDecoration: 'underline' }}>${listing.price_per_night.toLocaleString()} × {nights} night{nights !== 1 ? 's' : ''}</span>
            <span>${nightly.toLocaleString()}</span>
          </div>
          {listing.cleaning_fee > 0 && (
            <div className="price-row">
              <span style={{ textDecoration: 'underline' }}>Cleaning fee</span>
              <span>${listing.cleaning_fee.toLocaleString()}</span>
            </div>
          )}
          {listing.service_fee > 0 && (
            <div className="price-row">
              <span style={{ textDecoration: 'underline' }}>Airbnb service fee</span>
              <span>${listing.service_fee.toLocaleString()}</span>
            </div>
          )}
          <div className="price-row price-row-total">
            <span>Total before taxes</span>
            <span>${total.toLocaleString()}</span>
          </div>
        </>
      )}
    </div>
  );
}
