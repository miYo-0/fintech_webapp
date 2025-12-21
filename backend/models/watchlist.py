"""Watchlist models for tracking stocks."""
from datetime import datetime
from models import db


class Watchlist(db.Model):
    """User watchlist."""
    
    __tablename__ = 'watchlists'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    is_default = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user = db.relationship('User', back_populates='watchlists')
    items = db.relationship('WatchlistItem', back_populates='watchlist', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        """String representation."""
        return f'<Watchlist {self.name}>'
    
    def to_dict(self, include_items=False):
        """Convert to dictionary."""
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'description': self.description,
            'is_default': self.is_default,
            'item_count': self.items.count(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_items:
            data['items'] = [item.to_dict() for item in self.items.all()]
        
        return data


class WatchlistItem(db.Model):
    """Individual stock in a watchlist."""
    
    __tablename__ = 'watchlist_items'
    
    id = db.Column(db.Integer, primary_key=True)
    watchlist_id = db.Column(db.Integer, db.ForeignKey('watchlists.id'), nullable=False, index=True)
    stock_id = db.Column(db.Integer, db.ForeignKey('stocks.id'), nullable=False, index=True)
    notes = db.Column(db.Text)
    alert_price_above = db.Column(db.Float)  # Alert when price goes above
    alert_price_below = db.Column(db.Float)  # Alert when price goes below
    added_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    watchlist = db.relationship('Watchlist', back_populates='items')
    stock = db.relationship('Stock')
    
    # Composite unique constraint
    __table_args__ = (
        db.UniqueConstraint('watchlist_id', 'stock_id', name='uq_watchlist_stock'),
    )
    
    def __repr__(self):
        """String representation."""
        return f'<WatchlistItem {self.stock.symbol}>'
    
    def to_dict(self):
        """Convert to dictionary."""
        return {
            'id': self.id,
            'watchlist_id': self.watchlist_id,
            'stock': self.stock.to_dict() if self.stock else None,
            'notes': self.notes,
            'alert_price_above': self.alert_price_above,
            'alert_price_below': self.alert_price_below,
            'added_at': self.added_at.isoformat() if self.added_at else None
        }
