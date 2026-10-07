/* eslint-disable */
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { listingsAPI, Amenity, ListingDetail } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/Toast';

const PROPERTY_TYPES = ['Apartment', 'House', 'Villa', 'Cabin', 'Cottage', 'Chalet', 'Treehouse', 'Houseboat', 'Cave', 'Farm stay', 'Tiny home'];
const CATEGORIES = ['Beach', 'Mountain', 'Trending', 'OMG!', 'Cabins', 'Lakefront', 'Skiing', 'Tropical', 'Iconic cities', 'Historical homes', 'Countryside', 'Desert', 'Amazing views'];

interface Props {
  existing?: ListingDetail;
  mode: 'create' | 'edit';
}

export default function ListingForm({ existing, mode }: Props) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    title: existing?.title || '',
    description: existing?.description || '',
    property_type: existing?.property_type || 'Apartment',
    category: existing?.category || '',
    price_per_night: existing?.price_per_night || '',
    cleaning_fee: existing?.cleaning_fee || '',
    service_fee: existing?.service_fee || '',
    address: existing?.address || '',
    city: existing?.city || '',
    state: existing?.state || '',
    country: existing?.country || '',
    latitude: existing?.latitude || '',
    longitude: existing?.longitude || '',
    max_guests: existing?.max_guests || 2,
    bedrooms: existing?.bedrooms || 1,
    beds: existing?.beds || 1,
    bathrooms: existing?.bathrooms || 1,
    image_urls: existing?.images?.map(i => i.url) || [''],
    amenity_ids: existing?.amenities?.map(a => a.id) || [],
  });

  useEffect(() => {
    listingsAPI.getAmenities().then(setAmenities).catch(() => {});
  }, []);

  const update = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const toggleAmenity = (id: number) => {
    setForm(prev => ({
      ...prev,
      amenity_ids: prev.amenity_ids.includes(id)
        ? prev.amenity_ids.filter(a => a !== id)
        : [...prev.amenity_ids, id]
    }));
  };

  const addImageUrl = () => setForm(prev => ({ ...prev, image_urls: [...prev.image_urls, ''] }));
  const removeImageUrl = (i: number) => setForm(prev => ({ ...prev, image_urls: prev.image_urls.filter((_, idx) => idx !== i) }));
  const updateImageUrl = (i: number, val: string) => setForm(prev => ({ ...prev, image_urls: prev.image_urls.map((url, idx) => idx === i ? val : url) }));

  const handleSubmit = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const payload = {
        ...form,
        price_per_night: Number(form.price_per_night),
        cleaning_fee: Number(form.cleaning_fee) || 0,
        service_fee: Number(form.service_fee) || 0,
        latitude: Number(form.latitude) || 0,
        longitude: Number(form.longitude) || 0,
        image_urls: form.image_urls.filter(u => u.trim()),
      };
      if (mode === 'create') {
        const listing = await listingsAPI.create(token, payload);
        showToast('Listing created!');
        router.push(`/listings/${listing.id}`);
      } else if (existing) {
        await listingsAPI.update(token, existing.id, payload);
        showToast('Listing updated!');
        router.push(`/listings/${existing.id}`);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const amenityGroups = amenities.reduce((acc: Record<string, Amenity[]>, a) => {
    const cat = a.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(a);
    return acc;
  }, {});

  const TOTAL_STEPS = 4;

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700 }}>
          {mode === 'create' ? 'Create a new listing' : 'Edit listing'}
        </h1>
        <span style={{ fontSize: '14px', color: '#717171' }}>Step {step} of {TOTAL_STEPS}</span>
      </div>

      {/* Progress bar */}
      <div style={{ height: '4px', background: '#DDDDDD', borderRadius: '2px', marginBottom: '40px' }}>
        <div style={{ height: '100%', background: '#222', borderRadius: '2px', width: `${(step / TOTAL_STEPS) * 100}%`, transition: 'width 0.3s' }} />
      </div>

      {step === 1 && (
        <Step1
          form={form} update={update}
          propertyTypes={PROPERTY_TYPES} categories={CATEGORIES}
        />
      )}
      {step === 2 && <Step2 form={form} update={update} />}
      {step === 3 && (
        <Step3
          form={form} update={update}
          amenityGroups={amenityGroups} toggleAmenity={toggleAmenity}
          addImageUrl={addImageUrl} removeImageUrl={removeImageUrl} updateImageUrl={updateImageUrl}
        />
      )}
      {step === 4 && <Step4 form={form} update={update} />}

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', paddingTop: '24px', borderTop: '1px solid #DDDDDD' }}>
        <button
          className="btn btn-secondary"
          style={{ borderRadius: '8px', opacity: step === 1 ? 0 : 1 }}
          onClick={() => setStep(s => Math.max(1, s - 1))}
          disabled={step === 1}
        >
          Back
        </button>
        {step < TOTAL_STEPS ? (
          <button
            className="btn btn-primary"
            style={{ borderRadius: '8px' }}
            onClick={() => setStep(s => Math.min(TOTAL_STEPS, s + 1))}
          >
            Next →
          </button>
        ) : (
          <button
            className="btn btn-gradient"
            style={{ borderRadius: '8px' }}
            onClick={handleSubmit}
            disabled={loading || !form.title || !form.city || !form.country || !form.price_per_night}
          >
            {loading ? <span className="spinner" /> : mode === 'create' ? 'Publish listing' : 'Save changes'}
          </button>
        )}
      </div>
    </div>
  );
}

function Step1({ form, update, propertyTypes, categories }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '20px' }}>What type of place?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {propertyTypes.map((type: string) => (
            <button
              key={type}
              onClick={() => update('property_type', type)}
              style={{ padding: '14px', border: `2px solid ${form.property_type === type ? '#222' : '#DDDDDD'}`, borderRadius: '12px', cursor: 'pointer', background: form.property_type === type ? '#F7F7F7' : 'white', fontWeight: form.property_type === type ? 600 : 400, fontSize: '14px', fontFamily: 'inherit', transition: 'all 0.15s' }}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '8px' }}>Title</h2>
        <p style={{ fontSize: '14px', color: '#717171', marginBottom: '12px' }}>A catchy title helps your listing stand out.</p>
        <input
          className="input"
          value={form.title}
          onChange={e => update('title', e.target.value)}
          placeholder="e.g. Stunning beachfront villa with sunset views"
          maxLength={100}
        />
        <div style={{ textAlign: 'right', fontSize: '12px', color: '#717171', marginTop: '4px' }}>{form.title.length}/100</div>
      </div>

      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '8px' }}>Category</h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {categories.map((cat: string) => (
            <button
              key={cat}
              onClick={() => update('category', form.category === cat ? '' : cat)}
              style={{ padding: '8px 14px', border: `1.5px solid ${form.category === cat ? '#222' : '#DDDDDD'}`, borderRadius: '9999px', cursor: 'pointer', background: form.category === cat ? '#222' : 'white', color: form.category === cat ? 'white' : '#222', fontSize: '13px', fontFamily: 'inherit', transition: 'all 0.15s' }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step2({ form, update }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '20px' }}>Where is it located?</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="input-group">
            <label className="input-label">Street address</label>
            <input className="input" value={form.address} onChange={e => update('address', e.target.value)} placeholder="123 Main St" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="input-group">
              <label className="input-label">City *</label>
              <input className="input" value={form.city} onChange={e => update('city', e.target.value)} placeholder="City" required />
            </div>
            <div className="input-group">
              <label className="input-label">State/Province</label>
              <input className="input" value={form.state} onChange={e => update('state', e.target.value)} placeholder="State" />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Country *</label>
            <input className="input" value={form.country} onChange={e => update('country', e.target.value)} placeholder="Country" required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="input-group">
              <label className="input-label">Latitude</label>
              <input className="input" type="number" step="any" value={form.latitude} onChange={e => update('latitude', e.target.value)} placeholder="0.0000" />
            </div>
            <div className="input-group">
              <label className="input-label">Longitude</label>
              <input className="input" type="number" step="any" value={form.longitude} onChange={e => update('longitude', e.target.value)} placeholder="0.0000" />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '20px' }}>Property details</h2>
        {[
          { label: 'Max guests', key: 'max_guests', min: 1, max: 16 },
          { label: 'Bedrooms', key: 'bedrooms', min: 0, max: 20 },
          { label: 'Beds', key: 'beds', min: 1, max: 20 },
          { label: 'Bathrooms', key: 'bathrooms', min: 0.5, max: 10, step: 0.5 },
        ].map(f => (
          <div key={f.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #F0F0F0' }}>
            <span style={{ fontSize: '15px', fontWeight: 500 }}>{f.label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={() => update(f.key, Math.max(f.min, Number(form[f.key]) - (f.step || 1)))}
                style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #DDDDDD', background: 'white', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >−</button>
              <span style={{ width: '24px', textAlign: 'center', fontWeight: 500 }}>{form[f.key]}</span>
              <button
                onClick={() => update(f.key, Math.min(f.max, Number(form[f.key]) + (f.step || 1)))}
                style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #DDDDDD', background: 'white', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >+</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Step3({ form, update, amenityGroups, toggleAmenity, addImageUrl, removeImageUrl, updateImageUrl }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Description */}
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '8px' }}>Describe your place</h2>
        <p style={{ fontSize: '14px', color: '#717171', marginBottom: '12px' }}>Share what makes your place special and what guests can expect.</p>
        <textarea
          className="input"
          style={{ minHeight: '160px', resize: 'vertical', lineHeight: '1.6' }}
          value={form.description}
          onChange={e => update('description', e.target.value)}
          placeholder="Describe your space, neighborhood, and what makes it unique..."
          maxLength={2000}
        />
        <div style={{ textAlign: 'right', fontSize: '12px', color: '#717171', marginTop: '4px' }}>{form.description.length}/2000</div>
      </div>

      {/* Photos */}
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '8px' }}>Photos</h2>
        <p style={{ fontSize: '14px', color: '#717171', marginBottom: '16px' }}>Add photo URLs. The first photo will be your cover image.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {form.image_urls.map((url: string, i: number) => (
            <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                className="input"
                style={{ flex: 1 }}
                value={url}
                onChange={e => updateImageUrl(i, e.target.value)}
                placeholder={`Photo ${i + 1} URL (https://...)`}
              />
              {url && (
                <img src={url} alt="" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} onError={e => (e.target as HTMLImageElement).style.display = 'none'} />
              )}
              {form.image_urls.length > 1 && (
                <button onClick={() => removeImageUrl(i)} style={{ color: '#FF385C', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', flexShrink: 0 }}>✕</button>
              )}
            </div>
          ))}
          <button className="btn btn-secondary btn-sm" style={{ borderRadius: '8px', alignSelf: 'flex-start' }} onClick={addImageUrl}>+ Add another photo</button>
        </div>
      </div>

      {/* Amenities */}
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '16px' }}>Amenities</h2>
        {Object.entries(amenityGroups).map(([cat, items]: any) => (
          <div key={cat} style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#717171', marginBottom: '10px' }}>{cat}</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {items.map((a: Amenity) => (
                <label key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '8px 0' }}>
                  <input type="checkbox" checked={form.amenity_ids.includes(a.id)} onChange={() => toggleAmenity(a.id)} style={{ width: '20px', height: '20px', accentColor: '#222' }} />
                  <span style={{ fontSize: '14px' }}>{a.name}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Step4({ form, update }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h2 style={{ fontSize: '22px', fontWeight: 600 }}>Pricing</h2>
      <p style={{ fontSize: '15px', color: '#717171', marginTop: '-16px' }}>Set your prices. These can be adjusted anytime.</p>

      <div className="input-group">
        <label className="input-label">Nightly rate (USD) *</label>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', fontWeight: 700 }}>$</span>
          <input
            className="input"
            style={{ paddingLeft: '32px', fontSize: '24px', fontWeight: 700, height: '64px' }}
            type="number"
            min="1"
            value={form.price_per_night}
            onChange={e => update('price_per_night', e.target.value)}
            placeholder="0"
            required
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="input-group">
          <label className="input-label">Cleaning fee</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#717171' }}>$</span>
            <input className="input" style={{ paddingLeft: '28px' }} type="number" min="0" value={form.cleaning_fee} onChange={e => update('cleaning_fee', e.target.value)} placeholder="0" />
          </div>
        </div>
        <div className="input-group">
          <label className="input-label">Service fee</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#717171' }}>$</span>
            <input className="input" style={{ paddingLeft: '28px' }} type="number" min="0" value={form.service_fee} onChange={e => update('service_fee', e.target.value)} placeholder="0" />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div style={{ padding: '24px', border: '1px solid #DDDDDD', borderRadius: '16px', background: '#F7F7F7' }}>
        <h3 style={{ fontWeight: 600, marginBottom: '16px' }}>Earnings preview (per night)</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Nightly rate</span>
            <span>${Number(form.price_per_night) || 0}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#717171' }}>
            <span>Cleaning fee</span>
            <span>${Number(form.cleaning_fee) || 0}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#717171' }}>
            <span>Service fee</span>
            <span>${Number(form.service_fee) || 0}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid #DDDDDD', paddingTop: '12px', marginTop: '4px' }}>
            <span>Guest pays total</span>
            <span>${(Number(form.price_per_night) + Number(form.cleaning_fee) + Number(form.service_fee)) || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
