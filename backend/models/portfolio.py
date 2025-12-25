"""Portfolio models for tracking user investments."""
from datetime import datetime
from models import db


class Portfolio(db.Model):
    """User portfolio."""
    
    __tablename__ = 'portfolios'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    is_default = db.Column(db.Boolean, default=False, nullable=False)
    currency = db.Column(db.String(10), default='USD')
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user = db.relationship('User', back_populates='portfolios')
    positions = db.relationship('Position', back_populates='portfolio', lazy='dynamic', cascade='all, delete-orphan')
    transactions = db.relationship('Transaction', back_populates='portfolio', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        """String representation."""
        return f'<Portfolio {self.name}>'
    
    def to_dict(self, include_positions=False, include_stats=False):
        """Convert to dictionary."""
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'description': self.description,
            'is_default': self.is_default,
            'currency': self.currency,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_positions:
            data['positions'] = [pos.to_dict() for pos in self.positions.all()]
        
        if include_stats:
            data['stats'] = self.calculate_stats()
        
        return data
    
    def calculate_stats(self):
        """Calculate portfolio statistics."""
        positions = self.positions.all()
        
        if not positions:
            return {
                'total_value': 0,
                'total_cost': 0,
                'total_gain_loss': 0,
                'total_gain_loss_percent': 0,
                'position_count': 0
            }
        
        total_value = sum(pos.current_value or 0 for pos in positions)
        total_cost = sum(pos.total_cost or 0 for pos in positions)
        total_gain_loss = total_value - total_cost
        total_gain_loss_percent = (total_gain_loss / total_cost * 100) if total_cost > 0 else 0
        
        return {
            'total_value': round(total_value, 2),
            'total_cost': round(total_cost, 2),
            'total_gain_loss': round(total_gain_loss, 2),
            'total_gain_loss_percent': round(total_gain_loss_percent, 2),
            'position_count': len(positions)
        }


class Position(db.Model):
    """Individual stock position in a portfolio."""
    
    __tablename__ = 'portfolio_positions'  # Changed from 'positions' to match actual database
    
    id = db.Column(db.Integer, primary_key=True)
    portfolio_id = db.Column(db.Integer, db.ForeignKey('portfolios.id'), nullable=False, index=True)
    stock_id = db.Column(db.Integer, db.ForeignKey('stocks.id'), nullable=False, index=True)
    quantity = db.Column(db.Float, nullable=False, default=0)
    average_price = db.Column(db.Float, nullable=False, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    portfolio = db.relationship('Portfolio', back_populates='positions')
    stock = db.relationship('Stock')
    
    # Composite unique constraint
    __table_args__ = (
        db.UniqueConstraint('portfolio_id', 'stock_id', name='uq_portfolio_stock'),
    )
    
    @property
    def total_cost(self):
        """Calculate total cost basis."""
        return self.quantity * self.average_price
    
    @property
    def current_value(self):
        """Calculate current market value."""
        if self.stock and self.stock.last_price:
            return self.quantity * self.stock.last_price
        return None
    
    @property
    def gain_loss(self):
        """Calculate gain/loss."""
        if self.current_value is not None:
            return self.current_value - self.total_cost
        return None
    
    @property
    def gain_loss_percent(self):
        """Calculate gain/loss percentage."""
        if self.gain_loss is not None and self.total_cost > 0:
            return (self.gain_loss / self.total_cost) * 100
        return None
    
    def __repr__(self):
        """String representation."""
        return f'<Position {self.stock.symbol} qty={self.quantity}>'
    
    def to_dict(self):
        """Convert to dictionary."""
        return {
            'id': self.id,
            'portfolio_id': self.portfolio_id,
            'stock': self.stock.to_dict() if self.stock else None,
            'quantity': self.quantity,
            'average_price': self.average_price,
            'total_cost': round(self.total_cost, 2),
            'current_value': round(self.current_value, 2) if self.current_value else None,
            'gain_loss': round(self.gain_loss, 2) if self.gain_loss else None,
            'gain_loss_percent': round(self.gain_loss_percent, 2) if self.gain_loss_percent else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Transaction(db.Model):
    """Transaction history for portfolio."""
    
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    portfolio_id = db.Column(db.Integer, db.ForeignKey('portfolios.id'), nullable=False, index=True)
    stock_id = db.Column(db.Integer, db.ForeignKey('stocks.id'), nullable=False, index=True)
    transaction_type = db.Column(db.String(10), nullable=False)  # BUY, SELL
    quantity = db.Column(db.Float, nullable=False)
    price = db.Column(db.Float, nullable=False)
    fees = db.Column(db.Float, default=0)
    notes = db.Column(db.Text)
    transaction_date = db.Column(db.DateTime, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    portfolio = db.relationship('Portfolio', back_populates='transactions')
    stock = db.relationship('Stock')
    
    @property
    def total_amount(self):
        """Calculate total transaction amount including fees."""
        return (self.quantity * self.price) + self.fees
    
    def __repr__(self):
        """String representation."""
        return f'<Transaction {self.transaction_type} {self.stock.symbol} qty={self.quantity}>'
    
    def to_dict(self):
        """Convert to dictionary."""
        return {
            'id': self.id,
            'portfolio_id': self.portfolio_id,
            'stock': self.stock.to_dict(include_quote=False) if self.stock else None,
            'transaction_type': self.transaction_type,
            'quantity': self.quantity,
            'price': self.price,
            'fees': self.fees,
            'total_amount': round(self.total_amount, 2),
            'notes': self.notes,
            'transaction_date': self.transaction_date.isoformat() if self.transaction_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
