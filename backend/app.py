"""Main Flask application."""
import os
import logging
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO
from config import config
from models import init_db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize extensions
jwt = JWTManager()
socketio = SocketIO()


def create_app(config_name=None):
    """Create and configure Flask application."""
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    CORS(app, origins=app.config['CORS_ORIGINS'], supports_credentials=True)
    jwt.init_app(app)
    init_db(app)
    socketio.init_app(
        app,
        cors_allowed_origins=app.config['CORS_ORIGINS'],
        message_queue=app.config.get('SOCKETIO_MESSAGE_QUEUE'),
        async_mode=app.config.get('SOCKETIO_ASYNC_MODE', 'eventlet')
    )
    
    # Register blueprints
    from api.auth import auth_bp
    from api.stocks import stocks_bp
    from api.portfolio import portfolio_bp
    from api.watchlist import watchlist_bp
    from api.market import market_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(stocks_bp)
    app.register_blueprint(portfolio_bp)
    app.register_blueprint(watchlist_bp)
    app.register_blueprint(market_bp)
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error'}), 500
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'error': 'Token has expired'}), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({'error': 'Invalid token'}), 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        logger.error(f"Missing token: {error}")
        return jsonify({'error': 'Authorization required - no token found in cookies'}), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        logger.error(f"Invalid token: {error}")
        return jsonify({'error': 'Invalid token'}), 401
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        logger.error(f"Token expired: {jwt_payload}")
        return jsonify({'error': 'Token has expired'}), 401
    
    # Health check endpoint
    @app.route('/health')
    def health_check():
        return jsonify({
            'status': 'healthy',
            'service': 'StockScope API',
            'version': '1.0.0'
        }), 200
    
    # API info endpoint
    @app.route('/api')
    def api_info():
        return jsonify({
            'name': 'StockScope API',
            'version': '1.0.0',
            'endpoints': {
                'auth': '/api/auth',
                'stocks': '/api/stocks',
                'portfolio': '/api/portfolio',
                'watchlist': '/api/watchlist',
                'market': '/api/market'
            }
        }), 200
    
    logger.info(f"Application created with config: {config_name}")
    
    return app


# Create app instance
app = create_app()


if __name__ == '__main__':
    # Run with SocketIO for WebSocket support
    socketio.run(
        app,
        host='0.0.0.0',
        port=5000,
        debug=app.config.get('DEBUG', False)
    )
