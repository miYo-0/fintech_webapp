"""User model for authentication and user management."""
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from models import db


class User(db.Model):
    """User model for authentication."""
    
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50))
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_admin = db.Column(db.Boolean, default=False, nullable=False)
    email_verified = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_login = db.Column(db.DateTime)
    
    # Preferences
    preferred_market = db.Column(db.String(10), default='US')  # US, IN, etc.
    theme = db.Column(db.String(10), default='dark')  # dark, light
    
    # Relationships
    watchlists = db.relationship('Watchlist', back_populates='user', lazy='dynamic', cascade='all, delete-orphan')
    portfolios = db.relationship('Portfolio', back_populates='user', lazy='dynamic', cascade='all, delete-orphan')
    saved_screeners = db.relationship('SavedScreener', back_populates='user', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        """String representation."""
        return f'<User {self.username}>'
    
    def set_password(self, password):
        """Hash and set password."""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check password against hash."""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self, include_email=False):
        """Convert to dictionary."""
        data = {
            'id': self.id,
            'username': self.username,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'is_active': self.is_active,
            'email_verified': self.email_verified,
            'preferred_market': self.preferred_market,
            'theme': self.theme,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }
        
        if include_email:
            data['email'] = self.email
        
        return data
    
    def update_last_login(self):
        """Update last login timestamp."""
        self.last_login = datetime.utcnow()
        db.session.commit()
