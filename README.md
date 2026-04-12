# AgriVision Pro

A comprehensive, AI-powered multi-tenant SaaS platform for modern agriculture. Connects farmers directly with buyers, provides intelligent crop health monitoring, weather forecasting, market intelligence, and financial management.

## 🚀 Features

### Core Modules

#### 1. AI Crop Health Monitor
- Upload crop images for instant AI-powered disease detection
- Gemini Vision API integration for accurate diagnosis
- Treatment recommendations with organic and chemical options
- Historical analysis tracking
- Multi-language support (English, Hindi, Marathi)

#### 2. Weather Intelligence System
- 7-day weather forecast with detailed metrics
- Weather alerts (heavy rain, drought, frost, heat waves)
- Crop-specific recommendations based on weather conditions
- Location-based forecasting
- UV index, humidity, wind speed monitoring

#### 3. Local Market Intelligence
- Real-time mandi prices across India
- Price trends and historical data
- Market comparisons by location
- Support for 12+ major crops
- Export potential indicators

#### 4. Crop Encyclopedia
- Comprehensive database of 100+ crops
- Planting guides with soil, temperature, and rainfall requirements
- Pest and disease identification
- Organic and chemical treatment options
- Companion cropping and rotation recommendations
- Searchable by crop name, category, or growing conditions

#### 5. B2B Marketplace
- Direct farmer-to-buyer transactions
- Verified supplier network
- Order tracking and management
- Secure payment integration
- Rating and review system

#### 6. Financial Management
- Income and expense tracking
- Category-wise budget allocation
- Profit/loss analysis
- Monthly and yearly financial reports
- GST and tax-deductible expense tracking
- Recurring transaction support

#### 7. Multi-Language Support
- English (Default)
- Hindi (हिंदी)
- Marathi (मराठी)

#### 8. Dark Mode
- Full dark mode support across all pages
- System theme detection
- Persistent theme preference

## 🏗️ Architecture

### Tech Stack

**Backend:**
- Node.js + Express + TypeScript
- MongoDB + Mongoose ODM
- JWT Authentication
- Multer for file uploads
- Socket.io for real-time notifications
- Gemini AI API integration

**Frontend:**
- Next.js 15 + React 19 + TypeScript
- Tailwind CSS + Shadcn/UI
- TanStack Query (React Query) for data fetching
- Zustand for state management
- Framer Motion for animations
- React Hot Toast for notifications

### Database Schema

```
├── User (Farmer/Buyer/Admin)
├── Crop (with weather & soil data)
├── Order (B2B transactions)
├── Inventory (Marketplace listings)
├── AIAnalysis (Health scan results)
├── Weather (Forecasts & alerts)
├── MarketPrice (Mandi rates)
├── CropEncyclopedia (Crop database)
├── FinancialRecord (Income/Expense)
├── Budget (Season planning)
└── Notification (Real-time alerts)
```

## 📁 Project Structure

```
MASAI/
├── client/                 # Next.js frontend
│   ├── app/
│   │   ├── (app)/         # Protected routes
│   │   │   ├── dashboard/
│   │   │   ├── weather/
│   │   │   ├── market-prices/
│   │   │   ├── crop-encyclopedia/
│   │   │   ├── health-monitor/
│   │   │   ├── marketplace/
│   │   │   ├── inventory/
│   │   │   ├── orders/
│   │   │   └── financial/
│   │   └── auth/          # Login/Register
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── store/
├── server/                 # Express backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── services/
│   └── uploads/
└── docs/                   # Documentation
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Gemini API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd AgriVision
```

2. Install server dependencies:
```bash
cd server
npm install
```

3. Install client dependencies:
```bash
cd ../client
npm install
```

4. Configure environment variables:

**Server (.env):**
```env
NODE_ENV=your-env-name (developement, production etc.)
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/agrivision_pro
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your_gemini_api_key
CLIENT_URL=http://localhost:3000
```

**Client (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

5. Start the development servers:

**Server:**
```bash
cd server
npm run dev
```

**Client:**
```bash
cd client
npm run dev
```

6. Open http://localhost:3000 in your browser

## 📸 Virtual Tour

Experience the AgriVision Pro platform through this step-by-step visual journey of a modern farmer's workflow.

### 1. Welcome to AgriVision
The landing page greets users with a premium, accessible interface highlighting the core value propositions of the platform.
![Landing Page](https://agrivision-uploads-042122908061-ap-south-1-an.s3.ap-south-1.amazonaws.com/uploads/1775636274395-0a030672.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAQTTVYSGOXLSWJXKT%2F20260408%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20260408T105317Z&X-Amz-Expires=604800&X-Amz-Signature=80d4e98017ce3d7715a3245b97f89a3ac4fc20c500df7f82db85c76c5a1c4729&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

### 2. Seamless Onboarding
A simple, secure registration process designed for ease of use, allowing farmers to quickly join the digital ecosystem.
![Registration](https://agrivision-uploads-042122908061-ap-south-1-an.s3.ap-south-1.amazonaws.com/uploads/1775636290637-792e232e.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAQTTVYSGOXLSWJXKT%2F20260408%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20260408T105317Z&X-Amz-Expires=604800&X-Amz-Signature=54aadcefafb4aa4acce244632a27d0b93d902b577eebb1f4eda03ece9a6b584f&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

### 3. Intelligence Dashboard
The central hub for data-driven farming. View recent orders, active crop health scans, and quick navigation to all critical modules.
![Dashboard](https://agrivision-uploads-042122908061-ap-south-1-an.s3.ap-south-1.amazonaws.com/uploads/1775635766072-571354c8.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAQTTVYSGOXLSWJXKT%2F20260408%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20260408T105317Z&X-Amz-Expires=604800&X-Amz-Signature=c80e589cc8cda90f8a8331615f98e865a4982672ec09808a3712b5ef33c7f99c&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

### 4. AI Health Monitor
Leverage the power of Gemini Vision AI to diagnose crop diseases and pests instantly. Just upload a photo, and get expert treatment advice.
![AI Health Monitor](https://agrivision-uploads-042122908061-ap-south-1-an.s3.ap-south-1.amazonaws.com/uploads/1775635753039-0331a88f.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAQTTVYSGOXLSWJXKT%2F20260408%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20260408T105317Z&X-Amz-Expires=604800&X-Amz-Signature=c9905e0e2cb9809ccf31d5802506f318ffcc1a150ec839264a5594c4c2b35bd2&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

### 5. Market Pulse
Real-time Mandi price tracking across India. Make informed decisions on when and where to sell your produce for maximum profit.
![Market Prices](https://agrivision-uploads-042122908061-ap-south-1-an.s3.ap-south-1.amazonaws.com/uploads/1775635766072-571354c8.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAQTTVYSGOXLSWJXKT%2F20260408%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20260408T105317Z&X-Amz-Expires=604800&X-Amz-Signature=c80e589cc8cda90f8a8331615f98e865a4982672ec09808a3712b5ef33c7f99c&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

### 6. Real Time Order Tracking
Real-time Order tracking. Make informed decisions on when and who order your product, buyer info real time chat feature between farmer and buyer.
![Market Prices](https://agrivision-uploads-042122908061-ap-south-1-an.s3.ap-south-1.amazonaws.com/uploads/1775646030168-639d64a5.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAQTTVYSGOXLSWJXKT%2F20260408%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20260408T110031Z&X-Amz-Expires=604800&X-Amz-Signature=1536e5f496283675b4559f9e38c34652e17671ad3821b8368380dd5c1d85d3db&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

### 7. B2B Marketplace
A digital storefront to connect directly with bulk buyers. List your inventory, manage orders, and grow your business without middlemen.
![Marketplace](https://agrivision-uploads-042122908061-ap-south-1-an.s3.ap-south-1.amazonaws.com/uploads/1775637340582-662ec3bb.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAQTTVYSGOXLSWJXKT%2F20260408%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20260408T104819Z&X-Amz-Expires=604800&X-Amz-Signature=2bf430caca9830074a020c0829b1836969b510d4cb1a5f7c76d342e1a209295f&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

### 7. Digital Encyclopedia
A comprehensive guide for 100+ crops, providing expert knowledge on cultivation, pests, and soil requirements at your fingertips.
![Crop Encyclopedia](https://agrivision-uploads-042122908061-ap-south-1-an.s3.ap-south-1.amazonaws.com/uploads/1775635923744-6d220842.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAQTTVYSGOXLSWJXKT%2F20260408%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20260408T104819Z&X-Amz-Expires=604800&X-Amz-Signature=9ed485324e2a9857dc4f130097e7e03032bd7057fa590ffbd3f628b1fae39d90&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

### 8. Financial Hub
Manage your farm's finances like a business. Track every expense, monitor income, and analyze your profitability with intuitive reports.
![Financial Dashboard](https://agrivision-uploads-042122908061-ap-south-1-an.s3.ap-south-1.amazonaws.com/uploads/1775646541930-e24aa53f.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAQTTVYSGOXLSWJXKT%2F20260408%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20260408T110903Z&X-Amz-Expires=604800&X-Amz-Signature=692206123a901de27efa1b2bc66879d0a07c666a0a70e1e31cd8d24775e91825&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

### 9. Secure Exit
End your session securely with a single click, ensuring your farm data always remains private.
![Logout](https://agrivision-uploads-042122908061-ap-south-1-an.s3.ap-south-1.amazonaws.com/uploads/1775646541930-e24aa53f.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAQTTVYSGOXLSWJXKT%2F20260408%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20260408T111123Z&X-Amz-Expires=604800&X-Amz-Signature=b30aca0b30e9afdca0d648498c5cb500a25fcf4397daf4a6796a7d016eaba872&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

> [!TIP]
> **S3 Visibility Note:** These tour images are stored on a private AWS S3 bucket. They use temporary presigned URLs for visibility. To make images permanent in a public README, set the S3 bucket/folder to "Public Read" and use the base S3 URLs.

## 📱 User Flows

### Farmer Flow
1. Register/Login as Farmer
2. View Dashboard with crop overview
3. Check Weather Intelligence for farming recommendations
4. Monitor Market Prices for best selling time
5. Use Crop Encyclopedia for cultivation guidance
6. Scan crops with AI Health Monitor
7. List produce in Inventory for Marketplace
8. Track Orders from buyers
9. Manage Finances (income/expenses)

### Buyer Flow
1. Register/Login as Buyer
2. Browse B2B Marketplace
3. View crop listings with prices and quality ratings
4. Place orders directly with farmers
5. Track order status and delivery
6. Rate and review suppliers

## 🔐 Authentication & Authorization

- JWT-based authentication
- Role-based access control (Farmer/Buyer/Admin)
- Multi-tenant architecture with tenant isolation
- Secure password hashing with bcrypt

## 🌐 API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Crops
- `GET /api/crops` - List all crops
- `POST /api/crops` - Create new crop
- `GET /api/crops/:id` - Get crop details

### AI Health
- `POST /api/ai/scan` - Scan crop image for diseases
- `GET /api/ai/analyses` - Get analysis history

### Weather
- `GET /api/weather` - Get weather data
- `PUT /api/weather/location` - Update location

### Market Prices
- `GET /api/market-prices` - Get mandi prices
- `GET /api/market-prices/trends/:crop` - Get price trends

### Crop Encyclopedia
- `GET /api/crop-encyclopedia` - List all crops
- `GET /api/crop-encyclopedia/search` - Search crops
- `GET /api/crop-encyclopedia/:id` - Get crop details

### Financial
- `GET /api/financial/summary` - Financial overview
- `GET /api/financial/records` - Transaction history
- `POST /api/financial/records` - Add transaction

### Orders
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order
- `PATCH /api/orders/:id/status` - Update order status

## 🎨 UI/UX Features

- Responsive design (mobile-first)
- Dark mode support
- Smooth animations with Framer Motion
- Interactive charts and visualizations
- Real-time notifications
- Skeleton loading states
- Error boundaries and fallbacks

## 🧪 Testing

```bash
# Run server tests
cd server
npm test

# Run client tests
cd client
npm test
```

## 🚢 Deployment

### Server (Render/Railway/Heroku)
1. Set environment variables
2. Connect MongoDB Atlas
3. Deploy with `git push`

### Client (Vercel/Netlify)
1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set output directory: `dist` or `.next`
4. Add environment variables

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGO_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret for JWT signing | Yes |
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `CLIENT_URL` | Frontend URL for CORS | Yes |
| `PORT` | Server port (default: 5000) | No |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Team

- Full-stack development with modern technologies
- AI integration for agricultural insights
- Multi-tenant SaaS architecture
- Responsive and accessible UI design

## 🙏 Acknowledgments

- Google Gemini API for AI capabilities
- OpenWeather API for weather data
- Agmarknet for market price data
- Shadcn/UI for component library

---

Built with ❤️ for farmers and the agricultural community.
