"""Stock data API endpoints."""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.stock_data_service import StockDataService
from services.technical_analysis import TechnicalAnalysisService
from services.cache_service import CacheService
from models import db
from models.stock import Stock, StockPriceData, TechnicalIndicator
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

stocks_bp = Blueprint('stocks', __name__, url_prefix='/api/stocks')


def get_services():
    """Get service instances."""
    stock_service = StockDataService(current_app.config)
    cache_service = CacheService(
        current_app.config.get('REDIS_URL'),
        current_app.config.get('STOCK_DATA_CACHE_TIMEOUT', 60)
    )
    return stock_service, cache_service


@stocks_bp.route('/search', methods=['GET'])
def search_stocks():
    """Search for stocks by symbol or name."""
    try:
        query = request.args.get('q', '').strip()
        limit = min(int(request.args.get('limit', 10)), 50)
        
        if not query or len(query) < 1:
            return jsonify({'error': 'Query parameter required'}), 400
        
        stock_service, cache_service = get_services()
        
        # Try cache first
        cache_key = f"search:{query}:{limit}"
        cached_results = cache_service.get(cache_key)
        
        if cached_results:
            return jsonify({'results': cached_results}), 200
        
        # Search stocks
        results = stock_service.search_stocks(query, limit)
        
        # Cache results for 5 minutes
        cache_service.set(cache_key, results, timeout=300)
        
        return jsonify({'results': results}), 200
        
    except Exception as e:
        logger.error(f"Stock search error: {e}")
        return jsonify({'error': 'Search failed'}), 500


@stocks_bp.route('/<symbol>/quote', methods=['GET'])
def get_stock_quote(symbol):
    """Get real-time quote for a stock."""
    try:
        symbol = symbol.upper()
        stock_service, cache_service = get_services()
        
        # Try cache first
        cache_key = f"quote:{symbol}"
        cached_quote = cache_service.get(cache_key)
        
        if cached_quote:
            return jsonify(cached_quote), 200
        
        # Fetch quote
        quote = stock_service.get_quote(symbol)
        
        if not quote:
            return jsonify({'error': 'Stock not found'}), 404
        
        # Cache for 1 minute
        cache_service.set(cache_key, quote, timeout=60)
        
        return jsonify(quote), 200
        
    except Exception as e:
        logger.error(f"Get quote error for {symbol}: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to get quote'}), 500


@stocks_bp.route('/<symbol>/historical', methods=['GET'])
def get_historical_data(symbol):
    """Get historical price data for a stock."""
    try:
        symbol = symbol.upper()
        period = request.args.get('period', '1y')
        interval = request.args.get('interval', '1d')
        
        stock_service, cache_service = get_services()
        
        # Try cache first
        cache_key = f"historical:{symbol}:{period}:{interval}"
        cached_data = cache_service.get(cache_key)
        
        if cached_data:
            return jsonify({'symbol': symbol, 'data': cached_data}), 200
        
        # Fetch historical data
        data = stock_service.get_historical_data(symbol, period, interval)
        
        if not data:
            return jsonify({'error': 'No data found'}), 404
        
        # Cache for 5 minutes
        cache_service.set(cache_key, data, timeout=300)
        
        return jsonify({'symbol': symbol, 'data': data}), 200
        
    except Exception as e:
        logger.error(f"Get historical data error for {symbol}: {e}")
        return jsonify({'error': 'Failed to get historical data'}), 500


@stocks_bp.route('/<symbol>/info', methods=['GET'])
def get_company_info(symbol):
    """Get detailed company information."""
    try:
        symbol = symbol.upper()
        stock_service, cache_service = get_services()
        
        # Try cache first
        cache_key = f"info:{symbol}"
        cached_info = cache_service.get(cache_key)
        
        if cached_info:
            return jsonify(cached_info), 200
        
        # Fetch company info
        info = stock_service.get_company_info(symbol)
        
        if not info:
            return jsonify({'error': 'Company info not found'}), 404
        
        # Cache for 1 hour
        cache_service.set(cache_key, info, timeout=3600)
        
        return jsonify(info), 200
        
    except Exception as e:
        logger.error(f"Get company info error for {symbol}: {e}")
        return jsonify({'error': 'Failed to get company info'}), 500


@stocks_bp.route('/<symbol>/indicators', methods=['GET'])
def get_technical_indicators(symbol):
    """Get technical indicators for a stock."""
    try:
        symbol = symbol.upper()
        stock_service, cache_service = get_services()
        
        # Try cache first
        cache_key = f"indicators:{symbol}"
        cached_indicators = cache_service.get(cache_key)
        
        if cached_indicators:
            return jsonify(cached_indicators), 200
        
        # Fetch historical data for calculations
        historical_data = stock_service.get_historical_data(symbol, period='6mo', interval='1d')
        
        if not historical_data:
            return jsonify({'error': 'Insufficient data for analysis'}), 404
        
        # Calculate indicators
        indicators = TechnicalAnalysisService.calculate_all_indicators(historical_data)
        
        # Cache for 5 minutes
        cache_service.set(cache_key, indicators, timeout=300)
        
        return jsonify({'symbol': symbol, 'indicators': indicators}), 200
        
    except Exception as e:
        logger.error(f"Get indicators error for {symbol}: {e}")
        return jsonify({'error': 'Failed to calculate indicators'}), 500


@stocks_bp.route('/list', methods=['GET'])
def list_stocks():
    """List all stocks in database with pagination."""
    try:
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 50)), 100)
        market = request.args.get('market')
        exchange = request.args.get('exchange')
        
        query = Stock.query.filter_by(is_active=True)
        
        if market:
            query = query.filter_by(market=market.upper())
        if exchange:
            query = query.filter_by(exchange=exchange.upper())
        
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        stocks = [stock.to_dict() for stock in pagination.items]
        
        return jsonify({
            'stocks': stocks,
            'total': pagination.total,
            'page': page,
            'per_page': per_page,
            'pages': pagination.pages
        }), 200
        
    except Exception as e:
        logger.error(f"List stocks error: {e}")
        return jsonify({'error': 'Failed to list stocks'}), 500
