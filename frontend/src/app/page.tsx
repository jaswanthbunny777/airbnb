/* eslint-disable */
'use client';
import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { listingsAPI, ListingCard, PaginatedListings } from '@/lib/api';
import ListingCardComponent from '@/components/ListingCard';
import CategoryBar from '@/components/CategoryBar';
import FilterModal from '@/components/FilterModal';

import { Globe, Umbrella, Flame, Mountain, Sparkles, Tent, Waves, Snowflake, Palmtree, Building2, Castle, Leaf, Sun, Image as ImageIcon } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: <Globe size={24} strokeWidth={1.5} /> },
  { id: 'Beach', label: 'Beach', icon: <Umbrella size={24} strokeWidth={1.5} /> },
  { id: 'Trending', label: 'Trending', icon: <Flame size={24} strokeWidth={1.5} /> },
  { id: 'Mountain', label: 'Mountains', icon: <Mountain size={24} strokeWidth={1.5} /> },
  { id: 'OMG!', label: 'OMG!', icon: <Sparkles size={24} strokeWidth={1.5} /> },
  { id: 'Cabins', label: 'Cabins', icon: <Tent size={24} strokeWidth={1.5} /> },
  { id: 'Lakefront', label: 'Lakefront', icon: <Waves size={24} strokeWidth={1.5} /> },
  { id: 'Skiing', label: 'Skiing', icon: <Snowflake size={24} strokeWidth={1.5} /> },
  { id: 'Tropical', label: 'Tropical', icon: <Palmtree size={24} strokeWidth={1.5} /> },
  { id: 'Iconic cities', label: 'Iconic cities', icon: <Building2 size={24} strokeWidth={1.5} /> },
  { id: 'Historical homes', label: 'Historical', icon: <Castle size={24} strokeWidth={1.5} /> },
  { id: 'Countryside', label: 'Countryside', icon: <Leaf size={24} strokeWidth={1.5} /> },
  { id: 'Desert', label: 'Desert', icon: <Sun size={24} strokeWidth={1.5} /> },
  { id: 'Amazing views', label: 'Amazing views', icon: <ImageIcon size={24} strokeWidth={1.5} /> },
];

function HomeContent() {
  const searchParams = useSearchParams();
  const location = searchParams.get('location') || '';
  const [listings, setListings] = useState<ListingCard[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filters, setFilters] = useState<any>({});
  const [filterOpen, setFilterOpen] = useState(false);

  const fetchListings = useCallback(async (p: number, cat: string, f: any, loc: string, append = false) => {
    if (p === 1) setLoading(true); else setLoadingMore(true);
    try {
      const params: any = { page: p, page_size: 20, ...f };
      if (cat && cat !== 'all') params.category = cat;
      if (loc) params.location = loc;
      const data = await listingsAPI.getAll(params);
      setListings(prev => append ? [...prev, ...data.listings] : data.listings);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    fetchListings(1, category, filters, location);
  }, [category, filters, location, fetchListings]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchListings(nextPage, category, filters, location, true);
  };

  const handleFilterApply = (f: any) => {
    setFilters(f);
    setFilterOpen(false);
  };

  return (
    <div>
      {/* Category Bar with Filter Button */}
      <div style={{ display: 'flex', alignItems: 'center', maxWidth: '1280px', margin: '0 auto', gap: '16px', paddingRight: '24px' }}>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <CategoryBar categories={CATEGORIES} active={category} onChange={setCategory} />
        </div>
        <button 
          onClick={() => setFilterOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #DDDDDD', borderRadius: '12px', padding: '10px 16px', fontSize: '14px', fontWeight: 500, backgroundColor: 'white', cursor: 'pointer' }}
        >
          <svg viewBox="0 0 32 32" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M7 16H3m26 0H15M29 6h-4m-8 0H3m26 20h-4M7 16a4 4 0 1 0 8 0 4 4 0 0 0-8 0zM17 6a4 4 0 1 0 8 0 4 4 0 0 0-8 0zm0 20a4 4 0 1 0 8 0 4 4 0 0 0-8 0z" />
          </svg>
          Filters
        </button>
      </div>

      {/* Main grid */}
      <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto' }}>
        {loading ? (
          <SkeletonGrid />
        ) : listings.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="listings-grid">
              {listings.map(listing => (
                <ListingCardComponent key={listing.id} listing={listing} />
              ))}
            </div>

            {page < totalPages && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
                <button
                  className="btn btn-secondary"
                  style={{ borderRadius: '8px', padding: '14px 32px' }}
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? <span className="spinner spinner-dark" /> : `Show more (${total - listings.length} remaining)`}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {filterOpen && (
        <FilterModal
          filters={filters}
          onApply={handleFilterApply}
          onClose={() => setFilterOpen(false)}
        />
      )}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="listings-grid">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i}>
          <div className="skeleton" style={{ aspectRatio: '1', borderRadius: '12px', marginBottom: '12px' }} />
          <div className="skeleton" style={{ height: '16px', width: '70%', marginBottom: '8px' }} />
          <div className="skeleton" style={{ height: '14px', width: '50%', marginBottom: '8px' }} />
          <div className="skeleton" style={{ height: '14px', width: '40%' }} />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '80px 24px' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
      <h3 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '8px' }}>No results found</h3>
      <p style={{ color: '#717171', fontSize: '16px' }}>Try adjusting your search or filters to find what you're looking for.</p>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
