"""Screener models for custom stock screening."""
from datetime import datetime
from models import db
import json


class SavedScreener(db.Model):
    """User-saved custom screeners."""
    
    __tablename__ = 'saved_screeners'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    filters = db.Column(db.JSON, nullable=False)  # JSON array of filter criteria
    is_public = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_run_at = db.Column(db.DateTime)
    
    # Relationships
    user = db.relationship('User', back_populates='saved_screeners')
    
    def __repr__(self):
        """String representation."""
        return f'<SavedScreener {self.name}>'
    
    def to_dict(self):
        """Convert to dictionary."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'description': self.description,
            'filters': self.filters,
            'is_public': self.is_public,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'last_run_at': self.last_run_at.isoformat() if self.last_run_at else None
        }
    
    def update_last_run(self):
        """Update last run timestamp."""
        self.last_run_at = datetime.utcnow()
        db.session.commit()
