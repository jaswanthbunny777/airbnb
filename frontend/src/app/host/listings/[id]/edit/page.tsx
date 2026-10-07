'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { listingsAPI, ListingDetail } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import ListingForm from '@/components/ListingForm';

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!token) { router.push('/'); return; }
    listingsAPI.getById(Number(id))
      .then(setListing)
      .catch(() => router.push('/host/dashboard'))
      .finally(() => setLoading(false));
  }, [id, token, authLoading]);

  if (loading) return <div style={{ padding: '80px', textAlign: 'center' }}><span className="spinner spinner-dark" /></div>;
  if (!listing) return null;

  return <ListingForm mode="edit" existing={listing} />;
}
