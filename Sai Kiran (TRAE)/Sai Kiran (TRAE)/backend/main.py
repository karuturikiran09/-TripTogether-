from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import json
import hashlib
import uuid
from datetime import datetime
import os
import uvicorn

app = FastAPI(title="TripTogether API", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data file paths
DATA_DIR = "../data"
USERS_FILE = os.path.join(DATA_DIR, "users.json")
TRIPS_FILE = os.path.join(DATA_DIR, "trips.json")
PAYMENTS_FILE = os.path.join(DATA_DIR, "payments.json")
CHATS_FILE = os.path.join(DATA_DIR, "chats.json")

# Pydantic models
class UserRegister(BaseModel):
    username: str
    email: str
    phone: str
    aadhar_number: str
    password: str
    aadhar_photo: Optional[str] = None
    aadhar_photo_name: Optional[str] = None

class TripCreate(BaseModel):
    title: str
    from_location: str
    to_location: str
    date: str
    seats: int
    budget: float
    description: str
    type: str

class PaymentRequest(BaseModel):
    amount: float
    credits: int

# Utility functions
def load_json(file_path):
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return []

def save_json(file_path, data):
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2)

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# API Routes
@app.get("/")
async def root():
    return {"message": "TripTogether API is running!"}

@app.post("/api/register")
async def register_user(user: UserRegister):
    users = load_json(USERS_FILE)
    
    # Check if email already exists
    if any(u['email'] == user.email for u in users):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    new_user = {
        "id": str(uuid.uuid4()),
        "username": user.username,
        "email": user.email,
        "password": hash_password(user.password),
        "phone": user.phone,
        "aadhar_number": user.aadhar_number,
        "credits": 0,
        "created_at": datetime.now().isoformat(),
        "blocked": False
    }
    
    # Add aadhar photo if provided
    if user.aadhar_photo:
        new_user["aadhar_photo"] = user.aadhar_photo
    if user.aadhar_photo_name:
        new_user["aadhar_photo_name"] = user.aadhar_photo_name
    
    users.append(new_user)
    save_json(USERS_FILE, users)
    
    return {"message": "User registered successfully", "user_id": new_user["id"]}

@app.post("/api/login")
async def login_user(email: str = Query(...), password: str = Query(...)):
    users = load_json(USERS_FILE)
    
    # Find user
    user = next((u for u in users if u['email'] == email), None)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check password
    if user['password'] != hash_password(password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check if blocked
    if user.get('blocked', False):
        raise HTTPException(status_code=403, detail="Account is blocked")
    
    # Return user data (without password)
    user_data = {k: v for k, v in user.items() if k != 'password'}
    return {"message": "Login successful", "user": user_data}

@app.get("/api/trips")
async def get_trips(status: Optional[str] = None):
    trips = load_json(TRIPS_FILE)
    users = load_json(USERS_FILE)
    
    # Filter out trips from blocked users
    blocked_user_ids = [u['id'] for u in users if u.get('blocked', False)]
    trips = [t for t in trips if t.get('user_id') not in blocked_user_ids]
    
    if status:
        trips = [t for t in trips if t.get('status') == status]
    
    return trips

@app.post("/api/trips")
async def create_trip(trip: TripCreate, user_id: str = Query(...)):
    trips = load_json(TRIPS_FILE)
    
    new_trip = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "title": trip.title,
        "from_location": trip.from_location,
        "to_location": trip.to_location,
        "date": trip.date,
        "seats": trip.seats,
        "budget": trip.budget,
        "description": trip.description,
        "type": trip.type,
        "status": "pending",
        "created_at": datetime.now().isoformat()
    }
    
    trips.append(new_trip)
    save_json(TRIPS_FILE, trips)
    
    return {"message": "Trip created successfully", "trip_id": new_trip["id"]}

@app.get("/api/trips/{trip_id}")
async def get_trip(trip_id: str):
    trips = load_json(TRIPS_FILE)
    trip = next((t for t in trips if t['id'] == trip_id), None)
    
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    return trip

@app.post("/api/payment")
async def process_payment(payment: PaymentRequest, user_id: str = Query(...)):
    users = load_json(USERS_FILE)
    payments = load_json(PAYMENTS_FILE)
    
    # Find user
    user_index = next((i for i, u in enumerate(users) if u['id'] == user_id), None)
    if user_index is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update user credits
    users[user_index]['credits'] = users[user_index].get('credits', 0) + payment.credits
    save_json(USERS_FILE, users)
    
    # Record payment
    new_payment = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "amount": payment.amount,
        "credits": payment.credits,
        "status": "completed",
        "created_at": datetime.now().isoformat()
    }
    
    payments.append(new_payment)
    save_json(PAYMENTS_FILE, payments)
    
    return {"message": "Payment successful", "credits": users[user_index]['credits']}

@app.get("/api/user/{user_id}/credits")
async def get_user_credits(user_id: str):
    users = load_json(USERS_FILE)
    user = next((u for u in users if u['id'] == user_id), None)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"credits": user.get('credits', 0)}

@app.post("/api/chat/initiate")
async def initiate_chat(user_id: str = Query(...), trip_id: str = Query(...)):
    users = load_json(USERS_FILE)
    chats = load_json(CHATS_FILE)
    
    # Find user
    user_index = next((i for i, u in enumerate(users) if u['id'] == user_id), None)
    if user_index is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user has credits
    if users[user_index].get('credits', 0) < 1:
        raise HTTPException(status_code=402, detail="Insufficient credits")
    
    # Deduct credit
    users[user_index]['credits'] -= 1
    save_json(USERS_FILE, users)
    
    # Create chat
    chat_id = f"chat-{user_id}-{trip_id}"
    new_chat = {
        "id": chat_id,
        "user_id": user_id,
        "trip_id": trip_id,
        "messages": [],
        "created_at": datetime.now().isoformat()
    }
    
    chats.append(new_chat)
    save_json(CHATS_FILE, chats)
    
    return {"message": "Chat initiated", "chat_id": chat_id}

# Admin endpoints
@app.get("/api/admin/stats")
async def get_admin_stats():
    users = load_json(USERS_FILE)
    trips = load_json(TRIPS_FILE)
    payments = load_json(PAYMENTS_FILE)
    
    total_revenue = sum(p.get('amount', 0) for p in payments)
    
    return {
        "total_users": len(users),
        "total_trips": len(trips),
        "pending_trips": len([t for t in trips if t.get('status') == 'pending']),
        "approved_trips": len([t for t in trips if t.get('status') == 'approved']),
        "total_revenue": total_revenue,
        "total_payments": len(payments)
    }

@app.get("/api/admin/users")
async def get_all_users():
    users = load_json(USERS_FILE)
    # Remove passwords from response
    return [{k: v for k, v in user.items() if k != 'password'} for user in users]

@app.get("/api/admin/payments")
async def get_all_payments():
    return load_json(PAYMENTS_FILE)

@app.get("/api/admin/trips")
async def get_all_trips():
    return load_json(TRIPS_FILE)

@app.put("/api/admin/user/{user_id}/block")
async def block_user(user_id: str, blocked: bool = Query(...)):
    users = load_json(USERS_FILE)
    user_index = next((i for i, u in enumerate(users) if u['id'] == user_id), None)
    
    if user_index is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    users[user_index]['blocked'] = blocked
    save_json(USERS_FILE, users)
    
    return {"message": f"User {'blocked' if blocked else 'unblocked'} successfully"}

@app.put("/api/admin/trip/{trip_id}/status")
async def update_trip_status(trip_id: str, status: str = Query(...), reason: Optional[str] = None):
    trips = load_json(TRIPS_FILE)
    
    trip_index = next((i for i, t in enumerate(trips) if t['id'] == trip_id), None)
    if trip_index is None:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    trips[trip_index]['status'] = status
    if reason:
        trips[trip_index]['rejection_reason'] = reason
    
    save_json(TRIPS_FILE, trips)
    
    return {"message": f"Trip status updated to {status}"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8080)