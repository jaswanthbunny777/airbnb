/* eslint-disable */
'use client';
import { Review } from '@/lib/api';

export default function ReviewCard({ review }: { review: Review }) {
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        {review.author?.avatar_url ? (
          <img src={review.author.avatar_url} alt={review.author.first_name} style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#DDDDDD', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 600, color: '#717171' }}>
            {review.author?.first_name?.[0] || '?'}
          </div>
        )}
        <div>
          <div style={{ fontWeight: 600, fontSize: '15px' }}>{review.author?.first_name} {review.author?.last_name}</div>
          <div style={{ fontSize: '13px', color: '#717171' }}>{formatDate(review.created_at)}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '2px', marginBottom: '8px' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} viewBox="0 0 32 32" width="12" height="12" fill={i < Math.round(review.rating) ? '#222' : '#DDDDDD'}>
            <path d="M15.094 1.579l-4.124 8.885-9.86 1.27a1 1 0 0 0-.542 1.736l7.293 6.565-1.965 9.852a1 1 0 0 0 1.483 1.061L16 25.951l8.625 4.997a1 1 0 0 0 1.483-1.06l-1.965-9.853 7.293-6.565a1 1 0 0 0-.542-1.735l-9.86-1.271-4.124-8.885a1 1 0 0 0-1.816 0z"/>
          </svg>
        ))}
      </div>
      <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#222', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {review.comment}
      </p>
    </div>
  );
}
