from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from app.database import get_db
from app.models import User, Listing, Review
from app.schemas import ReviewCreate, ReviewResponse
from app.auth import require_auth

router = APIRouter(prefix="/api/reviews", tags=["reviews"])


@router.get("/listing/{listing_id}", response_model=List[ReviewResponse])
def get_listing_reviews(listing_id: int, db: Session = Depends(get_db)):
    reviews = (
        db.query(Review)
        .options(joinedload(Review.author))
        .filter(Review.listing_id == listing_id)
        .order_by(Review.created_at.desc())
        .all()
    )
    result = []
    for r in reviews:
        resp = ReviewResponse.model_validate(r)
        from app.schemas import ReviewAuthor
        resp.author = ReviewAuthor.model_validate(r.author)
        result.append(resp)
    return result


@router.post("", response_model=ReviewResponse, status_code=201)
def create_review(
    data: ReviewCreate,
    user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    listing = db.query(Listing).filter(Listing.id == data.listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # Can't review your own listing
    if listing.host_id == user.id:
        raise HTTPException(status_code=400, detail="Cannot review your own listing")

    review = Review(
        listing_id=data.listing_id,
        author_id=user.id,
        booking_id=data.booking_id,
        rating=data.rating,
        cleanliness=data.cleanliness,
        accuracy=data.accuracy,
        communication=data.communication,
        location_rating=data.location_rating,
        check_in_rating=data.check_in_rating,
        value=data.value,
        comment=data.comment,
    )
    db.add(review)

    # Update listing rating
    db.flush()
    avg = db.query(func.avg(Review.rating)).filter(Review.listing_id == data.listing_id).scalar()
    count = db.query(func.count(Review.id)).filter(Review.listing_id == data.listing_id).scalar()
    listing.avg_rating = round(avg, 2) if avg else 0
    listing.num_reviews = count

    db.commit()
    db.refresh(review)

    review = (
        db.query(Review)
        .options(joinedload(Review.author))
        .filter(Review.id == review.id)
        .first()
    )
    resp = ReviewResponse.model_validate(review)
    from app.schemas import ReviewAuthor
    resp.author = ReviewAuthor.model_validate(review.author)
    return resp
