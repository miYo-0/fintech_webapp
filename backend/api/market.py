"""Market overview API endpoints."""
from flask import Blueprint, request, jsonify, current_app
from services.stock_data_service import StockDataService
from services.cache_service import CacheService
import logging

logger = logging.getLogger(__name__)

market_bp = Blueprint('market', __name__, url_prefix='/api/market')


def get_services():
    """Get service instances."""
    stock_service = StockDataService(current_app.config)
    cache_service = CacheService(
        current_app.config.get('REDIS_URL'),
        current_app.config.get('CACHE_DEFAULT_TIMEOUT', 300)
    )
    return stock_service, cache_service


@market_bp.route('/indices', methods=['GET'])
def get_indices():
    """Get major market indices."""
    try:
        stock_service, cache_service = get_services()
        
        # Try cache first
        cache_key = "market:indices"
        cached_data = cache_service.get(cache_key)
        
        if cached_data:
            return jsonify({'indices': cached_data}), 200
        
        # Fetch indices
        indices = stock_service.get_market_indices()
        
        # Cache for 1 minute
        cache_service.set(cache_key, indices, timeout=60)
        
        return jsonify({'indices': indices}), 200
        
    except Exception as e:
        logger.error(f"Get indices error: {e}")
        return jsonify({'error': 'Failed to get indices'}), 500


@market_bp.route('/movers', methods=['GET'])
def get_market_movers():
    """Get top gainers and losers."""
    try:
        market = request.args.get('market', 'US')
        limit = min(int(request.args.get('limit', 10)), 50)
        
        stock_service, cache_service = get_services()
        
        # Try cache first
        cache_key = f"market:movers:{market}:{limit}"
        cached_data = cache_service.get(cache_key)
        
        if cached_data:
            return jsonify(cached_data), 200
        
        # Fetch movers
        movers = stock_service.get_top_gainers_losers(market, limit)
        
        # Cache for 5 minutes
        cache_service.set(cache_key, movers, timeout=300)
        
        return jsonify(movers), 200
        
    except Exception as e:
        logger.error(f"Get market movers error: {e}")
        return jsonify({'error': 'Failed to get market movers'}), 500


@market_bp.route('/overview', methods=['GET'])
def get_market_overview():
    """Get comprehensive market overview."""
    try:
        stock_service, cache_service = get_services()
        
        # Try cache first
        cache_key = "market:overview"
        cached_data = cache_service.get(cache_key)
        
        if cached_data:
            return jsonify(cached_data), 200
        
        # Fetch indices
        indices = stock_service.get_market_indices()
        
        overview = {
            'indices': indices,
            'gainers': [],
            'losers': [],
            'most_active': []
        }
        
        # Cache for 2 minutes
        cache_service.set(cache_key, overview, timeout=120)
        
        return jsonify(overview), 200
        
    except Exception as e:
        logger.error(f"Get market overview error: {e}")
        return jsonify({'error': 'Failed to get market overview'}), 500
