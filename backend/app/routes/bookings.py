import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_
from app.database import get_db
from app.models import User, Listing, Booking
from app.schemas import BookingCreate, BookingResponse, BookedDateRange, ListingCardResponse
from app.auth import require_auth

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


@router.post("", response_model=BookingResponse, status_code=201)
def create_booking(
    data: BookingCreate,
    user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    # Validate listing exists
    listing = db.query(Listing).filter(Listing.id == data.listing_id, Listing.is_active == True).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # Can't book your own listing
    if listing.host_id == user.id:
        raise HTTPException(status_code=400, detail="Cannot book your own listing")

    # Validate dates
    if data.check_in >= data.check_out:
        raise HTTPException(status_code=400, detail="Check-out must be after check-in")

    if data.check_in < datetime.date.today():
        raise HTTPException(status_code=400, detail="Check-in cannot be in the past")

    # Validate guests
    if data.num_guests > listing.max_guests:
        raise HTTPException(
            status_code=400,
            detail=f"Max guests for this listing is {listing.max_guests}",
        )

    # Check for overlapping bookings
    overlap = (
        db.query(Booking)
        .filter(
            Booking.listing_id == data.listing_id,
            Booking.status != "cancelled",
            Booking.check_in < data.check_out,
            Booking.check_out > data.check_in,
        )
        .first()
    )
    if overlap:
        raise HTTPException(status_code=409, detail="Dates are not available")

    # Calculate total
    nights = (data.check_out - data.check_in).days
    nightly_total = listing.price_per_night * nights
    total_price = nightly_total + listing.cleaning_fee + listing.service_fee

    booking = Booking(
        listing_id=data.listing_id,
        guest_id=user.id,
        check_in=data.check_in,
        check_out=data.check_out,
        num_guests=data.num_guests,
        total_price=round(total_price, 2),
        status="confirmed",
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    # Reload with listing
    booking = (
        db.query(Booking)
        .options(joinedload(Booking.listing).joinedload(Listing.images), joinedload(Booking.listing).joinedload(Listing.host))
        .filter(Booking.id == booking.id)
        .first()
    )
    resp = BookingResponse.model_validate(booking)
    resp.listing = ListingCardResponse.model_validate(booking.listing)
    return resp


@router.get("/my-trips", response_model=List[BookingResponse])
def get_my_trips(
    user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    bookings = (
        db.query(Booking)
        .options(joinedload(Booking.listing).joinedload(Listing.images), joinedload(Booking.listing).joinedload(Listing.host))
        .filter(Booking.guest_id == user.id)
        .order_by(Booking.check_in.desc())
        .all()
    )
    result = []
    for b in bookings:
        resp = BookingResponse.model_validate(b)
        resp.listing = ListingCardResponse.model_validate(b.listing)
        result.append(resp)
    return result


@router.get("/host-bookings", response_model=List[BookingResponse])
def get_host_bookings(
    user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    bookings = (
        db.query(Booking)
        .join(Listing)
        .options(joinedload(Booking.listing).joinedload(Listing.images), joinedload(Booking.listing).joinedload(Listing.host))
        .filter(Listing.host_id == user.id)
        .order_by(Booking.check_in.desc())
        .all()
    )
    result = []
    for b in bookings:
        resp = BookingResponse.model_validate(b)
        resp.listing = ListingCardResponse.model_validate(b.listing)
        result.append(resp)
    return result


@router.get("/listing/{listing_id}/booked-dates", response_model=List[BookedDateRange])
def get_booked_dates(listing_id: int, db: Session = Depends(get_db)):
    bookings = (
        db.query(Booking)
        .filter(
            Booking.listing_id == listing_id,
            Booking.status != "cancelled",
            Booking.check_out >= datetime.date.today(),
        )
        .all()
    )
    return [BookedDateRange(check_in=b.check_in, check_out=b.check_out) for b in bookings]


@router.put("/{booking_id}/cancel", response_model=BookingResponse)
def cancel_booking(
    booking_id: int,
    user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    booking = (
        db.query(Booking)
        .options(joinedload(Booking.listing).joinedload(Listing.images), joinedload(Booking.listing).joinedload(Listing.host))
        .filter(Booking.id == booking_id)
        .first()
    )
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.guest_id != user.id and booking.listing.host_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if booking.status == "cancelled":
        raise HTTPException(status_code=400, detail="Already cancelled")

    booking.status = "cancelled"
    db.commit()
    db.refresh(booking)

    resp = BookingResponse.model_validate(booking)
    resp.listing = ListingCardResponse.model_validate(booking.listing)
    return resp
