# 🚀 Fleet Telematics Platform - Complete Codebase

**A production-ready driver safety and fleet management SaaS platform for India**

---

## 📋 Project Overview

**Fleet Telematics Platform** is a comprehensive B2B SaaS solution that combines mobile applications, backend API, and database infrastructure to provide real-time driver monitoring, safety scoring, and fleet management.

### Key Features

- ✅ **Real-time GPS Tracking** - Collect GPS every 5 seconds during trips
- ✅ **Automatic Event Detection** - Detect harsh brakes, speeding, harsh corners
- ✅ **Daily Safety Scores** - Calculate driver scores daily at 11:59 PM (Celery)
- ✅ **FASTAG Wallet Management** - Manage toll payment wallets
- ✅ **OTP-Based B2B Onboarding** - Fleet owners invite drivers
- ✅ **Multi-User Support** - Driver app, Fleet owner app, Admin dashboard

---

## 📁 Project Structure

```
fleet-telematics-platform/
├── backend/                          (Python FastAPI)
│   ├── main.py                      Entry point
│   ├── database.py                  PostgreSQL connection
│   ├── models.py                    8 database tables
│   ├── auth.py                      JWT + OTP authentication
│   ├── requirements.txt             Python dependencies
│   ├── .env.example                 Environment template
│   └── routes/
│       ├── auth_routes.py           Login, register, OTP
│       ├── trip_routes.py           Trip management
│       ├── score_routes.py          Driver scores
│       └── fleet_routes.py          Fleet dashboard
│
├── driver-app/                       (React Native - Expo)
│   ├── App.js                       Main entry point
│   ├── package.json                 Dependencies
│   └── src/
│       ├── api/client.js            API client
│       ├── store/authSlice.js       Redux store
│       └── screens/                 UI screens
│
├── fleet-app/                        (React Native - Expo)
│   ├── App.js                       Main entry point
│   ├── package.json                 Dependencies
│   └── src/
│       ├── api/client.js            API client
│       ├── store/authSlice.js       Redux store
│       └── screens/                 UI screens
│
└── README.md                        This file
```

---

## 🏗️ Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React Native (Expo) | Cross-platform mobile apps |
| **Backend** | FastAPI (Python) | REST API |
| **Database** | PostgreSQL | Relational data storage |
| **Cache/Queue** | Redis | Celery task queue |
| **Auth** | JWT + OTP | Secure authentication |
| **File Storage** | Firebase | Document/image storage |
| **State Mgmt** | Redux Toolkit | Mobile state management |

---

## 🗄️ Database Schema (8 Tables)

### 1. **companies**
- Fleet owner accounts
- Subscription management
- Contact information

### 2. **drivers**
- Driver profiles
- Phone number (unique - OTP login)
- Document URLs (Firebase)
- Status (active/suspended)

### 3. **vehicles**
- Vehicle information
- Registration details
- FASTAG ID and balance
- Document expiry tracking

### 4. **trips**
- Trip records
- Start/end times
- Distance and duration
- Event counts (denormalized)

### 5. **gps_coordinates** (HIGH VOLUME)
- GPS points collected every 5 seconds
- ~180,000 rows/day for 100 drivers
- Speed and bearing data
- Indexed for fast playback

### 6. **trip_events**
- Harsh brake events (-5 points)
- Speeding incidents (-1 point)
- Harsh corner events (-2 points)
- Event location and severity

### 7. **daily_scores** (KEY TABLE)
- Daily driver safety scores (0-100)
- Calculated at 11:59 PM via Celery
- Average of all trip scores
- Event breakdowns

### 8. **fastag_wallets**
- FASTAG toll payment balance
- Top-up history
- Sync status with provider

---

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- Node.js 16+
- PostgreSQL 12+
- Redis 6+
- Expo CLI

---

### 1️⃣ Backend Setup (5 minutes)

```bash
# Clone and enter backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env with your database URL and secrets

# Initialize database
python database.py

# Start server
python main.py
# Server runs at http://localhost:8000
# API docs at http://localhost:8000/docs
```

**Backend Endpoints:**
- `POST /api/v1/auth/register-company` - Register company
- `POST /api/v1/auth/invite-driver` - Send OTP
- `POST /api/v1/auth/verify-driver` - Verify OTP & create driver
- `GET /api/v1/scores/yesterday` - Get yesterday's score
- `GET /api/v1/fleet/dashboard` - Fleet dashboard

---

### 2️⃣ Driver App Setup (5 minutes)

```bash
# Enter driver app directory
cd driver-app

# Install dependencies
npm install
# or yarn install

# Start Expo development server
npm start

# Scan QR code with Expo Go app on your phone
# Or press 'a' for Android emulator
# Or press 'i' for iOS simulator
```

**Driver App Features:**
- OTP-based login
- Start/stop trips
- View daily score (next morning)
- See FASTAG wallet
- Upload documents

---

### 3️⃣ Fleet Owner App Setup (5 minutes)

```bash
# Enter fleet app directory
cd fleet-app

# Install dependencies
npm install

# Start Expo
npm start

# Scan QR code or use emulator
```

**Fleet Owner App Features:**
- Company registration
- View all drivers
- See drivers' scores
- Manage FASTAG wallets
- Track active trips

---

## 🔐 Authentication Flow

### Driver Onboarding (B2B Model)

```
1. Fleet Owner -> Invites Driver
   POST /auth/invite-driver?phone=9876543210
   
2. System -> Sends OTP via SMS
   OTP: 123456 (5-minute expiry)
   
3. Driver -> Enters OTP + vehicle info
   POST /auth/verify-driver
   {
     "phone": "9876543210",
     "otp": "123456",
     "name": "Rajesh",
     "vehicle_number": "KA01AB1234"
   }
   
4. Response -> JWT tokens
   {
     "access_token": "eyJhbGc...",
     "refresh_token": "eyJhbGc...",
     "expires_in": 86400
   }
```

---

## 🎯 Scoring Formula

```
Base Score: 100 points

Per Event Deductions:
  • Harsh brake (>2G deceleration) = -5 points
  • Speeding (>80 km/h) = -1 point  
  • Harsh corner (>30° turn) = -2 points

Trip Score = 100 - (harsh_brakes × 5) - (speeding × 1) - (corners × 2)
Range: 0-100 (capped)

Daily Score = Average of all trip scores for the day

Calculated: 11:59 PM every night (Celery job)
Visible: Next morning at 6 AM
```

**Example:**
```
Trip 1: 100 - (3×5) - (2×1) = 87/100
Trip 2: 100 - (1×5) - (0×1) = 95/100
Trip 3: 100 - (2×5) - (1×1) = 89/100

Daily Average = (87 + 95 + 89) / 3 = 90.3 ≈ 90/100
```

---

## 🔌 API Endpoints

### Authentication (6 endpoints)
```
POST   /auth/register-company      Create company account
POST   /auth/login-company         Company login  
POST   /auth/invite-driver         Send OTP to driver
POST   /auth/verify-driver         Verify OTP & create account
POST   /auth/refresh-token         Refresh JWT token
GET    /auth/me                    Get current user
```

### Trips (5 endpoints)
```
POST   /trips/start                Start new trip
PUT    /trips/{id}/locations       Send GPS batch
POST   /trips/{id}/end             End trip
GET    /trips/{id}                 Get trip details
GET    /trips                      List driver's trips
```

### Scores (4 endpoints)
```
GET    /scores/yesterday           Yesterday's score
GET    /scores/weekly              7-day average
GET    /scores/monthly             30-day average
GET    /scores/history             Score history
```

### Fleet (6 endpoints)
```
GET    /fleet/drivers              All drivers
GET    /fleet/scores               All drivers' scores
GET    /fleet/vehicles             All vehicles
GET    /fleet/active-trips         Active trips
GET    /fleet/dashboard            KPI dashboard
POST   /fleet/invite-driver        Invite new driver
```

---

## 🛠️ Development Guide

### Adding a New API Endpoint

1. **Create route handler** in `routes/your_route.py`:
```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db

router = APIRouter()

@router.get("/endpoint")
async def your_endpoint(db: Session = Depends(get_db)):
    """Endpoint documentation"""
    # Your code here
    return {"status": "success"}
```

2. **Register route** in `main.py`:
```python
from routes import your_route

app.include_router(
    your_route.router,
    prefix="/api/v1/your",
    tags=["YourTag"]
)
```

3. **Test endpoint** at `http://localhost:8000/docs`

---

### Adding a New Screen (Mobile)

1. **Create screen component** in `src/screens/YourScreen.js`:
```javascript
import React from 'react';
import { View, Text } from 'react-native';

export const YourScreen = ({ navigation }) => {
  return (
    <View>
      <Text>Your screen content</Text>
    </View>
  );
};
```

2. **Add to navigation** in `App.js`:
```javascript
<Tab.Screen
  name="YourScreen"
  component={YourScreen}
  options={{ title: 'Your Screen' }}
/>
```

---

## 📊 Database Migrations

Use Alembic for managing database schema changes:

```bash
# Create a migration
alembic revision --autogenerate -m "Add new column"

# Apply migration
alembic upgrade head

# Rollback
alembic downgrade -1
```

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/
pytest tests/test_auth.py -v
```

### Mobile Tests
```bash
cd driver-app
npm test
```

---

## 📦 Deployment

### Backend (Render, Railway, Heroku)

1. **Push code to GitHub**
2. **Connect to deployment platform**
3. **Set environment variables**
4. **Deploy**

```bash
# Example with Render
git push origin main
# Automatically deployed
```

### Mobile Apps (Apple App Store, Google Play)

```bash
# Build APK for Android
eas build --platform android

# Build IPA for iOS  
eas build --platform ios

# Submit to stores
eas submit --platform android --latest
eas submit --platform ios --latest
```

---

## 🔒 Security Considerations

- ✅ HTTPS/TLS for all communications
- ✅ JWT tokens with 24-hour expiry
- ✅ Bcrypt password hashing (12 rounds)
- ✅ Rate limiting on OTP requests (3 attempts)
- ✅ Idempotent API operations
- ✅ CORS configured for mobile apps
- ✅ Database credentials via environment variables
- ✅ SQL injection protection (SQLAlchemy ORM)

**Production Checklist:**
- [ ] Change SECRET_KEY to random 32+ character string
- [ ] Enable HTTPS everywhere
- [ ] Setup monitoring (Sentry, DataDog)
- [ ] Configure email alerts
- [ ] Setup database backups
- [ ] Enable rate limiting
- [ ] Configure firewall rules
- [ ] Setup VPN for database access

---

## 📈 Performance Tips

1. **Database Indexing** - Key tables have indexes on frequently queried columns
2. **Connection Pooling** - SQLAlchemy uses pool_size=20
3. **Pagination** - All list endpoints support pagination
4. **Caching** - Redis for session/token storage
5. **Async Jobs** - Celery for daily scoring calculation
6. **CDN** - Firebase for static document storage

---

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Check if port 8000 is in use
lsof -i :8000

# Kill process using port
kill -9 <PID>

# Check database connection
python database.py
```

### Mobile App Won't Connect
```bash
# Clear cache
npm start --c

# Reset node_modules
rm -rf node_modules && npm install

# Check API URL in .env
echo $REACT_APP_API_URL
```

### Database Migration Error
```bash
# Reset database (CAREFUL!)
dropdb fleet_platform
createdb fleet_platform
python database.py
```

---

## 📚 Documentation Files

- **DATABASE_DESIGN.md** - Detailed schema documentation
- **API_REFERENCE.md** - Complete API endpoint reference
- **DEPLOYMENT_GUIDE.md** - Step-by-step deployment guide
- **ARCHITECTURE.md** - System architecture and design decisions

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Write tests for new functionality
4. Submit a pull request

---

## 📞 Support

- **Backend Issues**: Check `logs/` directory
- **Database Issues**: Review PostgreSQL logs
- **Mobile Issues**: Check Expo console output
- **General Help**: Review API docs at `/docs`

---

## 📄 License

MIT License - Feel free to use for personal and commercial projects

---

## 🎉 What's Next?

1. **Phase 2** - Real-time push notifications
2. **Phase 3** - OBD-II vehicle data integration
3. **Phase 4** - Insurance partner API integrations
4. **Phase 5** - Advanced analytics dashboard

---

**Ready to scale? Start with Phase 1 and expand from there!** 🚀
