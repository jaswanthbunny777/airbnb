from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models import User, Listing, Wishlist, wishlist_items
from app.schemas import WishlistCreate, WishlistResponse, WishlistToggle, ListingCardResponse
from app.auth import require_auth

router = APIRouter(prefix="/api/wishlists", tags=["wishlists"])


@router.get("", response_model=List[WishlistResponse])
def get_wishlists(user: User = Depends(require_auth), db: Session = Depends(get_db)):
    wishlists = (
        db.query(Wishlist)
        .options(joinedload(Wishlist.listings).joinedload(Listing.images), joinedload(Wishlist.listings).joinedload(Listing.host))
        .filter(Wishlist.user_id == user.id)
        .all()
    )
    result = []
    for w in wishlists:
        resp = WishlistResponse.model_validate(w)
        resp.listings = [ListingCardResponse.model_validate(l) for l in w.listings]
        result.append(resp)
    return result


@router.post("", response_model=WishlistResponse, status_code=201)
def create_wishlist(data: WishlistCreate, user: User = Depends(require_auth), db: Session = Depends(get_db)):
    wl = Wishlist(user_id=user.id, name=data.name)
    db.add(wl)
    db.commit()
    db.refresh(wl)
    return WishlistResponse.model_validate(wl)


@router.post("/toggle")
def toggle_wishlist_item(
    data: WishlistToggle,
    user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    listing = db.query(Listing).filter(Listing.id == data.listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # Get or create default wishlist
    if data.wishlist_id:
        wishlist = db.query(Wishlist).filter(
            Wishlist.id == data.wishlist_id, Wishlist.user_id == user.id
        ).first()
    else:
        wishlist = db.query(Wishlist).filter(Wishlist.user_id == user.id).first()
        if not wishlist:
            wishlist = Wishlist(user_id=user.id, name="My Wishlist")
            db.add(wishlist)
            db.flush()

    if not wishlist:
        raise HTTPException(status_code=404, detail="Wishlist not found")

    # Load the wishlist with listings
    wishlist = (
        db.query(Wishlist)
        .options(joinedload(Wishlist.listings))
        .filter(Wishlist.id == wishlist.id)
        .first()
    )

    # Toggle
    if listing in wishlist.listings:
        wishlist.listings.remove(listing)
        db.commit()
        return {"action": "removed", "wishlist_id": wishlist.id}
    else:
        wishlist.listings.append(listing)
        db.commit()
        return {"action": "added", "wishlist_id": wishlist.id}


@router.get("/check/{listing_id}")
def check_wishlisted(
    listing_id: int,
    user: Optional[User] = Depends(require_auth),
    db: Session = Depends(get_db),
):
    if not user:
        return {"is_wishlisted": False}
    
    wishlists = (
        db.query(Wishlist)
        .options(joinedload(Wishlist.listings))
        .filter(Wishlist.user_id == user.id)
        .all()
    )
    for wl in wishlists:
        for l in wl.listings:
            if l.id == listing_id:
                return {"is_wishlisted": True, "wishlist_id": wl.id}
    return {"is_wishlisted": False}


@router.delete("/{wishlist_id}")
def delete_wishlist(
    wishlist_id: int,
    user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    wl = db.query(Wishlist).filter(Wishlist.id == wishlist_id, Wishlist.user_id == user.id).first()
    if not wl:
        raise HTTPException(status_code=404, detail="Wishlist not found")
    db.delete(wl)
    db.commit()
    return {"message": "Wishlist deleted"}
