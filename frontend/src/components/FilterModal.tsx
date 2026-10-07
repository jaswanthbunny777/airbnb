/* eslint-disable */
'use client';
import { useState, useEffect } from 'react';
import { listingsAPI, Amenity } from '@/lib/api';

const PROPERTY_TYPES = ['Apartment', 'House', 'Villa', 'Cabin', 'Cottage', 'Chalet', 'Treehouse', 'Houseboat', 'Cave', 'Farm stay', 'Tiny home'];

interface Props {
  filters: any;
  onApply: (filters: any) => void;
  onClose: () => void;
}

export default function FilterModal({ filters, onApply, onClose }: Props) {
  const [minPrice, setMinPrice] = useState(filters.min_price || '');
  const [maxPrice, setMaxPrice] = useState(filters.max_price || '');
  const [propertyType, setPropertyType] = useState(filters.property_type || '');
  const [selectedAmenities, setSelectedAmenities] = useState<number[]>(
    filters.amenities ? filters.amenities.split(',').map(Number) : []
  );
  const [bedrooms, setBedrooms] = useState(filters.bedrooms || 0);
  const [bathrooms, setBathrooms] = useState(filters.bathrooms || 0);
  const [amenities, setAmenities] = useState<Amenity[]>([]);

  useEffect(() => {
    listingsAPI.getAmenities().then(setAmenities).catch(() => {});
  }, []);

  const toggleAmenity = (id: number) => {
    setSelectedAmenities(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleApply = () => {
    const f: any = {};
    if (minPrice) f.min_price = Number(minPrice);
    if (maxPrice) f.max_price = Number(maxPrice);
    if (propertyType) f.property_type = propertyType;
    if (selectedAmenities.length) f.amenities = selectedAmenities.join(',');
    if (bedrooms > 0) f.bedrooms = bedrooms;
    if (bathrooms > 0) f.bathrooms = bathrooms;
    onApply(f);
  };

  const handleClear = () => {
    setMinPrice(''); setMaxPrice(''); setPropertyType('');
    setSelectedAmenities([]); setBedrooms(0); setBathrooms(0);
  };

  const CategoryAmenities = amenities.reduce((acc: Record<string, Amenity[]>, a) => {
    const cat = a.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(a);
    return acc;
  }, {});

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '620px' }}>
        <div className="modal-header">
          <button className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 32 32" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M6 6l20 20M26 6L6 26"/>
            </svg>
          </button>
          <h2 style={{ flex: 1, textAlign: 'center', fontSize: '16px', fontWeight: 600 }}>Filters</h2>
          <div style={{ width: 32 }} />
        </div>

        <div style={{ padding: '24px', overflowY: 'auto', maxHeight: 'calc(90vh - 80px)' }}>
          {/* Price range */}
          <section style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Price range</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="input-group">
                <label className="input-label">Min price</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '15px', color: '#717171' }}>$</span>
                  <input className="input" style={{ paddingLeft: '28px' }} type="number" min="0" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="0" />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Max price</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '15px', color: '#717171' }}>$</span>
                  <input className="input" style={{ paddingLeft: '28px' }} type="number" min="0" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="Any" />
                </div>
              </div>
            </div>
          </section>

          <div className="divider" style={{ margin: '0 0 32px' }} />

          {/* Rooms and beds */}
          <section style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Rooms and beds</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <CounterRow label="Bedrooms" value={bedrooms} onChange={setBedrooms} max={8} />
              <CounterRow label="Bathrooms" value={bathrooms} onChange={setBathrooms} max={8} />
            </div>
          </section>

          <div className="divider" style={{ margin: '0 0 32px' }} />

          {/* Property type */}
          <section style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Property type</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {PROPERTY_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => setPropertyType(propertyType === type ? '' : type)}
                  style={{
                    padding: '12px 8px', border: `1.5px solid ${propertyType === type ? '#222' : '#DDDDDD'}`,
                    borderRadius: '8px', fontSize: '13px', fontWeight: propertyType === type ? 600 : 400,
                    cursor: 'pointer', background: propertyType === type ? '#F7F7F7' : 'white',
                    fontFamily: 'inherit', transition: 'all 0.15s',
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </section>

          <div className="divider" style={{ margin: '0 0 32px' }} />

          {/* Amenities */}
          <section style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Amenities</h3>
            {Object.entries(CategoryAmenities).map(([cat, items]) => (
              <div key={cat} style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#717171', marginBottom: '10px' }}>{cat}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {items.map(a => (
                    <label key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '8px 0' }}>
                      <input
                        type="checkbox"
                        checked={selectedAmenities.includes(a.id)}
                        onChange={() => toggleAmenity(a.id)}
                        style={{ width: '20px', height: '20px', accentColor: '#222' }}
                      />
                      <span style={{ fontSize: '14px' }}>{a.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </section>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #DDDDDD', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="btn btn-ghost" style={{ fontSize: '14px', fontWeight: 600, textDecoration: 'underline' }} onClick={handleClear}>Clear all</button>
          <button className="btn btn-primary" style={{ borderRadius: '8px' }} onClick={handleApply}>Show results</button>
        </div>
      </div>
    </div>
  );
}

function CounterRow({ label, value, onChange, max }: { label: string; value: number; onChange: (v: number) => void; max: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '15px' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value === 0}
          style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #DDDDDD', background: 'white', cursor: value === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', opacity: value === 0 ? 0.3 : 1 }}
        >−</button>
        <span style={{ width: '24px', textAlign: 'center', fontSize: '15px', fontWeight: 500 }}>
          {value === 0 ? 'Any' : value}
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value === max}
          style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #DDDDDD', background: 'white', cursor: value === max ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', opacity: value === max ? 0.3 : 1 }}
        >+</button>
      </div>
    </div>
  );
}
