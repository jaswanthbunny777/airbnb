import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


# ─── User Schemas ───────────────────────────────────────────────
class UserBase(BaseModel):
    email: str
    first_name: str
    last_name: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None

class UserResponse(UserBase):
    id: int
    avatar_url: str = ""
    phone: str = ""
    bio: str = ""
    is_host: bool = False
    is_superhost: bool = False
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ─── Amenity Schemas ────────────────────────────────────────────
class AmenityResponse(BaseModel):
    id: int
    name: str
    icon: str = ""
    category: str = ""

    class Config:
        from_attributes = True


# ─── Listing Image Schemas ──────────────────────────────────────
class ListingImageBase(BaseModel):
    url: str
    caption: str = ""
    position: int = 0

class ListingImageResponse(ListingImageBase):
    id: int

    class Config:
        from_attributes = True


# ─── Listing Schemas ────────────────────────────────────────────
class ListingBase(BaseModel):
    title: str
    description: str = ""
    property_type: str
    category: str = ""
    price_per_night: float
    cleaning_fee: float = 0
    service_fee: float = 0
    address: str = ""
    city: str
    state: str = ""
    country: str
    latitude: float = 0
    longitude: float = 0
    max_guests: int = 1
    bedrooms: int = 1
    beds: int = 1
    bathrooms: float = 1

class ListingCreate(ListingBase):
    image_urls: List[str] = []
    amenity_ids: List[int] = []

class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    property_type: Optional[str] = None
    category: Optional[str] = None
    price_per_night: Optional[float] = None
    cleaning_fee: Optional[float] = None
    service_fee: Optional[float] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    max_guests: Optional[int] = None
    bedrooms: Optional[int] = None
    beds: Optional[int] = None
    bathrooms: Optional[float] = None
    image_urls: Optional[List[str]] = None
    amenity_ids: Optional[List[int]] = None
    is_active: Optional[bool] = None

class HostInfo(BaseModel):
    id: int
    first_name: str
    last_name: str
    avatar_url: str = ""
    is_superhost: bool = False
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class ListingResponse(ListingBase):
    id: int
    host_id: int
    avg_rating: float = 0
    num_reviews: int = 0
    is_active: bool = True
    created_at: datetime.datetime
    images: List[ListingImageResponse] = []
    amenities: List[AmenityResponse] = []
    host: Optional[HostInfo] = None

    class Config:
        from_attributes = True

class ListingCardResponse(BaseModel):
    id: int
    title: str
    city: str
    state: str
    country: str
    price_per_night: float
    avg_rating: float
    num_reviews: int
    property_type: str
    category: str
    images: List[ListingImageResponse] = []
    host: Optional[HostInfo] = None

    class Config:
        from_attributes = True

class PaginatedListings(BaseModel):
    listings: List[ListingCardResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ─── Booking Schemas ────────────────────────────────────────────
class BookingCreate(BaseModel):
    listing_id: int
    check_in: datetime.date
    check_out: datetime.date
    num_guests: int = 1

class BookingResponse(BaseModel):
    id: int
    listing_id: int
    guest_id: int
    check_in: datetime.date
    check_out: datetime.date
    num_guests: int
    total_price: float
    status: str
    created_at: datetime.datetime
    listing: Optional[ListingCardResponse] = None

    class Config:
        from_attributes = True

class BookedDateRange(BaseModel):
    check_in: datetime.date
    check_out: datetime.date


# ─── Review Schemas ─────────────────────────────────────────────
class ReviewCreate(BaseModel):
    listing_id: int
    booking_id: Optional[int] = None
    rating: float = Field(ge=1, le=5)
    cleanliness: float = Field(default=5.0, ge=1, le=5)
    accuracy: float = Field(default=5.0, ge=1, le=5)
    communication: float = Field(default=5.0, ge=1, le=5)
    location_rating: float = Field(default=5.0, ge=1, le=5)
    check_in_rating: float = Field(default=5.0, ge=1, le=5)
    value: float = Field(default=5.0, ge=1, le=5)
    comment: str = ""

class ReviewAuthor(BaseModel):
    id: int
    first_name: str
    last_name: str
    avatar_url: str = ""

    class Config:
        from_attributes = True

class ReviewResponse(BaseModel):
    id: int
    listing_id: int
    author_id: int
    rating: float
    cleanliness: float
    accuracy: float
    communication: float
    location_rating: float
    check_in_rating: float
    value: float
    comment: str
    created_at: datetime.datetime
    author: Optional[ReviewAuthor] = None

    class Config:
        from_attributes = True


# ─── Wishlist Schemas ───────────────────────────────────────────
class WishlistCreate(BaseModel):
    name: str = "My Wishlist"

class WishlistResponse(BaseModel):
    id: int
    user_id: int
    name: str
    created_at: datetime.datetime
    listings: List[ListingCardResponse] = []

    class Config:
        from_attributes = True

class WishlistToggle(BaseModel):
    listing_id: int
    wishlist_id: Optional[int] = None
