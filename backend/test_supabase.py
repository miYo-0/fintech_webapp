"""
Test Supabase database connection.

This script tests the connection to Supabase and creates tables if they don't exist.
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db, User, Portfolio, Watchlist

def test_supabase_connection():
    """Test connection to Supabase database."""
    app = create_app()
    
    with app.app_context():
        try:
            # Test connection
            print("🔄 Testing database connection...")
            db.engine.connect()
            print("✅ Connected to Supabase database successfully!")
            print(f"📍 Database URL: {app.config['SQLALCHEMY_DATABASE_URI'][:50]}...")
            
            # Create tables
            print("\n🔄 Creating database tables...")
            db.create_all()
            print("✅ Database tables created successfully!")
            
            # Test query
            print("\n🔄 Testing database query...")
            user_count = User.query.count()
            portfolio_count = Portfolio.query.count()
            watchlist_count = Watchlist.query.count()
            
            print(f"✅ Query successful!")
            print(f"   📊 Users: {user_count}")
            print(f"   📊 Portfolios: {portfolio_count}")
            print(f"   📊 Watchlists: {watchlist_count}")
            
            print("\n🎉 Supabase integration successful! Your database is ready to use.")
            return True
            
        except Exception as e:
            print(f"\n❌ Database connection failed!")
            print(f"   Error: {e}")
            print(f"\n💡 Troubleshooting:")
            print(f"   1. Check your DATABASE_URL in .env file")
            print(f"   2. Verify your Supabase project is active")
            print(f"   3. Ensure your IP is allowed in Supabase settings")
            print(f"   4. Check if password contains special characters (they might need URL encoding)")
            return False

if __name__ == '__main__':
    success = test_supabase_connection()
    sys.exit(0 if success else 1)
