import math
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func
from app.database import get_db
from app.models import User, Listing, ListingImage, Amenity, listing_amenities
from app.schemas import (
    ListingCreate, ListingUpdate, ListingResponse, ListingCardResponse,
    PaginatedListings, AmenityResponse
)
from app.auth import require_auth, get_current_user

router = APIRouter(prefix="/api/listings", tags=["listings"])


@router.get("", response_model=PaginatedListings)
def get_listings(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    location: Optional[str] = None,
    category: Optional[str] = None,
    property_type: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    guests: Optional[int] = None,
    bedrooms: Optional[int] = None,
    bathrooms: Optional[int] = None,
    amenities: Optional[str] = None,  # comma-separated amenity IDs
    sort_by: Optional[str] = None,  # price_asc, price_desc, rating
    db: Session = Depends(get_db),
):
    query = db.query(Listing).filter(Listing.is_active == True)
    query = query.options(joinedload(Listing.images), joinedload(Listing.host))

    if location:
        loc = f"%{location}%"
        query = query.filter(
            or_(
                Listing.city.ilike(loc),
                Listing.state.ilike(loc),
                Listing.country.ilike(loc),
                Listing.address.ilike(loc),
            )
        )

    if category and category != "all":
        query = query.filter(Listing.category == category)

    if property_type:
        query = query.filter(Listing.property_type == property_type)

    if min_price is not None:
        query = query.filter(Listing.price_per_night >= min_price)

    if max_price is not None:
        query = query.filter(Listing.price_per_night <= max_price)

    if guests is not None:
        query = query.filter(Listing.max_guests >= guests)

    if bedrooms is not None:
        query = query.filter(Listing.bedrooms >= bedrooms)

    if bathrooms is not None:
        query = query.filter(Listing.bathrooms >= bathrooms)

    if amenities:
        amenity_ids = [int(a) for a in amenities.split(",") if a.strip()]
        for aid in amenity_ids:
            query = query.filter(
                Listing.amenities.any(Amenity.id == aid)
            )

    # Get total count (must use a subquery to handle joinedload)
    total = query.with_entities(func.count(Listing.id)).scalar()

    # Sort
    if sort_by == "price_asc":
        query = query.order_by(Listing.price_per_night.asc())
    elif sort_by == "price_desc":
        query = query.order_by(Listing.price_per_night.desc())
    elif sort_by == "rating":
        query = query.order_by(Listing.avg_rating.desc())
    else:
        query = query.order_by(Listing.created_at.desc())

    # Paginate
    offset = (page - 1) * page_size
    listings = query.offset(offset).limit(page_size).all()

    return PaginatedListings(
        listings=[ListingCardResponse.model_validate(l) for l in listings],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total > 0 else 1,
    )


@router.get("/categories", response_model=List[str])
def get_categories(db: Session = Depends(get_db)):
    cats = db.query(Listing.category).filter(
        Listing.is_active == True,
        Listing.category != "",
    ).distinct().all()
    return [c[0] for c in cats]


@router.get("/amenities", response_model=List[AmenityResponse])
def get_amenities(db: Session = Depends(get_db)):
    amenities = db.query(Amenity).order_by(Amenity.category, Amenity.name).all()
    return [AmenityResponse.model_validate(a) for a in amenities]


@router.get("/{listing_id}", response_model=ListingResponse)
def get_listing(listing_id: int, db: Session = Depends(get_db)):
    listing = (
        db.query(Listing)
        .options(
            joinedload(Listing.images),
            joinedload(Listing.amenities),
            joinedload(Listing.host),
        )
        .filter(Listing.id == listing_id)
        .first()
    )
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return ListingResponse.model_validate(listing)


@router.post("", response_model=ListingResponse, status_code=201)
def create_listing(
    data: ListingCreate,
    user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    # Mark user as host
    user.is_host = True

    listing = Listing(
        host_id=user.id,
        title=data.title,
        description=data.description,
        property_type=data.property_type,
        category=data.category,
        price_per_night=data.price_per_night,
        cleaning_fee=data.cleaning_fee,
        service_fee=data.service_fee,
        address=data.address,
        city=data.city,
        state=data.state,
        country=data.country,
        latitude=data.latitude,
        longitude=data.longitude,
        max_guests=data.max_guests,
        bedrooms=data.bedrooms,
        beds=data.beds,
        bathrooms=data.bathrooms,
    )
    db.add(listing)
    db.flush()

    # Add images
    for i, url in enumerate(data.image_urls):
        img = ListingImage(listing_id=listing.id, url=url, position=i)
        db.add(img)

    # Add amenities
    if data.amenity_ids:
        amenities = db.query(Amenity).filter(Amenity.id.in_(data.amenity_ids)).all()
        listing.amenities = amenities

    db.commit()
    db.refresh(listing)

    # Reload with relations
    listing = (
        db.query(Listing)
        .options(joinedload(Listing.images), joinedload(Listing.amenities), joinedload(Listing.host))
        .filter(Listing.id == listing.id)
        .first()
    )
    return ListingResponse.model_validate(listing)


@router.put("/{listing_id}", response_model=ListingResponse)
def update_listing(
    listing_id: int,
    data: ListingUpdate,
    user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.host_id != user.id:
        raise HTTPException(status_code=403, detail="Not your listing")

    update_data = data.model_dump(exclude_unset=True)

    # Handle images separately
    if "image_urls" in update_data:
        image_urls = update_data.pop("image_urls")
        # Remove existing images
        db.query(ListingImage).filter(ListingImage.listing_id == listing.id).delete()
        for i, url in enumerate(image_urls):
            img = ListingImage(listing_id=listing.id, url=url, position=i)
            db.add(img)

    # Handle amenities separately
    if "amenity_ids" in update_data:
        amenity_ids = update_data.pop("amenity_ids")
        amenities = db.query(Amenity).filter(Amenity.id.in_(amenity_ids)).all()
        listing.amenities = amenities

    # Update other fields
    for key, value in update_data.items():
        setattr(listing, key, value)

    db.commit()
    db.refresh(listing)

    listing = (
        db.query(Listing)
        .options(joinedload(Listing.images), joinedload(Listing.amenities), joinedload(Listing.host))
        .filter(Listing.id == listing.id)
        .first()
    )
    return ListingResponse.model_validate(listing)


@router.delete("/{listing_id}")
def delete_listing(
    listing_id: int,
    user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.host_id != user.id:
        raise HTTPException(status_code=403, detail="Not your listing")

    db.delete(listing)
    db.commit()
    return {"message": "Listing deleted"}


@router.get("/host/my-listings", response_model=List[ListingCardResponse])
def get_my_listings(
    user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    listings = (
        db.query(Listing)
        .options(joinedload(Listing.images), joinedload(Listing.host))
        .filter(Listing.host_id == user.id)
        .order_by(Listing.created_at.desc())
        .all()
    )
    return [ListingCardResponse.model_validate(l) for l in listings]
