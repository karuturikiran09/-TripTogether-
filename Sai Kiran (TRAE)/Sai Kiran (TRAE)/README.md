# TripTogether - Smart Multi-User Travel Coordination System

A professional web-based travel collaboration platform where users can post or join trips, share travel resources, get AI-suggested route and budget plans, and pay a small fee to chat with trip owners.

## 🌟 Features

### User Features
- **User Registration & Authentication** - Secure login/signup system
- **Trip Management** - Post trips as Driver/Traveler/Sponsor
- **Smart Search & Filter** - Find trips by location, date, budget
- **AI-Powered Matching** - Get matched with compatible travelers
- **Route Optimization** - AI-suggested routes and cost estimates
- **Pay-to-Chat System** - Buy credits to contact trip owners
- **Secure Payments** - Integrated payment gateway (Razorpay)
- **User Dashboard** - Manage trips, chats, and credits

### Admin Features
- **Dashboard Analytics** - View stats, revenue, and activity
- **User Management** - View and manage all users
- **Trip Approval System** - Approve/reject trip posts
- **Payment Monitoring** - Track all transactions
- **Platform Settings** - Configure pricing and policies

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: Python (FastAPI)
- **Database**: JSON-based file storage
- **APIs**: RESTful API architecture
- **Styling**: Custom CSS with modern design
- **Icons**: Font Awesome

## 📁 Project Structure

```
TripTogether/
├── backend/
│   ├── main.py              # FastAPI backend server
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── index.html          # Main landing page
│   ├── css/
│   │   └── style.css       # Main stylesheet
│   ├── js/
│   │   └── app.js          # Frontend JavaScript
│   └── admin/
│       ├── admin.html      # Admin panel
│       ├── admin.css       # Admin styles
│       └── admin.js        # Admin functionality
├── data/                   # JSON data storage
│   ├── users.json
│   ├── trips.json
│   ├── payments.json
│   └── chats.json
└── README.md
```

## 🚀 Installation & Setup

### Prerequisites
- Python 3.8 or higher
- Modern web browser (Chrome, Firefox, Edge)

### Step 1: Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Step 2: Start the Backend Server

```bash
python main.py
```

The API server will start at `http://localhost:8000`

### Step 3: Open the Frontend

Open `frontend/index.html` in your web browser, or use a local server:

```bash
# Using Python's built-in server
cd frontend
python -m http.server 8080
```

Then visit `http://localhost:8080`

### Step 4: Access Admin Panel

Navigate to `frontend/admin/admin.html` to access the admin dashboard.

## 📖 Usage Guide

### For Users

1. **Sign Up**: Create an account with email and password
2. **Browse Trips**: Search for available trips by location
3. **Post a Trip**: Create your own trip listing
4. **Buy Credits**: Purchase chat credits (₹20 per credit)
5. **Contact Owners**: Use credits to initiate chat with trip owners
6. **Manage Dashboard**: View your trips, chats, and credits

### For Admins

1. **Access Admin Panel**: Open `admin/admin.html`
2. **View Dashboard**: Monitor platform statistics
3. **Manage Users**: View all registered users
4. **Approve Trips**: Review and approve/reject trip posts
5. **Track Payments**: Monitor all transactions
6. **Configure Settings**: Adjust pricing and policies

## 🔑 Key Endpoints

### User Endpoints
- `POST /api/register` - Register new user
- `POST /api/login` - User login
- `GET /api/trips` - Get all trips
- `POST /api/trips` - Create new trip
- `GET /api/trips/{trip_id}` - Get trip details

### Payment Endpoints
- `POST /api/payment` - Process payment
- `GET /api/user/{user_id}/credits` - Get user credits

### Chat Endpoints
- `POST /api/chat/initiate` - Start chat (costs 1 credit)
- `POST /api/chat/{chat_id}/message` - Send message
- `GET /api/chat/{chat_id}` - Get chat history

### Admin Endpoints
- `GET /api/admin/stats` - Get platform statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/payments` - Get all payments
- `PUT /api/admin/trip/{trip_id}/status` - Update trip status

## 💳 Payment System

The platform uses a credit-based system:
- **1 Credit** = ₹20 (1 chat request)
- **5 Credits** = ₹90 (Save ₹10)
- **10 Credits** = ₹150 (Save ₹50)

Credits are required to initiate chat with trip owners, ensuring genuine interactions.

## 🎨 Design Features

- **Modern UI/UX** - Clean, professional interface
- **Responsive Design** - Works on all devices
- **Smooth Animations** - Enhanced user experience
- **Gradient Themes** - Eye-catching color schemes
- **Icon Integration** - Font Awesome icons throughout

## 🔒 Security Features

- **Password Hashing** - SHA-256 encryption
- **Secure Payments** - Payment gateway integration
- **Admin Moderation** - Manual trip approval system
- **User Verification** - Pay-to-chat prevents spam

## 🌐 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Opera

## 📝 Future Enhancements

- Real-time chat with WebSocket
- Google Maps integration
- Email notifications
- Mobile app version
- Advanced AI matching algorithms
- Rating and review system
- Multi-language support

## 🤝 Contributing

This is an MCA project. For any suggestions or improvements, please contact the developer.

## 📄 License

This project is created for educational purposes as part of MCA curriculum.

## 👨‍💻 Developer

**Sai Kiran**
- Project: MCA Final Year Project
- Institution: [Your Institution Name]
- Year: 2024

## 📞 Support

For any queries or issues:
- Email: support@triptogether.com
- Phone: +91 98765 43210

---

**Note**: This is a demonstration project. For production use, implement proper database (PostgreSQL/MongoDB), real payment gateway integration, and enhanced security measures.
