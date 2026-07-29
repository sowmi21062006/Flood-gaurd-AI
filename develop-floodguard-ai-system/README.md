# FloodGuard AI - Autonomous Early Warning & Community Evacuation System

A production-ready, full-stack AI-powered web application for flash flood prediction, evacuation planning, and emergency communication using Multi-Agent AI architecture.

## 🌊 Overview

FloodGuard AI is an intelligent emergency response system that predicts flash floods, simulates flood inundation, plans safe evacuation routes, and sends multilingual emergency alerts to communities at risk.

**Supporting SDG 11 (Sustainable Cities) and SDG 13 (Climate Action)**

## 🚀 Features

### Multi-Agent AI Architecture
- **Hydrological Radar Agent**: Monitors environmental sensors and predicts flood probability using ML models
- **Flood Inundation Mapping Agent**: Generates street-level flood simulation and identifies affected roads
- **Evacuation Routing Agent**: Calculates safest evacuation routes using A* algorithm
- **Multilingual Alert Agent**: Generates emergency alerts in 6 languages using Groq AI
- **Emergency Coordinator Agent**: Orchestrates all agents in automated workflow

### Core Capabilities
✅ Real-time flood risk prediction  
✅ AI-powered risk scoring (0-100)  
✅ Street-level flood mapping  
✅ Smart evacuation routing  
✅ Multilingual emergency alerts (English, Tamil, Hindi, Kannada, Telugu, Malayalam)  
✅ Shelter capacity management  
✅ Live environmental sensor monitoring  
✅ AI chatbot assistant  
✅ Role-based access control  
✅ Emergency workflow automation  

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS 4
- **Authentication**: NextAuth.js
- **State Management**: React Hooks
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js
- **API Framework**: Next.js API Routes
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **AI Integration**: Groq API (Llama 3.3 70B)

### AI & Machine Learning
- **Multi-Agent System**: Custom TypeScript implementation
- **LLM**: Groq API (Llama 3.3 70B Versatile)
- **Prediction Models**: Simulated XGBoost/LSTM algorithms
- **Routing Algorithm**: A* pathfinding

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Groq API key (get free at https://console.groq.com)

## 🔧 Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd floodguard-ai
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Edit `.env` file and add:
```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
GROQ_API_KEY=your-groq-api-key-here
```

4. **Set up database**
```bash
# Apply schema to database
npx drizzle-kit push
```

5. **Seed initial data**
```bash
# Start the development server first
npm run dev

# Then in another terminal, seed the database
curl -X POST http://localhost:3000/api/seed
```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```
Visit http://localhost:3000

### Production Mode
```bash
npm run build
npm start
```

## 📱 User Roles

- **Admin**: Full system access, can trigger emergency workflows
- **Emergency Officer**: Can approve alerts and manage emergency response
- **Volunteer**: Can view data and assist in coordination
- **Citizen**: Can view alerts, find shelters, and get evacuation routes

## 🔑 Default Test Account

Create an account via the registration page or use Google OAuth.

## 📊 Database Schema

### Core Tables
- `users` - User authentication and profiles
- `sensor_data` - Environmental sensor readings
- `flood_predictions` - AI-generated flood predictions
- `flood_maps` - Inundation simulation data
- `alerts` - Emergency alerts (multilingual)
- `routes` - Evacuation routes
- `shelters` - Emergency shelter information
- `agent_logs` - AI agent activity logs
- `chat_conversations` - Chatbot conversations
- `historical_floods` - Training data for ML models

## 🤖 AI Agent Workflow

1. **Hydrological Agent** reads sensor data (river level, rainfall, etc.)
2. **Prediction** generates flood risk score and probability
3. **If risk > 50%**, workflow continues:
   - **Mapping Agent** simulates flood inundation
   - **Routing Agent** calculates safe evacuation routes
   - **Alert Agent** generates multilingual emergency messages
4. **Coordinator** logs all activities and stores results
5. **Admin** approves alerts for broadcast

## 🔌 API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/auth/[...nextauth]` - NextAuth endpoints

### Emergency System
- `POST /api/prediction/run` - Trigger emergency workflow
- `GET /api/prediction/run` - Get current flood status

### Data Management
- `GET /api/sensors` - Get sensor readings
- `POST /api/sensors` - Add sensor data
- `GET /api/shelters` - Get shelters
- `POST /api/shelters` - Add shelter
- `GET /api/alerts` - Get alerts
- `POST /api/alerts` - Approve alert

### AI Features
- `POST /api/chatbot` - Chat with AI assistant
- `GET /api/dashboard/stats` - Get dashboard statistics

### Utilities
- `POST /api/seed` - Seed database with sample data
- `GET /api/health` - Health check

## 🎯 Key Pages

- `/` - Landing page
- `/login` - User login
- `/register` - User registration
- `/dashboard` - Main emergency dashboard
- `/dashboard/map` - Live flood map & shelters
- `/dashboard/chatbot` - AI assistant

## 🧪 Testing the Application

1. **Seed database**: `curl -X POST http://localhost:3000/api/seed`
2. **Register account**: Visit `/register`
3. **Login**: Visit `/login`
4. **Run emergency workflow**: Click "Run Emergency Workflow" on dashboard
5. **View results**: Check prediction, sensors, and agent health
6. **Chat with AI**: Visit `/dashboard/chatbot`
7. **View map**: Visit `/dashboard/map`

## 🌍 Multilingual Support

The system generates emergency alerts in 6 languages:
- English
- Tamil (தமிழ்)
- Hindi (हिन्दी)
- Kannada (ಕನ್ನಡ)
- Telugu (తెలుగు)
- Malayalam (മലയാളം)

## 🔒 Security Features

- Password hashing with bcrypt
- JWT session management
- Role-based access control
- API authentication
- Protected routes
- Environment variable secrets

## 📈 Performance

- Real-time sensor monitoring
- Sub-second flood predictions
- Instant alert generation
- Efficient database queries
- Optimized AI agent execution

## 🤝 Contributing

This is a hackathon demonstration project showcasing:
- Multi-agent AI architecture
- Real-time emergency response systems
- Disaster management technology
- Climate action solutions

## 📄 License

MIT License - Feel free to use for educational and non-commercial purposes.

## 🙏 Acknowledgments

- Groq for fast AI inference
- Next.js team for the excellent framework
- PostgreSQL community
- OpenStreetMap for geodata standards

## 📞 Support

For issues or questions, please create an issue in the repository.

---

**Built with ❤️ for disaster resilience and community safety**

Supporting UN Sustainable Development Goals:
- SDG 11: Sustainable Cities and Communities
- SDG 13: Climate Action
