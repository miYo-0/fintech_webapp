"""Database models initialization."""
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

db = SQLAlchemy()
migrate = Migrate()


def init_db(app):
    """Initialize database with app."""
    db.init_app(app)
    migrate.init_app(app, db)
    
    # Import models to register them
    from models import user, stock, portfolio, watchlist, screener
    
    return db
