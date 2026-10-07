import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Text, Boolean, DateTime,
    ForeignKey, Date, Table, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.database import Base

# Association table for listing amenities
listing_amenities = Table(
    "listing_amenities",
    Base.metadata,
    Column("listing_id", Integer, ForeignKey("listings.id", ondelete="CASCADE"), primary_key=True),
    Column("amenity_id", Integer, ForeignKey("amenities.id", ondelete="CASCADE"), primary_key=True),
)

# Association table for wishlist items
wishlist_items = Table(
    "wishlist_items",
    Base.metadata,
    Column("wishlist_id", Integer, ForeignKey("wishlists.id", ondelete="CASCADE"), primary_key=True),
    Column("listing_id", Integer, ForeignKey("listings.id", ondelete="CASCADE"), primary_key=True),
)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    avatar_url = Column(String(500), default="")
    phone = Column(String(20), default="")
    bio = Column(Text, default="")
    is_host = Column(Boolean, default=False)
    is_superhost = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    listings = relationship("Listing", back_populates="host", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="guest", foreign_keys="Booking.guest_id", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="author", cascade="all, delete-orphan")
    wishlists = relationship("Wishlist", back_populates="user", cascade="all, delete-orphan")

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


class Listing(Base):
    __tablename__ = "listings"

    id = Column(Integer, primary_key=True, index=True)
    host_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, default="")
    property_type = Column(String(50), nullable=False)  # Apartment, House, Villa, Cabin, etc.
    category = Column(String(50), default="")  # Trending, Beach, Mountain, etc.
    price_per_night = Column(Float, nullable=False)
    cleaning_fee = Column(Float, default=0)
    service_fee = Column(Float, default=0)
    
    # Location
    address = Column(String(500), default="")
    city = Column(String(100), nullable=False)
    state = Column(String(100), default="")
    country = Column(String(100), nullable=False)
    latitude = Column(Float, default=0)
    longitude = Column(Float, default=0)

    # Property details
    max_guests = Column(Integer, default=1)
    bedrooms = Column(Integer, default=1)
    beds = Column(Integer, default=1)
    bathrooms = Column(Float, default=1)

    # Rating
    avg_rating = Column(Float, default=0)
    num_reviews = Column(Integer, default=0)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    host = relationship("User", back_populates="listings")
    images = relationship("ListingImage", back_populates="listing", cascade="all, delete-orphan", order_by="ListingImage.position")
    amenities = relationship("Amenity", secondary=listing_amenities, back_populates="listings")
    bookings = relationship("Booking", back_populates="listing", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="listing", cascade="all, delete-orphan")


class ListingImage(Base):
    __tablename__ = "listing_images"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("listings.id", ondelete="CASCADE"), nullable=False)
    url = Column(String(500), nullable=False)
    caption = Column(String(255), default="")
    position = Column(Integer, default=0)

    listing = relationship("Listing", back_populates="images")


class Amenity(Base):
    __tablename__ = "amenities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    icon = Column(String(50), default="")
    category = Column(String(50), default="")  # Essentials, Features, Safety, etc.

    listings = relationship("Listing", secondary=listing_amenities, back_populates="amenities")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("listings.id", ondelete="CASCADE"), nullable=False)
    guest_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    check_in = Column(Date, nullable=False)
    check_out = Column(Date, nullable=False)
    num_guests = Column(Integer, default=1)
    total_price = Column(Float, nullable=False)
    status = Column(String(20), default="confirmed")  # confirmed, cancelled, completed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('listing_id', 'check_in', 'check_out', name='uq_booking_dates'),
    )

    # Relationships
    listing = relationship("Listing", back_populates="bookings")
    guest = relationship("User", back_populates="bookings", foreign_keys=[guest_id])


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("listings.id", ondelete="CASCADE"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True)
    rating = Column(Float, nullable=False)
    cleanliness = Column(Float, default=5.0)
    accuracy = Column(Float, default=5.0)
    communication = Column(Float, default=5.0)
    location_rating = Column(Float, default=5.0)
    check_in_rating = Column(Float, default=5.0)
    value = Column(Float, default=5.0)
    comment = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    listing = relationship("Listing", back_populates="reviews")
    author = relationship("User", back_populates="reviews")


class Wishlist(Base):
    __tablename__ = "wishlists"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), default="My Wishlist")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="wishlists")
    listings = relationship("Listing", secondary=wishlist_items)
