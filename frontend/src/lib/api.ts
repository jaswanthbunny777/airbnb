/* eslint-disable */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface FetchOptions extends RequestInit {
  token?: string | null;
}

async function fetchAPI<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Network error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// ─── Auth ─────────────────────────────────────────────────────
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
  phone: string;
  bio: string;
  is_host: boolean;
  is_superhost: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const authAPI = {
  register: (data: { email: string; password: string; first_name: string; last_name: string }) =>
    fetchAPI<AuthResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    fetchAPI<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  getMe: (token: string) =>
    fetchAPI<User>('/api/auth/me', { token }),

  updateMe: (token: string, data: Partial<User>) =>
    fetchAPI<User>('/api/auth/me', { method: 'PUT', token, body: JSON.stringify(data) }),
};

// ─── Listings ─────────────────────────────────────────────────
export interface ListingImage {
  id: number;
  url: string;
  caption: string;
  position: number;
}

export interface HostInfo {
  id: number;
  first_name: string;
  last_name: string;
  avatar_url: string;
  is_superhost: boolean;
  created_at: string;
}

export interface Amenity {
  id: number;
  name: string;
  icon: string;
  category: string;
}

export interface ListingCard {
  id: number;
  title: string;
  city: string;
  state: string;
  country: string;
  price_per_night: number;
  avg_rating: number;
  num_reviews: number;
  property_type: string;
  category: string;
  images: ListingImage[];
  host: HostInfo | null;
}

export interface ListingDetail extends ListingCard {
  host_id: number;
  description: string;
  cleaning_fee: number;
  service_fee: number;
  address: string;
  latitude: number;
  longitude: number;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  is_active: boolean;
  created_at: string;
  amenities: Amenity[];
}

export interface PaginatedListings {
  listings: ListingCard[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ListingSearchParams {
  page?: number;
  page_size?: number;
  location?: string;
  category?: string;
  property_type?: string;
  min_price?: number;
  max_price?: number;
  guests?: number;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string;
  sort_by?: string;
}

export const listingsAPI = {
  getAll: (params: ListingSearchParams = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    return fetchAPI<PaginatedListings>(`/api/listings?${searchParams.toString()}`);
  },

  getById: (id: number) =>
    fetchAPI<ListingDetail>(`/api/listings/${id}`),

  getCategories: () =>
    fetchAPI<string[]>('/api/listings/categories'),

  getAmenities: () =>
    fetchAPI<Amenity[]>('/api/listings/amenities'),

  create: (token: string, data: any) =>
    fetchAPI<ListingDetail>('/api/listings', { method: 'POST', token, body: JSON.stringify(data) }),

  update: (token: string, id: number, data: any) =>
    fetchAPI<ListingDetail>(`/api/listings/${id}`, { method: 'PUT', token, body: JSON.stringify(data) }),

  delete: (token: string, id: number) =>
    fetchAPI<{ message: string }>(`/api/listings/${id}`, { method: 'DELETE', token }),

  getMyListings: (token: string) =>
    fetchAPI<ListingCard[]>('/api/listings/host/my-listings', { token }),
};

// ─── Bookings ─────────────────────────────────────────────────
export interface Booking {
  id: number;
  listing_id: number;
  guest_id: number;
  check_in: string;
  check_out: string;
  num_guests: number;
  total_price: number;
  status: string;
  created_at: string;
  listing: ListingCard | null;
}

export interface BookedDateRange {
  check_in: string;
  check_out: string;
}

export const bookingsAPI = {
  create: (token: string, data: { listing_id: number; check_in: string; check_out: string; num_guests: number }) =>
    fetchAPI<Booking>('/api/bookings', { method: 'POST', token, body: JSON.stringify(data) }),

  getMyTrips: (token: string) =>
    fetchAPI<Booking[]>('/api/bookings/my-trips', { token }),

  getHostBookings: (token: string) =>
    fetchAPI<Booking[]>('/api/bookings/host-bookings', { token }),

  getBookedDates: (listingId: number) =>
    fetchAPI<BookedDateRange[]>(`/api/bookings/listing/${listingId}/booked-dates`),

  cancel: (token: string, bookingId: number) =>
    fetchAPI<Booking>(`/api/bookings/${bookingId}/cancel`, { method: 'PUT', token }),
};

// ─── Reviews ──────────────────────────────────────────────────
export interface ReviewAuthor {
  id: number;
  first_name: string;
  last_name: string;
  avatar_url: string;
}

export interface Review {
  id: number;
  listing_id: number;
  author_id: number;
  rating: number;
  cleanliness: number;
  accuracy: number;
  communication: number;
  location_rating: number;
  check_in_rating: number;
  value: number;
  comment: string;
  created_at: string;
  author: ReviewAuthor | null;
}

export const reviewsAPI = {
  getByListing: (listingId: number) =>
    fetchAPI<Review[]>(`/api/reviews/listing/${listingId}`),

  create: (token: string, data: any) =>
    fetchAPI<Review>('/api/reviews', { method: 'POST', token, body: JSON.stringify(data) }),
};

// ─── Wishlists ────────────────────────────────────────────────
export interface Wishlist {
  id: number;
  user_id: number;
  name: string;
  created_at: string;
  listings: ListingCard[];
}

export const wishlistsAPI = {
  getAll: (token: string) =>
    fetchAPI<Wishlist[]>('/api/wishlists', { token }),

  create: (token: string, name: string) =>
    fetchAPI<Wishlist>('/api/wishlists', { method: 'POST', token, body: JSON.stringify({ name }) }),

  toggle: (token: string, listingId: number, wishlistId?: number) =>
    fetchAPI<{ action: string; wishlist_id: number }>('/api/wishlists/toggle', {
      method: 'POST',
      token,
      body: JSON.stringify({ listing_id: listingId, wishlist_id: wishlistId }),
    }),

  check: (token: string, listingId: number) =>
    fetchAPI<{ is_wishlisted: boolean; wishlist_id?: number }>(`/api/wishlists/check/${listingId}`, { token }),

  delete: (token: string, wishlistId: number) =>
    fetchAPI<{ message: string }>(`/api/wishlists/${wishlistId}`, { method: 'DELETE', token }),
};
