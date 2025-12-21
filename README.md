# StockScope - Advanced Stock Market Analysis Platform

A production-ready full-stack stock analysis platform featuring real-time market data, advanced screeners, technical indicators, portfolio tracking, and a beautiful modern UI.

## 🚀 Features

### Core Functionality
- **Real-Time Market Data**: Live stock quotes, indices, and market overview
- **Advanced Stock Screener**: Filter stocks using 50+ criteria including technical and fundamental indicators
- **Technical Analysis**: RSI, MACD, Moving Averages, Bollinger Bands, and more
- **Portfolio Management**: Track multiple portfolios with real-time P&L calculations
- **Watchlists**: Create custom watchlists with price alerts
- **Market Insights**: Top gainers/losers, sector performance, market heatmap

### Technical Highlights
- **Backend**: Flask REST API with JWT authentication
- **Frontend**: Next.js 14 with React 18 and TypeScript
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Caching**: Redis for high-performance data caching
- **Real-time**: WebSocket support via Socket.IO
- **Design**: Modern glassmorphism UI with dark mode
- **Deployment**: Docker containerization ready

## 📋 Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

## 🛠️ Installation

### Option 1: Docker Compose (Recommended)

```bash
# Clone the repository
cd fintech_webdev

# Create environment file
cp .env.example .env
# Edit .env with your API keys

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
```

### Option 2: Manual Setup

#### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp ../.env.example .env
# Edit .env with your configuration

# Initialize database
flask db init
flask db migrate -m "Initial migration"
flask db upgrade

# Run the backend
python app.py
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local

# Run development server
npm run dev
```

## 📁 Project Structure

```
fintech_webdev/
├── backend/
│   ├── api/              # REST API endpoints
│   │   ├── auth.py       # Authentication
│   │   ├── stocks.py     # Stock data
│   │   ├── portfolio.py  # Portfolio management
│   │   ├── watchlist.py  # Watchlist management
│   │   └── market.py     # Market overview
│   ├── models/           # Database models
│   │   ├── user.py
│   │   ├── stock.py
│   │   ├── portfolio.py
│   │   ├── watchlist.py
│   │   └── screener.py
│   ├── services/         # Business logic
│   │   ├── stock_data_service.py
│   │   ├── technical_analysis.py
│   │   └── cache_service.py
│   ├── app.py            # Flask application
│   ├── config.py         # Configuration
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/          # Next.js pages
│   │   ├── components/   # React components
│   │   ├── lib/          # API client
│   │   ├── store/        # State management
│   │   ├── styles/       # Global styles
│   │   └── types/        # TypeScript types
│   ├── package.json
│   ├── next.config.js
│   └── tailwind.config.js
├── docker-compose.yml
└── README.md
```

## 🔑 API Keys

To use stock market data, you'll need API keys from one or more providers:

### Free Tier APIs
- **Alpha Vantage**: https://www.alphavantage.co/support/#api-key (Free: 5 calls/min, 500 calls/day)
- **Yahoo Finance**: via `yfinance` library (no key required, best for development)
- **Finnhub**: https://finnhub.io/ (Free: 60 calls/min)

Add your keys to `.env`:
```
ALPHA_VANTAGE_API_KEY=your_key_here
FINNHUB_API_KEY=your_key_here
```

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# Flask
SECRET_KEY=your-secret-key-change-in-production
JWT_SECRET_KEY=your-jwt-secret-key-change-in-production

# Database
DATABASE_URL=postgresql://stockscope_user:stockscope_password@localhost:5432/stockscope_db

# Redis
REDIS_URL=redis://localhost:6379/0

# Stock APIs
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
FINNHUB_API_KEY=your_finnhub_key

# CORS
CORS_ORIGINS=http://localhost:3000
```

## 🎨 Design System

### Colors
- **Primary**: Deep blue (#1e3a8a → #3b82f6)
- **Success**: Green (#10b981)
- **Danger**: Red (#ef4444)
- **Dark Background**: #0f172a, #1e293b

### Typography
- **Headings**: Inter (Bold)
- **Body**: Inter (Regular, Medium)
- **Monospace**: JetBrains Mono

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/me` - Update profile

### Stocks
- `GET /api/stocks/search?q={query}` - Search stocks
- `GET /api/stocks/{symbol}/quote` - Get real-time quote
- `GET /api/stocks/{symbol}/historical` - Historical data
- `GET /api/stocks/{symbol}/info` - Company information
- `GET /api/stocks/{symbol}/indicators` - Technical indicators

### Portfolio
- `GET /api/portfolio/` - List portfolios
- `POST /api/portfolio/` - Create portfolio
- `GET /api/portfolio/{id}` - Get portfolio details
- `POST /api/portfolio/{id}/positions` - Add position
- `GET /api/portfolio/{id}/transactions` - Transaction history

### Watchlist
- `GET /api/watchlist/` - List watchlists
- `POST /api/watchlist/` - Create watchlist
- `POST /api/watchlist/{id}/items` - Add stock to watchlist

### Market
- `GET /api/market/indices` - Major market indices
- `GET /api/market/movers` - Top gainers/losers
- `GET /api/market/overview` - Market overview

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest tests/ -v --cov

# Frontend tests
cd frontend
npm test
```

## 🚀 Deployment

### Production Checklist
1. ✅ Set strong `SECRET_KEY` and `JWT_SECRET_KEY`
2. ✅ Configure production database (PostgreSQL)
3. ✅ Set up Redis instance
4. ✅ Add stock market API keys
5. ✅ Configure CORS for your domain
6. ✅ Enable HTTPS
7. ✅ Set up monitoring and logging

### Docker Production

```bash
# Build and run in production mode
docker-compose -f docker-compose.yml up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🛣️ Roadmap

- [x] Core stock data fetching
- [x] Authentication system
- [x] Portfolio management
- [x] Watchlist functionality
- [ ] Advanced screener builder UI
- [ ] Real-time WebSocket updates
- [ ] Celery background tasks
- [ ] Email notifications
- [ ] Mobile-responsive dashboard
- [ ] Export to CSV/PDF
- [ ] Advanced charting with TradingView

## 🤝 Contributing

This is a portfolio project. Feel free to fork and customize for your needs!

## 📄 License

This project is for educational and portfolio purposes.

## 🙏 Acknowledgments

- Stock data provided by yfinance, Alpha Vantage, and Finnhub
- UI inspired by ScanX, Tickertape, Screener, and StockAnalysis
- Built with Flask, Next.js, PostgreSQL, and Redis

## 📞 Support

For questions or issues, please create an issue in the repository.

---

**Built with ❤️ for stock market enthusiasts**
