# Airbnb Clone

A full-stack functional clone of Airbnb featuring property listings, booking workflows, user authentication, and a host management dashboard. Built as a comprehensive SDE Fullstack Assignment.

## 🚀 Live Demo
- **Frontend (Vercel):** (https://airbnb-qys2.vercel.app/)
- **Backend (Render):** https://airbnb-493d.onrender.com

## 🛠 Tech Stack
- **Frontend:** Next.js (TypeScript), React, CSS Modules
- **Backend:** Python, FastAPI, Uvicorn
- **Database:** SQLite, SQLAlchemy (ORM)
- **Authentication:** JWT (JSON Web Tokens)

## 🏗 Architecture Overview
The application follows a decoupled client-server architecture:
1. **Frontend Client (Next.js):** Handles the UI, state management, and routing. Communicates with the backend exclusively via RESTful API calls. Features dynamic routing and responsive layouts that exactly mirror Airbnb's design system.
2. **Backend API (FastAPI):** Serves as the central data access and business logic layer. Implements fast, asynchronous endpoints for users, listings, bookings, and reviews. Secures private endpoints using JWT Bearer authentication.
3. **Database Layer (SQLite):** A relational database managed via SQLAlchemy. Stores persistent states with strong foreign key constraints to ensure data integrity between users, listings, and overlapping booking dates.

## 🗄 Database Schema
The relational schema consists of four primary models:
- **Users (`users`):** Stores user credentials (hashed passwords) and profile info. Acts as both Guests and Hosts.
- **Listings (`listings`):** Properties available for booking. Fields include title, description, price, location, amenities, and category. Belongs to a Host (User).
- **Bookings (`bookings`):** Reservation records. Links a Guest (User) to a Listing. Contains `check_in`, `check_out`, total price, and status (confirmed/cancelled).
- **Reviews (`reviews`):** Feedback left by Guests. Links a Guest (User) to a Listing. Contains a rating and comment.

## 📡 API Overview
The FastAPI backend exposes the following primary REST endpoints:

### Authentication
- `POST /api/auth/register` - Create a new user account.
- `POST /api/auth/login` - Authenticate and receive a JWT token.
- `GET /api/auth/me` - Retrieve current user profile.

### Listings
- `GET /api/listings` - Retrieve all listings (supports pagination, category, and location filtering).
- `GET /api/listings/{id}` - Retrieve a single listing.
- `POST /api/listings` - Create a new listing (Host).
- `PUT /api/listings/{id}` - Update a listing (Host).
- `DELETE /api/listings/{id}` - Delete a listing (Host).

### Bookings
- `POST /api/bookings` - Create a new reservation.
- `GET /api/bookings/my-trips` - Retrieve all bookings for the authenticated Guest.
- `GET /api/bookings/host` - Retrieve all bookings for properties owned by the authenticated Host.
- `GET /api/bookings/listing/{id}/booked-dates` - Retrieve unavailable date ranges for a listing's calendar.
- `PUT /api/bookings/{id}/cancel` - Cancel an active booking.

### Reviews
- `POST /api/reviews` - Submit a review for a completed stay.
- `GET /api/reviews/listing/{id}` - Get all reviews for a listing.

## ⚙️ Local Setup Instructions

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
# Activate virtual environment
# Windows: .venv\Scripts\activate
# Mac/Linux: source .venv/bin/activate

pip install -r requirements.txt

# Seed the database with mock data
python seed.py

# Start the FastAPI server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install

# Start the Next.js dev server
npm run dev
```
Open `http://localhost:3000` in your browser.

## 🧠 Assumptions & Design Decisions
- **Authentication:** A user is implicitly treated as a "Guest" when booking and a "Host" when creating listings. No strict role enforcement separates the two; anyone can host a property.
- **Payments:** Payment processing is mocked. The booking flow summarizes costs and directly confirms the booking without capturing real credit card details, as permitted by the assignment scope.
- **Map:** To avoid exposing billing keys in a public repository, map views are rendered using static placeholder images from Mapbox.
- **Storage:** Listing images rely on direct image URLs provided by the host instead of implementing S3 cloud bucket uploads to keep the backend lightweight.
