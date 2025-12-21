"""Stock-related models for market data."""
from datetime import datetime
from models import db


class Stock(db.Model):
    """Stock master data."""
    
    __tablename__ = 'stocks'
    
    id = db.Column(db.Integer, primary_key=True)
    symbol = db.Column(db.String(20), unique=True, nullable=False, index=True)
    name = db.Column(db.String(200), nullable=False)
    exchange = db.Column(db.String(20), nullable=False, index=True)  # NASDAQ, NYSE, NSE, BSE
    market = db.Column(db.String(10), nullable=False, index=True)  # US, IN
    sector = db.Column(db.String(100))
    industry = db.Column(db.String(100))
    market_cap = db.Column(db.BigInteger)
    country = db.Column(db.String(50))
    currency = db.Column(db.String(10), default='USD')
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    ipo_date = db.Column(db.Date)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Latest quote cache
    last_price = db.Column(db.Float)
    price_change = db.Column(db.Float)
    price_change_percent = db.Column(db.Float)
    volume = db.Column(db.BigInteger)
    quote_updated_at = db.Column(db.DateTime)
    
    # Relationships
    price_data = db.relationship('StockPriceData', back_populates='stock', lazy='dynamic', cascade='all, delete-orphan')
    technical_indicators = db.relationship('TechnicalIndicator', back_populates='stock', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        """String representation."""
        return f'<Stock {self.symbol}>'
    
    def to_dict(self, include_quote=True):
        """Convert to dictionary."""
        data = {
            'id': self.id,
            'symbol': self.symbol,
            'name': self.name,
            'exchange': self.exchange,
            'market': self.market,
            'sector': self.sector,
            'industry': self.industry,
            'market_cap': self.market_cap,
            'currency': self.currency
        }
        
        if include_quote and self.last_price:
            data['quote'] = {
                'price': self.last_price,
                'change': self.price_change,
                'change_percent': self.price_change_percent,
                'volume': self.volume,
                'updated_at': self.quote_updated_at.isoformat() if self.quote_updated_at else None
            }
        
        return data


class StockPriceData(db.Model):
    """Historical stock price data."""
    
    __tablename__ = 'stock_price_data'
    
    id = db.Column(db.Integer, primary_key=True)
    stock_id = db.Column(db.Integer, db.ForeignKey('stocks.id'), nullable=False, index=True)
    date = db.Column(db.Date, nullable=False, index=True)
    open = db.Column(db.Float, nullable=False)
    high = db.Column(db.Float, nullable=False)
    low = db.Column(db.Float, nullable=False)
    close = db.Column(db.Float, nullable=False)
    adj_close = db.Column(db.Float)
    volume = db.Column(db.BigInteger, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    stock = db.relationship('Stock', back_populates='price_data')
    
    # Composite unique constraint
    __table_args__ = (
        db.UniqueConstraint('stock_id', 'date', name='uq_stock_date'),
        db.Index('idx_stock_date', 'stock_id', 'date'),
    )
    
    def __repr__(self):
        """String representation."""
        return f'<StockPriceData {self.stock.symbol} {self.date}>'
    
    def to_dict(self):
        """Convert to dictionary."""
        return {
            'date': self.date.isoformat(),
            'open': self.open,
            'high': self.high,
            'low': self.low,
            'close': self.close,
            'adj_close': self.adj_close,
            'volume': self.volume
        }


class TechnicalIndicator(db.Model):
    """Technical indicators for stocks."""
    
    __tablename__ = 'technical_indicators'
    
    id = db.Column(db.Integer, primary_key=True)
    stock_id = db.Column(db.Integer, db.ForeignKey('stocks.id'), nullable=False, index=True)
    date = db.Column(db.Date, nullable=False, index=True)
    
    # Moving Averages
    sma_20 = db.Column(db.Float)
    sma_50 = db.Column(db.Float)
    sma_200 = db.Column(db.Float)
    ema_12 = db.Column(db.Float)
    ema_26 = db.Column(db.Float)
    
    # RSI
    rsi_14 = db.Column(db.Float)
    
    # MACD
    macd = db.Column(db.Float)
    macd_signal = db.Column(db.Float)
    macd_histogram = db.Column(db.Float)
    
    # Bollinger Bands
    bb_upper = db.Column(db.Float)
    bb_middle = db.Column(db.Float)
    bb_lower = db.Column(db.Float)
    
    # Other indicators
    atr_14 = db.Column(db.Float)  # Average True Range
    adx_14 = db.Column(db.Float)  # Average Directional Index
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    stock = db.relationship('Stock', back_populates='technical_indicators')
    
    # Composite unique constraint
    __table_args__ = (
        db.UniqueConstraint('stock_id', 'date', name='uq_indicator_stock_date'),
        db.Index('idx_indicator_stock_date', 'stock_id', 'date'),
    )
    
    def __repr__(self):
        """String representation."""
        return f'<TechnicalIndicator {self.stock.symbol} {self.date}>'
    
    def to_dict(self):
        """Convert to dictionary."""
        return {
            'date': self.date.isoformat(),
            'sma_20': self.sma_20,
            'sma_50': self.sma_50,
            'sma_200': self.sma_200,
            'ema_12': self.ema_12,
            'ema_26': self.ema_26,
            'rsi_14': self.rsi_14,
            'macd': self.macd,
            'macd_signal': self.macd_signal,
            'macd_histogram': self.macd_histogram,
            'bb_upper': self.bb_upper,
            'bb_middle': self.bb_middle,
            'bb_lower': self.bb_lower,
            'atr_14': self.atr_14,
            'adx_14': self.adx_14
        }
