'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { listingsAPI, reviewsAPI, bookingsAPI, ListingDetail, Review, BookedDateRange } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/Toast';
import BookingPanel from '@/components/BookingPanel';
import PhotoGallery from '@/components/PhotoGallery';
import ReviewCard from '@/components/ReviewCard';

const AMENITY_ICONS: Record<string, string> = {
  'Wifi': '📶', 'Kitchen': '🍳', 'Washer': '🫧', 'Dryer': '💨', 'Air conditioning': '❄️',
  'Heating': '🔥', 'TV': '📺', 'Iron': '👔', 'Pool': '🏊', 'Hot tub': '🛁',
  'Free parking': '🚗', 'EV charger': '⚡', 'Gym': '💪', 'BBQ grill': '🍖',
  'Breakfast': '🥞', 'Indoor fireplace': '🪵', 'Beachfront': '🏖️', 'Waterfront': '🌊',
  'Ski-in/Ski-out': '⛷️', 'Smoke alarm': '🚨', 'Carbon monoxide alarm': '⚠️',
  'Fire extinguisher': '🧯', 'First aid kit': '🏥', 'Workspace': '💼',
  'Self check-in': '🔑', 'Luggage dropoff': '🧳', 'Long term stays': '📅', 'Pets allowed': '🐾',
};

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, token } = useAuth();
  const { showToast } = useToast();

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [bookedDates, setBookedDates] = useState<BookedDateRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [galleryOpen, setGalleryOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    const lid = Number(id);
    Promise.all([
      listingsAPI.getById(lid),
      reviewsAPI.getByListing(lid),
      bookingsAPI.getBookedDates(lid),
    ]).then(([l, r, b]) => {
      setListing(l);
      setReviews(r);
      setBookedDates(b);
    }).catch(() => router.push('/'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSkeleton />;
  if (!listing) return null;

  const images = listing.images?.length ? listing.images : [];
  const mainImg = images[0]?.url || 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1200';

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '24px' }}>
      {/* Title */}
      <h1 style={{ fontSize: '26px', fontWeight: 700, marginBottom: '8px' }}>{listing.title}</h1>
      
      {/* Rating + Location row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', flexWrap: 'wrap', fontSize: '15px' }}>
        {listing.avg_rating > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
            ★ {listing.avg_rating.toFixed(2)} · <span style={{ fontWeight: 400, textDecoration: 'underline', cursor: 'pointer' }}>{listing.num_reviews} reviews</span>
          </span>
        )}
        {listing.host?.is_superhost && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            🏅 <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Superhost</span>
          </span>
        )}
        <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>
          {listing.city}, {listing.state ? `${listing.state}, ` : ''}{listing.country}
        </span>
      </div>

      {/* Photo Grid */}
      <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', marginBottom: '40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '8px', height: '480px' }}>
          <div style={{ gridRow: '1 / 3', overflow: 'hidden' }}>
            <img src={mainImg} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} onClick={() => setGalleryOpen(true)} />
          </div>
          {images.slice(1, 5).map((img, i) => (
            <div key={i} style={{ overflow: 'hidden' }}>
              <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} onClick={() => setGalleryOpen(true)} />
            </div>
          ))}
        </div>
        <button
          onClick={() => setGalleryOpen(true)}
          style={{ position: 'absolute', bottom: '16px', right: '16px', background: 'white', border: '1.5px solid #222', borderRadius: '8px', padding: '8px 16px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
            <rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/>
            <rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/>
          </svg>
          Show all photos
        </button>
      </div>

      {/* Main layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '64px', alignItems: 'start' }}>
        <div>
          {/* Host info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '24px', borderBottom: '1px solid #DDDDDD', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '4px' }}>
                {listing.property_type} hosted by {listing.host?.first_name}
              </h2>
              <div style={{ fontSize: '15px', color: '#717171' }}>
                {listing.max_guests} guests · {listing.bedrooms} bedroom{listing.bedrooms !== 1 ? 's' : ''} · {listing.beds} bed{listing.beds !== 1 ? 's' : ''} · {listing.bathrooms} bath{listing.bathrooms !== 1 ? 's' : ''}
              </div>
            </div>
            {listing.host?.avatar_url && (
              <img src={listing.host.avatar_url} alt={listing.host.first_name} style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            )}
          </div>

          {/* Highlights */}
          <div style={{ paddingBottom: '24px', borderBottom: '1px solid #DDDDDD', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {listing.host?.is_superhost && (
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '24px' }}>🏅</span>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>{listing.host.first_name} is a Superhost</div>
                  <div style={{ fontSize: '14px', color: '#717171' }}>Superhosts are experienced, highly rated hosts who are committed to providing great stays.</div>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '24px' }}>📅</span>
              <div>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>Free cancellation before check-in</div>
                <div style={{ fontSize: '14px', color: '#717171' }}>Cancel before check-in for a full refund.</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '24px' }}>🔑</span>
              <div>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>Self check-in</div>
                <div style={{ fontSize: '14px', color: '#717171' }}>Check yourself in with a lockbox.</div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div style={{ paddingBottom: '24px', borderBottom: '1px solid #DDDDDD', marginBottom: '24px' }}>
            <p style={{ fontSize: '15px', lineHeight: '1.7', whiteSpace: 'pre-line' }}>{listing.description}</p>
          </div>

          {/* Amenities */}
          <div style={{ paddingBottom: '24px', borderBottom: '1px solid #DDDDDD', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '20px' }}>What this place offers</h3>
            <div className="amenity-grid">
              {listing.amenities?.slice(0, 10).map(a => (
                <div key={a.id} className="amenity-item">
                  <span style={{ fontSize: '22px' }}>{AMENITY_ICONS[a.name] || '✓'}</span>
                  <span style={{ fontSize: '15px' }}>{a.name}</span>
                </div>
              ))}
            </div>
            {listing.amenities?.length > 10 && (
              <button className="btn btn-secondary" style={{ marginTop: '16px', borderRadius: '8px' }}>
                Show all {listing.amenities.length} amenities
              </button>
            )}
          </div>

          {/* Reviews */}
          {reviews.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                <span style={{ fontSize: '22px', fontWeight: 700 }}>★ {listing.avg_rating.toFixed(2)}</span>
                <span style={{ fontSize: '22px', fontWeight: 700, color: '#717171' }}>·</span>
                <span style={{ fontSize: '22px', fontWeight: 700 }}>{listing.num_reviews} reviews</span>
              </div>
              
              {/* Rating breakdown */}
              {reviews.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                  {[
                    { label: 'Cleanliness', value: reviews.reduce((s, r) => s + r.cleanliness, 0) / reviews.length },
                    { label: 'Accuracy', value: reviews.reduce((s, r) => s + r.accuracy, 0) / reviews.length },
                    { label: 'Communication', value: reviews.reduce((s, r) => s + r.communication, 0) / reviews.length },
                    { label: 'Location', value: reviews.reduce((s, r) => s + r.location_rating, 0) / reviews.length },
                    { label: 'Check-in', value: reviews.reduce((s, r) => s + r.check_in_rating, 0) / reviews.length },
                    { label: 'Value', value: reviews.reduce((s, r) => s + r.value, 0) / reviews.length },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '14px' }}>{item.label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <div style={{ flex: 1, height: '4px', background: '#DDDDDD', borderRadius: '2px' }}>
                          <div style={{ width: `${(item.value / 5) * 100}%`, height: '100%', background: '#222', borderRadius: '2px' }} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 600, minWidth: '28px' }}>{item.value.toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {reviews.slice(0, 6).map(r => <ReviewCard key={r.id} review={r} />)}
              </div>
            </div>
          )}

          {/* Map */}
          <div style={{ marginTop: '32px' }}>
            <h3 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '16px' }}>Where you&apos;ll be</h3>
            <p style={{ fontSize: '15px', marginBottom: '16px', color: '#717171' }}>
              {listing.city}{listing.state ? `, ${listing.state}` : ''}, {listing.country}
            </p>
            <div className="map-placeholder">
              <img
                src={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${listing.longitude},${listing.latitude},11,0/800x480?access_token=placeholder`}
                alt="Map"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => {
                  (e.target as HTMLImageElement).src = `https://maps.googleapis.com/maps/api/staticmap?center=${listing.latitude},${listing.longitude}&zoom=11&size=800x480&markers=${listing.latitude},${listing.longitude}&key=placeholder`;
                }}
              />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e0f0ff 0%, #b8dff5 50%, #90c5e8 100%)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>📍</div>
                  <div style={{ fontWeight: 600, fontSize: '16px' }}>
                    {listing.city}, {listing.country}
                  </div>
                  <div style={{ fontSize: '14px', color: '#717171', marginTop: '4px' }}>
                    {listing.latitude.toFixed(4)}, {listing.longitude.toFixed(4)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Host */}
          <div style={{ marginTop: '40px', paddingTop: '32px', borderTop: '1px solid #DDDDDD' }}>
            <h3 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '24px' }}>Meet your host</h3>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
              <div style={{ textAlign: 'center' }}>
                <img src={listing.host?.avatar_url || ''} alt={listing.host?.first_name} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', marginBottom: '8px' }} />
                <div style={{ fontWeight: 700, fontSize: '16px' }}>{listing.host?.first_name}</div>
                {listing.host?.is_superhost && <div style={{ fontSize: '12px', color: '#717171', marginTop: '4px' }}>🏅 Superhost</div>}
                <div style={{ fontSize: '13px', color: '#717171', marginTop: '4px' }}>
                  Hosting since {listing.host?.created_at ? formatDate(listing.host.created_at) : ''}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '15px', lineHeight: '1.6' }}>
                  {listing.host?.is_superhost && (
                    <p style={{ marginBottom: '12px' }}>
                      {listing.host.first_name} is a Superhost. Superhosts are highly rated hosts who have hosting experience.
                    </p>
                  )}
                </div>
                <div style={{ marginTop: '16px', padding: '16px', background: '#F7F7F7', borderRadius: '12px', fontSize: '14px', color: '#717171' }}>
                  <strong>📱 Contact</strong><br />
                  To protect your payment, never transfer money or communicate outside of the Airbnb website.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Panel */}
        <div>
          <BookingPanel listing={listing} bookedDates={bookedDates} />
        </div>
      </div>

      {/* Full-screen gallery */}
      {galleryOpen && (
        <PhotoGallery images={images.map(i => i.url)} title={listing.title} onClose={() => setGalleryOpen(false)} />
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '24px' }}>
      <div className="skeleton" style={{ height: '32px', width: '60%', marginBottom: '12px' }} />
      <div className="skeleton" style={{ height: '20px', width: '40%', marginBottom: '24px' }} />
      <div style={{ height: '480px', background: '#f0f0f0', borderRadius: '16px', marginBottom: '40px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '64px' }}>
        <div>
          <div className="skeleton" style={{ height: '24px', width: '70%', marginBottom: '16px' }} />
          <div className="skeleton" style={{ height: '16px', width: '50%', marginBottom: '32px' }} />
          <div className="skeleton" style={{ height: '100px', marginBottom: '24px' }} />
          <div className="skeleton" style={{ height: '200px', marginBottom: '24px' }} />
        </div>
        <div className="skeleton" style={{ height: '400px', borderRadius: '16px' }} />
      </div>
    </div>
  );
}
